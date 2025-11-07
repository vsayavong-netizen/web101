import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment
} from '@mui/material';
import { 
  Search as SearchIcon, Download as DownloadIcon,
  EditNote as EditNoteIcon
} from '@mui/icons-material';
import { ProjectGroup, ScoringSettings, Advisor } from '../types';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import { ExcelUtils } from '../utils/excelUtils';
import { useToast } from '../hooks/useToast';
import { useTranslations } from '../hooks/useTranslations';

interface ScoringManagementProps {
    projectGroups: ProjectGroup[];
    advisors: Advisor[];
    scoringSettings: ScoringSettings;
    onSelectProject: (projectGroup: ProjectGroup) => void;
}

type SortKey = 'projectId' | 'studentNames' | 'advisorName' | 'finalScore' | 'finalGrade';

const ScoringManagement: React.FC<ScoringManagementProps> = ({ projectGroups, scoringSettings, onSelectProject, advisors }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig<SortKey> | null>({ key: 'projectId', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');
    const addToast = useToast();
    const t = useTranslations();
    
    const scoreableProjects = useMemo(() => {
        return projectGroups.filter(pg => 
            pg.project.defenseDate &&
            pg.project.mainCommitteeId &&
            pg.project.secondCommitteeId &&
            pg.project.thirdCommitteeId
        );
    }, [projectGroups]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const calculateFinalScore = useCallback((project: ProjectGroup['project']) => {
        const { mainAdvisorScore, mainCommitteeScore, secondCommitteeScore, thirdCommitteeScore } = project;
        if (mainAdvisorScore === null || mainCommitteeScore === null || secondCommitteeScore === null || thirdCommitteeScore === null) return null;

        const avgCommitteeScore = (mainCommitteeScore + secondCommitteeScore + thirdCommitteeScore) / 3;
        const finalScore = mainAdvisorScore + avgCommitteeScore;
        
        return finalScore;
    }, []);

    const getFinalGrade = useCallback((score: number | null): string => {
        if (score === null) return t('incomplete');
        const foundGrade = scoringSettings.gradeBoundaries.find(boundary => score >= boundary.minScore);
        return foundGrade ? foundGrade.grade : 'F';
    }, [scoringSettings.gradeBoundaries, t]);

    const projectsWithScores = useMemo(() => {
        return scoreableProjects.map(pg => {
            const finalScore = calculateFinalScore(pg.project);
            return {
                ...pg,
                finalScore,
                finalGrade: getFinalGrade(finalScore),
                studentNames: pg.students.map(s => `${s.name} ${s.surname}`).join(', '),
                committeeAvgScore: (pg.project.mainCommitteeScore !== null && pg.project.secondCommitteeScore !== null && pg.project.thirdCommitteeScore !== null)
                    ? ((pg.project.mainCommitteeScore + pg.project.secondCommitteeScore + pg.project.thirdCommitteeScore) / 3)
                    : null
            };
        });
    }, [scoreableProjects, calculateFinalScore, getFinalGrade]);


    const sortedAndFilteredProjects = useMemo(() => {
        let filtered = [...projectsWithScores];
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(pg =>
                pg.project.projectId.toLowerCase().includes(lowercasedQuery) ||
                pg.project.topicEng.toLowerCase().includes(lowercasedQuery) ||
                pg.studentNames.toLowerCase().includes(lowercasedQuery) ||
                pg.project.advisorName.toLowerCase().includes(lowercasedQuery)
            );
        }
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue: string | number | null;
                let bValue: string | number | null;
                switch(sortConfig.key) {
                    case 'finalScore':
                        aValue = a.finalScore === null ? -1 : a.finalScore;
                        bValue = b.finalScore === null ? -1 : b.finalScore;
                        break;
                    case 'finalGrade':
                        aValue = a.finalGrade;
                        bValue = b.finalGrade;
                        break;
                    case 'studentNames':
                        aValue = a.studentNames;
                        bValue = b.studentNames;
                        break;
                    default:
                        aValue = a.project[sortConfig.key as keyof typeof a.project] as string | number;
                        bValue = b.project[sortConfig.key as keyof typeof b.project] as string | number;
                }
                
                if (aValue === null || aValue === 'Incomplete') return 1;
                if (bValue === null || bValue === 'Incomplete') return -1;
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [projectsWithScores, searchQuery, sortConfig]);

    const handleExportExcel = useCallback(async () => {
        const dataToExport = sortedAndFilteredProjects.map(pg => ({
            [t('projectId')]: pg.project.projectId,
            [t('students')]: pg.studentNames,
            [t('advisor')]: pg.project.advisorName,
            [t('advisorScore')]: pg.project.mainAdvisorScore?.toFixed(2) ?? t('na'),
            [t('committeeAvg')]: pg.committeeAvgScore?.toFixed(2) ?? t('na'),
            [t('finalScore')]: pg.finalScore?.toFixed(2) ?? t('na'),
            [t('finalGrade')]: pg.finalGrade,
        }));
    
        if (dataToExport.length === 0) {
            addToast({ type: 'info', message: t('noDataToExport') });
            return;
        }
    
        await ExcelUtils.exportToExcel(dataToExport, 'scoring_report.xlsx');
        addToast({ type: 'success', message: t('exportScoringSuccess') });
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
                   <EditNoteIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                   <Box>
                     <Typography variant="h5" component="h2" fontWeight="bold">
                       {t('manageScoringTitle')}
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                       {t('manageScoringDescription')}
                     </Typography>
                   </Box>
                </Box>
                <Button
                    onClick={handleExportExcel}
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    sx={{ bgcolor: 'green.600', '&:hover': { bgcolor: 'green.700' }, fontWeight: 'bold', mt: { xs: 2, sm: 0 } }}
                >
                    {t('exportScoringReport')}
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
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <SortableHeader sortKey="projectId" title={t('projectId')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="studentNames" title={t('students')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="advisorName" title={t('advisor')} sortConfig={sortConfig} requestSort={requestSort} />
                            <TableCell>{t('advisorScore')}</TableCell>
                            <TableCell>{t('committeeAvg')}</TableCell>
                            <SortableHeader sortKey="finalScore" title={t('finalScore')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="finalGrade" title={t('finalGrade')} sortConfig={sortConfig} requestSort={requestSort} />
                            <TableCell>{t('details')}</TableCell>
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
                                <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                                    {pg.project.projectId}
                                </TableCell>
                                <TableCell>{pg.studentNames}</TableCell>
                                <TableCell>{pg.project.advisorName}</TableCell>
                                <TableCell>{pg.project.mainAdvisorScore?.toFixed(2) ?? t('na')}</TableCell>
                                <TableCell>{pg.committeeAvgScore?.toFixed(2) ?? t('na')}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{pg.finalScore?.toFixed(2) ?? t('na')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{pg.finalGrade}</TableCell>
                                <TableCell>
                                    <Button
                                        size="small"
                                        onClick={() => onSelectProject(pg)}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        {t('view')}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {sortedAndFilteredProjects.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography color="text.secondary">
                            {searchQuery ? t('noProjectsForQuery').replace('${query}', searchQuery) : t('noScoreableProjects')}
                        </Typography>
                    </Box>
                )}
            </TableContainer>
        </Paper>
    );
};

export default ScoringManagement;