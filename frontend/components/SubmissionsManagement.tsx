import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack, InputAdornment, Chip, CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon, Download as DownloadIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { ProjectGroup, FinalSubmissionFile, FinalSubmissionStatus } from '../types';
import { useToast } from '../hooks/useToast';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import JSZip from 'jszip';
import { useTranslations } from '../hooks/useTranslations';

interface SubmissionsManagementProps {
    projectGroups: ProjectGroup[];
}

interface SubmissionRow {
  projectId: string;
  studentNames: string;
  advisorName: string;
  submissionType: 'Pre-Defense' | 'Post-Defense';
  file: FinalSubmissionFile;
}

type SubmissionSortKey = 'projectId' | 'studentNames' | 'submittedAt' | 'status' | 'advisorName';

// Helper functions
const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getFileDataUrl = (fileId: string): string => {
    try {
        return localStorage.getItem(`file_${fileId}`) || '';
    } catch (error) {
        console.error('Error reading file from localStorage:', error);
        return '';
    }
};

const getStatusColor = (status: FinalSubmissionStatus): 'success' | 'info' | 'warning' | 'default' => {
    switch (status) {
        case FinalSubmissionStatus.Approved:
            return 'success';
        case FinalSubmissionStatus.Submitted:
            return 'info';
        case FinalSubmissionStatus.RequiresRevision:
            return 'warning';
        default:
            return 'default';
    }
};


const SubmissionsManagement: React.FC<SubmissionsManagementProps> = ({ projectGroups }) => {
    // States for Pre-Defense Table
    const [preSearchQuery, setPreSearchQuery] = useState('');
    const [preSortConfig, setPreSortConfig] = useState<SortConfig<SubmissionSortKey> | null>({ key: 'submittedAt', direction: 'descending' });
    const [isZippingPre, setIsZippingPre] = useState(false);

    // States for Post-Defense Table
    const [postSearchQuery, setPostSearchQuery] = useState('');
    const [postSortConfig, setPostSortConfig] = useState<SortConfig<SubmissionSortKey> | null>({ key: 'submittedAt', direction: 'descending' });
    const [isZippingPost, setIsZippingPost] = useState(false);
    
    const addToast = useToast();
    const t = useTranslations();

    // Split data into two lists
    const { preDefenseRows, postDefenseRows } = useMemo<{ preDefenseRows: SubmissionRow[], postDefenseRows: SubmissionRow[] }>(() => {
        const preRows: SubmissionRow[] = [];
        const postRows: SubmissionRow[] = [];
        projectGroups.forEach(pg => {
            const studentNames = pg.students.map(s => `${s.name} ${s.surname}`).join(', ');
            if (pg.project.finalSubmissions?.preDefenseFile) {
                preRows.push({
                    projectId: pg.project.projectId,
                    studentNames,
                    advisorName: pg.project.advisorName,
                    submissionType: 'Pre-Defense',
                    file: pg.project.finalSubmissions.preDefenseFile
                });
            }
            if (pg.project.finalSubmissions?.postDefenseFile) {
                postRows.push({
                    projectId: pg.project.projectId,
                    studentNames,
                    advisorName: pg.project.advisorName,
                    submissionType: 'Post-Defense',
                    file: pg.project.finalSubmissions.postDefenseFile
                });
            }
        });
        return { preDefenseRows: preRows, postDefenseRows: postRows };
    }, [projectGroups]);
    
    // Sort functions for each table
    const requestPreSort = (key: SubmissionSortKey) => {
        let direction: SortDirection = 'ascending';
        if (preSortConfig && preSortConfig.key === key && preSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setPreSortConfig({ key, direction });
    };
    const requestPostSort = (key: SubmissionSortKey) => {
        let direction: SortDirection = 'ascending';
        if (postSortConfig && postSortConfig.key === key && postSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setPostSortConfig({ key, direction });
    };

    // Generic sorting and filtering logic
    const applySortAndFilter = (
        rows: SubmissionRow[], 
        query: string, 
        config: SortConfig<SubmissionSortKey> | null
    ): SubmissionRow[] => {
        let filtered = [...rows];
        if (query) {
            const lowercasedQuery = query.toLowerCase();
            filtered = filtered.filter(row =>
                row.projectId.toLowerCase().includes(lowercasedQuery) ||
                row.studentNames.toLowerCase().includes(lowercasedQuery) ||
                row.advisorName.toLowerCase().includes(lowercasedQuery) ||
                row.file.name.toLowerCase().includes(lowercasedQuery)
            );
        }
        if (config !== null) {
            filtered.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;

                if (config.key === 'submittedAt') {
                    aValue = new Date(a.file.submittedAt).getTime();
                    bValue = new Date(b.file.submittedAt).getTime();
                } else if (config.key === 'status') {
                    aValue = a.file.status;
                    bValue = b.file.status;
                } else {
                    aValue = a[config.key as keyof Omit<SubmissionRow, 'file'>];
                    bValue = b[config.key as keyof Omit<SubmissionRow, 'file'>];
                }
                
                if (aValue < bValue) return config.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return config.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    };

    const sortedAndFilteredPreDefense = useMemo(() => applySortAndFilter(preDefenseRows, preSearchQuery, preSortConfig), [preDefenseRows, preSearchQuery, preSortConfig]);
    const sortedAndFilteredPostDefense = useMemo(() => applySortAndFilter(postDefenseRows, postSearchQuery, postSortConfig), [postDefenseRows, postSearchQuery, postSortConfig]);

    const handleDownload = (row: SubmissionRow) => {
        const dataUrl = getFileDataUrl(row.file.fileId);
        if (dataUrl) {
            const safeStudentNames = row.studentNames.replace(/, /g, ' and ').replace(/\s+/g, '_');
            
            const nameParts = row.file.name.split('.');
            const extension = nameParts.length > 1 ? nameParts.pop() : 'file';

            const submissionType = row.submissionType.replace(/\s+/g, '_');

            const newFileName = `${row.projectId}_${safeStudentNames}_${submissionType}.${extension}`;

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = newFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            addToast({ type: 'error', message: t('couldNotRetrieveFile') });
        }
    };

    const handleBulkDownload = useCallback(async (type: 'pre' | 'post') => {
        const submissionsToZip = type === 'pre' ? sortedAndFilteredPreDefense : sortedAndFilteredPostDefense;
        const zipStateSetter = type === 'pre' ? setIsZippingPre : setIsZippingPost;
        const zipFileName = type === 'pre' ? 'Pre_Defense_Submissions' : 'Post_Defense_Submissions';
        
        if (submissionsToZip.length === 0) {
            addToast({ type: 'info', message: t('noFilesToDownload') });
            return;
        }

        zipStateSetter(true);
        addToast({ type: 'info', message: t('preparingDownload') });
    
        const zip = new JSZip();
    
        for (const row of submissionsToZip) {
            const dataUrl = getFileDataUrl(row.file.fileId);
            if (dataUrl) {
                const base64Data = dataUrl.split(',')[1];
                if(base64Data) {
                    const safeStudentNames = row.studentNames
                        .replace(/, /g, ' and ')
                        .replace(/\s+/g, ' ')
                        .trim();

                    const nameParts = row.file.name.split('.');
                    const extension = nameParts.length > 1 ? nameParts.pop() : 'file';

                    const baseName = `${row.projectId} ${safeStudentNames} ${row.submissionType}`;
                    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9 ._-]/g, '').replace(/\s/g, '_');
                    
                    const newFileName = `${sanitizedBaseName}.${extension}`;

                    zip.file(newFileName, base64Data, { base64: true });
                }
            }
        }

        try {
            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = `${zipFileName}_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            addToast({ type: 'success', message: t('zipSuccess') });
        } catch (error) {
            console.error("Error creating zip file:", error);
            addToast({ type: 'error', message: t('zipFailed') });
        } finally {
            zipStateSetter(false);
        }
    }, [sortedAndFilteredPreDefense, sortedAndFilteredPostDefense, addToast, t]);

    const renderTable = (
        title: string,
        description: string,
        rows: SubmissionRow[],
        searchQuery: string,
        setSearchQuery: (query: string) => void,
        sortConfig: SortConfig<SubmissionSortKey> | null,
        requestSort: (key: SubmissionSortKey) => void,
        onBulkDownload: () => void,
        isZipping: boolean,
        emptyMessage: string
    ) => (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 3,
                gap: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                   <InventoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                   <Box>
                     <Typography variant="h5" component="h2" fontWeight="bold">
                       {title}
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                       {description}
                     </Typography>
                   </Box>
                </Box>
                <Button
                    onClick={onBulkDownload}
                    disabled={isZipping}
                    variant="contained"
                    startIcon={isZipping ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                    sx={{ fontWeight: 'bold', mt: { xs: 2, sm: 0 } }}
                >
                    {isZipping ? t('zipping') : t('downloadAll').replace('${count}', String(rows.length))}
                </Button>
            </Box>
            <Box sx={{ mb: 2 }}>
                <TextField
                    placeholder={t('searchSubmissionsPlaceholder')}
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
                            <TableCell>{t('fileName')}</TableCell>
                            <SortableHeader sortKey="submittedAt" title={t('submitted')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="status" title={t('status')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="advisorName" title={t('advisor')} sortConfig={sortConfig} requestSort={requestSort} />
                            <TableCell align="right">{t('download')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map(row => (
                            <TableRow 
                                key={`${row.projectId}-${row.submissionType}`}
                                sx={{
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                <TableCell component="th" scope="row" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    {row.projectId}
                                </TableCell>
                                <TableCell>{row.studentNames}</TableCell>
                                <TableCell>
                                    <Box sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.file.name}>
                                        <Typography variant="body2" noWrap>
                                            {row.file.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            ({formatBytes(row.file.size)})
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {new Date(row.file.submittedAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <Chip 
                                        label={row.file.status} 
                                        color={getStatusColor(row.file.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{row.advisorName}</TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDownload(row)}
                                        color="primary"
                                    >
                                        <DownloadIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {rows.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography color="text.secondary">
                            {searchQuery ? `${t('noProjectsForQuery').replace('${query}', searchQuery)}` : emptyMessage}
                        </Typography>
                    </Box>
                )}
            </TableContainer>
        </Paper>
    );

    return (
        <Box sx={{ py: 2 }}>
            {renderTable(
                t('preDefenseTitle'),
                t('preDefenseDescription'),
                sortedAndFilteredPreDefense,
                preSearchQuery,
                setPreSearchQuery,
                preSortConfig,
                requestPreSort,
                () => handleBulkDownload('pre'),
                isZippingPre,
                t('noPreDefenseFiles')
            )}
            {renderTable(
                t('postDefenseTitle'),
                t('postDefenseDescription'),
                sortedAndFilteredPostDefense,
                postSearchQuery,
                setPostSearchQuery,
                postSortConfig,
                requestPostSort,
                () => handleBulkDownload('post'),
                isZippingPost,
                t('noPostDefenseFiles')
            )}
        </Box>
    );
};

export default SubmissionsManagement;
