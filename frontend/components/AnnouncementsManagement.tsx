import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack
} from '@mui/material';
import { 
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Campaign as CampaignIcon
} from '@mui/icons-material';
import { Announcement, User } from '../types';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';
import AnnouncementModal from './AnnouncementModal';
import { useTranslations } from '../hooks/useTranslations';

interface AnnouncementsManagementProps {
    announcements: Announcement[];
    user: User;
    addAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateAnnouncement: (announcement: Announcement) => void;
    deleteAnnouncement: (announcementId: string) => void;
}

const AnnouncementsManagement: React.FC<AnnouncementsManagementProps> = ({ announcements, user, addAnnouncement, updateAnnouncement, deleteAnnouncement }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
    const addToast = useToast();
    const t = useTranslations();

    const handleAddClick = () => {
        setEditingAnnouncement(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setIsModalOpen(true);
    };

    const confirmDelete = () => {
        if (announcementToDelete) {
            deleteAnnouncement(announcementToDelete.id);
            addToast({ type: 'success', message: t('announcementDeletedSuccess') });
            setAnnouncementToDelete(null);
        }
    };

    const handleSave = (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'authorName'>) => {
        if (editingAnnouncement) {
            updateAnnouncement({ ...editingAnnouncement, ...data });
            addToast({ type: 'success', message: t('announcementUpdatedSuccess') });
        } else {
            addAnnouncement({ ...data, authorName: user.name });
            addToast({ type: 'success', message: t('announcementPostedSuccess') });
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
                   <CampaignIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                   <Box>
                     <Typography variant="h5" component="h2" fontWeight="bold">
                       {t('manageAnnouncements')}
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                       {t('manageAnnouncementsDescription')}
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
                    {t('newAnnouncement')}
                </Button>
            </Box>
            
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('title')}</TableCell>
                            <TableCell>{t('audience')}</TableCell>
                            <TableCell>{t('author')}</TableCell>
                            <TableCell>{t('date')}</TableCell>
                            <TableCell align="right">{t('actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {announcements.map(announcement => (
                            <TableRow 
                                key={announcement.id}
                                sx={{
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                                    {announcement.title}
                                </TableCell>
                                <TableCell>{announcement.audience}</TableCell>
                                <TableCell>{announcement.authorName}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {new Date(announcement.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditClick(announcement)}
                                            color="primary"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => setAnnouncementToDelete(announcement)}
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
                {announcements.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography color="text.secondary">
                            {t('noAnnouncementsFound').replace('${newAnnouncement}', t('newAnnouncement'))}
                        </Typography>
                    </Box>
                )}
            </TableContainer>

            {isModalOpen && (
                <AnnouncementModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave} 
                    announcementToEdit={editingAnnouncement}
                />
            )}
            {announcementToDelete && (
                <ConfirmationModal 
                    isOpen={!!announcementToDelete}
                    onClose={() => setAnnouncementToDelete(null)}
                    onConfirm={confirmDelete}
                    title={t('deleteAnnouncementTitle')}
                    message={t('deleteAnnouncementMessage').replace('${title}', announcementToDelete.title)}
                />
            )}
        </Paper>
    );
};

export default AnnouncementsManagement;
