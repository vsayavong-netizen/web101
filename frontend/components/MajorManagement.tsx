import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Major, Student, Classroom, Gender, ProjectGroup, ProjectStatus } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, BookOpenIcon, MagnifyingGlassIcon, TableCellsIcon } from './icons';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';
import MajorModal from './MajorModal';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import MajorCard from './MajorCard';
import { ExcelUtils } from '../utils/excelUtils';
import { useTranslations } from '../hooks/useTranslations';
import Pagination from './Pagination';

type MajorSortKey = 'id' | 'name' | 'abbreviation' | 'students' | 'projects' | 'soloProjects' | 'duoProjects' | 'classrooms' | 'male' | 'female' | 'monk' | 'approved' | 'pending' | 'rejected';
const ITEMS_PER_PAGE = 15;

interface MajorManagementProps {
    majors: Major[];
    students: Student[];
    classrooms: Classroom[];
    projectGroups: ProjectGroup[];
    addMajor: (major: Omit<Major, 'id'>) => void;
    updateMajor: (major: Major) => void;
    deleteMajor: (majorId: string) => void;
}


const MajorManagement: React.FC<MajorManagementProps> = ({ majors, students, classrooms, projectGroups, addMajor, updateMajor, deleteMajor }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMajor, setEditingMajor] = useState<Major | null>(null);
    const [majorToDelete, setMajorToDelete] = useState<Major | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig<MajorSortKey> | null>({ key: 'id', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const addToast = useToast();
    const t = useTranslations();

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const requestSort = (key: MajorSortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const majorStats = useMemo(() => {
        const stats = new Map<string, { studentCount: number; classroomCount: number; maleCount: number; femaleCount: number; monkCount: number; projectCount: number; soloProjectCount: number; duoProjectCount: number; approvedCount: number; pendingCount: number; rejectedCount: number }>();
        majors.forEach(major => {
            stats.set(major.id, { studentCount: 0, classroomCount: 0, maleCount: 0, femaleCount: 0, monkCount: 0, projectCount: 0, soloProjectCount: 0, duoProjectCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 });
        });

        students.forEach(student => {
            const major = majors.find(m => m.name === student.major);
            if (major) {
                const stat = stats.get(major.id);
                if (stat) {
                    stat.studentCount++;
                    if (student.gender === Gender.Male) stat.maleCount++;
                    else if (student.gender === Gender.Female) stat.femaleCount++;
                    else if (student.gender === Gender.Monk) stat.monkCount++;
                }
            }
        });

        classrooms.forEach(classroom => {
            const stat = stats.get(classroom.majorId);
            if (stat) {
                stat.classroomCount++;
            }
        });
        
        projectGroups.forEach(pg => {
            if (pg.students.length > 0) {
                const studentMajorName = pg.students[0].major;
                const major = majors.find(m => m.name === studentMajorName);
                if(major) {
                    const stat = stats.get(major.id);
                    if (stat) {
                        stat.projectCount++;
                        if (pg.students.length === 1) stat.soloProjectCount++;
                        else if (pg.students.length >= 2) stat.duoProjectCount++;
                        
                        if (pg.project.status === ProjectStatus.Approved) stat.approvedCount++;
                        else if (pg.project.status === ProjectStatus.Pending) stat.pendingCount++;
                        else if (pg.project.status === ProjectStatus.Rejected) stat.rejectedCount++;
                    }
                }
            }
        });
        
        return stats;
    }, [majors, students, classrooms, projectGroups]);

    const sortedAndFilteredMajors = useMemo(() => {
        let filteredMajors = [...majors];

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filteredMajors = filteredMajors.filter(major =>
                major.id.toLowerCase().includes(lowercasedQuery) ||
                major.name.toLowerCase().includes(lowercasedQuery) ||
                major.abbreviation.toLowerCase().includes(lowercasedQuery)
            );
        }

        if (sortConfig !== null) {
            filteredMajors.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;

                if (sortConfig.key === 'students') {
                    aValue = majorStats.get(a.id)?.studentCount || 0;
                    bValue = majorStats.get(b.id)?.studentCount || 0;
                } else if (sortConfig.key === 'projects') {
                    aValue = majorStats.get(a.id)?.projectCount || 0;
                    bValue = majorStats.get(b.id)?.projectCount || 0;
                } else if (sortConfig.key === 'soloProjects') {
                    aValue = majorStats.get(a.id)?.soloProjectCount || 0;
                    bValue = majorStats.get(b.id)?.soloProjectCount || 0;
                } else if (sortConfig.key === 'duoProjects') {
                    aValue = majorStats.get(a.id)?.duoProjectCount || 0;
                    bValue = majorStats.get(b.id)?.duoProjectCount || 0;
                } else if (sortConfig.key === 'classrooms') {
                    aValue = majorStats.get(a.id)?.classroomCount || 0;
                    bValue = majorStats.get(b.id)?.classroomCount || 0;
                } else if (sortConfig.key === 'male') {
                    aValue = majorStats.get(a.id)?.maleCount || 0;
                    bValue = majorStats.get(b.id)?.maleCount || 0;
                } else if (sortConfig.key === 'female') {
                    aValue = majorStats.get(a.id)?.femaleCount || 0;
                    bValue = majorStats.get(b.id)?.femaleCount || 0;
                } else if (sortConfig.key === 'monk') {
                    aValue = majorStats.get(a.id)?.monkCount || 0;
                    bValue = majorStats.get(b.id)?.monkCount || 0;
                } else if (sortConfig.key === 'approved') {
                    aValue = majorStats.get(a.id)?.approvedCount || 0;
                    bValue = majorStats.get(b.id)?.approvedCount || 0;
                } else if (sortConfig.key === 'pending') {
                    aValue = majorStats.get(a.id)?.pendingCount || 0;
                    bValue = majorStats.get(b.id)?.pendingCount || 0;
                } else if (sortConfig.key === 'rejected') {
                    aValue = majorStats.get(a.id)?.rejectedCount || 0;
                    bValue = majorStats.get(b.id)?.rejectedCount || 0;
                } else {
                    aValue = a[sortConfig.key as keyof Major];
                    bValue = b[sortConfig.key as keyof Major];
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filteredMajors;
    }, [majors, sortConfig, searchQuery, majorStats]);

    const paginatedMajors = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedAndFilteredMajors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedAndFilteredMajors, currentPage]);
    
    const totals = useMemo(() => {
        let totalStudents = 0, totalProjects = 0, totalSoloProjects = 0, totalDuoProjects = 0, totalApproved = 0, totalPending = 0, totalRejected = 0;
        let totalMale = 0, totalFemale = 0, totalMonk = 0, totalClassrooms = 0;

        for (const stats of majorStats.values()) {
            totalStudents += stats.studentCount;
            totalProjects += stats.projectCount;
            totalSoloProjects += stats.soloProjectCount;
            totalDuoProjects += stats.duoProjectCount;
            totalApproved += stats.approvedCount;
            totalPending += stats.pendingCount;
            totalRejected += stats.rejectedCount;
            totalMale += stats.maleCount;
            totalFemale += stats.femaleCount;
            totalMonk += stats.monkCount;
            totalClassrooms += stats.classroomCount;
        }

        return { totalStudents, totalProjects, totalSoloProjects, totalDuoProjects, totalApproved, totalPending, totalRejected, totalMale, totalFemale, totalMonk, totalClassrooms };
    }, [majorStats]);

    const handleAddClick = () => {
        setEditingMajor(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (major: Major) => {
        setEditingMajor(major);
        setIsModalOpen(true);
    };

    const handleDeleteRequest = (major: Major) => {
        const isUsedByStudent = students.some(s => s.major === major.name);
        if (isUsedByStudent) {
            addToast({ type: 'error', message: t('majorInUseStudentsError').replace('${majorName}', major.name) });
            return;
        }
        
        const isUsedByClassroom = classrooms.some(c => c.majorId === major.id);
        if (isUsedByClassroom) {
            addToast({ type: 'error', message: t('majorInUseClassroomError').replace('${majorName}', major.name) });
            return;
        }

        setMajorToDelete(major);
    };

    const confirmDelete = () => {
        if (majorToDelete) {
            deleteMajor(majorToDelete.id);
            addToast({ type: 'success', message: t('majorDeletedSuccess') });
            setMajorToDelete(null);
        }
    };

    const handleSaveMajor = (majorData: Major | Omit<Major, 'id'>) => {
        if ('id' in majorData) {
            updateMajor(majorData);
            addToast({ type: 'success', message: t('majorUpdatedSuccess') });
        } else {
            addMajor(majorData);
            addToast({ type: 'success', message: t('majorAddedSuccess') });
        }
        setIsModalOpen(false);
    };

    const handleExportExcel = useCallback(() => {
        const dataToExport = sortedAndFilteredMajors.map(major => {
            const stats = majorStats.get(major.id) || { studentCount: 0, classroomCount: 0, maleCount: 0, femaleCount: 0, monkCount: 0, projectCount: 0, soloProjectCount: 0, duoProjectCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 };
            return {
                [t('majorId')]: major.id,
                [t('majorName')]: major.name,
                [t('abbreviation')]: major.abbreviation,
                [t('students')]: stats.studentCount,
                [t('projects')]: stats.projectCount,
                [t('projects1p')]: stats.soloProjectCount,
                [t('projects2p')]: stats.duoProjectCount,
                [t('approved')]: stats.approvedCount,
                [t('pending')]: stats.pendingCount,
                [t('rejected')]: stats.rejectedCount,
                [t('male')]: stats.maleCount,
                [t('female')]: stats.femaleCount,
                [t('monk')]: stats.monkCount,
                [t('classrooms')]: stats.classroomCount,
            };
        });
    
        if (dataToExport.length === 0) {
            addToast({ type: 'info', message: t('noDataToExport') });
            return;
        }
    
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Majors');
    
        worksheet['!cols'] = [
            { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 }
        ];
    
        XLSX.writeFile(workbook, 'majors_report.xlsx');
        addToast({ type: 'success', message: t('majorExportSuccess') });
    }, [sortedAndFilteredMajors, majorStats, addToast, t]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div className="flex items-center">
                   <BookOpenIcon className="w-8 h-8 text-blue-600 mr-3"/>
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('manageMajors')}</h2>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">{t('manageMajorsDescription')}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                    >
                        <TableCellsIcon className="w-5 h-5 mr-2" />
                        {t('exportExcel')}
                    </button>
                    <button
                        onClick={handleAddClick}
                        className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {t('addMajor')}
                    </button>
                </div>
            </div>
             <div className="mb-4">
                 <div className="relative w-full sm:w-1/2 lg:w-1/3">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600 dark:placeholder:text-gray-400"
                        placeholder={t('searchByMajor')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paginatedMajors.map(major => {
                    const stats = majorStats.get(major.id) || { studentCount: 0, classroomCount: 0, maleCount: 0, femaleCount: 0, monkCount: 0, projectCount: 0, soloProjectCount: 0, duoProjectCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 };
                    return (
                        <MajorCard
                            key={major.id}
                            major={major}
                            studentCount={stats.studentCount}
                            classroomCount={stats.classroomCount}
                            maleCount={stats.maleCount}
                            femaleCount={stats.femaleCount}
                            monkCount={stats.monkCount}
                            projectCount={stats.projectCount}
                            soloProjectCount={stats.soloProjectCount}
                            duoProjectCount={stats.duoProjectCount}
                            approvedCount={stats.approvedCount}
                            pendingCount={stats.pendingCount}
                            rejectedCount={stats.rejectedCount}
                            onEdit={() => handleEditClick(major)}
                            onDelete={() => handleDeleteRequest(major)}
                        />
                    );
                })}
            </div>

            <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                        <tr>
                            <SortableHeader sortKey="id" title={t('majorId')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="name" title={t('majorName')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="abbreviation" title={t('abbreviation')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="students" title={t('students')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="projects" title={t('projects')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="soloProjects" title={t('projects1p')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="duoProjects" title={t('projects2p')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="approved" title={t('approved')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="pending" title={t('pending')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="rejected" title={t('rejected')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="male" title={t('male')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="female" title={t('female')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="monk" title={t('monk')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="classrooms" title={t('classrooms')} sortConfig={sortConfig} requestSort={requestSort} />
                            <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedMajors.map(major => {
                            const stats = majorStats.get(major.id) || { studentCount: 0, classroomCount: 0, maleCount: 0, femaleCount: 0, monkCount: 0, projectCount: 0, soloProjectCount: 0, duoProjectCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 };
                            return (
                                <tr key={major.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{major.id}</td>
                                    <td className="px-6 py-4">{major.name}</td>
                                    <td className="px-6 py-4">{major.abbreviation}</td>
                                    <td className="px-6 py-4">{stats.studentCount}</td>
                                    <td className="px-6 py-4">{stats.projectCount}</td>
                                    <td className="px-6 py-4">{stats.soloProjectCount}</td>
                                    <td className="px-6 py-4">{stats.duoProjectCount}</td>
                                    <td className="px-6 py-4 text-green-600 dark:text-green-400">{stats.approvedCount}</td>
                                    <td className="px-6 py-4 text-yellow-600 dark:text-yellow-400">{stats.pendingCount}</td>
                                    <td className="px-6 py-4 text-red-600 dark:text-red-400">{stats.rejectedCount}</td>
                                    <td className="px-6 py-4">{stats.maleCount}</td>
                                    <td className="px-6 py-4">{stats.femaleCount}</td>
                                    <td className="px-6 py-4">{stats.monkCount}</td>
                                    <td className="px-6 py-4">{stats.classroomCount}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEditClick(major)} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDeleteRequest(major)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-100 dark:bg-slate-700 font-bold text-slate-800 dark:text-slate-200">
                            <td className="px-6 py-4" colSpan={3}>{t('total')}</td>
                            <td className="px-6 py-4">{totals.totalStudents}</td>
                            <td className="px-6 py-4">{totals.totalProjects}</td>
                            <td className="px-6 py-4">{totals.totalSoloProjects}</td>
                            <td className="px-6 py-4">{totals.totalDuoProjects}</td>
                            <td className="px-6 py-4 text-green-600 dark:text-green-400">{totals.totalApproved}</td>
                            <td className="px-6 py-4 text-yellow-600 dark:text-yellow-400">{totals.totalPending}</td>
                            <td className="px-6 py-4 text-red-600 dark:text-red-400">{totals.totalRejected}</td>
                            <td className="px-6 py-4">{totals.totalMale}</td>
                            <td className="px-6 py-4">{totals.totalFemale}</td>
                            <td className="px-6 py-4">{totals.totalMonk}</td>
                            <td className="px-6 py-4">{totals.totalClassrooms}</td>
                            <td className="px-6 py-4"></td>
                        </tr>
                    </tfoot>
                </table>
                 {sortedAndFilteredMajors.length === 0 && (
                     <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                        {searchQuery ? `No majors found for "${searchQuery}".` : `No majors found. Click "${t('addMajor')}" to begin.`}
                    </div>
                )}
            </div>
             <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(sortedAndFilteredMajors.length / ITEMS_PER_PAGE)}
                totalItems={sortedAndFilteredMajors.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />
            {isModalOpen && (
                <MajorModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveMajor} 
                    majorToEdit={editingMajor}
                    allMajors={majors}
                />
            )}
            {majorToDelete && (
                <ConfirmationModal 
                    isOpen={!!majorToDelete}
                    onClose={() => setMajorToDelete(null)}
                    onConfirm={confirmDelete}
                    title={t('deleteMajorTitle')}
                    message={t('deleteMajorMessage').replace('${majorName}', majorToDelete.name)}
                />
            )}
        </div>
    );
};

export default MajorManagement;