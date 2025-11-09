import React from 'react';
import {
  Box, Paper, Typography, Button, List, ListItem, ListItemButton, Stack, Badge, Divider, Avatar
} from '@mui/material';
import {
  Notifications as BellIcon, Inbox as InboxStackIcon,
  CheckCircle as CheckCircleIcon, Edit as PencilIcon,
  Chat as ChatBubbleBottomCenterTextIcon, Settings as Cog6ToothIcon
} from '@mui/icons-material';
import { Notification, NotificationType } from '../types';
import { formatTimeAgo } from '../utils/timeUtils';
import { useTranslations } from '../hooks/useTranslations';

const notificationTypeConfig: Record<NotificationType, { icon: React.ElementType, color: 'primary' | 'success' | 'secondary' | 'info' | 'warning' }> = {
    Submission: { icon: InboxStackIcon, color: 'primary' },
    Approval: { icon: CheckCircleIcon, color: 'success' },
    Feedback: { icon: PencilIcon, color: 'secondary' },
    Mention: { icon: ChatBubbleBottomCenterTextIcon, color: 'info' },
    Message: { icon: ChatBubbleBottomCenterTextIcon, color: 'info' },
    System: { icon: Cog6ToothIcon, color: 'warning' },
};

interface NotificationsPageProps {
  notifications: Notification[];
  onSelectNotification: (notification: Notification) => void;
  onMarkAllRead: () => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications, onSelectNotification, onMarkAllRead }) => {
  const t = useTranslations();
  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <BellIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {t('notifications')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('allUpdatesAndMentions')}
            </Typography>
          </Box>
        </Stack>
        <Button
          onClick={onMarkAllRead}
          disabled={!notifications.some(n => !n.read)}
          sx={{
            mt: { xs: 2, sm: 0 },
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          {t('markAllAsRead')}
        </Button>
      </Box>
      
      {notifications.length > 0 ? (
        <List>
          {notifications.map((n, index) => {
            const config = notificationTypeConfig[n.type] || notificationTypeConfig.System;
            const Icon = config.icon;
            return (
              <React.Fragment key={n.id}>
                {index > 0 && <Divider />}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => onSelectNotification(n)}
                    sx={{
                      bgcolor: !n.read ? 'primary.light' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ width: '100%' }}>
                      <Icon sx={{ fontSize: 24, color: `${config.color}.main`, mt: 0.5, flexShrink: 0 }} />
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
          })}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <BellIcon sx={{ fontSize: 48, color: 'text.secondary', mx: 'auto', display: 'block', mb: 2 }} />
          <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>
            {t('allCaughtUp')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('noNotifications')}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default NotificationsPage;