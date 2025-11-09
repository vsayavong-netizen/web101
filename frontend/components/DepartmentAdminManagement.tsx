import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack, InputAdornment, Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, VpnKey as VpnKeyIcon
} from '@mui/icons-material';
import { Advisor, ProjectGroup, Major, ProjectStatus, User } from '../types';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';
import AdvisorModal from './AdvisorModal';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import { useTranslations } from '../hooks/useTranslations';

type AdvisorSortKey = 'id' | 'name' | 'specializedMajors';

interface DepartmentAdminManagementProps {
    user: User;
    advisors: Advisor[];
    projectGroups: ProjectGroup[];
    majors: Major[];
    addAdvisor: (advisor: Omit<Advisor, 'id'>) => void;
    updateAdvisor: (advisor: Advisor) => void;
}

const DepartmentAdminManagement: React.FC<DepartmentAdminManagementProps> = ({ user, advisors, projectGroups, majors, addAdvisor, updateAdvisor }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
    const [advisorToDemote, setAdvisorToDemote] = useState<Advisor | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig<AdvisorSortKey> | null>({ key: 'id', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');
    const addToast = useToast();
    const t = useTranslations();

    const deptAdmins = useMemo(() => advisors.filter(a => a.isDepartmentAdmin), [advisors]);

    const requestSort = (key: AdvisorSortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getMajorNames = useCallback((majorIds: string[]): string => {
        if (!majorIds || majorIds.length === 0) return 'All Majors';
        return majorIds.map(id => majors.find(m => m.id === id)?.abbreviation || '?').join(', ');
    }, [majors]);

    const sortedAndFilteredAdvisors = useMemo(() => {
        let filteredAdvisors = [...deptAdmins];
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filteredAdvisors = filteredAdvisors.filter(advisor =>
                advisor.id.toLowerCase().includes(lowercasedQuery) ||
                advisor.name.toLowerCase().includes(lowercasedQuery)
            );
        }
        if (sortConfig !== null) {
            filteredAdvisors.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;
                switch (sortConfig.key) {
                    case 'specializedMajors': aValue = getMajorNames(a.specializedMajorIds); bValue = getMajorNames(b.specializedMajorIds); break;
                    default: aValue = a[sortConfig.key as 'id' | 'name']; bValue = b[sortConfig.key as 'id' | 'name'];
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filteredAdvisors;
    }, [deptAdmins, sortConfig, searchQuery, getMajorNames]);

    const handleAddClick = () => {
        setEditingAdvisor(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (advisor: Advisor) => {
        setEditingAdvisor(advisor);
        setIsModalOpen(true);
    };

    const handleDemoteRequest = (advisor: Advisor) => {
        setAdvisorToDemote(advisor);
    };
    
    const confirmDemote = () => {
        if (advisorToDemote) {
            updateAdvisor({ ...advisorToDemote, isDepartmentAdmin: false });
            addToast({ type: 'success', message: t('demotedSuccess').replace('${name}', advisorToDemote.name) });
            setAdvisorToDemote(null);
        }
    };
    
    const handleSaveAdvisor = (advisorData: Advisor | Omit<Advisor, 'id'>) => {
        const dataWithAdminFlag = { ...advisorData, isDepartmentAdmin: true };
        if ('id' in dataWithAdminFlag) {
            updateAdvisor(dataWithAdminFlag as Advisor);
            addToast({ type: 'success', message: t('deptAdminUpdatedSuccess') });
        } else {
            addAdvisor(dataWithAdminFlag as Omit<Advisor, 'id'>);
            addToast({ type: 'success', message: t('deptAdminAddedSuccess') });
        }
        setIsModalOpen(false);
    };
    
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
                   <VpnKeyIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                   <Box>
                     <Typography variant="h5" component="h2" fontWeight="bold">
                       {t('manageDeptAdmins')}
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                       {t('manageDeptAdminsDescription')}
                     </Typography>
                   </Box>
                </Box>
                <Button
                    onClick={handleAddClick}
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    sx={{ fontWeight: 'bold', mt: { xs: 2, sm: 0 } }}
                >
                    {t('addDeptAdmin')}
                </Button>
            </Box>
            <Box sx={{ mb: 2 }}>
                <TextField
                    placeholder={t('searchByDeptAdmin')}
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
                            <SortableHeader sortKey="id" title={t('studentId')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="name" title={t('fullName')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="specializedMajors" title={t('managedMajors')} sortConfig={sortConfig} requestSort={requestSort} />
                            <TableCell align="right">{t('actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedAndFilteredAdvisors.map(adv => (
                            <TableRow 
                                key={adv.id}
                                sx={{
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                <TableCell component="th" scope="row" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    {adv.id}
                                </TableCell>
                                <TableCell>{adv.name}</TableCell>
                                <TableCell>{getMajorNames(adv.specializedMajorIds)}</TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditClick(adv)}
                                            color="primary"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <Tooltip title={adv.id === user.id ? t('cannotDemoteSelf') : t('demoteToAdvisor')}>
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDemoteRequest(adv)}
                                                    disabled={adv.id === user.id}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {sortedAndFilteredAdvisors.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography color="text.secondary">
                            {searchQuery ? `No department admins found for "${searchQuery}".` : 'No department admins found. Promote an advisor to create one.'}
                        </Typography>
                    </Box>
                )}
            </TableContainer>
            {isModalOpen && (<AdvisorModal user={user} onClose={() => setIsModalOpen(false)} onSave={handleSaveAdvisor} advisorToEdit={editingAdvisor} allAdvisors={advisors} majors={majors} />)}
            {advisorToDemote && (<ConfirmationModal 
                isOpen={!!advisorToDemote} 
                onClose={() => setAdvisorToDemote(null)} 
                onConfirm={confirmDemote} 
                title={t('demoteDeptAdminTitle')} 
                message={t('demoteDeptAdminMessage').replace('${name}', advisorToDemote.name)}
                confirmText={t('confirmDemotion')}
                confirmButtonColor="warning"
            />)}
        </Paper>
    );
};

export default DepartmentAdminManagement;