import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Student, ProjectGroup, Major, Classroom, Gender, User } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, UserGroupIcon, MagnifyingGlassIcon, DocumentArrowUpIcon, CheckCircleIcon, ClockIcon, TableCellsIcon } from './icons';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';
import StudentModal from './StudentModal';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import StudentCard from './StudentCard';
import BulkEditModal from './BulkEditModal';
import ImportReviewModal from './ImportReviewModal';
import { ExcelUtils } from '../utils/excelUtils';
import { useTranslations } from '../hooks/useTranslations';
import Pagination from './Pagination';

type StudentSortKey = 'studentId' | 'name' | 'major' | 'classroom' | 'status';
const ITEMS_PER_PAGE = 15;

interface StudentManagementProps {
    user: User;
    students: Student[];
    projectGroups: ProjectGroup[];
    majors: Major[];
    classrooms: Classroom[];
    addStudent: (student: Student) => void;
    updateStudent: (student: Student) => void;
    deleteStudent: (studentId: string) => void;
    bulkAddOrUpdateStudents: (students: Student[]) => void;
    bulkUpdateStudents: (studentIds: string[], updates: Partial<Pick<Student, 'major' | 'classroom'>>) => void;
    bulkDeleteStudents: (studentIds: string[]) => void;
    initialFilter?: string;
    onFilterConsumed?: () => void;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; onClick: () => void; color: string; isActive: boolean }> = ({ title, value, icon, onClick, color, isActive }) => (
    <button onClick={onClick} className={`p-4 rounded-xl shadow-md flex items-center space-x-4 w-full text-left transition-all transform hover:scale-105 ${isActive ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800' : 'ring-1 ring-transparent'} ${color}`}>
        <div className="flex-shrink-0 bg-white/20 rounded-full p-3 text-white">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    </button>
);

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void; }> = ({ enabled, onChange }) => (
    <button
        type="button"
        className={`${enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        role="switch"
        aria-checked={enabled}
        onClick={onChange}
    >
        <span
            aria-hidden="true"
            className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);


const StudentManagement: React.FC<StudentManagementProps> = (props) => {
    const { user, students, projectGroups, majors, classrooms, addStudent, updateStudent, deleteStudent, bulkAddOrUpdateStudents, bulkUpdateStudents, bulkDeleteStudents, initialFilter, onFilterConsumed } = props;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig<StudentSortKey> | null>({ key: 'studentId', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');
    const [majorFilter, setMajorFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState(initialFilter || 'all');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewData, setReviewData] = useState<(Student & { _status: 'new' | 'update' | 'error'; _error?: string })[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const addToast = useToast();
    const t = useTranslations();
    
    useEffect(() => {
        if (initialFilter && onFilterConsumed) {
            onFilterConsumed();
        }
    }, [initialFilter, onFilterConsumed]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, majorFilter, statusFilter]);

    const requestSort = (key: StudentSortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const studentProjectMap = useMemo(() => {
        const map = new Map<string, string>();
        projectGroups.forEach(pg => {
            pg.students.forEach(s => {
                map.set(s.studentId, pg.project.projectId);
            });
        });
        return map;
    }, [projectGroups]);
    
    const sortedAndFilteredStudents = useMemo(() => {
        let filteredStudents = [...students];
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filteredStudents = filteredStudents.filter(student => student.studentId.toLowerCase().includes(lowercasedQuery) || `${student.name} ${student.surname}`.toLowerCase().includes(lowercasedQuery) || student.email.toLowerCase().includes(lowercasedQuery));
        }
        if (majorFilter !== 'all') filteredStudents = filteredStudents.filter(s => s.major === majorFilter);
        if (statusFilter !== 'all') filteredStudents = filteredStudents.filter(s => s.status === statusFilter);
        if (sortConfig !== null) {
            filteredStudents.sort((a, b) => {
                let aValue: string | number, bValue: string | number;
                if (sortConfig.key === 'name') { aValue = `${a.name} ${a.surname}`; bValue = `${b.name} ${b.surname}`; } 
                else { aValue = a[sortConfig.key]; bValue = b[sortConfig.key]; }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filteredStudents;
    }, [students, sortConfig, searchQuery, majorFilter, statusFilter]);
    
    const studentStats = useMemo(() => {
        const approved = students.filter(s => s.status === 'Approved').length;
        const pending = students.filter(s => s.status === 'Pending').length;
        return { total: students.length, approved, pending };
    }, [students]);

    const paginatedStudents = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedAndFilteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedAndFilteredStudents, currentPage]);
    
    const handleAddClick = () => { setEditingStudent(null); setIsModalOpen(true); };
    const handleEditClick = (student: Student) => { setEditingStudent(student); setIsModalOpen(true); };

    const handleApproveStudent = (student: Student) => {
        updateStudent({ ...student, status: 'Approved' });
        addToast({ type: 'success', message: t('approvedStudent').replace('${name}', `${student.name} ${student.surname}`) });
    };

    const handleDeleteRequest = (student: Student) => {
        if (studentProjectMap.has(student.studentId)) {
            addToast({ type: 'error', message: t('cannotDeleteStudentWithProject') });
            return;
        }
        setStudentToDelete(student);
    };

    const confirmDelete = () => {
        if (studentToDelete) {
            deleteStudent(studentToDelete.studentId);
            addToast({ type: 'success', message: t('studentDeletedSuccess') });
            setStudentToDelete(null);
        }
    };

    const handleSaveStudent = (studentData: Student | Omit<Student, 'id'>) => {
        if ('studentId' in studentData && editingStudent) {
            updateStudent(studentData as Student);
            addToast({ type: 'success', message: t('studentUpdatedSuccess') });
        } else {
            addStudent(studentData as Student);
            addToast({ type: 'success', message: t('studentAddedSuccess') });
        }
        setIsModalOpen(false);
    };
    
    const handleSelect = (studentId: string) => {
        setSelectedStudentIds(prev => {
            const newSet = new Set(prev);
            newSet.has(studentId) ? newSet.delete(studentId) : newSet.add(studentId);
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedStudentIds(e.target.checked ? new Set(sortedAndFilteredStudents.map(s => s.studentId)) : new Set());
    };

    const handleBulkEdit = (updates: { major?: string, classroom?: string }) => {
        if (Object.keys(updates).length === 0) {
            addToast({ type: 'info', message: t('noChangesForBulkEdit') });
            return;
        }
        bulkUpdateStudents(Array.from(selectedStudentIds), updates);
        addToast({ type: 'success', message: t('studentsUpdatedSuccess').replace('${count}', String(selectedStudentIds.size)) });
        setIsBulkEditModalOpen(false);
        setSelectedStudentIds(new Set());
    };

    const handleBulkDelete = () => {
        const studentsWithProjects = Array.from(selectedStudentIds).filter(id => studentProjectMap.has(id));
        if (studentsWithProjects.length > 0) {
            addToast({ type: 'error', message: t('cannotDeleteStudentsWithProjects').replace('${count}', String(studentsWithProjects.length)) });
            setIsBulkDeleteModalOpen(false);
            return;
        }
        bulkDeleteStudents(Array.from(selectedStudentIds));
        addToast({ type: 'success', message: t('studentsDeletedSuccess').replace('${count}', String(selectedStudentIds.size)) });
        setIsBulkDeleteModalOpen(false);
        setSelectedStudentIds(new Set());
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const json = await ExcelUtils.readExcelFile(file);
                const existingStudentIds = new Set(students.map(s => s.studentId.toLowerCase()));
                const allMajors = new Set(majors.map(m => m.name.toLowerCase()));
                const allClassrooms = new Set(classrooms.map(c => c.name.toLowerCase()));
                const processedData = json.map(row => {
                    const studentId = row['Student ID']?.toString().trim().toUpperCase();
                    if (!studentId) return { ...row, _status: 'error', _error: 'Missing Student ID' };
                    const status = existingStudentIds.has(studentId.toLowerCase()) ? 'update' : 'new';
                    let error = '';
                    const major = row['Major']?.toString().trim();
                    if (!allMajors.has(major.toLowerCase())) error += 'Invalid Major. ';
                    const classroom = row['Classroom']?.toString().trim();
                    if (!allClassrooms.has(classroom.toLowerCase())) error += 'Invalid Classroom. ';
                    return { studentId, name: row['Name']?.toString().trim(), surname: row['Surname']?.toString().trim(), gender: row['Gender']?.toString().trim(), major, classroom, tel: row['Tel']?.toString().trim(), email: row['Email']?.toString().trim(), status: row['Status']?.toString().trim() || 'Approved', _status: error ? 'error' : status, _error: error || undefined };
                });
                setReviewData(processedData as any);
                setIsReviewModalOpen(true);
            } catch (error) {
                addToast({ type: 'error', message: t('fileParseError') });
                console.error("File parse error:", error);
            } finally { if (event.target) event.target.value = ''; }
        };
        reader.readAsBinaryString(file);
    };

    const handleConfirmImport = (validData: Student[]) => {
        bulkAddOrUpdateStudents(validData);
        addToast({ type: 'success', message: t('studentsImportedSuccess').replace('${count}', String(validData.length)) });
        setIsReviewModalOpen(false);
    };
    
    const handleExportExcel = useCallback(async () => {
        const dataToExport = sortedAndFilteredStudents.map(student => ({
            [t('studentId')]: student.studentId,
            [t('name')]: student.name,
            [t('surname')]: student.surname,
            [t('gender')]: student.gender,
            [t('major')]: student.major,
            [t('classroom')]: student.classroom,
            [t('telephone')]: student.tel,
            [t('email')]: student.email,
            [t('status')]: student.status,
            [t('project')]: studentProjectMap.get(student.studentId) || t('na'),
        }));

        if (dataToExport.length === 0) {
            addToast({ type: 'info', message: t('noDataToExport') });
            return;
        }

        await ExcelUtils.exportToExcel(dataToExport, 'students_report.xlsx');
        addToast({ type: 'success', message: t('studentExportSuccess') });
    }, [sortedAndFilteredStudents, studentProjectMap, addToast, t]);

    const handleToggleAiAssistant = (student: Student) => {
        updateStudent({
            ...student,
            isAiAssistantEnabled: !(student.isAiAssistantEnabled ?? true)
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex items-center">
                   <UserGroupIcon className="w-8 h-8 text-blue-600 mr-3"/>
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('manageAllStudents')}</h2>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">{t('studentsDescription')}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls"/>
                    <button onClick={handleImportClick} className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg shadow-md"><DocumentArrowUpIcon className="w-5 h-5 mr-2" /> {t('import')}</button>
                    <button onClick={handleExportExcel} className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md">
                        <TableCellsIcon className="w-5 h-5 mr-2" /> {t('exportExcel')}
                    </button>
                    <button onClick={handleAddClick} className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md"><PlusIcon className="w-5 h-5 mr-2" /> {t('addStudent')}</button>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title={t('totalStudents')} value={studentStats.total} icon={<UserGroupIcon className="w-6 h-6"/>} onClick={() => setStatusFilter('all')} color="bg-blue-500 ring-blue-500" isActive={statusFilter === 'all'} />
                <StatCard title={t('approvedStudents')} value={studentStats.approved} icon={<CheckCircleIcon className="w-6 h-6"/>} onClick={() => setStatusFilter('Approved')} color="bg-green-500 ring-green-500" isActive={statusFilter === 'Approved'} />
                <StatCard title={t('pendingStudents')} value={studentStats.pending} icon={<ClockIcon className="w-6 h-6"/>} onClick={() => setStatusFilter('Pending')} color="bg-yellow-500 ring-yellow-500" isActive={statusFilter === 'Pending'} />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                     <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" /></div><input type="text" className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm dark:bg-slate-700 dark:text-white" placeholder={t('searchByIdNameEmail')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                    <select value={majorFilter} onChange={e => setMajorFilter(e.target.value)} className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm dark:bg-slate-700 dark:text-white"><option value="all">{t('allMajors')}</option>{majors.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select>
                </div>
                {selectedStudentIds.size > 0 && <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg flex justify-between items-center mb-4"><span className="font-semibold text-blue-800 dark:text-blue-200">{t('bulkActionsSelected').replace('${count}', String(selectedStudentIds.size))}</span><div className="flex gap-2"><button onClick={() => setIsBulkEditModalOpen(true)} className="text-sm font-medium text-blue-600 dark:text-blue-300 hover:underline">{t('edit')}</button><button onClick={() => setIsBulkDeleteModalOpen(true)} className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline">{t('delete')}</button></div></div>}
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">{paginatedStudents.map(student => <StudentCard key={student.studentId} student={student} user={user} projectId={studentProjectMap.get(student.studentId)} onEdit={() => handleEditClick(student)} onDelete={() => handleDeleteRequest(student)} onApprove={() => handleApproveStudent(student)} onSelect={handleSelect} isSelected={selectedStudentIds.has(student.studentId)} onToggleAiAssistant={() => handleToggleAiAssistant(student)}/>)}</div>
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300"><tr><th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedStudentIds.size > 0 && selectedStudentIds.size === sortedAndFilteredStudents.length} className="w-4 h-4 text-blue-600" /></th><SortableHeader sortKey="studentId" title={t('studentId')} sortConfig={sortConfig} requestSort={requestSort} /><SortableHeader sortKey="name" title={t('fullName')} sortConfig={sortConfig} requestSort={requestSort} /><SortableHeader sortKey="major" title={t('major')} sortConfig={sortConfig} requestSort={requestSort} /><SortableHeader sortKey="status" title={t('status')} sortConfig={sortConfig} requestSort={requestSort} />{user.role === 'Admin' && <th scope="col" className="px-6 py-3">{t('aiAssistant')}</th>}<th scope="col" className="px-6 py-3">{t('project')}</th><th scope="col" className="px-6 py-3 text-right">{t('actions')}</th></tr></thead>
                        <tbody>{paginatedStudents.map(student => <tr key={student.studentId} className={`border-b dark:border-slate-700 ${selectedStudentIds.has(student.studentId) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'}`}><td className="w-4 p-4"><input type="checkbox" checked={selectedStudentIds.has(student.studentId)} onChange={() => handleSelect(student.studentId)} className="w-4 h-4 text-blue-600"/></td><td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{student.studentId}</td><td className="px-6 py-4">{student.name} {student.surname}</td><td className="px-6 py-4">{student.major}</td><td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{student.status}</span></td>{user.role === 'Admin' && <td className="px-6 py-4"><ToggleSwitch enabled={student.isAiAssistantEnabled ?? true} onChange={() => handleToggleAiAssistant(student)} /></td>}<td className="px-6 py-4">{studentProjectMap.get(student.studentId) || 'N/A'}</td><td className="px-6 py-4 text-right space-x-2">{student.status === 'Pending' && <button onClick={() => handleApproveStudent(student)} className="p-2 text-slate-500 hover:text-green-600" title={t('approve')}><CheckCircleIcon className="w-5 h-5"/></button>}<button onClick={() => handleEditClick(student)} className="p-2 text-slate-500 hover:text-blue-600"><PencilIcon className="w-5 h-5" /></button><button onClick={() => handleDeleteRequest(student)} className="p-2 text-slate-500 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button></td></tr>)}</tbody>
                    </table>
                    {sortedAndFilteredStudents.length === 0 && <div className="text-center py-10 text-slate-500 dark:text-slate-400">{searchQuery ? t('noStudentsForQuery').replace('${query}', searchQuery) : t('noStudentsClickToAdd')}</div>}
                </div>
                 <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(sortedAndFilteredStudents.length / ITEMS_PER_PAGE)}
                    totalItems={sortedAndFilteredStudents.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </div>
            {isModalOpen && <StudentModal onClose={() => setIsModalOpen(false)} onSave={handleSaveStudent} studentToEdit={editingStudent} allStudents={students} majors={majors} classrooms={classrooms} />}
            {studentToDelete && <ConfirmationModal isOpen={!!studentToDelete} onClose={() => setStudentToDelete(null)} onConfirm={confirmDelete} title={t('deleteStudentTitle')} message={t('deleteStudentMessage').replace('${name}', `${studentToDelete.name} ${studentToDelete.surname}`)} />}
            {isBulkEditModalOpen && <BulkEditModal isOpen={isBulkEditModalOpen} onClose={() => setIsBulkEditModalOpen(false)} onSave={handleBulkEdit} majors={majors} classrooms={classrooms} selectedCount={selectedStudentIds.size} />}
            {isBulkDeleteModalOpen && <ConfirmationModal isOpen={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)} onConfirm={handleBulkDelete} title={t('bulkDeleteStudentTitle').replace('${count}', String(selectedStudentIds.size))} message={t('bulkDeleteStudentMessage').replace('${count}', String(selectedStudentIds.size))} />}
            {isReviewModalOpen && <ImportReviewModal<Student> isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onConfirm={handleConfirmImport} data={reviewData} columns={[{ key: '_status', header: 'Status' }, { key: 'studentId', header: 'Student ID' }, { key: 'name', header: 'Name' }, { key: 'surname', header: 'Surname' }, { key: 'major', header: 'Major' }, { key: 'classroom', header: 'Classroom' }, { key: '_error', header: 'Error' }]} dataTypeName="Students" />}
        </div>
    );
};

export default StudentManagement;