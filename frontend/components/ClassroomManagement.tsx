import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Grid, Stack, InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Download as DownloadIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { Classroom, Student, Major, Gender, ProjectGroup, ProjectStatus, User } from '../types';
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

    const handleSaveClassroom = async (classroomData: Classroom | Omit<Classroom, 'id'>) => {
        try {
            if ('id' in classroomData) {
                await updateClassroom(classroomData);
                addToast({ type: 'success', message: t('classroomUpdatedSuccess') });
            } else {
                await addClassroom(classroomData);
                addToast({ type: 'success', message: t('classroomAddedSuccess') });
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save classroom:', error);
            addToast({ type: 'error', message: t('classroomSaveError') || 'Failed to save classroom' });
        }
    };

    const handleExportExcel = useCallback(async () => {
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
    
        await ExcelUtils.exportToExcel(dataToExport, 'classrooms_report.xlsx');
        addToast({ type: 'success', message: t('classroomExportSuccess') });
    }, [sortedAndFilteredClassrooms, classroomStats, addToast, t]);

    return (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 3,
                gap: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                   <BusinessIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                   <Box>
                     <Typography variant="h5" component="h2" fontWeight="bold">
                       {t('manageClassrooms')}
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                       {t('manageClassroomsDescription')}
                     </Typography>
                   </Box>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: { xs: 2, sm: 0 } }}>
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
                        {t('addClassroom')}
                    </Button>
                </Stack>
            </Box>
            <Box sx={{ mb: 2 }}>
                <TextField
                    placeholder={t('searchByClassroom')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: { xs: '100%', sm: '50%', lg: '33%' } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <Box sx={{ display: { lg: 'none' } }}>
                {sortedAndFilteredClassrooms.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography color="text.secondary">
                            {searchQuery 
                                ? (t('noClassroomsForQuery') || 'No classrooms found for "${query}".').replace('${query}', searchQuery)
                                : (t('noClassroomsClickToAdd') || 'No classrooms found. Click "Add Classroom" to begin.')
                            }
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {paginatedClassrooms.map((classroom, index) => {
                            const stats = classroomStats.get(classroom.id) || { studentCount: 0, maleCount: 0, femaleCount: 0, monkCount: 0, projectCount: 0, soloProjectCount: 0, duoProjectCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 };
                            return (
                                <Grid size={{ xs: 12, sm: 6 }} key={classroom.id}>
                                    <ClassroomCard
                                        index={(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                        classroom={classroom}
                                        {...stats}
                                        onEdit={() => handleEditClick(classroom)}
                                        onDelete={() => handleDeleteRequest(classroom)}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Box>

            <TableContainer sx={{ display: { xs: 'none', lg: 'block' } }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('no')}</TableCell>
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
                            <TableCell align="right">{t('actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedClassrooms.map((classroom, index) => {
                            const stats = classroomStats.get(classroom.id) || { studentCount: 0, maleCount: 0, femaleCount: 0, monkCount: 0, projectCount: 0, soloProjectCount: 0, duoProjectCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 };
                            return (
                                <TableRow 
                                    key={classroom.id}
                                    sx={{
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                                        {classroom.id}
                                    </TableCell>
                                    <TableCell>{classroom.name}</TableCell>
                                    <TableCell>{classroom.majorName}</TableCell>
                                    <TableCell>{stats.studentCount}</TableCell>
                                    <TableCell>{stats.maleCount}</TableCell>
                                    <TableCell>{stats.femaleCount}</TableCell>
                                    <TableCell>{stats.monkCount}</TableCell>
                                    <TableCell>{stats.projectCount}</TableCell>
                                    <TableCell>{stats.soloProjectCount}</TableCell>
                                    <TableCell>{stats.duoProjectCount}</TableCell>
                                    <TableCell sx={{ color: 'success.main' }}>{stats.approvedCount}</TableCell>
                                    <TableCell sx={{ color: 'warning.main' }}>{stats.pendingCount}</TableCell>
                                    <TableCell sx={{ color: 'error.main' }}>{stats.rejectedCount}</TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEditClick(classroom)}
                                                color="primary"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteRequest(classroom)}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                {sortedAndFilteredClassrooms.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography color="text.secondary">
                            {searchQuery 
                                ? (t('noClassroomsForQuery') || 'No classrooms found for "${query}".').replace('${query}', searchQuery)
                                : (t('noClassroomsClickToAdd') || 'No classrooms found. Click "Add Classroom" to begin.')
                            }
                        </Typography>
                    </Box>
                )}
            </TableContainer>
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
                    title={t('deleteClassroomTitle') || 'Delete Classroom?'}
                    message={(t('deleteClassroomMessage') || 'Are you sure you want to delete classroom "${classroomName}"? This action cannot be undone.').replace('${classroomName}', classroomToDelete.name)}
                />
            )}
        </Paper>
    );
};

export default ClassroomManagement;