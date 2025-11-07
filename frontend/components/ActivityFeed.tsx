import React from 'react';
import {
  Paper, Typography, Box, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Avatar, Divider
} from '@mui/material';
import {
  Inbox as InboxIcon, Notifications as BellIcon,
  CheckCircle as CheckCircleIcon, Cancel as XCircleIcon,
  UploadFile as DocumentArrowUpIcon, ChatBubbleOutline as ChatBubbleIcon,
  Edit as PencilIcon, SwapHoriz as ArrowsRightLeftIcon,
  Groups as UserGroupIcon, CalendarToday as CalendarDaysIcon
} from '@mui/icons-material';
import { Notification } from '../types';
import { formatTimeAgo } from '../utils/timeUtils';
import { useTranslations } from '../hooks/useTranslations';

interface ActivityFeedProps {
    notifications: Notification[];
    onSelectNotification: (notification: Notification) => void;
}

const getNotificationIcon = (message: string): { Icon: React.ComponentType<any>, color: 'success' | 'error' | 'primary' | 'secondary' | 'warning' | 'info' | 'default' } => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('approved')) return { Icon: CheckCircleIcon, color: 'success' };
    if (lowerMessage.includes('rejected')) return { Icon: XCircleIcon, color: 'error' };
    if (lowerMessage.includes('submitted') || lowerMessage.includes('submission')) return { Icon: DocumentArrowUpIcon, color: 'primary' };
    if (lowerMessage.includes('feedback')) return { Icon: ChatBubbleIcon, color: 'secondary' };
    if (lowerMessage.includes('updated') || lowerMessage.includes('changed')) return { Icon: PencilIcon, color: 'warning' };
    if (lowerMessage.includes('transferred')) return { Icon: ArrowsRightLeftIcon, color: 'warning' };
    if (lowerMessage.includes('assigned')) return { Icon: UserGroupIcon, color: 'info' };
    if (lowerMessage.includes('scheduled')) return { Icon: CalendarDaysIcon, color: 'info' };
    return { Icon: BellIcon, color: 'default' };
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ notifications, onSelectNotification }) => {
    const recentNotifications = notifications.slice(0, 10);
    const t = useTranslations();

    return (
        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', mr: 1.5 }}>
                    <InboxIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                    {t('recentActivity')}
                </Typography>
            </Box>
            {recentNotifications.length > 0 ? (
                <List>
                    {recentNotifications.map((notification, index) => {
                        const { Icon, color } = getNotificationIcon(notification.message);
                        return (
                            <React.Fragment key={notification.id}>
                                {index > 0 && <Divider />}
                                <ListItem disablePadding>
                                    <ListItemButton
                                        onClick={() => onSelectNotification(notification)}
                                        sx={{ borderRadius: 1, mb: 0.5 }}
                                    >
                                        <ListItemIcon>
                                            <Icon color={color} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={notification.message}
                                            secondary={formatTimeAgo(notification.timestamp, t)}
                                            primaryTypographyProps={{ variant: 'body2' }}
                                            secondaryTypographyProps={{ variant: 'caption' }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            </React.Fragment>
                        )
                    })}
                </List>
            ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        {t('noRecentActivity')}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default ActivityFeed;
