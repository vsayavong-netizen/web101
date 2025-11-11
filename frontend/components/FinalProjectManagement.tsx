import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Grid, Stack, InputAdornment, Card, CardContent, Divider
} from '@mui/material';
import { 
  Search as SearchIcon, Download as DownloadIcon, Check as CheckIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { ProjectGroup, Advisor, FinalSubmissionStatus } from '../types';
import { useToast } from '../hooks/useToast';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import { ExcelUtils } from '../utils/excelUtils';
import { useTranslations } from '../hooks/useTranslations';

interface FinalProjectManagementProps {
    projectGroups: ProjectGroup[];
    advisors: Advisor[];
    updateProjectGrade: (projectId: string, finalGrade: string | null) => void;
}

type SortKey = 'projectId' | 'studentNames' | 'advisorName' | 'finalGrade';

import { getFile } from '../utils/fileStorage';

const getFileDataUrl = async (fileId: string): Promise<string> => {
    try {
        const fileData = await getFile(fileId);
        return fileData || '';
    } catch (error) {
        console.error('Error reading file:', error);
        // Fallback to localStorage
        return localStorage.getItem(`file_${fileId}`) || '';
    }
};

export const FinalProjectManagement: React.FC<FinalProjectManagementProps> = ({ projectGroups, advisors, updateProjectGrade }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig<SortKey> | null>({ key: 'projectId', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');
    const [edits, setEdits] = useState<Record<string, string>>({});
    const addToast = useToast();
    const t = useTranslations();

    const finalProjects = useMemo(() => {
        return projectGroups.filter(pg => 
            pg.project.finalSubmissions?.postDefenseFile?.status === FinalSubmissionStatus.Approved
        );
    }, [projectGroups]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredProjects = useMemo(() => {
        let filtered = [...finalProjects];
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(pg =>
                pg.project.projectId.toLowerCase().includes(lowercasedQuery) ||
                pg.project.topicEng.toLowerCase().includes(lowercasedQuery) ||
                pg.project.advisorName.toLowerCase().includes(lowercasedQuery) ||
                pg.students.some(s => `${s.name} ${s.surname}`.toLowerCase().includes(lowercasedQuery))
            );
        }
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;
                switch (sortConfig.key) {
                    case 'studentNames':
                        aValue = a.students.map(s => s.name).join(', ');
                        bValue = b.students.map(s => s.name).join(', ');
                        break;
                    case 'finalGrade':
                        aValue = a.project.finalGrade || '';
                        bValue = b.project.finalGrade || '';
                        break;
                    default:
                        aValue = a.project[sortConfig.key as 'projectId' | 'advisorName'];
                        bValue = b.project[sortConfig.key as 'projectId' | 'advisorName'];
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [finalProjects, searchQuery, sortConfig]);

    const handleGradeChange = (projectId: string, grade: string) => {
        setEdits(prev => ({ ...prev, [projectId]: grade.toUpperCase() }));
    };

    const handleSaveGrade = (projectId: string) => {
        const grade = edits[projectId];
        if (grade === undefined) return;
        updateProjectGrade(projectId, grade || null);
        addToast({ type: 'success', message: t('gradeSavedToast').replace('${projectId}', projectId) });
        setEdits(prev => {
            const newEdits = { ...prev };
            delete newEdits[projectId];
            return newEdits;
        });
    };

    const handleDownload = async (pg: ProjectGroup) => {
        const file = pg.project.finalSubmissions?.postDefenseFile;
        if (!file) return;

        try {
            const dataUrl = await getFileDataUrl(file.fileId);
            if (dataUrl) {
                const studentNames = pg.students.map(s => `${s.name}_${s.surname}`).join('_and_');
                const safeStudentNames = studentNames.replace(/\s+/g, '_');
                const nameParts = file.name.split('.');
                const extension = nameParts.length > 1 ? nameParts.pop() : 'file';
                const newFileName = `${pg.project.projectId}_${safeStudentNames}_Final_Report.${extension}`;
                
                const link = document.createElement('a');
                link.href = dataUrl.startsWith('http') ? dataUrl : dataUrl;
                link.download = newFileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                addToast({ type: 'error', message: t('couldNotRetrieveFile') });
            }
        } catch (error) {
            console.error('Failed to download file:', error);
            addToast({ type: 'error', message: t('couldNotRetrieveFile') });
        }
    };

    const handleExportExcel = useCallback(async () => {
        const dataToExport = sortedAndFilteredProjects.map(pg => ({
            [t('projectId')]: pg.project.projectId,
            [t('topicEng')]: pg.project.topicEng,
            [t('students')]: pg.students.map(s => `${s.name} ${s.surname} (${s.studentId})`).join(', '),
            [t('advisor')]: pg.project.advisorName,
            [t('finalGrades')]: pg.project.finalGrade || t('notGraded')
        }));
        
        if (dataToExport.length === 0) {
            addToast({ type: 'info', message: t('noDataToExport') });
            return;
        }

        await ExcelUtils.exportToExcel(dataToExport, 'final_project_grades.xlsx');
        addToast({ type: 'success', message: t('exportGradesSuccessToast') });
    }, [sortedAndFilteredProjects, addToast, t]);


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
                   <AssignmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                   <Box>
                     <Typography variant="h5" component="h2" fontWeight="bold">
                       {t('finalGradesReports')}
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                       {t('finalGradesDescription')}
                     </Typography>
                   </Box>
                </Box>
                <Button
                    onClick={handleExportExcel}
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    sx={{ bgcolor: 'green.600', '&:hover': { bgcolor: 'green.700' }, fontWeight: 'bold', mt: { xs: 2, sm: 0 } }}
                >
                    {t('exportGrades')}
                </Button>
            </Box>
            <Box sx={{ mb: 2 }}>
                <TextField
                    placeholder={t('searchByIdTopicStudent')}
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
                    {sortedAndFilteredProjects.map(pg => (
                        <Grid size={{ xs: 12, sm: 6 }} key={pg.project.projectId}>
                            <Card variant="outlined">
                                <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                                        <Typography variant="h6" fontWeight="bold">
                                            {pg.project.projectId}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {pg.project.topicEng}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {t('advisor')}: {pg.project.advisorName}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2">
                                            <strong>{t('students')}:</strong> {pg.students.map(s => `${s.name} ${s.surname}`).join(', ')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2">
                                            <strong>{t('finalReport')}:</strong>{' '}
                                            <Button
                                                size="small"
                                                startIcon={<DownloadIcon />}
                                                onClick={() => handleDownload(pg)}
                                                sx={{ textTransform: 'none', minWidth: 'auto', p: 0 }}
                                            >
                                                {t('download')}
                                            </Button>
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Box>
                                        <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                                            {t('finalGrades')}
                                        </Typography>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <TextField
                                                size="small"
                                                value={edits[pg.project.projectId] ?? pg.project.finalGrade ?? ''}
                                                onChange={(e) => handleGradeChange(pg.project.projectId, e.target.value)}
                                                sx={{ flexGrow: 1 }}
                                            />
                                            {edits[pg.project.projectId] !== undefined && (
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleSaveGrade(pg.project.projectId)}
                                                    size="small"
                                                >
                                                    <CheckIcon />
                                                </IconButton>
                                            )}
                                        </Stack>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            <TableContainer sx={{ display: { xs: 'none', lg: 'block' } }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <SortableHeader sortKey="projectId" title={t('projectId')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="studentNames" title={t('students')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="advisorName" title={t('advisor')} sortConfig={sortConfig} requestSort={requestSort} />
                            <TableCell>{t('finalReport')}</TableCell>
                            <SortableHeader sortKey="finalGrade" title={t('finalGrades')} sortConfig={sortConfig} requestSort={requestSort} />
                            <TableCell align="right">{t('actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedAndFilteredProjects.map(pg => (
                            <TableRow 
                                key={pg.project.projectId}
                                sx={{
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                <TableCell component="th" scope="row" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    {pg.project.projectId}
                                </TableCell>
                                <TableCell>{pg.students.map(s => `${s.name} ${s.surname}`).join(', ')}</TableCell>
                                <TableCell>{pg.project.advisorName}</TableCell>
                                <TableCell>
                                    <Button
                                        size="small"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => handleDownload(pg)}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        {t('download')}
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        size="small"
                                        value={edits[pg.project.projectId] ?? pg.project.finalGrade ?? ''}
                                        onChange={(e) => handleGradeChange(pg.project.projectId, e.target.value)}
                                        sx={{ width: 100 }}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    {edits[pg.project.projectId] !== undefined && (
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleSaveGrade(pg.project.projectId)}
                                            aria-label={t('saveChanges')}
                                        >
                                            <CheckIcon />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {sortedAndFilteredProjects.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography color="text.secondary">
                            {searchQuery ? `${t('noProjectsForQuery').replace('${query}', searchQuery)}` : t('noProjectsToDisplay')}
                        </Typography>
                    </Box>
                )}
            </TableContainer>
        </Paper>
    );
};
