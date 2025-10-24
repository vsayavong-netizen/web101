import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Classroom, Student, Major, Gender, ProjectGroup, ProjectStatus, User } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, BuildingOfficeIcon, MagnifyingGlassIcon, TableCellsIcon } from './icons';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';
import ClassroomModal from './ClassroomModal';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import ClassroomCard from './ClassroomCard';
import { ExcelUtils } from '../utils/excelUtils';
import { useTranslations } from '../hooks/useTranslations';
import Pagination from './Pagination';

type ClassroomSortKey = 'id' | 'name' | 'majorName' | 'students' | 'projects' | 'soloProjects' | 'duoProjects' | 'approved' | 'pending' | 'rejected' | 'male' | 'female' | 'monk';
const ITEMS_PER_PAGE = 15;

interface ClassroomManagementProps {
    user: User;
    classrooms: Classroom[];
    students: Student[];
    majors: Major[];
    projectGroups: ProjectGroup[];
    addClassroom: (classroom: Omit<Classroom, 'id'>) => void;
    updateClassroom: (classroom: Classroom) => void;
    deleteClassroom: (classroomId: string) => void;
}

const ClassroomManagement: React.FC<ClassroomManagementProps> = ({ user, classrooms, students, majors, projectGroups, addClassroom, updateClassroom, deleteClassroom }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
    const [classroomToDelete, setClassroomToDelete] = useState<Classroom | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig<ClassroomSortKey> | null>({ key: 'id', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const addToast = useToast();
    const t = useTranslations();

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const requestSort = (key: ClassroomSortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const classroomStats = useMemo(() => {
        const stats = new Map<string, { studentCount: number; maleCount: number; femaleCount: number; monkCount: number; projectCount: number; soloProjectCount: number; duoProjectCount: number; approvedCount: number; pendingCount: number; rejectedCount: number; }>();
        classrooms.forEach(classroom => {
            stats.set(classroom.id, { studentCount: 0, maleCount: 0, femaleCount: 0, monkCount: 0, projectCount: 0, soloProjectCount: 0, duoProjectCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 });
        });

        students.forEach(student => {
            const classroom = classrooms.find(c => c.name === student.classroom);
            if (classroom) {
                const stat = stats.get(classroom.id);
                if (stat) {
                    stat.studentCount++;
                    if (student.gender === Gender.Male) stat.maleCount++;
                    else if (student.gender === Gender.Female) stat.femaleCount++;
                    else if (student.gender === Gender.Monk) stat.monkCount++;
                }
            }
        });
        
        projectGroups.forEach(pg => {
            if (pg.students.length > 0) {
                const classroomIdsInProject = new Set(pg.students.map(s => classrooms.find(c => c.name === s.classroom)?.id).filter(Boolean));

                classroomIdsInProject.forEach(classroomId => {
                    const stat = stats.get(classroomId as string);
                    if (stat) {
                        stat.projectCount++;
                        if (pg.students.length === 1) stat.soloProjectCount++;
                        else if (pg.students.length >= 2) stat.duoProjectCount++;

                        if (pg.project.status === ProjectStatus.Approved) stat.approvedCount++;
                        else if (pg.project.status === ProjectStatus.Pending) stat.pendingCount++;
                        else if (pg.project.status === ProjectStatus.Rejected) stat.rejectedCount++;
                    }
                });
            }
        });
        
        return stats;
    }, [classrooms, students, projectGroups]);

    const sortedAndFilteredClassrooms = useMemo(() => {
        let filteredClassrooms = [...classrooms];

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filteredClassrooms = filteredClassrooms.filter(classroom =>
                classroom.id.toLowerCase().includes(lowercasedQuery) ||
                classroom.name.toLowerCase().includes(lowercasedQuery) ||
                classroom.majorName.toLowerCase().includes(lowercasedQuery)
            );
        }

        if (sortConfig !== null) {
            filteredClassrooms.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;

                const statsA = classroomStats.get(a.id);
                const statsB = classroomStats.get(b.id);
                
                switch (sortConfig.key) {
                    case 'students': aValue = statsA?.studentCount || 0; bValue = statsB?.studentCount || 0; break;
                    case 'projects': aValue = statsA?.projectCount || 0; bValue = statsB?.projectCount || 0; break;
                    case 'soloProjects': aValue = statsA?.soloProjectCount || 0; bValue = statsB?.soloProjectCount || 0; break;
                    case 'duoProjects': aValue = statsA?.duoProjectCount || 0; bValue = statsB?.duoProjectCount || 0; break;
                    case 'approved': aValue = statsA?.approvedCount || 0; bValue = statsB?.approvedCount || 0; break;
                    case 'pending': aValue = statsA?.pendingCount || 0; bValue = statsB?.pendingCount || 0; break;
                    case 'rejected': aValue = statsA?.rejectedCount || 0; bValue = statsB?.rejectedCount || 0; break;
                    case 'male': aValue = statsA?.maleCount || 0; bValue = statsB?.maleCount || 0; break;
                    case 'female': aValue = statsA?.femaleCount || 0; bValue = statsB?.femaleCount || 0; break;
                    case 'monk': aValue = statsA?.monkCount || 0; bValue = statsB?.monkCount || 0; break;
                    default: aValue = a[sortConfig.key as 'id' | 'name' | 'majorName']; bValue = b[sortConfig.key as 'id' | 'name' | 'majorName'];
                }
                
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filteredClassrooms;
    }, [classrooms, sortConfig, searchQuery, classroomStats]);
    
    const paginatedClassrooms = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedAndFilteredClassrooms.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedAndFilteredClassrooms, currentPage]);

    const totals = useMemo(() => {
        let totalStudents = 0, totalProjects = 0, totalSoloProjects = 0, totalDuoProjects = 0, totalApproved = 0, totalPending = 0, totalRejected = 0;
        let totalMale = 0, totalFemale = 0, totalMonk = 0;

        for (const stats of classroomStats.values()) {
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
        }

        return { totalStudents, totalProjects, totalSoloProjects, totalDuoProjects, totalApproved, totalPending, totalRejected, totalMale, totalFemale, totalMonk };
    }, [classroomStats]);

    const handleAddClick = () => {
        setEditingClassroom(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (classroom: Classroom) => {
        setEditingClassroom(classroom);
        setIsModalOpen(true);
    };

    const handleDeleteRequest = (classroom: Classroom) => {
        const isInUse = students.some(s => s.classroom === classroom.name);
        if (isInUse) {
            addToast({ type: 'error', message: t('classroomInUseError').replace('${classroomName}', classroom.name) });
        } else {
            setClassroomToDelete(classroom);
        }
    };

    const confirmDelete = () => {
        if (classroomToDelete) {
            deleteClassroom(classroomToDelete.id);
            addToast({ type: 'success', message: t('classroomDeletedSuccess') });
            setClassroomToDelete(null);
        }
    };

    const handleSaveClassroom = (classroomData: Classroom | Omit<Classroom, 'id'>) => {
        if ('id' in classroomData) {
            updateClassroom(classroomData);
            addToast({ type: 'success', message: t('classroomUpdatedSuccess') });
        } else {
            addClassroom(classroomData);
            addToast({ type: 'success', message: t('classroomAddedSuccess') });
        }
        setIsModalOpen(false);
    };

    const handleExportExcel = useCallback(() => {
        const dataToExport = sortedAndFilteredClassrooms.map(classroom => {
            const stats = classroomStats.get(classroom.id) || { studentCount: 0, maleCount: 0, femaleCount: 0, monkCount: 0, projectCount: 0, soloProjectCount: 0, duoProjectCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 };
            return {
                [t('classroomId')]: classroom.id,
                [t('classroomName')]: classroom.name,
                [t('major')]: classroom.majorName,
                [t('students')]: stats.studentCount,
                [t('male')]: stats.maleCount,
                [t('female')]: stats.femaleCount,
                [t('monk')]: stats.monkCount,
                [t('projects')]: stats.projectCount,
                [t('projects1p')]: stats.soloProjectCount,
                [t('projects2p')]: stats.duoProjectCount,
                [t('approved')]: stats.approvedCount,
                [t('pending')]: stats.pendingCount,
                [t('rejected')]: stats.rejectedCount,
            };
        });
    
        if (dataToExport.length === 0) {
            addToast({ type: 'info', message: t('noDataToExport') });
            return;
        }
    
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Classrooms');
    
        worksheet['!cols'] = [
            { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, 
            { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
        ];
    
        XLSX.writeFile(workbook, 'classrooms_report.xlsx');
        addToast({ type: 'success', message: t('classroomExportSuccess') });
    }, [sortedAndFilteredClassrooms, classroomStats, addToast, t]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div className="flex items-center">
                   <BuildingOfficeIcon className="w-8 h-8 text-blue-600 mr-3"/>
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('manageClassrooms')}</h2>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">{t('manageClassroomsDescription')}</p>
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
                        {t('addClassroom')}
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
                        placeholder={t('searchByClassroom')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paginatedClassrooms.map((classroom, index) => {
                    const stats = classroomStats.get(classroom.id) || { studentCount: 0, maleCount: 0, femaleCount: 0, monkCount: 0, projectCount: 0, soloProjectCount: 0, duoProjectCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 };
                    return (
                        <ClassroomCard
                            key={classroom.id}
                            index={(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                            classroom={classroom}
                            {...stats}
                            onEdit={() => handleEditClick(classroom)}
                            onDelete={() => handleDeleteRequest(classroom)}
                        />
                    );
                })}
            </div>

            <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('no')}</th>
                            <SortableHeader sortKey="id" title={t('classroomId')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="name" title={t('classroomName')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="majorName" title={t('major')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="students" title={t('students')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="male" title={t('male')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="female" title={t('female')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="monk" title={t('monk')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="projects" title={t('projects')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="soloProjects" title={t('projects1p')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="duoProjects" title={t('projects2p')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="approved" title={t('approved')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="pending" title={t('pending')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="rejected" title={t('rejected')} sortConfig={sortConfig} requestSort={requestSort} />
                            <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedClassrooms.map((classroom, index) => {
                            const stats = classroomStats.get(classroom.id) || { studentCount: 0, maleCount: 0, femaleCount: 0, monkCount: 0, projectCount: 0, soloProjectCount: 0, duoProjectCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 };
                            return (
                                <tr key={classroom.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                                    <td className="px-6 py-4">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{classroom.id}</td>
                                    <td className="px-6 py-4">{classroom.name}</td>
                                    <td className="px-6 py-4">{classroom.majorName}</td>
                                    <td className="px-6 py-4">{stats.studentCount}</td>
                                    <td className="px-6 py-4">{stats.maleCount}</td>
                                    <td className="px-6 py-4">{stats.femaleCount}</td>
                                    <td className="px-6 py-4">{stats.monkCount}</td>
                                    <td className="px-6 py-4">{stats.projectCount}</td>
                                    <td className="px-6 py-4">{stats.soloProjectCount}</td>
                                    <td className="px-6 py-4">{stats.duoProjectCount}</td>
                                    <td className="px-6 py-4 text-green-600 dark:text-green-400">{stats.approvedCount}</td>
                                    <td className="px-6 py-4 text-yellow-600 dark:text-yellow-400">{stats.pendingCount}</td>
                                    <td className="px-6 py-4 text-red-600 dark:text-red-400">{stats.rejectedCount}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEditClick(classroom)} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDeleteRequest(classroom)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {sortedAndFilteredClassrooms.length === 0 && (
                     <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                        {searchQuery ? `No classrooms found for "${searchQuery}".` : 'No classrooms found. Click "Add Classroom" to begin.'}
                    </div>
                )}
            </div>
             <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(sortedAndFilteredClassrooms.length / ITEMS_PER_PAGE)}
                totalItems={sortedAndFilteredClassrooms.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />
            {isModalOpen && (
                <ClassroomModal 
                    user={user}
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveClassroom} 
                    classroomToEdit={editingClassroom}
                    allClassrooms={classrooms}
                    majors={majors}
                />
            )}
            {classroomToDelete && (
                <ConfirmationModal 
                    isOpen={!!classroomToDelete}
                    onClose={() => setClassroomToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Delete Classroom?"
                    message={`Are you sure you want to delete classroom "${classroomToDelete.name}"? This action cannot be undone.`}
                />
            )}
        </div>
    );
};

export default ClassroomManagement;