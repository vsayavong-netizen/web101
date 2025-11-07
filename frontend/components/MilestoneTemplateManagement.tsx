import React, { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack, InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Assignment as AssignmentIcon
} from '@mui/icons-material';
import { MilestoneTemplate } from '../types';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';
import MilestoneTemplateModal from './MilestoneTemplateModal';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import { useTranslations } from '../hooks/useTranslations';

type TemplateSortKey = 'id' | 'name' | 'taskCount';

interface MilestoneTemplateManagementProps {
    templates: MilestoneTemplate[];
    addTemplate: (template: Omit<MilestoneTemplate, 'id'>) => void;
    updateTemplate: (template: MilestoneTemplate) => void;
    deleteTemplate: (templateId: string) => void;
}

const MilestoneTemplateManagement: React.FC<MilestoneTemplateManagementProps> = ({ templates, addTemplate, updateTemplate, deleteTemplate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<MilestoneTemplate | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<MilestoneTemplate | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig<TemplateSortKey> | null>({ key: 'id', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');
    const addToast = useToast();
    const t = useTranslations();

    const requestSort = (key: TemplateSortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredTemplates = useMemo(() => {
        let filteredTemplates = [...templates];

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filteredTemplates = filteredTemplates.filter(template =>
                template.id.toLowerCase().includes(lowercasedQuery) ||
                template.name.toLowerCase().includes(lowercasedQuery) ||
                template.description.toLowerCase().includes(lowercasedQuery)
            );
        }

        if (sortConfig !== null) {
            filteredTemplates.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;

                if (sortConfig.key === 'taskCount') {
                    aValue = a.tasks.length;
                    bValue = b.tasks.length;
                } else {
                    aValue = a[sortConfig.key as 'id' | 'name'];
                    bValue = b[sortConfig.key as 'id' | 'name'];
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filteredTemplates;
    }, [templates, sortConfig, searchQuery]);

    const handleAddClick = () => {
        setEditingTemplate(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (template: MilestoneTemplate) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };
    
    const handleDeleteRequest = (template: MilestoneTemplate) => {
        setTemplateToDelete(template);
    };

    const confirmDelete = () => {
        if (templateToDelete) {
            deleteTemplate(templateToDelete.id);
            addToast({ type: 'success', message: t('templateDeletedSuccess') });
            setTemplateToDelete(null);
        }
    };
    
    const handleSaveTemplate = (templateData: MilestoneTemplate | Omit<MilestoneTemplate, 'id'>) => {
        if ('id' in templateData) {
            updateTemplate(templateData as MilestoneTemplate);
            addToast({ type: 'success', message: t('templateUpdatedSuccess') });
        } else {
            addTemplate(templateData as Omit<MilestoneTemplate, 'id'>);
            addToast({ type: 'success', message: t('templateAddedSuccess') });
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
                   <AssignmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                   <Box>
                     <Typography variant="h5" component="h2" fontWeight="bold">
                       {t('manageMilestoneTemplates')}
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                       {t('manageMilestoneTemplatesDescription')}
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
                    {t('addTemplate')}
                </Button>
            </Box>

            <Box sx={{ mb: 2 }}>
                <TextField
                    placeholder={t('searchByTemplate')}
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
                            <SortableHeader sortKey="id" title="ID" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="name" title={t('templateName')} sortConfig={sortConfig} requestSort={requestSort} />
                            <TableCell>{t('description')}</TableCell>
                            <SortableHeader sortKey="taskCount" title={t('tasks')} sortConfig={sortConfig} requestSort={requestSort} />
                            <TableCell align="right">{t('actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedAndFilteredTemplates.map(template => (
                            <TableRow 
                                key={template.id}
                                sx={{
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                <TableCell component="th" scope="row" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    {template.id}
                                </TableCell>
                                <TableCell>{template.name}</TableCell>
                                <TableCell>
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary"
                                        sx={{ 
                                            maxWidth: 300, 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                        title={template.description}
                                    >
                                        {template.description}
                                    </Typography>
                                </TableCell>
                                <TableCell>{template.tasks.length}</TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditClick(template)}
                                            color="primary"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteRequest(template)}
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
                {sortedAndFilteredTemplates.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography color="text.secondary">
                            {searchQuery ? `No templates found for "${searchQuery}".` : `No templates found. Click "${t('addTemplate')}" to begin.`}
                        </Typography>
                    </Box>
                )}
            </TableContainer>
            
            {isModalOpen && (
                <MilestoneTemplateModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveTemplate} 
                    templateToEdit={editingTemplate}
                    allTemplates={templates}
                />
            )}
            
            {templateToDelete && (
                <ConfirmationModal 
                    isOpen={!!templateToDelete}
                    onClose={() => setTemplateToDelete(null)}
                    onConfirm={confirmDelete}
                    title={t('deleteTemplateTitle')}
                    message={t('deleteTemplateMessage').replace('${templateName}', templateToDelete.name)}
                />
            )}
        </Paper>
    );
};

export default MilestoneTemplateManagement;
