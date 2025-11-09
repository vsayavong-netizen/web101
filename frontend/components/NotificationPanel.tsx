import React from 'react';
import {
  Box, Paper, Typography, Button, List, ListItem, ListItemButton, ListItemText, Divider, Badge, Stack
} from '@mui/material';
import {
  Notifications as BellIcon, Inbox as InboxStackIcon,
  CheckCircle as CheckCircleIcon, Edit as PencilIcon,
  Chat as ChatBubbleBottomCenterTextIcon, Settings as Cog6ToothIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { Notification, NotificationType } from '../types';
import { formatTimeAgo } from '../utils/timeUtils';
import { useTranslations, TranslationKey } from '../hooks/useTranslations';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onSelectNotification: (notification: Notification) => void;
  onViewAll: () => void;
}

const notificationTypeConfig: Record<NotificationType, { icon: React.ElementType, color: 'primary' | 'success' | 'secondary' | 'info' | 'warning' }> = {
    Submission: { icon: InboxStackIcon, color: 'primary' },
    Approval: { icon: CheckCircleIcon, color: 'success' },
    Feedback: { icon: PencilIcon, color: 'secondary' },
    Mention: { icon: ChatBubbleBottomCenterTextIcon, color: 'info' },
    Message: { icon: ChatBubbleBottomCenterTextIcon, color: 'info' },
    System: { icon: Cog6ToothIcon, color: 'warning' },
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onMarkAllRead, onSelectNotification, onViewAll }) => {
    const t = useTranslations();
    const unreadCount = notifications.filter(n => !n.read).length;
    const notificationsToShow = notifications.slice(0, 7); // Show up to 7 recent notifications

    return (
        <Paper
            elevation={24}
            sx={{
                position: 'absolute',
                right: 0,
                top: '100%',
                mt: 1,
                width: { xs: 320, sm: 384 },
                zIndex: 1300,
                border: 1,
                borderColor: 'divider'
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight="semibold">
                    {t('notifications')}
                </Typography>
                {unreadCount > 0 && (
                    <Button
                        onClick={(e) => { e.stopPropagation(); onMarkAllRead(); }}
                        size="small"
                        sx={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            textTransform: 'none',
                            minWidth: 'auto'
                        }}
                    >
                        {t('markAllAsRead')}
                    </Button>
                )}
            </Box>
            <List sx={{ maxHeight: 320, overflowY: 'auto' }}>
                {notificationsToShow.length > 0 ? (
                    notificationsToShow.map((n, index) => {
                        const config = notificationTypeConfig[n.type] || notificationTypeConfig.System;
                        const Icon = config.icon;
                        return (
                            <React.Fragment key={n.id}>
                                {index > 0 && <Divider />}
                                <ListItem disablePadding>
                                    <ListItemButton
                                        onClick={(e) => { e.stopPropagation(); onSelectNotification(n); }}
                                        sx={{
                                            bgcolor: !n.read ? 'primary.light' : 'transparent',
                                            '&:hover': { bgcolor: 'action.hover' }
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ width: '100%' }}>
                                            <Icon sx={{ fontSize: 20, color: `${config.color}.main`, mt: 0.5, flexShrink: 0 }} />
                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                {n.title && (
                                                    <Typography variant="body2" fontWeight="semibold" sx={{ mb: 0.5 }}>
                                                        {n.title}
                                                    </Typography>
                                                )}
                                                <Typography
                                                    variant="body2"
                                                    color={n.title ? 'text.secondary' : 'text.primary'}
                                                    sx={{ mb: 0.5 }}
                                                >
                                                    {n.message}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatTimeAgo(n.timestamp, t)}
                                                </Typography>
                                            </Box>
                                            {!n.read && (
                                                <Badge
                                                    variant="dot"
                                                    color="primary"
                                                    sx={{ mt: 1, flexShrink: 0 }}
                                                />
                                            )}
                                        </Stack>
                                    </ListItemButton>
                                </ListItem>
                            </React.Fragment>
                        );
                    })
                ) : (
                    <ListItem>
                        <Box sx={{ textAlign: 'center', py: 3, width: '100%' }}>
                            <BellIcon sx={{ fontSize: 32, color: 'text.secondary', mx: 'auto', display: 'block', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                {t('noNotifications')}
                            </Typography>
                        </Box>
                    </ListItem>
                )}
            </List>
            <Divider />
            <Box sx={{ p: 1 }}>
                <Button
                    onClick={(e) => { e.stopPropagation(); onViewAll(); }}
                    fullWidth
                    endIcon={<ChevronRightIcon />}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        justifyContent: 'center'
                    }}
                >
                    {t('viewAllNotifications')}
                </Button>
            </Box>
        </Paper>
    );
};

export default NotificationPanel;