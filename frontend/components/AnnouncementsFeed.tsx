import React, { useMemo } from 'react';
import {
  Paper, Typography, Box, List, ListItem, Avatar, Divider
} from '@mui/material';
import { Campaign as MegaphoneIcon } from '@mui/icons-material';
import { Announcement, User } from '../types';
import { formatTimeAgo } from '../utils/timeUtils';
import { useTranslations } from '../hooks/useTranslations';

interface AnnouncementsFeedProps {
    announcements: Announcement[];
    user: User;
}

const parseMarkdown = (text: string = '') => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/(\r\n|\n|\r)/g, '<br />');
};

const AnnouncementsFeed: React.FC<AnnouncementsFeedProps> = ({ announcements, user }) => {
    const t = useTranslations();
    const relevantAnnouncements = useMemo(() => {
        return announcements
            .filter(a => {
                if (a.audience === 'All') return true;
                if (a.audience === 'Students' && user.role === 'Student') return true;
                if (a.audience === 'Advisors' && (user.role === 'Advisor' || user.role === 'Admin')) return true;
                return false;
            })
            .slice(0, 5); // Show latest 5
    }, [announcements, user.role]);

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', mr: 1.5 }}>
                    <MegaphoneIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                    {t('recentAnnouncements')}
                </Typography>
            </Box>
            {relevantAnnouncements.length > 0 ? (
                <List>
                    {relevantAnnouncements.map((announcement, index) => (
                        <React.Fragment key={announcement.id}>
                            {index > 0 && <Divider sx={{ my: 2 }} />}
                            <ListItem disablePadding sx={{ flexDirection: 'column', alignItems: 'flex-start', pt: index > 0 ? 0 : 1 }}>
                                <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                                    {announcement.title}
                                </Typography>
                                <Box
                                    sx={{
                                        mt: 0.5,
                                        fontSize: '0.875rem',
                                        color: 'text.secondary',
                                        '& strong': { fontWeight: 'bold' },
                                        '& em': { fontStyle: 'italic' }
                                    }}
                                    dangerouslySetInnerHTML={{ __html: parseMarkdown(announcement.content) }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                    {t('postedBy').replace('{author}', announcement.authorName)} &bull; {formatTimeAgo(announcement.createdAt, t)}
                                </Typography>
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        {t('noAnnouncements')}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default AnnouncementsFeed;