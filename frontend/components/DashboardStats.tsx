import React, { useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Stack, LinearProgress, Avatar
} from '@mui/material';
import {
  BarChart as ChartBarIcon, Groups as UserGroupIcon,
  School as AcademicCapIcon, Assignment as ClipboardDocumentListIcon,
  Inbox as InboxStackIcon, CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { Advisor, User, ProjectGroup, ProjectStatus } from '../types';
import { MilestoneReviewItem } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface DashboardStatsProps {
  user: User;
  stats: { totalProjects: number; totalStudents: number; };
  advisors: Advisor[];
  advisorProjectCounts: Record<string, number>;
  committeeCounts: Record<string, { main: number; second: number; third: number }>;
  projectGroups: ProjectGroup[];
  milestonesToReview: MilestoneReviewItem[];
  onSelectProjectFromId: (projectId: string) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; }> = ({ icon, title, value }) => (
    <Paper elevation={2} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 56, height: 56 }}>
            {icon}
        </Avatar>
        <Box>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
                {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
                {value}
            </Typography>
        </Box>
    </Paper>
);

const WorkloadItem: React.FC<{ title: string; count: number; quota: number; color: 'primary' | 'success' | 'warning' | 'secondary' }> = ({ title, count, quota, color }) => {
    const percentage = quota > 0 ? (count / quota) * 100 : 0;
    const isOverloaded = count > quota;
    const displayPercentage = isOverloaded ? 100 : percentage;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                <Typography variant="caption" fontWeight="medium" color="text.secondary">
                    {title}
                </Typography>
                <Typography variant="caption" fontWeight="semibold" color={isOverloaded ? 'error.main' : 'text.primary'}>
                    {count} / {quota}
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={displayPercentage}
                color={isOverloaded ? 'error' : color}
                sx={{ height: 8, borderRadius: 1 }}
            />
        </Box>
    );
};

const AdvisorWorkloadCard: React.FC<{ advisor: Advisor; projectCount: number; committeeCounts: { main: number; second: number; third: number }; t: (key: any) => string }> = ({ advisor, projectCount, committeeCounts, t }) => {
    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main', width: 48, height: 48 }}>
                    <AcademicCapIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                        {advisor.name}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <WorkloadItem title={t('projectSupervision')} count={projectCount} quota={advisor.quota} color="primary" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <WorkloadItem title={t('mainCommittee')} count={committeeCounts.main} quota={advisor.mainCommitteeQuota} color="success" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <WorkloadItem title={t('secondCommittee')} count={committeeCounts.second} quota={advisor.secondCommitteeQuota} color="warning" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <WorkloadItem title={t('thirdCommittee')} count={committeeCounts.third} quota={advisor.thirdCommitteeQuota} color="secondary" />
                        </Grid>
                    </Grid>
                </Box>
            </Stack>
        </Paper>
    );
};

const StatusOverview: React.FC<{ projectGroups: ProjectGroup[]; t: (key: any) => string }> = ({ projectGroups, t }) => {
    const statusCounts = useMemo(() => {
        return projectGroups.reduce((acc, group) => {
            acc[group.project.status] = (acc[group.project.status] || 0) + 1;
            return acc;
        }, {} as Record<ProjectStatus, number>);
    }, [projectGroups]);

    const total = projectGroups.length;
    
    const statusData = [
        { name: t('approved'), count: statusCounts[ProjectStatus.Approved] || 0, color: 'success' as const },
        { name: t('pending'), count: statusCounts[ProjectStatus.Pending] || 0, color: 'warning' as const },
        { name: t('rejected'), count: statusCounts[ProjectStatus.Rejected] || 0, color: 'error' as const },
    ];
    
    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main', width: 48, height: 48 }}>
                    <ClipboardDocumentListIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium" color="text.secondary" sx={{ mb: 2 }}>
                        {t('projectStatusOverview')}
                    </Typography>
                    <Stack spacing={2}>
                        {statusData.map(status => {
                            const percentage = total > 0 ? (status.count / total) * 100 : 0;
                            return (
                                <Box key={status.name}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                                        <Typography variant="body2" fontWeight="semibold">
                                            {status.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {status.count} / {total}
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={percentage}
                                        color={status.color}
                                        sx={{ height: 8, borderRadius: 1 }}
                                    />
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            </Stack>
        </Paper>
    );
};

const MilestonesReviewPanel: React.FC<{ milestones: MilestoneReviewItem[]; onSelectProjectFromId: (projectId: string) => void; t: (key: any) => string; }> = ({ milestones, onSelectProjectFromId, t }) => {
    if (milestones.length === 0) {
        return (
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 48, height: 48 }}>
                        <CheckCircleIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">
                            {t('allCaughtUp')}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" color="text.secondary">
                            {t('noMilestonesToReview')}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>
        )
    }

    return (
        <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                {t('reviewQueue')}
            </Typography>
            <Stack spacing={1.5} sx={{ maxHeight: 256, overflowY: 'auto', pr: 1 }}>
                {milestones.map(item => (
                    <Button
                        key={item.projectGroupId + item.milestoneName}
                        onClick={() => onSelectProjectFromId(item.projectGroupId)}
                        fullWidth
                        sx={{
                            textAlign: 'left',
                            textTransform: 'none',
                            p: 1.5,
                            bgcolor: 'action.hover',
                            '&:hover': {
                                bgcolor: 'primary.light',
                                border: 2,
                                borderColor: 'primary.main'
                            }
                        }}
                    >
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="body2" fontWeight="semibold">
                                {item.milestoneName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {item.projectGroupId} - {item.studentNames}
                            </Typography>
                        </Box>
                    </Button>
                ))}
            </Stack>
        </Paper>
    )
}


const DashboardStats: React.FC<DashboardStatsProps> = ({ user, stats, advisors, advisorProjectCounts, committeeCounts, projectGroups, milestonesToReview, onSelectProjectFromId }) => {
  const t = useTranslations();

  if (user.role === 'Advisor') {
      const selfAdvisor = advisors.find(adv => adv.id === user.id);
      if (!selfAdvisor) return null;
      return (
          <Stack spacing={3}>
              <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                      <StatCard icon={<UserGroupIcon />} title={t('yourStudents')} value={stats.totalStudents} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                      <StatCard icon={<InboxStackIcon />} title={t('milestonesToReview')} value={milestonesToReview.length} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                      <MilestonesReviewPanel milestones={milestonesToReview} onSelectProjectFromId={onSelectProjectFromId} t={t} />
                  </Grid>
              </Grid>
              <AdvisorWorkloadCard
                advisor={selfAdvisor}
                projectCount={advisorProjectCounts[selfAdvisor.name] || 0}
                committeeCounts={committeeCounts[selfAdvisor.id] || { main: 0, second: 0, third: 0 }}
                t={t}
              />
          </Stack>
      )
  }
    
  // Admin View
  return (
    <Stack spacing={3}>
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
                <StatCard icon={<ChartBarIcon />} title={t('totalProjects')} value={stats.totalProjects} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <StatCard icon={<UserGroupIcon />} title={t('totalStudents')} value={stats.totalStudents} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <StatusOverview projectGroups={projectGroups} t={t} />
            </Grid>
        </Grid>
        <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                {t('advisorWorkloadOverview')}
            </Typography>
            <Grid container spacing={3}>
                {advisors.map(adv => (
                    <Grid size={{ xs: 12, md: 6 }} key={adv.id}>
                        <AdvisorWorkloadCard
                            advisor={adv}
                            projectCount={advisorProjectCounts[adv.name] || 0}
                            committeeCounts={committeeCounts[adv.id] || { main: 0, second: 0, third: 0 }}
                            t={t}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    </Stack>
  );
};

export default DashboardStats;