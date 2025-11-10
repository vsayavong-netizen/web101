import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, TextField, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, Grid, Stack, Switch, FormControl, InputLabel,
  Checkbox, Chip, Tooltip, InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, UploadFile as UploadFileIcon,
  Download as DownloadIcon, Groups as GroupsIcon,
  CheckCircle as CheckCircleIcon, Schedule as ScheduleIcon
} from '@mui/icons-material';
import { Student, ProjectGroup, Major, Classroom, Gender, User } from '../types';
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

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; onClick: () => void; color: 'primary' | 'success' | 'warning'; isActive: boolean }> = ({ title, value, icon, onClick, color = 'primary', isActive }) => {
    const colorMap: Record<'primary' | 'success' | 'warning', { bg: string; ring: string }> = {
        'primary': { bg: 'primary.main', ring: 'primary.main' },
        'success': { bg: 'success.main', ring: 'success.main' },
        'warning': { bg: 'warning.main', ring: 'warning.main' },
    };
    const muiColor = colorMap[color];
    
    return (
        <Card
            onClick={onClick}
            sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                bgcolor: muiColor.bg,
                color: 'white',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' },
                border: isActive ? 2 : 1,
                borderColor: isActive ? muiColor.ring : 'transparent',
            }}
        >
            <Box sx={{ 
                flexShrink: 0, 
                bgcolor: 'rgba(255,255,255,0.2)', 
                borderRadius: '50%', 
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {title}
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                    {value}
                </Typography>
            </Box>
        </Card>
    );
};

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void; }> = ({ enabled, onChange }) => (
    <Switch
        checked={enabled}
        onChange={onChange}
        color="primary"
    />
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                   <GroupsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                   <Box>
                     <Typography variant="h5" component="h2" fontWeight="bold">
                       {t('manageAllStudents')}
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                       {t('studentsDescription')}
                     </Typography>
                   </Box>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: { xs: 2, sm: 0 } }}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".xlsx, .xls"/>
                    <Button
                        onClick={handleImportClick}
                        variant="contained"
                        startIcon={<UploadFileIcon />}
                        sx={{ bgcolor: 'teal.600', '&:hover': { bgcolor: 'teal.700' }, fontWeight: 'bold' }}
                    >
                        {t('import')}
                    </Button>
                    <Button
                        onClick={handleExportExcel}
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        sx={{ bgcolor: 'green.600', '&:hover': { bgcolor: 'green.700' }, fontWeight: 'bold' }}
                    >
                        {t('exportExcel')}
                    </Button>
                    <Button
                        onClick={handleAddClick}
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        sx={{ fontWeight: 'bold' }}
                    >
                        {t('addStudent')}
                    </Button>
                </Stack>
            </Box>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatCard 
                        title={t('totalStudents')} 
                        value={studentStats.total} 
                        icon={<GroupsIcon sx={{ fontSize: 24 }} />} 
                        onClick={() => setStatusFilter('all')} 
                        color="primary" 
                        isActive={statusFilter === 'all'} 
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatCard 
                        title={t('approvedStudents')} 
                        value={studentStats.approved} 
                        icon={<CheckCircleIcon sx={{ fontSize: 24 }} />} 
                        onClick={() => setStatusFilter('Approved')} 
                        color="success" 
                        isActive={statusFilter === 'Approved'} 
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatCard 
                        title={t('pendingStudents')} 
                        value={studentStats.pending} 
                        icon={<ScheduleIcon sx={{ fontSize: 24 }} />} 
                        onClick={() => setStatusFilter('Pending')} 
                        color="warning" 
                        isActive={statusFilter === 'Pending'} 
                    />
                </Grid>
            </Grid>

            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            placeholder={t('searchByIdNameEmail')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel>{t('major')}</InputLabel>
                            <Select
                                value={majorFilter}
                                onChange={(e) => setMajorFilter(e.target.value)}
                                label={t('major')}
                            >
                                <MenuItem value="all">{t('allMajors')}</MenuItem>
                                {majors.map(m => (
                                    <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                {selectedStudentIds.size > 0 && (
                    <Box sx={{ 
                        bgcolor: 'primary.light', 
                        p: 2, 
                        borderRadius: 1, 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2
                    }}>
                        <Typography variant="body2" fontWeight={600} color="primary.dark">
                            {t('bulkActionsSelected').replace('${count}', String(selectedStudentIds.size))}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button
                                onClick={() => setIsBulkEditModalOpen(true)}
                                size="small"
                                color="primary"
                            >
                                {t('edit')}
                            </Button>
                            <Button
                                onClick={() => setIsBulkDeleteModalOpen(true)}
                                size="small"
                                color="error"
                            >
                                {t('delete')}
                            </Button>
                        </Stack>
                    </Box>
                )}
                <Box sx={{ display: { lg: 'none' } }}>
                    <Grid container spacing={2}>
                        {paginatedStudents.map((student, index) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={student.id || `${student.studentId}-${index}`}>
                                <StudentCard 
                                    student={student} 
                                    user={user} 
                                    projectId={studentProjectMap.get(student.studentId)} 
                                    onEdit={() => handleEditClick(student)} 
                                    onDelete={() => handleDeleteRequest(student)} 
                                    onApprove={() => handleApproveStudent(student)} 
                                    onSelect={handleSelect} 
                                    isSelected={selectedStudentIds.has(student.studentId)} 
                                    onToggleAiAssistant={() => handleToggleAiAssistant(student)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
                <TableContainer sx={{ display: { xs: 'none', lg: 'block' } }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedStudentIds.size > 0 && selectedStudentIds.size === sortedAndFilteredStudents.length}
                                        indeterminate={selectedStudentIds.size > 0 && selectedStudentIds.size < sortedAndFilteredStudents.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                                <SortableHeader sortKey="studentId" title={t('studentId')} sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader sortKey="name" title={t('fullName')} sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader sortKey="major" title={t('major')} sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader sortKey="status" title={t('status')} sortConfig={sortConfig} requestSort={requestSort} />
                                {user.role === 'Admin' && (
                                    <TableCell>{t('aiAssistant')}</TableCell>
                                )}
                                <TableCell>{t('project')}</TableCell>
                                <TableCell align="right">{t('actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedStudents.map((student, index) => (
                                <TableRow 
                                    key={student.id || `${student.studentId}-${index}`}
                                    selected={selectedStudentIds.has(student.studentId)}
                                    sx={{
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedStudentIds.has(student.studentId)}
                                            onChange={() => handleSelect(student.studentId)}
                                        />
                                    </TableCell>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                                        {student.studentId}
                                    </TableCell>
                                    <TableCell>{student.name} {student.surname}</TableCell>
                                    <TableCell>{student.major}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={student.status}
                                            size="small"
                                            color={student.status === 'Approved' ? 'success' : 'warning'}
                                        />
                                    </TableCell>
                                    {user.role === 'Admin' && (
                                        <TableCell>
                                            <ToggleSwitch 
                                                enabled={student.isAiAssistantEnabled ?? true} 
                                                onChange={() => handleToggleAiAssistant(student)} 
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell>{studentProjectMap.get(student.studentId) || 'N/A'}</TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            {student.status === 'Pending' && (
                                                <Tooltip title={t('approve')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleApproveStudent(student)}
                                                        color="success"
                                                    >
                                                        <CheckCircleIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEditClick(student)}
                                                color="primary"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteRequest(student)}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {sortedAndFilteredStudents.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 5 }}>
                            <Typography color="text.secondary">
                                {searchQuery ? t('noStudentsForQuery').replace('${query}', searchQuery) : t('noStudentsClickToAdd')}
                            </Typography>
                        </Box>
                    )}
                </TableContainer>
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(sortedAndFilteredStudents.length / ITEMS_PER_PAGE)}
                    totalItems={sortedAndFilteredStudents.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </Paper>
            {isModalOpen && <StudentModal onClose={() => setIsModalOpen(false)} onSave={handleSaveStudent} studentToEdit={editingStudent} allStudents={students} majors={majors} classrooms={classrooms} />}
            {studentToDelete && <ConfirmationModal isOpen={!!studentToDelete} onClose={() => setStudentToDelete(null)} onConfirm={confirmDelete} title={t('deleteStudentTitle')} message={t('deleteStudentMessage').replace('${name}', `${studentToDelete.name} ${studentToDelete.surname}`)} />}
            {isBulkEditModalOpen && <BulkEditModal isOpen={isBulkEditModalOpen} onClose={() => setIsBulkEditModalOpen(false)} onSave={handleBulkEdit} majors={majors} classrooms={classrooms} selectedCount={selectedStudentIds.size} />}
            {isBulkDeleteModalOpen && <ConfirmationModal isOpen={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)} onConfirm={handleBulkDelete} title={t('bulkDeleteStudentTitle').replace('${count}', String(selectedStudentIds.size))} message={t('bulkDeleteStudentMessage').replace('${count}', String(selectedStudentIds.size))} />}
            {isReviewModalOpen && <ImportReviewModal<Student> isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onConfirm={handleConfirmImport} data={reviewData} columns={[{ key: '_status', header: 'Status' }, { key: 'studentId', header: 'Student ID' }, { key: 'name', header: 'Name' }, { key: 'surname', header: 'Surname' }, { key: 'major', header: 'Major' }, { key: 'classroom', header: 'Classroom' }, { key: '_error', header: 'Error' }]} dataTypeName="Students" />}
        </Box>
    );
};

export default StudentManagement;