import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Grid, Stack, Switch, Checkbox, Tooltip, InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, UploadFile as UploadFileIcon,
  Download as DownloadIcon, School as SchoolIcon
} from '@mui/icons-material';
import { Advisor, ProjectGroup, Major, User } from '../types';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';
import AdvisorModal from './AdvisorModal';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import AdvisorBulkEditModal from './AdvisorBulkEditModal';
import ImportReviewModal from './ImportReviewModal';
import { ExcelUtils } from '../utils/excelUtils';
import { useTranslations } from '../hooks/useTranslations';
import Pagination from './Pagination';
import AdvisorCard from './AdvisorCard';

type AdvisorSortKey = 'id' | 'name' | 'projectCount' | 'mainCommittee' | 'secondCommittee' | 'thirdCommittee';
const ITEMS_PER_PAGE = 15;

interface AdvisorManagementProps {
    user: User;
    advisors: Advisor[];
    projectGroups: ProjectGroup[];
    majors: Major[];
    advisorProjectCounts: Record<string, number>;
    committeeCounts: Record<string, { main: number; second: number; third: number }>;
    addAdvisor: (advisor: Omit<Advisor, 'id'>) => void;
    updateAdvisor: (advisor: Advisor) => void;
    deleteAdvisor: (advisorId: string) => void;
    deleteAdvisors: (advisorIds: string[]) => void;
    bulkAddOrUpdateAdvisors: (advisors: (Omit<Advisor, 'id'> | Advisor)[]) => void;
    bulkUpdateAdvisors: (advisorIds: string[], updates: Partial<Omit<Advisor, 'id' | 'name'>>) => void;
}

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void; }> = ({ enabled, onChange }) => (
    <Switch
        checked={enabled}
        onChange={onChange}
        color="primary"
    />
);

const AdvisorManagement: React.FC<AdvisorManagementProps> = (props) => {
    const { user, advisors, projectGroups, majors, advisorProjectCounts, committeeCounts, addAdvisor, updateAdvisor, deleteAdvisor, deleteAdvisors, bulkAddOrUpdateAdvisors, bulkUpdateAdvisors } = props;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
    const [advisorToDelete, setAdvisorToDelete] = useState<Advisor | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig<AdvisorSortKey> | null>({ key: 'id', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAdvisorIds, setSelectedAdvisorIds] = useState<Set<string>>(new Set());
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewData, setReviewData] = useState<(Advisor & { _status: 'new' | 'update' | 'error'; _error?: string })[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addToast = useToast();
    const t = useTranslations();

    const requestSort = (key: AdvisorSortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getMajorNames = useCallback((majorIds: string[]): string => {
        if (!majorIds || majorIds.length === 0) return t('all');
        return majorIds.map(id => majors.find(m => m.id === id)?.abbreviation || '?').join(', ');
    }, [majors, t]);
    
    const sortedAndFilteredAdvisors = useMemo(() => {
        let filteredAdvisors = [...advisors];
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filteredAdvisors = filteredAdvisors.filter(advisor => advisor.id.toLowerCase().includes(lowercasedQuery) || advisor.name.toLowerCase().includes(lowercasedQuery));
        }
        if (sortConfig !== null) {
            filteredAdvisors.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;
                switch (sortConfig.key) {
                    case 'projectCount': aValue = advisorProjectCounts[a.name] || 0; bValue = advisorProjectCounts[b.name] || 0; break;
                    case 'mainCommittee': aValue = committeeCounts[a.id]?.main || 0; bValue = committeeCounts[b.id]?.main || 0; break;
                    case 'secondCommittee': aValue = committeeCounts[a.id]?.second || 0; bValue = committeeCounts[b.id]?.second || 0; break;
                    case 'thirdCommittee': aValue = committeeCounts[a.id]?.third || 0; bValue = committeeCounts[b.id]?.third || 0; break;
                    default: aValue = a[sortConfig.key as 'id' | 'name']; bValue = b[sortConfig.key as 'id' | 'name'];
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filteredAdvisors;
    }, [advisors, sortConfig, searchQuery, advisorProjectCounts, committeeCounts]);
    
    const paginatedAdvisors = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedAndFilteredAdvisors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedAndFilteredAdvisors, currentPage]);

    const handleAddClick = () => { setEditingAdvisor(null); setIsModalOpen(true); };
    const handleEditClick = (advisor: Advisor) => { setEditingAdvisor(advisor); setIsModalOpen(true); };
    
    const handleDeleteRequest = (advisor: Advisor) => {
        if (projectGroups.some(pg => pg.project.advisorName === advisor.name)) {
            addToast({ type: 'error', message: t('cannotDeleteAdvisorWithProjects') });
            return;
        }
        setAdvisorToDelete(advisor);
    };
    
    const confirmDelete = () => {
        if (advisorToDelete) {
            deleteAdvisor(advisorToDelete.id);
            addToast({ type: 'success', message: t('advisorDeletedSuccess') });
            setAdvisorToDelete(null);
        }
    };

    const handleSaveAdvisor = (advisorData: Advisor | Omit<Advisor, 'id'>) => {
        if ('id' in advisorData) {
            updateAdvisor(advisorData as Advisor);
            addToast({ type: 'success', message: t('advisorUpdatedSuccess') });
        } else {
            addAdvisor(advisorData as Omit<Advisor, 'id'>);
            addToast({ type: 'success', message: t('advisorAddedSuccess') });
        }
        setIsModalOpen(false);
    };

    const handleSelect = (advisorId: string) => {
        setSelectedAdvisorIds(prev => {
            const newSet = new Set(prev);
            newSet.has(advisorId) ? newSet.delete(advisorId) : newSet.add(advisorId);
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedAdvisorIds(e.target.checked ? new Set(sortedAndFilteredAdvisors.map(a => a.id)) : new Set());
    };

    const handleBulkEdit = (updates: any) => {
        if (Object.keys(updates).length === 0) {
            addToast({ type: 'info', message: t('noChangesForBulkEdit') });
            return;
        }
        bulkUpdateAdvisors(Array.from(selectedAdvisorIds), updates);
        addToast({ type: 'success', message: t('advisorsUpdatedSuccess').replace('${count}', String(selectedAdvisorIds.size)) });
        setIsBulkEditModalOpen(false);
        setSelectedAdvisorIds(new Set());
    };

    const handleBulkDelete = () => {
        const advisorsWithProjects = Array.from(selectedAdvisorIds).filter(id => {
            const adv = advisors.find(a => a.id === id);
            return adv && projectGroups.some(pg => pg.project.advisorName === adv.name);
        });
        if (advisorsWithProjects.length > 0) {
            addToast({ type: 'error', message: t('cannotDeleteAdvisorsWithProjects').replace('${count}', String(advisorsWithProjects.length)) });
            setIsBulkDeleteModalOpen(false);
            return;
        }
        deleteAdvisors(Array.from(selectedAdvisorIds));
        addToast({ type: 'success', message: t('advisorsDeletedSuccess').replace('${count}', String(selectedAdvisorIds.size)) });
        setIsBulkDeleteModalOpen(false);
        setSelectedAdvisorIds(new Set());
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleExportExcel = useCallback(async () => {
        const dataToExport = sortedAndFilteredAdvisors.map(advisor => {
            const projectCount = advisorProjectCounts[advisor.name] || 0;
            const committeeCount = committeeCounts[advisor.id] || { main: 0, second: 0, third: 0 };
            return {
                [t('id')]: advisor.id,
                [t('fullName')]: advisor.name,
                [t('projectsSupervising')]: `${projectCount} / ${advisor.quota}`,
                [t('mainCommittee')]: `${committeeCount.main} / ${advisor.mainCommitteeQuota}`,
                [t('secondCommittee')]: `${committeeCount.second} / ${advisor.secondCommitteeQuota}`,
                [t('thirdCommittee')]: `${committeeCount.third} / ${advisor.thirdCommitteeQuota}`,
                [t('specializedMajors')]: getMajorNames(advisor.specializedMajorIds),
                [t('deptAdmin')]: advisor.isDepartmentAdmin ? t('yes') : t('no'),
            };
        });
    
        if (dataToExport.length === 0) {
            addToast({ type: 'info', message: t('noDataToExport') });
            return;
        }
    
        await ExcelUtils.exportToExcel(dataToExport, 'advisors_report.xlsx');
        addToast({ type: 'success', message: t('advisorExportSuccess') });
    }, [sortedAndFilteredAdvisors, advisorProjectCounts, committeeCounts, getMajorNames, addToast, t]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const json = await ExcelUtils.readExcelFile(file);
                const existingAdvisorNames = new Set(advisors.map(a => a.name.toLowerCase()));
                const majorAbbrToIdMap = new Map(majors.map(m => [m.abbreviation.toLowerCase(), m.id]));
                const processedData = json.map(row => {
                    const name = String(row['Name'] ?? '').trim();
                    if (!name) return { ...row, _status: 'error', _error: 'Missing Name' };

                    const status = existingAdvisorNames.has(name.toLowerCase()) ? 'update' : 'new';
                    let error = '';
                    
                    const majorAbbrs = String(row['Specialized Majors'] ?? '').split(',').map(s => s.trim().toLowerCase());
                    const specializedMajorIds: string[] = [];
                    majorAbbrs.forEach((abbr) => {
                        if (majorAbbrToIdMap.has(abbr)) {
                            specializedMajorIds.push(majorAbbrToIdMap.get(abbr)!);
                        } else if (abbr) {
                            error += `Invalid Major Abbreviation: ${abbr}. `;
                        }
                    });

                    const advisorId = advisors.find(a => a.name.toLowerCase() === name.toLowerCase())?.id;
                    return { id: advisorId, name, quota: Number(row['Quota']) || 5, mainCommitteeQuota: Number(row['Main Committee Quota']) || 5, secondCommitteeQuota: Number(row['2nd Committee Quota']) || 5, thirdCommitteeQuota: Number(row['3rd Committee Quota']) || 5, specializedMajorIds, _status: error ? 'error' : status, _error: error || undefined };
                });
            setReviewData(processedData as any);
            setIsReviewModalOpen(true);
        } catch (error) {
            addToast({ type: 'error', message: t('fileParseError') });
            console.error("File parse error:", error);
        } finally { if (event.target) event.target.value = ''; }
    };

    const handleConfirmImport = (validData: (Omit<Advisor, 'id'> | Advisor)[]) => {
        bulkAddOrUpdateAdvisors(validData);
        addToast({ type: 'success', message: t('advisorsImportedSuccess').replace('${count}', String(validData.length)) });
        setIsReviewModalOpen(false);
    };

    const handleToggleAiAssistant = (advisor: Advisor) => {
        updateAdvisor({
            ...advisor,
            isAiAssistantEnabled: !(advisor.isAiAssistantEnabled ?? true)
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
                   <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                   <Box>
                     <Typography variant="h5" component="h2" fontWeight="bold">
                       {t('manageAdvisors')}
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                       {t('advisorsDescription')}
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
                        {t('addAdvisor')}
                    </Button>
                </Stack>
            </Box>

            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ mb: 2 }}>
                    <TextField
                        placeholder={t('searchByAdvisor')}
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
                {selectedAdvisorIds.size > 0 && (
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
                            {t('bulkActionsSelected').replace('{count}', String(selectedAdvisorIds.size))}
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
                        {paginatedAdvisors.map(advisor => {
                            const projectCount = advisorProjectCounts[advisor.name] || 0;
                            return (
                                <Grid size={{ xs: 12, sm: 6 }} key={advisor.id}>
                                    <AdvisorCard
                                        advisor={advisor}
                                        user={user}
                                        projectCount={projectCount}
                                        getMajorNames={getMajorNames}
                                        onEdit={() => handleEditClick(advisor)}
                                        onDelete={() => handleDeleteRequest(advisor)}
                                        onSelect={handleSelect}
                                        isSelected={selectedAdvisorIds.has(advisor.id)}
                                        onToggleAiAssistant={() => handleToggleAiAssistant(advisor)}
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
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedAdvisorIds.size > 0 && selectedAdvisorIds.size === sortedAndFilteredAdvisors.length}
                                        indeterminate={selectedAdvisorIds.size > 0 && selectedAdvisorIds.size < sortedAndFilteredAdvisors.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                                <SortableHeader sortKey="id" title="ID" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader sortKey="name" title={t('fullName')} sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader sortKey="projectCount" title={t('projectsSupervising')} sortConfig={sortConfig} requestSort={requestSort} />
                                <TableCell>{t('specializedMajors')}</TableCell>
                                {user.role === 'Admin' && (
                                    <TableCell>{t('aiAssistant')}</TableCell>
                                )}
                                <TableCell align="right">{t('actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedAdvisors.map(advisor => {
                                const projectCount = advisorProjectCounts[advisor.name] || 0;
                                const isSelected = selectedAdvisorIds.has(advisor.id);
                                const isOverloaded = projectCount > advisor.quota;
                                return (
                                    <TableRow 
                                        key={advisor.id}
                                        selected={isSelected}
                                        sx={{
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={isSelected}
                                                onChange={() => handleSelect(advisor.id)}
                                            />
                                        </TableCell>
                                        <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                                            {advisor.id}
                                        </TableCell>
                                        <TableCell>{advisor.name}</TableCell>
                                          <TableCell sx={{ color: isOverloaded ? 'error.main' : 'inherit', fontWeight: isOverloaded ? 'bold' : 'normal' }}>
                                              {projectCount} / {advisor.quota}
                                          </TableCell>
                                        <TableCell>{getMajorNames(advisor.specializedMajorIds)}</TableCell>
                                        {user.role === 'Admin' && (
                                            <TableCell>
                                                <ToggleSwitch 
                                                    enabled={advisor.isAiAssistantEnabled ?? true} 
                                                    onChange={() => handleToggleAiAssistant(advisor)} 
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditClick(advisor)}
                                                    color="primary"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteRequest(advisor)}
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
                    {sortedAndFilteredAdvisors.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 5 }}>
                            <Typography color="text.secondary">
                                {searchQuery ? `No advisors found for "${searchQuery}".` : t('noAdvisorsData')}
                            </Typography>
                        </Box>
                    )}
                </TableContainer>
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(sortedAndFilteredAdvisors.length / ITEMS_PER_PAGE)}
                    totalItems={sortedAndFilteredAdvisors.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </Paper>
            
            {isModalOpen && <AdvisorModal user={user} onClose={() => setIsModalOpen(false)} onSave={handleSaveAdvisor} advisorToEdit={editingAdvisor} allAdvisors={advisors} majors={majors} />}
            {advisorToDelete && <ConfirmationModal isOpen={!!advisorToDelete} onClose={() => setAdvisorToDelete(null)} onConfirm={confirmDelete} title={t('deleteAdvisorTitle')} message={t('deleteAdvisorMessage').replace('${name}', advisorToDelete.name)} />}
            {isBulkEditModalOpen && <AdvisorBulkEditModal isOpen={isBulkEditModalOpen} onClose={() => setIsBulkEditModalOpen(false)} onSave={handleBulkEdit} selectedCount={selectedAdvisorIds.size} />}
            {isBulkDeleteModalOpen && <ConfirmationModal isOpen={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)} onConfirm={handleBulkDelete} title={t('bulkDeleteAdvisorTitle').replace('${count}', String(selectedAdvisorIds.size))} message={t('bulkDeleteAdvisorMessage').replace('${count}', String(selectedAdvisorIds.size))} />}
            {isReviewModalOpen && <ImportReviewModal<Omit<Advisor, 'id'> | Advisor> isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onConfirm={handleConfirmImport} data={reviewData} columns={[{ key: '_status', header: 'Status' }, { key: 'name', header: 'Name' }, { key: 'quota', header: 'Quota' }, { key: 'specializedMajorIds', header: 'Majors' }, { key: '_error', header: 'Error' }]} dataTypeName="Advisors" />}
        </Box>
    );
};

export default AdvisorManagement;
