import React, { useMemo, useState } from 'react';
import {
  Box, Paper, Typography, Button, Card, CardContent, Grid,
  List, ListItem, ListItemButton, ListItemText, LinearProgress,
  Divider, Chip
} from '@mui/material';
import { 
  Assignment as AssignmentIcon, Inbox as InboxIcon,
  Groups as GroupsIcon, School as SchoolIcon,
  CheckCircle as CheckCircleIcon, CalendarToday as CalendarTodayIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { User, ProjectGroup, Advisor, Student, Announcement, ProjectStatus, Project, ScoringSettings, ScoringRubricItem, Notification, MilestoneReviewItem, Major, Role } from '../types';
import AnnouncementsFeed from './AnnouncementsFeed';
import ProjectFilters from './ProjectFilters';
import ProjectTable from './ProjectTable';
import { SortConfig, SortDirection } from './SortableHeader';
import { ToastMessage } from '../context/ToastContext';
import ScoreEntryModal from './ScoreEntryModal';
import ActivityFeed from './ActivityFeed';
import { useTranslations } from '../hooks/useTranslations';
import { formatTimeAgo } from '../utils/timeUtils';

type ActiveView = 'dashboard' | 'projects' | 'students' | 'advisors' | 'deptAdmins' | 'majors' | 'classrooms' | 'milestoneTemplates' | 'submissions' | 'timeline' | 'analytics' | 'announcements' | 'committees' | 'scoring' | 'finalGrades' | 'settings' | 'calendar' | 'reporting' | 'aiTools' | 'notifications';

interface AdvisorDashboardProps {
    user: User;
    projectGroups: ProjectGroup[];
    students: Student[];
    advisors: Advisor[];
    committeeCounts: Record<string, { main: number; second: number; third: number }>;
    announcements: Announcement[];
    notifications: Notification[];
    onSelectNotification: (notification: Notification) => void;
    onSelectProject: (group: ProjectGroup) => void;
    onUpdateStatus: (projectId: string, status: ProjectStatus, actor: User, details: { comment?: string, templateId?: string }) => void;
    updateDetailedScore: (projectId: string, evaluatorId: string, scores: Record<string, number>) => void;
    addToast: (toast: Omit<ToastMessage, 'id'>) => void;
    scoringSettings: ScoringSettings;
    onOpenAiAssistant: () => void;
    majors: Major[];
    onNavigate: (view: ActiveView) => void;
}

const StatCard: React.FC<{ 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    onClick?: () => void; 
    color: 'primary' | 'success' | 'warning' | 'info' | 'default'; 
}> = ({ title, value, icon, onClick, color = 'primary' }) => {
    const muiColor = color;
    
    return (
        <Card 
            component={onClick ? 'button' : 'div'}
            onClick={onClick}
            disabled={!onClick}
            sx={{ 
                p: 3, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                width: '100%',
                textAlign: 'left',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick ? { transform: 'scale(1.02)', boxShadow: 6 } : {},
                transition: 'all 0.2s',
                border: 'none',
                boxShadow: 2
            }}
        >
            <Box sx={{ 
                bgcolor: `${muiColor}.light`, 
                color: `${muiColor}.main`,
                borderRadius: '50%',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="body2" color="text.secondary">{title}</Typography>
                <Typography variant="h4" fontWeight="bold">{value}</Typography>
            </Box>
        </Card>
    );
};

const WorkloadItem: React.FC<{ title: string; count: number; quota: number; color: 'primary' | 'success' | 'warning' | 'secondary' | 'error' }> = ({ title, count, quota, color = 'primary' }) => {
    const percentage = quota > 0 ? (count / quota) * 100 : 0;
    const isOverloaded = count > quota;
    const displayPercentage = Math.min(isOverloaded ? 100 : percentage, 100);
    
    const muiColor = color;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="body2" fontWeight="medium" color="text.secondary">
                    {title}
                </Typography>
                <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    color={isOverloaded ? 'error.main' : 'text.primary'}
                >
                    {count} / {quota}
                </Typography>
            </Box>
            <LinearProgress 
                variant="determinate" 
                value={displayPercentage} 
                color={isOverloaded ? 'error' : muiColor}
                sx={{ height: 8, borderRadius: 1 }}
            />
        </Box>
    );
};


export const AdvisorDashboard: React.FC<AdvisorDashboardProps> = (props) => {
    const {
        user, projectGroups, students, advisors, committeeCounts, announcements, notifications,
        onSelectNotification, onSelectProject, onUpdateStatus, updateDetailedScore, addToast,
        scoringSettings, onOpenAiAssistant, majors, onNavigate
    } = props;
    
    const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
    const [scoreModalData, setScoreModalData] = useState<{
        project: Project;
        rubric: ScoringRubricItem[];
        evaluatorId: string;
        evaluatorName: string;
        maxTotalScore: number;
    } | null>(null);
    const t = useTranslations();

    // Derived data from props, now encapsulated in the dashboard
    const advisorData = useMemo(() => advisors.find(a => a.id === user.id)!, [advisors, user.id]);
    const allProjectsForAdvisor = useMemo(() => projectGroups.filter(p => p.project.advisorName === user.name), [projectGroups, user.name]);
    const { studentCount, projectCount } = useMemo(() => {
        const studentIds = new Set<string>();
        allProjectsForAdvisor.forEach(pg => pg.students.forEach(s => studentIds.add(s.studentId)));
        return { studentCount: studentIds.size, projectCount: allProjectsForAdvisor.length };
    }, [allProjectsForAdvisor]);

    const projectsToReview = useMemo(() => allProjectsForAdvisor.filter(p => p.project.status === ProjectStatus.Pending), [allProjectsForAdvisor]);
    
    const milestonesToReview = useMemo(() => {
        const milestones: MilestoneReviewItem[] = [];
        allProjectsForAdvisor.forEach(pg => {
            pg.project.milestones?.forEach(m => {
                if (m.status === 'Submitted') {
                    milestones.push({
                        projectGroupId: pg.project.projectId,
                        milestoneName: m.name,
                        studentNames: pg.students.map(s => `${s.name} ${s.surname}`).join(', '),
                    });
                }
            });
        });
        return milestones;
    }, [allProjectsForAdvisor]);

    const committeeAssignments = useMemo(() => {
        return projectGroups.filter(pg => 
            pg.project.mainCommitteeId === user.id ||
            pg.project.secondCommitteeId === user.id ||
            pg.project.thirdCommitteeId === user.id
        );
    }, [projectGroups, user.id]);

    const recentlyUpdatedProjects = useMemo(() => {
        return [...allProjectsForAdvisor].sort((a, b) => {
            const lastActivityA = a.project.log?.[a.project.log.length - 1]?.timestamp || 0;
            const lastActivityB = b.project.log?.[b.project.log.length - 1]?.timestamp || 0;
            return new Date(lastActivityB).getTime() - new Date(lastActivityA).getTime();
        }).slice(0, 5);
    }, [allProjectsForAdvisor]);
    
    const committeeRubricTotal = useMemo(() => scoringSettings.committeeRubrics.reduce((sum, item) => sum + item.maxScore, 0), [scoringSettings.committeeRubrics]);

    const advisorNotifications = useMemo(() => {
        return notifications.filter(n => n.userIds.includes(user.id));
    }, [notifications, user.id]);

    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);
    
        const events: { date: Date; type: 'milestone' | 'defense'; text: string; project: ProjectGroup }[] = [];
    
        const relevantProjects = projectGroups.filter(pg => 
            pg.project.advisorName === user.name ||
            pg.project.mainCommitteeId === user.id ||
            pg.project.secondCommitteeId === user.id ||
            pg.project.thirdCommitteeId === user.id
        );
    
        relevantProjects.forEach(pg => {
            if (pg.project.advisorName === user.name) {
                pg.project.milestones?.forEach(m => {
                    const dueDate = new Date(m.dueDate);
                    if (dueDate >= today && dueDate <= sevenDaysFromNow) {
                        events.push({
                            date: dueDate,
                            type: 'milestone',
                            text: `${t('milestoneDue')}: ${m.name}`,
                            project: pg
                        });
                    }
                });
            }
    
            if (pg.project.defenseDate) {
                const defenseDate = new Date(pg.project.defenseDate);
                if (defenseDate >= today && defenseDate <= sevenDaysFromNow) {
                    let role = '';
                    if (pg.project.advisorName === user.name) role = t('mainAdvisor');
                    else if (pg.project.mainCommitteeId === user.id) role = t('mainCommittee');
                    else if (pg.project.secondCommitteeId === user.id) role = t('secondCommittee');
                    else if (pg.project.thirdCommitteeId === user.id) role = t('thirdCommittee');
                    
                    if (role) {
                         events.push({
                            date: defenseDate,
                            type: 'defense',
                            text: `${t('defense')} (${role})`,
                            project: pg
                        });
                    }
                }
            }
        });
    
        return events.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [projectGroups, user, t]);

    const getCommitteeRole = (project: Project, advisorId: string): string => {
        if (project.mainCommitteeId === advisorId) return t('mainCommittee');
        if (project.secondCommitteeId === advisorId) return t('secondCommittee');
        if (project.thirdCommitteeId === advisorId) return t('thirdCommittee');
        return '';
    };

    const handleOpenScoreModal = (project: Project) => {
        setScoreModalData({
            project,
            rubric: scoringSettings.committeeRubrics,
            evaluatorId: user.id,
            evaluatorName: user.name,
            maxTotalScore: committeeRubricTotal,
        });
        setIsScoreModalOpen(true);
    };

    const handleSaveScore = (scores: Record<string, number>) => {
        if (scoreModalData) {
            updateDetailedScore(scoreModalData.project.projectId, scoreModalData.evaluatorId, scores);
            addToast({type: 'success', message: t('committeeScoreSubmitted')});
        }
        setIsScoreModalOpen(false);
    };

    const formatEventDate = (date: Date): string => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const eventDate = new Date(date);
        eventDate.setHours(0,0,0,0);
    
        if (eventDate.getTime() === today.getTime()) return t('today');
        if (eventDate.getTime() === tomorrow.getTime()) return t('tomorrow');
        
        return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    };
    
    return (
        <Box sx={{ py: 2 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                    {t('advisorDashboardWelcome').replace('{name}', user.name)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {t('advisorDashboardDescription')}
                </Typography>
            </Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard 
                        title={t('projectsToReview')} 
                        value={projectsToReview.length} 
                        icon={<AssignmentIcon />} 
                        color="warning" 
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard 
                        title={t('milestonesToReview')} 
                        value={milestonesToReview.length} 
                        icon={<InboxIcon />} 
                        color="primary" 
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard 
                        title={t('supervisingProjects')} 
                        value={projectCount} 
                        icon={<SchoolIcon />} 
                        onClick={() => onNavigate('projects')} 
                        color="success" 
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard 
                        title={t('totalStudents')} 
                        value={studentCount} 
                        icon={<GroupsIcon />} 
                        color="info" 
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight="medium" gutterBottom>
                                {t('actionCenter')}
                            </Typography>
                            {(projectsToReview.length === 0 && milestonesToReview.length === 0) ? (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                    {t('allCaughtUp')}
                                </Typography>
                            ) : (
                                <Grid container spacing={3} sx={{ mt: 1 }}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                                            {t('projectApprovals')}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            {projectsToReview.length > 0 ? projectsToReview.map(pg => (
                                                <Card key={pg.project.projectId} variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                                                    <CardContent sx={{ p: 2 }}>
                                                        <Typography 
                                                            variant="body2" 
                                                            fontWeight="bold" 
                                                            color="primary" 
                                                            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                            onClick={() => onSelectProject(pg)}
                                                            noWrap
                                                        >
                                                            {pg.project.topicEng}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                            {pg.students.map(s => `${s.name} ${s.surname}`).join(', ')}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="success"
                                                                fullWidth
                                                                onClick={() => onUpdateStatus(pg.project.projectId, ProjectStatus.Approved, user, {})}
                                                            >
                                                                {t('approve')}
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="error"
                                                                fullWidth
                                                                onClick={() => onUpdateStatus(pg.project.projectId, ProjectStatus.Rejected, user, {})}
                                                            >
                                                                {t('reject')}
                                                            </Button>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            )) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    {t('noProjectsAwaitingApproval')}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                                            {t('milestoneReviews')}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            {milestonesToReview.length > 0 ? milestonesToReview.map(m => {
                                                const pg = allProjectsForAdvisor.find(p => p.project.projectId === m.projectGroupId);
                                                return (
                                                    <Card key={m.projectGroupId + m.milestoneName} variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                                                        <CardContent sx={{ p: 2 }}>
                                                            <Typography 
                                                                variant="body2" 
                                                                fontWeight="bold" 
                                                                color="primary" 
                                                                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                                onClick={() => pg && onSelectProject(pg)}
                                                                noWrap
                                                            >
                                                                {m.milestoneName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                                {m.studentNames}
                                                            </Typography>
                                                            <Button
                                                                fullWidth
                                                                size="small"
                                                                variant="contained"
                                                                sx={{ mt: 1.5 }}
                                                                onClick={() => pg && onSelectProject(pg)}
                                                            >
                                                                {t('reviewSubmission')}
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            }) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    {t('noMilestonesToReview')}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>
                            )}
                        </Paper>
                        
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight="medium">
                                    {t('recentlyUpdatedProjects')}
                                </Typography>
                                <Button size="small" onClick={() => onNavigate('projects')}>
                                    {t('viewAllMyProjects')}
                                </Button>
                            </Box>
                            <List>
                                {recentlyUpdatedProjects.map((pg, index) => (
                                    <React.Fragment key={pg.project.projectId}>
                                        {index > 0 && <Divider />}
                                        <ListItemButton onClick={() => onSelectProject(pg)}>
                                            <ListItemText
                                                primary={pg.project.topicEng}
                                                secondary={
                                                    <>
                                                        {pg.students.map(s => s.name).join(', ')}
                                                        <br />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {t('lastActivity')}: {pg.project.log?.length ? formatTimeAgo(pg.project.log[pg.project.log.length - 1].timestamp, t) : t('na')}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </ListItemButton>
                                    </React.Fragment>
                                ))}
                            </List>
                        </Paper>
                        
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight="medium" gutterBottom>
                                {t('committeeAssignments')}
                            </Typography>
                            {committeeAssignments.length > 0 ? (
                                <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                                    <List>
                                        {committeeAssignments.map((pg, index) => {
                                            const role = getCommitteeRole(pg.project, user.id);
                                            let score: number | null = null;
                                            if (role === t('mainCommittee')) score = pg.project.mainCommitteeScore;
                                            else if (role === t('secondCommittee')) score = pg.project.secondCommitteeScore;
                                            else if (role === t('thirdCommittee')) score = pg.project.thirdCommitteeScore;

                                            return (
                                                <React.Fragment key={pg.project.projectId}>
                                                    {index > 0 && <Divider />}
                                                    <ListItem
                                                        secondaryAction={
                                                            pg.project.defenseDate && (
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    onClick={() => handleOpenScoreModal(pg.project)}
                                                                >
                                                                    {score !== null ? t('editScore') : t('scoreNow')}
                                                                </Button>
                                                            )
                                                        }
                                                        sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 0.5 }}
                                                    >
                                                        <ListItemButton onClick={() => onSelectProject(pg)}>
                                                            <ListItemText
                                                                primary={pg.project.projectId}
                                                                secondary={role}
                                                            />
                                                        </ListItemButton>
                                                    </ListItem>
                                                </React.Fragment>
                                            )
                                        })}
                                    </List>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    {t('noCommitteeAssignments')}
                                </Typography>
                            )}
                        </Paper>
                    </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight="medium" gutterBottom>
                                {t('yourWorkload')}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                <WorkloadItem title={t('projectSupervision')} count={projectCount} quota={advisorData.quota} color="primary" />
                                <WorkloadItem title={t('mainCommittee')} count={committeeCounts[user.id]?.main || 0} quota={advisorData.mainCommitteeQuota} color="success" />
                                <WorkloadItem title={t('secondCommittee')} count={committeeCounts[user.id]?.second || 0} quota={advisorData.secondCommitteeQuota} color="warning" />
                                <WorkloadItem title={t('thirdCommittee')} count={committeeCounts[user.id]?.third || 0} quota={advisorData.thirdCommitteeQuota} color="secondary" />
                            </Box>
                        </Paper>
                        
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight="medium" gutterBottom>
                                {t('yourWeekAhead')}
                            </Typography>
                            {upcomingEvents.length > 0 ? (
                                <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                                    <List>
                                        {upcomingEvents.map((event, index) => (
                                            <React.Fragment key={index}>
                                                {index > 0 && <Divider />}
                                                <ListItemButton onClick={() => onSelectProject(event.project)}>
                                                    <ListItemIcon>
                                                        <Box sx={{ textAlign: 'center', minWidth: 48 }}>
                                                            <Typography variant="body2" fontWeight="bold" color="primary">
                                                                {formatEventDate(event.date)}
                                                            </Typography>
                                                            {event.type === 'defense' && (
                                                                <Typography variant="caption">
                                                                    {event.project.project.defenseTime}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={event.text}
                                                        secondary={event.project.project.projectId}
                                                    />
                                                    <Box
                                                        sx={{
                                                            width: 4,
                                                            height: '100%',
                                                            bgcolor: event.type === 'milestone' ? 'primary.main' : 'success.main',
                                                            borderRadius: 1,
                                                            ml: 1
                                                        }}
                                                    />
                                                </ListItemButton>
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <CalendarTodayIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {t('noUpcomingEvents')}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                        
                        <ActivityFeed notifications={advisorNotifications} onSelectNotification={onSelectNotification} />
                    </Box>
                </Grid>
            </Grid>
             {isScoreModalOpen && scoreModalData && (
                <ScoreEntryModal
                    isOpen={isScoreModalOpen}
                    onClose={() => setIsScoreModalOpen(false)}
                    onSave={handleSaveScore}
                    rubric={scoreModalData.rubric}
                    initialScores={scoreModalData.project.detailedScores?.[scoreModalData.evaluatorId] || {}}
                    evaluatorName={scoreModalData.evaluatorName}
                    maxTotalScore={scoreModalData.maxTotalScore}
                />
            )}
        </Box>
    );
};
