import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter,
  Grid, Stack, InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Download as DownloadIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import { Major, Student, Classroom, Gender, ProjectGroup, ProjectStatus } from '../types';
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

    const handleExportExcel = useCallback(async () => {
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
    
        await ExcelUtils.exportToExcel(dataToExport, 'majors_report.xlsx');
        addToast({ type: 'success', message: t('majorExportSuccess') });
    }, [sortedAndFilteredMajors, majorStats, addToast, t]);

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
                   <MenuBookIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                   <Box>
                     <Typography variant="h5" component="h2" fontWeight="bold">
                       {t('manageMajors')}
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                       {t('manageMajorsDescription')}
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
                        {t('addMajor')}
                    </Button>
                </Stack>
            </Box>
            <Box sx={{ mb: 2 }}>
                <TextField
                    placeholder={t('searchByMajor')}
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
                <Grid container spacing={2}>
                    {paginatedMajors.map(major => {
                        const stats = majorStats.get(major.id) || { studentCount: 0, classroomCount: 0, maleCount: 0, femaleCount: 0, monkCount: 0, projectCount: 0, soloProjectCount: 0, duoProjectCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 };
                        return (
                            <Grid size={{ xs: 12, sm: 6 }} key={major.id}>
                                <MajorCard
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
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>

            <TableContainer sx={{ display: { xs: 'none', lg: 'block' } }}>
                <Table>
                    <TableHead>
                        <TableRow>
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
                            <TableCell align="right">{t('actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedMajors.map(major => {
                            const stats = majorStats.get(major.id) || { studentCount: 0, classroomCount: 0, maleCount: 0, femaleCount: 0, monkCount: 0, projectCount: 0, soloProjectCount: 0, duoProjectCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 };
                            return (
                                <TableRow 
                                    key={major.id}
                                    sx={{
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                                        {major.id}
                                    </TableCell>
                                    <TableCell>{major.name}</TableCell>
                                    <TableCell>{major.abbreviation}</TableCell>
                                    <TableCell>{stats.studentCount}</TableCell>
                                    <TableCell>{stats.projectCount}</TableCell>
                                    <TableCell>{stats.soloProjectCount}</TableCell>
                                    <TableCell>{stats.duoProjectCount}</TableCell>
                                    <TableCell sx={{ color: 'success.main' }}>{stats.approvedCount}</TableCell>
                                    <TableCell sx={{ color: 'warning.main' }}>{stats.pendingCount}</TableCell>
                                    <TableCell sx={{ color: 'error.main' }}>{stats.rejectedCount}</TableCell>
                                    <TableCell>{stats.maleCount}</TableCell>
                                    <TableCell>{stats.femaleCount}</TableCell>
                                    <TableCell>{stats.monkCount}</TableCell>
                                    <TableCell>{stats.classroomCount}</TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEditClick(major)}
                                                color="primary"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteRequest(major)}
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
                    <TableFooter>
                        <TableRow sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>
                            <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>{t('total')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{totals.totalStudents}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{totals.totalProjects}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{totals.totalSoloProjects}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{totals.totalDuoProjects}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>{totals.totalApproved}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'warning.main' }}>{totals.totalPending}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'error.main' }}>{totals.totalRejected}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{totals.totalMale}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{totals.totalFemale}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{totals.totalMonk}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{totals.totalClassrooms}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
                {sortedAndFilteredMajors.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography color="text.secondary">
                            {searchQuery ? `No majors found for "${searchQuery}".` : `No majors found. Click "${t('addMajor')}" to begin.`}
                        </Typography>
                    </Box>
                )}
            </TableContainer>
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
        </Paper>
    );
};

export default MajorManagement;