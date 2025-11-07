import React, { useMemo } from 'react';
import {
  Box, Paper, Typography, Button, Card, CardContent, Grid,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Chip, Divider
} from '@mui/material';
import { 
  Assignment as AssignmentIcon, School as SchoolIcon, 
  AccessTime as AccessTimeIcon, CheckCircle as CheckCircleIcon,
  ChevronRight as ChevronRightIcon, Notifications as NotificationsIcon,
  Inbox as InboxIcon, Edit as EditIcon, 
  ChatBubbleOutline as ChatBubbleIcon, Settings as SettingsIcon
} from '@mui/icons-material';
import { User, ProjectGroup, Announcement, MilestoneStatus, Notification, NotificationType, Student, StudentSkillsAnalysis } from '../types';
import StatusBadge from './StatusBadge';
import AnnouncementsFeed from './AnnouncementsFeed';
import { formatTimeAgo } from '../utils/timeUtils';
import { useTranslations } from '../hooks/useTranslations';
import { useAiStudentAnalysis } from '../hooks/useAiStudentAnalysis';
import ProgressComparisonCard from './ProgressComparisonCard';
import AiSkillsCard from './AiSkillsCard';
import ResourceHubCard from './ResourceHubCard';


interface StudentDashboardProps {
    user: User;
    projectGroup: ProjectGroup;
    allProjectGroups: ProjectGroup[];
    studentData: Student;
    announcements: Announcement[];
    onViewProject: () => void;
    notifications: Notification[];
    onSelectNotification: (notification: Notification) => void;
}

const StatCard: React.FC<{ title: string; value: string | React.ReactNode; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
        <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                {icon}
            </Avatar>
            <Box>
                <Typography variant="caption" color="text.secondary">{title}</Typography>
                <Box sx={{ fontSize: '1.125rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {value}
                </Box>
            </Box>
        </CardContent>
    </Card>
);

const notificationTypeConfig: Record<NotificationType, { icon: React.FC<any>, color: 'primary' | 'success' | 'secondary' | 'warning' | 'error' | 'info' }> = {
    Submission: { icon: InboxIcon, color: 'primary' },
    Approval: { icon: CheckCircleIcon, color: 'success' },
    Feedback: { icon: EditIcon, color: 'secondary' },
    Mention: { icon: ChatBubbleIcon, color: 'info' },
    Message: { icon: ChatBubbleIcon, color: 'info' },
    System: { icon: SettingsIcon, color: 'warning' },
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, projectGroup, allProjectGroups, studentData, announcements, onViewProject, notifications, onSelectNotification }) => {
    const { project } = projectGroup;
    const t = useTranslations();

    const { skillsAnalysis, isAnalyzingSkills, analyzeSkills } = useAiStudentAnalysis(projectGroup, user);

    const upcomingMilestones = React.useMemo(() => {
        return (project.milestones || [])
            .filter(m => m.status !== MilestoneStatus.Approved)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 3);
    }, [project.milestones]);

    const notificationsToShow = React.useMemo(() => {
        const unread = notifications.filter(n => !n.read);
        return (unread.length > 0 ? unread : notifications).slice(0, 5);
    }, [notifications]);
    
    const { userProgress, majorAverageProgress } = useMemo(() => {
        const approvedMilestones = (project.milestones || []).filter(m => m.status === MilestoneStatus.Approved).length;
        const totalMilestones = (project.milestones || []).length;
        const currentUserProgress = totalMilestones > 0 ? (approvedMilestones / totalMilestones) * 100 : 0;

        const projectsInMajor = allProjectGroups.filter(pg => 
            pg.students.some(s => s.major === studentData.major) && 
            pg.project.projectId !== project.projectId &&
            (pg.project.milestones || []).length > 0
        );

        if (projectsInMajor.length === 0) {
            return { userProgress: currentUserProgress, majorAverageProgress: null };
        }

        const totalProgress = projectsInMajor.reduce((sum, pg) => {
            const approved = (pg.project.milestones || []).filter(m => m.status === MilestoneStatus.Approved).length;
            const total = (pg.project.milestones || []).length;
            return sum + (total > 0 ? (approved / total) * 100 : 0);
        }, 0);
        
        const avgProgress = totalProgress / projectsInMajor.length;

        return { userProgress: currentUserProgress, majorAverageProgress: avgProgress };
    }, [project, allProjectGroups, studentData.major]);

    return (
        <Box sx={{ py: 2 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                    {t('studentDashboardTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {t('studentDashboardDescription')}
                </Typography>
            </Box>

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2, mb: 3 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="medium" color="primary" gutterBottom>
                            {project.projectId}
                        </Typography>
                        <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                            {project.topicEng}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {project.topicLao}
                        </Typography>
                    </Box>
                    <Button
                        onClick={onViewProject}
                        variant="contained"
                        endIcon={<ChevronRightIcon />}
                        sx={{ flexShrink: 0 }}
                    >
                        {t('viewFullDetails')}
                    </Button>
                </Box>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                        <StatCard 
                            title={t('projectStatus')} 
                            value={<StatusBadge project={project} user={user} onUpdateStatus={() => {}} />} 
                            icon={<AssignmentIcon />} 
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                        <StatCard 
                            title={t('advisor')} 
                            value={project.advisorName} 
                            icon={<SchoolIcon />} 
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                        <StatCard 
                            title={t('nextMilestoneDue')} 
                            value={upcomingMilestones.length > 0 ? new Date(upcomingMilestones[0].dueDate).toLocaleDateString() : t('allDone')} 
                            icon={<AccessTimeIcon />} 
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <ProgressComparisonCard
                            userProgress={userProgress}
                            majorAverageProgress={majorAverageProgress}
                        />
                        <AiSkillsCard 
                            skillsAnalysis={skillsAnalysis}
                            isAnalyzing={isAnalyzingSkills}
                            onAnalyze={analyzeSkills}
                        />
                        <AnnouncementsFeed announcements={announcements} user={user} />
                    </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight="medium" gutterBottom>
                                {t('yourNotifications')}
                            </Typography>
                            {notificationsToShow.length > 0 ? (
                                <List>
                                    {notificationsToShow.map((notification, index) => {
                                        const config = notificationTypeConfig[notification.type] || notificationTypeConfig.System;
                                        const Icon = config.icon;
                                        return (
                                            <React.Fragment key={notification.id}>
                                                {index > 0 && <Divider />}
                                                <ListItem disablePadding>
                                                    <ListItemButton 
                                                        onClick={() => onSelectNotification(notification)}
                                                        sx={{ 
                                                            bgcolor: !notification.read ? 'action.selected' : 'transparent',
                                                            borderRadius: 1,
                                                            mb: 0.5
                                                        }}
                                                    >
                                                        <ListItemIcon>
                                                            <Icon color={config.color} />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={notification.title || notification.message}
                                                            secondary={notification.title ? (
                                                                <>
                                                                    {notification.message}
                                                                    <br />
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {formatTimeAgo(notification.timestamp, t)}
                                                                    </Typography>
                                                                </>
                                                            ) : (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {formatTimeAgo(notification.timestamp, t)}
                                                                </Typography>
                                                            )}
                                                        />
                                                        {!notification.read && (
                                                            <Chip size="small" color="primary" sx={{ minWidth: 8, height: 8, p: 0 }} />
                                                        )}
                                                    </ListItemButton>
                                                </ListItem>
                                            </React.Fragment>
                                        )
                                    })}
                                </List>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {t('noNotificationsYet')}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                        <ResourceHubCard />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};