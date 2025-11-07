
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, Select, MenuItem, FormControl, InputLabel,
    Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Stack, Divider
} from '@mui/material';
import { ProjectGroup, Advisor, Student, Major, ProjectStatus, Classroom, Gender } from '../types';
import { DocumentChartBarIcon, TableCellsIcon, SparklesIcon } from './icons';
import SortableHeader, { SortConfig } from './SortableHeader';
import { ExcelUtils } from '../utils/excelUtils';
import { useToast } from '../hooks/useToast';
import { GoogleGenAI } from "@google/genai";
import { useTranslations } from '../hooks/useTranslations';
import ColumnSelector from './ColumnSelector';
import Pagination from './Pagination';

interface ReportingPageProps {
    projectGroups: ProjectGroup[];
    advisors: Advisor[];
    students: Student[];
    majors: Major[];
    classrooms: Classroom[];
    committeeCounts: Record<string, { main: number; second: number; third: number }>;
}

const ITEMS_PER_PAGE = 20;

const DEFAULT_PROJECT_COLS = ['projectId', 'topicEng', 'status', 'advisorName', 'studentId', 'studentName', 'majorName'];
const DEFAULT_STUDENT_COLS = ['studentId', 'studentName', 'gender', 'majorName', 'classroom', 'email', 'status'];


export const ReportingPage: React.FC<ReportingPageProps> = ({ projectGroups, advisors, students, majors, classrooms, committeeCounts }) => {
    const [reportType, setReportType] = useState<'project' | 'student'>('project');
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_PROJECT_COLS);
    const [generatedData, setGeneratedData] = useState<any[] | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig<string> | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    const addToast = useToast();
    const t = useTranslations();
    
    const ALL_COLUMNS = useMemo(() => [
        { key: 'projectId', label: t('projectId'), types: ['project'] },
        { key: 'topicEng', label: t('topicEng'), types: ['project'] },
        { key: 'topicLao', label: t('topicLao'), types: ['project'] },
        { key: 'status', label: t('projectStatus'), types: ['project', 'student'] },
        { key: 'advisorName', label: t('advisor'), types: ['project'] },
        { key: 'studentId', label: t('studentId'), types: ['project', 'student'] },
        { key: 'studentName', label: t('studentName'), types: ['project', 'student'] },
        { key: 'gender', label: t('gender'), types: ['project', 'student'] },
        { key: 'majorName', label: t('major'), types: ['project', 'student'] },
        { key: 'classroom', label: t('classroom'), types: ['project', 'student'] },
        { key: 'tel', label: t('telephone'), types: ['student'] },
        { key: 'email', label: t('email'), types: ['student'] },
        { key: 'defenseDate', label: t('defenseDate'), types: ['project'] },
        { key: 'finalGrade', label: t('finalGrade'), types: ['project'] },
    ], [t]);


    useEffect(() => {
        setFilters({});
        setGeneratedData(null);
        setSortConfig(null);
        setCurrentPage(1);
        setAiSummary(null);
        setSelectedColumns(reportType === 'project' ? DEFAULT_PROJECT_COLS : DEFAULT_STUDENT_COLS);
    }, [reportType]);
    
    const availableColumns = useMemo(() => ALL_COLUMNS.filter(c => c.types.includes(reportType)), [reportType, ALL_COLUMNS]);
    
    const flattenedProjectData = useMemo(() => {
        const advisorMap = new Map(advisors.map(a => [a.id, a.name]));
        return projectGroups.flatMap(pg => 
            pg.students.map(s => ({
                ...s,
                ...pg.project,
                studentName: `${s.name} ${s.surname}`,
                majorName: s.major,
                mainCommittee: advisorMap.get(pg.project.mainCommitteeId || '') || 'N/A',
                secondCommittee: advisorMap.get(pg.project.secondCommitteeId || '') || 'N/A',
                thirdCommittee: advisorMap.get(pg.project.thirdCommitteeId || '') || 'N/A',
            }))
        );
    }, [projectGroups, advisors]);

    const handleGenerateReport = () => {
        let data: any[] = reportType === 'project' ? flattenedProjectData : students;
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'all') {
                data = data.filter(item => item[key] === value);
            }
        });
        
        setGeneratedData(data);
        setCurrentPage(1);
        setSortConfig(null);
        setAiSummary(null);
        addToast({type: 'success', message: t('reportGeneratedSuccess').replace('{count}', String(data.length))});
    };
    
    const sortedData = useMemo(() => {
        if (!generatedData) return [];
        let sortableItems = [...generatedData];
        if (sortConfig) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key] ?? '';
                const bValue = b[sortConfig.key] ?? '';
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [generatedData, sortConfig]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedData, currentPage]);
    
    const handleExport = useCallback(async () => {
        if (!generatedData) {
            addToast({ type: 'info', message: t('generateReportFirst') });
            return;
        }
        
        const dataToExport = sortedData.map(row => {
            const selectedRow: Record<string, any> = {};
            selectedColumns.forEach(key => {
                selectedRow[ALL_COLUMNS.find(c => c.key === key)?.label || key] = row[key] ?? '';
            });
            return selectedRow;
        });

        try {
            await ExcelUtils.exportToExcel(dataToExport, `${reportType}_report_${new Date().toISOString().slice(0,10)}.xlsx`);
            addToast({ type: 'success', message: t('exportSuccess') });
        } catch (error) {
            console.error('Export failed:', error);
            addToast({ type: 'error', message: t('exportFailed') });
        }
    }, [generatedData, sortedData, selectedColumns, reportType, addToast, t, ALL_COLUMNS]);
    
    const handleAiSummary = async () => {
        if (!generatedData || generatedData.length === 0) {
            addToast({type: 'info', message: t('generateReportWithDataFirst')});
            return;
        }
        if (!process.env.API_KEY) {
            addToast({type: 'error', message: t('aiFeatureNotConfigured')});
            return;
        }
        setIsGeneratingSummary(true);
        setAiSummary('');
        
        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            const dataSample = generatedData.slice(0, 50).map(row => {
                const sampleRow: Record<string, any> = {};
                selectedColumns.forEach(key => sampleRow[key] = row[key]);
                return sampleRow;
            });
            const prompt = `
              You are a data analyst for a university. Analyze the following sample of a report and provide a brief summary.
              The full report contains ${generatedData.length} entries. This is a sample of ${dataSample.length} entries.
              Report Data: ${JSON.stringify(dataSample, null, 2)}
              
              Based on this data, provide:
              1. A one-sentence high-level summary.
              2. Two or three bullet points highlighting key trends or interesting data points (e.g., "High number of pending projects in the BM major," or "Most students are from the IBM-4A classroom.").
              3. One actionable recommendation based on your findings.
              
              Format your response using Markdown.
            `;
            const response = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: prompt});
            setAiSummary(response.text);

        } catch(e) {
            console.error(e);
            addToast({type: 'error', message: t('aiSummaryFailed')});
            setAiSummary(null);
        } finally {
            setIsGeneratingSummary(false);
        }
    };
    
    const renderFilters = () => {
        switch(reportType) {
            case 'project':
                return <>
                    <FormControl fullWidth>
                        <InputLabel>{t('allMajors')}</InputLabel>
                        <Select
                            value={filters.majorName || 'all'}
                            onChange={e => setFilters(f => ({...f, majorName: e.target.value}))}
                            label={t('allMajors')}
                        >
                            <MenuItem value="all">{t('allMajors')}</MenuItem>
                            {majors.map(m => <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>{t('allAdvisors')}</InputLabel>
                        <Select
                            value={filters.advisorName || 'all'}
                            onChange={e => setFilters(f => ({...f, advisorName: e.target.value}))}
                            label={t('allAdvisors')}
                        >
                            <MenuItem value="all">{t('allAdvisors')}</MenuItem>
                            {advisors.map(a => <MenuItem key={a.id} value={a.name}>{a.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>{t('allStatuses')}</InputLabel>
                        <Select
                            value={filters.status || 'all'}
                            onChange={e => setFilters(f => ({...f, status: e.target.value}))}
                            label={t('allStatuses')}
                        >
                            <MenuItem value="all">{t('allStatuses')}</MenuItem>
                            {Object.values(ProjectStatus).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </FormControl>
                </>;
            case 'student':
                return <>
                    <FormControl fullWidth>
                        <InputLabel>{t('allMajors')}</InputLabel>
                        <Select
                            value={filters.major || 'all'}
                            onChange={e => setFilters(f => ({...f, major: e.target.value}))}
                            label={t('allMajors')}
                        >
                            <MenuItem value="all">{t('allMajors')}</MenuItem>
                            {majors.map(m => <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>{t('classrooms')}</InputLabel>
                        <Select
                            value={filters.classroom || 'all'}
                            onChange={e => setFilters(f => ({...f, classroom: e.target.value}))}
                            label={t('classrooms')}
                        >
                            <MenuItem value="all">{t('classrooms')}</MenuItem>
                            {classrooms.map(c => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>{t('allGenders')}</InputLabel>
                        <Select
                            value={filters.gender || 'all'}
                            onChange={e => setFilters(f => ({...f, gender: e.target.value}))}
                            label={t('allGenders')}
                        >
                            <MenuItem value="all">{t('allGenders')}</MenuItem>
                            {Object.values(Gender).map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                        </Select>
                    </FormControl>
                </>;
            default: return null;
        }
    };

    const requestSort = (columnKey: string) => {
        setSortConfig(prev => ({
            key: columnKey,
            direction: prev?.key === columnKey && prev.direction === 'ascending' ? 'descending' : 'ascending',
        }));
    };
    
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DocumentChartBarIcon sx={{ width: 32, height: 32, color: 'primary.main' }} />
                <Box>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                        {t('reportingInsights')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {t('reportingDescription')}
                    </Typography>
                </Box>
            </Box>

            <Paper elevation={3} sx={{ p: 3 }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>{t('reportType')}</InputLabel>
                            <Select
                                value={reportType}
                                onChange={e => setReportType(e.target.value as any)}
                                label={t('reportType')}
                            >
                                <MenuItem value="project">{t('projectReport')}</MenuItem>
                                <MenuItem value="student">{t('studentReport')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    {renderFilters()}
                    <Grid size={{ xs: 12, md: 12, lg: 12 }}>
                        <FormControl fullWidth>
                            <InputLabel>{t('columns')}</InputLabel>
                            <Box sx={{ mt: 2 }}>
                                <ColumnSelector 
                                    allColumns={availableColumns} 
                                    selectedColumns={selectedColumns} 
                                    setSelectedColumns={setSelectedColumns} 
                                />
                            </Box>
                        </FormControl>
                    </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button 
                        onClick={handleGenerateReport} 
                        variant="contained"
                        color="primary"
                    >
                        {t('generateReport')}
                    </Button>
                    <Button 
                        onClick={handleExport} 
                        disabled={!generatedData}
                        variant="contained"
                        color="secondary"
                        startIcon={<TableCellsIcon sx={{ width: 20, height: 20 }} />}
                    >
                        {t('exportToExcel')}
                    </Button>
                    <Button 
                        onClick={handleAiSummary} 
                        disabled={!generatedData || isGeneratingSummary}
                        variant="contained"
                        sx={{ bgcolor: 'purple.600', '&:hover': { bgcolor: 'purple.700' } }}
                        startIcon={isGeneratingSummary ? <CircularProgress size={16} color="inherit" /> : <SparklesIcon sx={{ width: 20, height: 20 }} />}
                    >
                        {t('aiSummary')}
                    </Button>
                </Stack>
            </Paper>

            {aiSummary && (
                <Alert 
                    severity="info" 
                    icon={<SparklesIcon sx={{ width: 20, height: 20 }} />}
                    sx={{ 
                        bgcolor: 'purple.50', 
                        border: '1px solid',
                        borderColor: 'purple.200',
                        '& .MuiAlert-message': {
                            '& p': { mb: 1 },
                            '& ul': { mb: 1, pl: 2 }
                        }
                    }}
                >
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {t('aiSummary')}
                    </Typography>
                    <Box 
                        sx={{ 
                            '& p': { mb: 1 },
                            '& ul': { mb: 1, pl: 2 },
                            '& li': { mb: 0.5 }
                        }}
                        dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br />') }}
                    />
                </Alert>
            )}
            
            {generatedData && (
                <Paper elevation={3}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {selectedColumns.map(colKey => (
                                        <SortableHeader 
                                            key={colKey}
                                            sortKey={colKey} 
                                            title={ALL_COLUMNS.find(c => c.key === colKey)?.label || colKey} 
                                            sortConfig={sortConfig} 
                                            requestSort={requestSort}
                                        />
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={selectedColumns.length} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {t('noDataForFilters')}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((row, index) => (
                                        <TableRow key={index}>
                                            {selectedColumns.map(key => (
                                                <TableCell key={key}>
                                                    {row[key] ?? ''}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Pagination 
                        currentPage={currentPage} 
                        totalPages={Math.ceil(sortedData.length / ITEMS_PER_PAGE)} 
                        totalItems={sortedData.length} 
                        itemsPerPage={ITEMS_PER_PAGE} 
                        onPageChange={setCurrentPage} 
                    />
                </Paper>
            )}
        </Box>
    );
};
