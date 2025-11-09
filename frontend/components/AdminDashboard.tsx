import React, { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, Card, CardContent, Grid,
  List, ListItem, ListItemButton, ListItemText, Avatar,
  Divider, Chip
} from '@mui/material';
import { 
  Assignment as AssignmentIcon, Groups as GroupsIcon,
  School as SchoolIcon, AccessTime as AccessTimeIcon,
  ChevronRight as ChevronRightIcon, CheckCircle as CheckCircleIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { User, ProjectGroup, Advisor, Student, Announcement, Notification, ProjectStatus, Major, DefenseSettings, ScoringSettings, MilestoneTemplate, Classroom } from '../types';
import AnnouncementsFeed from './AnnouncementsFeed';
import ActivityFeed from './ActivityFeed';
import { useToast } from '../hooks/useToast';
import { useTranslations } from '../hooks/useTranslations';
import AppReadinessModal from './AppReadinessModal';

interface AdminDashboardProps {
    user: User & Partial<Advisor>;
    projectGroups: ProjectGroup[];
    advisors: Advisor[];
    students: Student[];
    majors: Major[];
    announcements: Announcement[];
    notifications: Notification[];
    advisorProjectCounts: Record<string, number>;
    onViewProjects: (filter?: 'pending') => void;
    onSelectNotification: (notification: Notification) => void;
    onNavigate: (view: any) => void;
    onSelectProject: (projectGroup: ProjectGroup) => void;
    onManageAdvisorProjects: (advisorName: string) => void;
    onApproveStudent: (student: Student) => void;
    addToast: (toast: any) => void;
    defenseSettings: DefenseSettings;
    scoringSettings: ScoringSettings;
    milestoneTemplates: MilestoneTemplate[];
    classrooms: Classroom[];
}

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; onClick?: () => void; color: 'primary' | 'success' | 'warning' | 'info' | 'default'; }> = ({ title, value, icon, onClick, color = 'primary' }) => {
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
                transition: 'all 0.2s'
            }}
        >
            <Avatar sx={{ bgcolor: `${muiColor}.light`, color: `${muiColor}.main` }}>
                {icon}
            </Avatar>
            <Box>
                <Typography variant="body2" color="text.secondary">{title}</Typography>
                <Typography variant="h4" fontWeight="bold">{value}</Typography>
            </Box>
        </Card>
    );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
    const { 
        user, projectGroups, advisors, students, announcements, notifications,
        advisorProjectCounts, onViewProjects, onSelectNotification, onNavigate,
        onSelectProject, onManageAdvisorProjects, onApproveStudent, addToast,
        defenseSettings, scoringSettings, milestoneTemplates, classrooms, majors
    } = props;
    const t = useTranslations();
    const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);
    
    const pendingProjects = React.useMemo(() => projectGroups.filter(p => p.project.status === ProjectStatus.Pending), [projectGroups]);
    const pendingStudents = React.useMemo(() => students.filter(s => s.status === 'Pending'), [students]);

    const handleApproveStudent = (student: Student) => {
        onApproveStudent({ ...student, status: 'Approved' });
        addToast({ type: 'success', message: t('approvedStudent').replace('${name}', `${student.name} ${student.surname}`) });
    };
    
    const { overloadedAdvisors, averageLoad, mostLoadedAdvisors } = useMemo(() => {
        const overloaded = advisors.filter(adv => (advisorProjectCounts[adv.name] || 0) > adv.quota);
        const totalLoad = Object.values(advisorProjectCounts).reduce((sum: number, count: number) => sum + (count || 0), 0);
        const avg = advisors.length > 0 ? (totalLoad / advisors.length).toFixed(1) : '0.0';
        
        // FIX: The use of Number() on a potentially undefined value can lead to NaN, causing incorrect sorting. Using || 0 ensures a safe default for advisors with no projects.
        const sortedAdvisors = [...advisors].sort((a, b) => (advisorProjectCounts[b.name] || 0) - (advisorProjectCounts[a.name] || 0));

        return {
            overloadedAdvisors: overloaded,
            averageLoad: avg,
            mostLoadedAdvisors: sortedAdvisors.slice(0, 3)
        };
    }, [advisors, advisorProjectCounts]);

    return (
        <>
            <Box sx={{ py: 2 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                        {t('adminDashboardTitle')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('adminDashboardDescription')}
                    </Typography>
                </Box>

                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard 
                            title={t('totalProjects')} 
                            value={projectGroups.length} 
                            icon={<AssignmentIcon />} 
                            onClick={() => onNavigate('projects')} 
                            color="primary" 
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard 
                            title={t('totalStudents')} 
                            value={students.length} 
                            icon={<GroupsIcon />} 
                            onClick={() => onNavigate('students')} 
                            color="success" 
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard 
                            title={t('totalAdvisors')} 
                            value={advisors.length} 
                            icon={<SchoolIcon />} 
                            onClick={() => onNavigate('advisors')} 
                            color="info" 
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard 
                            title={t('pendingProjects')} 
                            value={pendingProjects.length} 
                            icon={<AccessTimeIcon />} 
                            onClick={() => onViewProjects('pending')} 
                            color="warning" 
                        />
                    </Grid>
                </Grid>
                
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight="medium" gutterBottom>
                                    {t('actionCenter')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                                            {t('pendingProjectsToReview')} ({pendingProjects.length})
                                        </Typography>
                                        {pendingProjects.length > 0 ? (
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                endIcon={<ChevronRightIcon />}
                                                onClick={() => onViewProjects('pending')}
                                                size="small"
                                            >
                                                {t('viewPendingProjects')}
                                            </Button>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                {t('noPendingProjectsToReview')}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Divider />
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                                            {t('pendingStudentApprovals')} ({pendingStudents.length})
                                        </Typography>
                                        <Box sx={{ maxHeight: 200, overflowY: 'auto', pr: 1 }}>
                                            {pendingStudents.length > 0 ? (
                                                <List dense>
                                                    {pendingStudents.map((student, index) => (
                                                        <React.Fragment key={student.studentId}>
                                                            {index > 0 && <Divider />}
                                                            <ListItem
                                                                secondaryAction={
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        color="success"
                                                                        onClick={() => handleApproveStudent(student)}
                                                                    >
                                                                        {t('approve')}
                                                                    </Button>
                                                                }
                                                                sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 0.5 }}
                                                            >
                                                                <ListItemText
                                                                    primary={`${student.name} ${student.surname}`}
                                                                    secondary={student.major}
                                                                />
                                                            </ListItem>
                                                        </React.Fragment>
                                                    ))}
                                                </List>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    {t('noPendingStudents')}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Paper>

                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight="medium" gutterBottom>
                                    {t('systemTools')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {t('checkAppReadinessDescription')}
                                </Typography>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<SecurityIcon />}
                                    onClick={() => setIsReadinessModalOpen(true)}
                                    sx={{ bgcolor: 'grey.700', '&:hover': { bgcolor: 'grey.800' } }}
                                >
                                    {t('checkAppReadiness')}
                                </Button>
                            </Paper>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight="medium" gutterBottom>
                                    {t('advisorWorkloadSnapshot')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                                        <Typography variant="body2" fontWeight="medium">
                                            {t('overloadedAdvisors')}
                                        </Typography>
                                        <Chip 
                                            label={overloadedAdvisors.length} 
                                            color={overloadedAdvisors.length > 0 ? 'error' : 'default'}
                                            size="small"
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                                        <Typography variant="body2" fontWeight="medium">
                                            {t('avgLoad')}
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {averageLoad}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                                            {t('mostLoadedAdvisors')}
                                        </Typography>
                                        <List dense>
                                            {mostLoadedAdvisors.map(adv => (
                                                <ListItemButton
                                                    key={adv.id}
                                                    onClick={() => onManageAdvisorProjects(adv.name)}
                                                >
                                                    <ListItemText
                                                        primary={adv.name}
                                                        secondary={`${advisorProjectCounts[adv.name] || 0} / ${adv.quota} ${t('projects')}`}
                                                    />
                                                </ListItemButton>
                                            ))}
                                        </List>
                                    </Box>
                                </Box>
                            </Paper>

                            <ActivityFeed notifications={notifications} onSelectNotification={onSelectNotification} />
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <AnnouncementsFeed announcements={announcements} user={user} />
                    </Grid>
                </Grid>
            </Box>
            {isReadinessModalOpen && (
                <AppReadinessModal
                    onClose={() => setIsReadinessModalOpen(false)}
                    advisors={advisors}
                    majors={majors}
                    classrooms={classrooms}
                    defenseSettings={defenseSettings}
                    scoringSettings={scoringSettings}
                    milestoneTemplates={milestoneTemplates}
                    projectGroups={projectGroups}
                    students={students}
                />
            )}
        </>
    );
};
