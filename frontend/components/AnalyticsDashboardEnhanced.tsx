import React, { useMemo } from 'react';
import { Box, Grid, Paper, Typography, Stack, LinearProgress, Card, CardContent, Button } from '@mui/material';
import { 
  PieChart as PieChartIcon, School as SchoolIcon, 
  CalendarToday as CalendarTodayIcon, Assignment as AssignmentIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { EnhancedPieChart, EnhancedBarChart, EnhancedLineChart, ChartDataPoint } from './EnhancedCharts';
import { ChartSkeleton } from './LoadingSkeletons';
import { ProjectGroup, Advisor, ProjectStatus, MilestoneStatus } from '../types';
import { getAdvisorColor } from '../utils/colorUtils';
import { ExcelUtils } from '../utils/excelUtils';
import { useToast } from '../hooks/useToast';
import { useTranslations } from '../hooks/useTranslations';

interface AnalyticsDashboardEnhancedProps {
  projectGroups: ProjectGroup[];
  advisors: Advisor[];
  advisorProjectCounts: Record<string, number>;
  loading?: boolean;
}

const ChartCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <Card elevation={3}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box sx={{ 
          p: 1, 
          bgcolor: 'primary.light', 
          borderRadius: '50%', 
          mr: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </Box>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
      </Box>
      <Box sx={{ minHeight: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </Box>
    </CardContent>
  </Card>
);

// 1. Project Status Pie Chart
const ProjectStatusPieChart: React.FC<{ projectGroups: ProjectGroup[] }> = ({ projectGroups }) => {
  const t = useTranslations();
  const data: ChartDataPoint[] = useMemo(() => {
    const counts = projectGroups.reduce((acc, pg) => {
      acc[pg.project.status] = (acc[pg.project.status] || 0) + 1;
      return acc;
    }, {} as Record<ProjectStatus, number>);
    
    return [
      { label: t('approved') || 'Approved', value: counts.Approved || 0, color: '#22c55e' },
      { label: t('pending') || 'Pending', value: counts.Pending || 0, color: '#eab308' },
      { label: t('rejected') || 'Rejected', value: counts.Rejected || 0, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [projectGroups, t]);

  if (data.reduce((sum, d) => sum + d.value, 0) === 0) {
    return <Typography color="text.secondary">{t('noProjectsToDisplay')}</Typography>;
  }

  return (
    <EnhancedPieChart
      title={t('projectStatus') || 'Project Status'}
      data={data}
      height={300}
      innerRadius={0}
      outerRadius={80}
      showLegend
      showTooltip
    />
  );
};

// 2. Advisor Workload Bar Chart
const AdvisorWorkloadBars: React.FC<{ advisors: Advisor[], advisorProjectCounts: Record<string, number> }> = ({ advisors, advisorProjectCounts }) => {
  const t = useTranslations();
  const data: ChartDataPoint[] = useMemo(() => {
    return advisors
      .filter(adv => (advisorProjectCounts[adv.name] || 0) > 0)
      .map(adv => ({
        label: adv.name,
        value: advisorProjectCounts[adv.name] || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 advisors
  }, [advisors, advisorProjectCounts]);

  if (data.length === 0) {
    return <Typography color="text.secondary">{t('noAdvisorsData')}</Typography>;
  }

  return (
    <EnhancedBarChart
      title={t('advisorWorkload') || 'Advisor Workload'}
      data={data}
      xAxisLabel={t('advisor') || 'Advisor'}
      yAxisLabel={t('projects') || 'Projects'}
      height={400}
      horizontal
      showLegend={false}
      showTooltip
    />
  );
};

// 3. Monthly Submissions Line Chart
const MonthlySubmissionsLineChart: React.FC<{ projectGroups: ProjectGroup[] }> = ({ projectGroups }) => {
  const t = useTranslations();
  const data: ChartDataPoint[] = useMemo(() => {
    const now = new Date();
    const monthData: Record<string, number> = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthData[monthKey] = 0;
    }

    // Count submissions
    projectGroups.forEach(pg => {
      const submission = pg.project.history.find(h => h.status === ProjectStatus.Pending);
      if (submission) {
        const submissionDate = new Date(submission.timestamp);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        if (submissionDate >= sixMonthsAgo) {
          const monthKey = submissionDate.toLocaleString('default', { month: 'short', year: 'numeric' });
          if (monthData[monthKey] !== undefined) {
            monthData[monthKey]++;
          }
        }
      }
    });

    return Object.entries(monthData).map(([label, value]) => ({
      label,
      value,
    }));
  }, [projectGroups]);

  if (data.length === 0) {
    return <Typography color="text.secondary">{t('noProjectsToDisplay')}</Typography>;
  }

  return (
    <EnhancedLineChart
      title={t('monthlySubmissions') || 'Monthly Submissions'}
      data={data}
      xAxisLabel={t('month') || 'Month'}
      yAxisLabel={t('submissions') || 'Submissions'}
      height={300}
      showLegend={false}
      showTooltip
    />
  );
};

// 4. Milestone Progress Bar Chart
const MilestoneProgressChart: React.FC<{ projectGroups: ProjectGroup[] }> = ({ projectGroups }) => {
  const t = useTranslations();
  const data: ChartDataPoint[] = useMemo(() => {
    const approvedProjects = projectGroups.filter(pg => pg.project.status === ProjectStatus.Approved && pg.project.milestones);
    if (approvedProjects.length === 0) return [];
    
    const milestoneStats: Record<string, number> = {};

    approvedProjects.flatMap(pg => pg.project.milestones || []).forEach(milestone => {
      if (!milestoneStats[milestone.name]) {
        milestoneStats[milestone.name] = 0;
      }
      if (milestone.status === MilestoneStatus.Approved) {
        milestoneStats[milestone.name]++;
      }
    });

    return Object.entries(milestoneStats)
      .map(([label, value]) => ({
        label,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 milestones
  }, [projectGroups]);

  if (data.length === 0) {
    return <Typography color="text.secondary">{t('noMilestoneData')}</Typography>;
  }

  return (
    <EnhancedBarChart
      title={t('milestoneProgress') || 'Milestone Progress'}
      data={data}
      xAxisLabel={t('milestone') || 'Milestone'}
      yAxisLabel={t('approved') || 'Approved'}
      height={300}
      showLegend={false}
      showTooltip
    />
  );
};

const AnalyticsDashboardEnhanced: React.FC<AnalyticsDashboardEnhancedProps> = ({
  projectGroups,
  advisors,
  advisorProjectCounts,
  loading = false,
}) => {
  const addToast = useToast();
  const t = useTranslations();

  const handleExport = () => {
    try {
      const workbook = ExcelUtils.createWorkbook();
      const sheet = workbook.addWorksheet(t('analytics') || 'Analytics');
      
      // Add project status data
      const statusCounts = projectGroups.reduce((acc, pg) => {
        acc[pg.project.status] = (acc[pg.project.status] || 0) + 1;
        return acc;
      }, {} as Record<ProjectStatus, number>);

      sheet.addRow([t('projectStatus') || 'Project Status', t('count') || 'Count']);
      sheet.addRow([t('approved') || 'Approved', statusCounts.Approved || 0]);
      sheet.addRow([t('pending') || 'Pending', statusCounts.Pending || 0]);
      sheet.addRow([t('rejected') || 'Rejected', statusCounts.Rejected || 0]);

      ExcelUtils.downloadWorkbook(workbook, `analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
      addToast({ type: 'success', message: t('exportSuccess') || 'Export successful' });
    } catch (error) {
      console.error('Export error:', error);
      addToast({ type: 'error', message: t('exportError') || 'Export failed' });
    }
  };

  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartSkeleton height={300} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartSkeleton height={300} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <ChartSkeleton height={400} />
        </Grid>
      </Grid>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          {t('analytics') || 'Analytics Dashboard'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          {t('export') || 'Export'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title={t('projectStatus') || 'Project Status'} icon={<PieChartIcon />}>
            <ProjectStatusPieChart projectGroups={projectGroups} />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title={t('monthlySubmissions') || 'Monthly Submissions'} icon={<CalendarTodayIcon />}>
            <MonthlySubmissionsLineChart projectGroups={projectGroups} />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartCard title={t('advisorWorkload') || 'Advisor Workload'} icon={<SchoolIcon />}>
            <AdvisorWorkloadBars advisors={advisors} advisorProjectCounts={advisorProjectCounts} />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartCard title={t('milestoneProgress') || 'Milestone Progress'} icon={<AssignmentIcon />}>
            <MilestoneProgressChart projectGroups={projectGroups} />
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboardEnhanced;

