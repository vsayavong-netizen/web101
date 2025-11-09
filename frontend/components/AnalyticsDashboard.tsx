import React, { useMemo, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, LinearProgress, Grid, Card, CardContent,
  Stack, Chip
} from '@mui/material';
import { 
  PieChart as PieChartIcon, School as SchoolIcon, 
  CalendarToday as CalendarTodayIcon, Assignment as AssignmentIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { ProjectGroup, Advisor, ProjectStatus, MilestoneStatus } from '../types';
import { getAdvisorColor } from '../utils/colorUtils';
import { ExcelUtils } from '../utils/excelUtils';
import { useToast } from '../hooks/useToast';
import { useTranslations } from '../hooks/useTranslations';


// Props Interface
interface AnalyticsDashboardProps {
    projectGroups: ProjectGroup[];
    advisors: Advisor[];
    advisorProjectCounts: Record<string, number>;
}

// Reusable Chart Card wrapper
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


const SchedulingStatusChart: React.FC<{ projectGroups: ProjectGroup[] }> = ({ projectGroups }) => {
    const t = useTranslations();

    const stats = useMemo(() => {
        const relevantProjects = projectGroups.filter(pg => pg.project.status === ProjectStatus.Approved);
        const total = relevantProjects.length;

        if (total === 0) {
            return null;
        }

        let fullyAssigned = 0;
        let partiallyAssigned = 0;
        let scheduled = 0;

        relevantProjects.forEach(pg => {
            const { mainCommitteeId, secondCommitteeId, thirdCommitteeId, defenseDate } = pg.project;
            const assignedCount = [mainCommitteeId, secondCommitteeId, thirdCommitteeId].filter(Boolean).length;
            
            if (assignedCount === 3) {
                fullyAssigned++;
            } else if (assignedCount > 0) {
                partiallyAssigned++;
            }

            if (defenseDate) {
                scheduled++;
            }
        });

        return {
            total,
            fullyAssigned,
            partiallyAssigned,
            unassigned: total - fullyAssigned - partiallyAssigned,
            scheduled,
            unscheduled: total - scheduled,
        };
    }, [projectGroups]);

    if (!stats) {
        return <Typography color="text.secondary">{t('noApprovedProjects')}</Typography>;
    }
    
    const ProgressBar: React.FC<{ value: number; total: number; color: 'success' | 'warning' | 'error' | 'info' | 'inherit'; label: string }> = ({ value, total, color, label }) => {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium">{label}</Typography>
                    <Typography variant="body2" color="text.secondary">{value} / {total}</Typography>
                </Box>
                <Box sx={{ position: 'relative', width: '100%' }}>
                    <LinearProgress 
                        variant="determinate" 
                        value={percentage} 
                        color={color}
                        sx={{ height: 16, borderRadius: 1 }}
                    />
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: 'white',
                        textShadow: '0 0 2px rgba(0,0,0,0.5)'
                    }}>
                        {percentage > 0 && `${percentage.toFixed(0)}%`}
                    </Box>
                </Box>
            </Box>
        );
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Stack spacing={4}>
                <Box>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                        {t('committeeAssignmentStatus')}
                    </Typography>
                    <Stack spacing={2}>
                        <ProgressBar value={stats.fullyAssigned} total={stats.total} color="success" label={t('fullyAssigned')} />
                        <ProgressBar value={stats.partiallyAssigned} total={stats.total} color="warning" label={t('partiallyAssigned')} />
                        <ProgressBar value={stats.unassigned} total={stats.total} color="error" label={t('unassigned')} />
                    </Stack>
                </Box>
                <Box>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                        {t('defenseSchedulingStatus')}
                    </Typography>
                    <Stack spacing={2}>
                        <ProgressBar value={stats.scheduled} total={stats.total} color="info" label={t('scheduledDefenses')} />
                        <ProgressBar value={stats.unscheduled} total={stats.total} color="inherit" label={t('unscheduled')} />
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
};


// --- Chart Components ---

// 1. Project Status Doughnut Chart
const ProjectStatusDoughnut: React.FC<{ projectGroups: ProjectGroup[] }> = ({ projectGroups }) => {
    const t = useTranslations();
    const data = useMemo(() => {
        const counts = projectGroups.reduce((acc, pg) => {
            acc[pg.project.status] = (acc[pg.project.status] || 0) + 1;
            return acc;
        }, {} as Record<ProjectStatus, number>);
        return {
            approved: counts.Approved || 0,
            pending: counts.Pending || 0,
            rejected: counts.Rejected || 0,
        };
    }, [projectGroups]);

    const total = data.approved + data.pending + data.rejected;
    if (total === 0) return <Typography color="text.secondary">{t('noProjectsToDisplay')}</Typography>;
    
    const radius = 80;
    const circumference = 2 * Math.PI * radius;

    const segments = [
        { value: data.approved, color: 'success' as const },
        { value: data.pending, color: 'warning' as const },
        { value: data.rejected, color: 'error' as const },
    ];
    
    const legend = [
        { label: t('approved'), color: 'success' as const, value: data.approved },
        { label: t('pending'), color: 'warning' as const, value: data.pending },
        { label: t('rejected'), color: 'error' as const, value: data.rejected },
    ];

    let accumulatedOffset = 0;

    const getColor = (color: 'success' | 'warning' | 'error') => {
        const colorMap = {
            'success': '#22c55e',
            'warning': '#eab308',
            'error': '#ef4444',
        };
        return colorMap[color];
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-around', width: '100%' }}>
            <Box sx={{ position: 'relative' }}>
                <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="100" cy="100" r={radius} fill="transparent" strokeWidth="20" stroke="currentColor" sx={{ color: 'action.disabledBackground' }} />
                    {segments.map((segment, index) => {
                        const dasharray = (segment.value / total) * circumference;
                        const strokeDashoffset = accumulatedOffset;
                        accumulatedOffset += dasharray;
                        return (
                             <circle 
                                key={index} 
                                cx="100" 
                                cy="100" 
                                r={radius} 
                                fill="transparent" 
                                strokeWidth="20"
                                strokeDasharray={`${dasharray} ${circumference}`}
                                strokeDashoffset={-strokeDashoffset}
                                stroke={getColor(segment.color)}
                            />
                        );
                    })}
                </svg>
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h4" fontWeight="bold">{total}</Typography>
                    <Typography variant="caption" color="text.secondary">{t('projects')}</Typography>
                </Box>
            </Box>
            <Stack spacing={1} sx={{ mt: { xs: 3, md: 0 }, ml: { md: 3 } }}>
                {legend.map(item => (
                    <Box key={item.label} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                            sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                mr: 1,
                                bgcolor: getColor(item.color)
                            }} 
                        />
                        <Typography variant="body2" fontWeight="medium">
                            {item.label}: {item.value} ({(total > 0 ? (item.value / total * 100) : 0).toFixed(1)}%)
                        </Typography>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
};


// 2. Advisor Workload Bar Chart
const AdvisorWorkloadBars: React.FC<{ advisors: Advisor[], advisorProjectCounts: Record<string, number> }> = ({ advisors, advisorProjectCounts }) => {
    const t = useTranslations();
    if (advisors.length === 0) return <Typography color="text.secondary">{t('noAdvisorsData')}</Typography>;
    
    return (
        <Stack spacing={2} sx={{ width: '100%' }}>
            {advisors.map(adv => {
                const count = advisorProjectCounts[adv.name] || 0;
                const percentage = adv.quota > 0 ? (count / adv.quota) * 100 : 0;
                const color = getAdvisorColor(adv.name);
                return (
                    <Box key={adv.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                            <Typography variant="body2" fontWeight="medium">{adv.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{count} / {adv.quota}</Typography>
                        </Box>
                        <Box sx={{ position: 'relative', width: '100%' }}>
                            <LinearProgress 
                                variant="determinate" 
                                value={Math.min(percentage, 100)} 
                                sx={{ 
                                    height: 16, 
                                    borderRadius: 1,
                                    bgcolor: 'action.disabledBackground',
                                    '& .MuiLinearProgress-bar': {
                                        bgcolor: color
                                    }
                                }}
                            />
                        </Box>
                    </Box>
                )
            })}
        </Stack>
    );
};


// 3. Monthly Submissions Area Chart
const MonthlySubmissionsAreaChart: React.FC<{ projectGroups: ProjectGroup[] }> = ({ projectGroups }) => {
    const t = useTranslations();
    const data = useMemo(() => {
        const now = new Date();
        const monthLabels: string[] = [];
        const counts: number[] = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthLabels.push(date.toLocaleString('default', { month: 'short' }));
            counts.push(0);
        }

        projectGroups.forEach(pg => {
            const submission = pg.project.history.find(h => h.status === ProjectStatus.Pending);
            if(submission){
                const submissionDate = new Date(submission.timestamp);
                const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                if (submissionDate >= sixMonthsAgo) {
                    const monthIndex = (submissionDate.getFullYear() - now.getFullYear()) * 12 + submissionDate.getMonth() - now.getMonth() + 5;
                    if(monthIndex >= 0 && monthIndex < 6) {
                        counts[monthIndex]++;
                    }
                }
            }
        });

        return { labels: monthLabels, counts };
    }, [projectGroups]);
    
    if (projectGroups.length === 0) return <Typography color="text.secondary">{t('noProjectsToDisplay')}</Typography>;

    const maxCount = Math.max(...data.counts, 5); // Ensure a minimum height for the y-axis
    const width = 400;
    const height = 200;
    const padding = { top: 10, right: 10, bottom: 20, left: 30 };

    const points = data.counts.map((count, i) => {
        const x = padding.left + (i / (data.counts.length - 1)) * (width - padding.left - padding.right);
        const y = height - padding.bottom - (count / maxCount) * (height - padding.top - padding.bottom);
        return `${x},${y}`;
    }).join(' ');
    
    const areaPath = `M${padding.left},${height - padding.bottom} L${points} L${width-padding.right},${height-padding.bottom} Z`;
    const linePath = `M${points}`;
    
    return (
        <Box sx={{ width: '100%' }}>
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
                {/* Y Axis */}
                <text x="10" y={padding.top + 5} style={{ fontSize: '12px', fill: 'currentColor' }}>{maxCount}</text>
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="currentColor" strokeWidth="1" opacity={0.3}/>
                <text x="10" y={height - padding.bottom} style={{ fontSize: '12px', fill: 'currentColor' }}>0</text>
                {/* X Axis */}
                <line x1={padding.left} y1={height - padding.bottom} x2={width-padding.right} y2={height - padding.bottom} stroke="currentColor" strokeWidth="1" opacity={0.3}/>
                {data.labels.map((label, i) => (
                    <text 
                        key={label} 
                        x={padding.left + (i / (data.labels.length - 1)) * (width - padding.left - padding.right)} 
                        y={height - 5} 
                        textAnchor="middle" 
                        style={{ fontSize: '12px', fill: 'currentColor' }}
                    >
                        {label}
                    </text>
                ))}

                {/* Chart Data */}
                <path d={areaPath} fill="rgba(25, 118, 210, 0.2)" />
                <path d={linePath} fill="none" stroke="#1976d2" strokeWidth="2" />
                 {data.counts.map((count, i) => (
                    <circle 
                        key={i} 
                        cx={padding.left + (i / (data.counts.length - 1)) * (width - padding.left - padding.right)} 
                        cy={height - padding.bottom - (count / maxCount) * (height - padding.top - padding.bottom)} 
                        r="3" 
                        fill="#1976d2" 
                    />
                ))}
            </svg>
        </Box>
    );
};

// 4. Milestone Progress Stacked Bar Chart
const MilestoneProgressChart: React.FC<{ projectGroups: ProjectGroup[] }> = ({ projectGroups }) => {
    const t = useTranslations();
    const data = useMemo(() => {
        const approvedProjects = projectGroups.filter(pg => pg.project.status === ProjectStatus.Approved && pg.project.milestones);
        if (approvedProjects.length === 0) return [];
        
        const milestoneStats: Record<string, Record<MilestoneStatus, number> & { total: number }> = {};

        approvedProjects.flatMap(pg => pg.project.milestones || []).forEach(milestone => {
            if (!milestoneStats[milestone.name]) {
                milestoneStats[milestone.name] = {
                    [MilestoneStatus.Approved]: 0,
                    [MilestoneStatus.Pending]: 0,
                    [MilestoneStatus.RequiresRevision]: 0,
                    [MilestoneStatus.Submitted]: 0,
                    total: 0
                };
            }
            milestoneStats[milestone.name][milestone.status]++;
            milestoneStats[milestone.name].total++;
        });

        return Object.entries(milestoneStats).map(([name, counts]) => ({ name, ...counts }));
    }, [projectGroups]);
    
    if (data.length === 0) return <Typography color="text.secondary">{t('noMilestonesYet')}</Typography>;
    
    const statusColors: Record<MilestoneStatus, string> = {
        [MilestoneStatus.Approved]: '#22c55e',
        [MilestoneStatus.Submitted]: '#3b82f6',
        [MilestoneStatus.RequiresRevision]: '#f97316',
        [MilestoneStatus.Pending]: '#94a3b8',
    };
    
    return (
        <Box sx={{ width: '100%' }}>
            <Stack spacing={2}>
                {data.map(item => (
                    <Box key={item.name}>
                        <Typography variant="body2" fontWeight="medium" sx={{ mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>
                            {item.name}
                        </Typography>
                        <Box sx={{ display: 'flex', width: '100%', height: 16, bgcolor: 'action.disabledBackground', borderRadius: 1, overflow: 'hidden' }}>
                            {Object.entries(statusColors).map(([status, color]) => {
                                const count = item[status as MilestoneStatus] || 0;
                                const percentage = item.total > 0 ? (count / item.total) * 100 : 0;
                                if(percentage === 0) return null;
                                return (
                                    <Box 
                                        key={status} 
                                        sx={{ 
                                            width: `${percentage}%`, 
                                            bgcolor: color,
                                            transition: 'width 0.5s'
                                        }} 
                                        title={`${status}: ${count}`}
                                    />
                                )
                            })}
                        </Box>
                    </Box>
                ))}
            </Stack>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 2 }}>
                {Object.entries(statusColors).map(([status, color]) => (
                     <Box key={status} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', mr: 0.5, bgcolor: color }} />
                        <Typography variant="caption" color="text.secondary">{status}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

// 5. Final Grade Distribution Bar Chart
const FinalGradeDistribution: React.FC<{ projectGroups: ProjectGroup[] }> = ({ projectGroups }) => {
    const t = useTranslations();
    const gradeData = useMemo(() => {
        const gradeCounts: Record<string, number> = {};
        projectGroups.forEach(pg => {
            if (pg.project.finalGrade) {
                const grade = pg.project.finalGrade.trim().toUpperCase();
                gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
            }
        });

        const sortedGrades = Object.entries(gradeCounts)
            .sort(([, countA], [, countB]) => countB - countA); // Sort by count descending

        return sortedGrades;
    }, [projectGroups]);

    if (gradeData.length === 0) {
        return <Typography color="text.secondary">{t('noFinalGradesYet')}</Typography>;
    }

    const maxCount = Math.max(...gradeData.map(([, count]) => count), 1); // Avoid division by zero

    const gradeColors: Record<string, string> = {
        'A': '#22c55e', 'A+': '#22c55e', 'A-': '#22c55e',
        'B+': '#0ea5e9', 'B': '#3b82f6', 'B-': '#6366f1',
        'C+': '#eab308', 'C': '#f97316', 'C-': '#ea580c',
        'D+': '#ef4444', 'D': '#dc2626',
        'F': '#4b5563'
    };
    const defaultColor = '#94a3b8';

    return (
        <Stack spacing={2} sx={{ width: '100%', pr: 2 }}>
            {gradeData.map(([grade, count]) => {
                const percentage = (count / maxCount) * 100;
                const color = gradeColors[grade] || defaultColor;
                return (
                    <Box key={grade} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ width: 48, textAlign: 'right' }}>
                            {grade}
                        </Typography>
                        <Box sx={{ flex: 1, position: 'relative', bgcolor: 'action.disabledBackground', borderRadius: 1, height: 24 }}>
                            <Box
                                sx={{
                                    height: 24,
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    px: 1,
                                    bgcolor: color,
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    transition: 'width 0.5s',
                                    width: `${percentage}%`
                                }}
                            >
                                {count > 0 && percentage > 10 && <span>{count}</span>}
                            </Box>
                            {percentage <= 10 && (
                                <Typography 
                                    variant="caption" 
                                    fontWeight="bold" 
                                    sx={{ 
                                        position: 'absolute', 
                                        left: `${percentage}%`, 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        pl: 0.5
                                    }}
                                >
                                    {count}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                );
            })}
        </Stack>
    );
};


// Main Component
const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ projectGroups, advisors, advisorProjectCounts }) => {
    const addToast = useToast();
    const t = useTranslations();

    const handleExportExcel = useCallback(async () => {
        // Prepare data for export
        const statusCounts = projectGroups.reduce((acc, pg) => {
            acc[pg.project.status] = (acc[pg.project.status] || 0) + 1;
            return acc;
        }, {} as Record<ProjectStatus, number>);
        
        const statusData = [
            { [t('status')]: t('approved'), [t('count')]: statusCounts.Approved || 0 },
            { [t('status')]: t('pending'), [t('count')]: statusCounts.Pending || 0 },
            { [t('status')]: t('rejected'), [t('count')]: statusCounts.Rejected || 0 },
        ];

        const workloadData = advisors.sort((a,b) => a.name.localeCompare(b.name)).map(adv => ({
            [t('advisor')]: adv.name,
            [t('projectsSupervising')]: advisorProjectCounts[adv.name] || 0,
            [t('quota')]: adv.quota
        }));

        const now = new Date();
        const monthlyData = Array.from({ length: 6 }).map((_, i) => {
            const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            return { [t('month')]: date.toLocaleString('default', { month: 'short', year: 'numeric' }), [t('submissions')]: 0 };
        });
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        projectGroups.forEach(pg => {
            const submission = pg.project.history.find(h => h.status === ProjectStatus.Pending);
            if(submission){
                const submissionDate = new Date(submission.timestamp);
                if (submissionDate >= sixMonthsAgo) {
                    const monthIndex = (submissionDate.getFullYear() - sixMonthsAgo.getFullYear()) * 12 + submissionDate.getMonth() - sixMonthsAgo.getMonth();
                    if(monthIndex >= 0 && monthIndex < 6) {
                        monthlyData[monthIndex][t('submissions')]++;
                    }
                }
            }
        });

        const approvedProjects = projectGroups.filter(pg => pg.project.status === ProjectStatus.Approved && pg.project.milestones);
        const milestoneStats: Record<string, Record<MilestoneStatus, number> & { total: number }> = {};
        approvedProjects.flatMap(pg => pg.project.milestones || []).forEach(milestone => {
            if (!milestoneStats[milestone.name]) {
                milestoneStats[milestone.name] = { Approved: 0, Pending: 0, 'Requires Revision': 0, Submitted: 0, total: 0 };
            }
            milestoneStats[milestone.name][milestone.status]++;
            milestoneStats[milestone.name].total++;
        });
        const milestoneData = Object.entries(milestoneStats).map(([name, counts]) => ({
            [t('milestone')]: name,
            [t('approved')]: counts.Approved,
            [t('submitted')]: counts.Submitted,
            [t('requiresRevision')]: counts['Requires Revision'],
            [t('pending')]: counts.Pending,
            [t('total')]: counts.total
        }));

        const gradeCounts: Record<string, number> = {};
        projectGroups.forEach(pg => {
            if (pg.project.finalGrade) {
                const grade = pg.project.finalGrade.trim().toUpperCase();
                gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
            }
        });
        const gradeData = Object.entries(gradeCounts).sort((a,b) => a[0].localeCompare(b[0])).map(([grade, count]) => ({
            [t('finalGrade')]: grade,
            [t('count')]: count
        }));

        // Export using ExcelUtils (simplified - single sheet export)
        const allData = {
            [t('projectStatus')]: statusData,
            [t('advisorWorkloadOverview')]: workloadData,
            [t('monthlySubmissions')]: monthlyData,
            [t('milestoneProgress')]: milestoneData,
            [t('gradeDistribution')]: gradeData,
        };

        await ExcelUtils.exportToExcel(statusData, 'Analytics_Report.xlsx');
        addToast({ type: 'success', message: t('analyticsExportSuccess') });
    }, [projectGroups, advisors, advisorProjectCounts, addToast, t]);

    return (
        <Box sx={{ py: 2 }}>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 3,
                gap: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                   <PieChartIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                   <Box>
                     <Typography variant="h5" component="h2" fontWeight="bold">
                       {t('analytics')}
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                       {t('analyticsDescription')}
                     </Typography>
                   </Box>
                </Box>
                <Button
                    onClick={handleExportExcel}
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    sx={{ bgcolor: 'green.600', '&:hover': { bgcolor: 'green.700' }, fontWeight: 'bold', mt: { xs: 2, sm: 0 } }}
                >
                    {t('exportReport')}
                </Button>
            </Box>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 6 }}>
                    <ChartCard title={t('projectStatusBreakdown')} icon={<PieChartIcon sx={{ fontSize: 24, color: 'primary.main' }} />}>
                        <ProjectStatusDoughnut projectGroups={projectGroups} />
                    </ChartCard>
                </Grid>
                <Grid size={{ xs: 12, lg: 6 }}>
                    <ChartCard title={t('advisorWorkloadOverview')} icon={<SchoolIcon sx={{ fontSize: 24, color: 'primary.main' }} />}>
                        <AdvisorWorkloadBars advisors={advisors} advisorProjectCounts={advisorProjectCounts} />
                    </ChartCard>
                </Grid>
                <Grid size={{ xs: 12, lg: 6 }}>
                    <ChartCard title={t('monthlySubmissions')} icon={<CalendarTodayIcon sx={{ fontSize: 24, color: 'primary.main' }} />}>
                        <MonthlySubmissionsAreaChart projectGroups={projectGroups} />
                    </ChartCard>
                </Grid>
                <Grid size={{ xs: 12, lg: 6 }}>
                    <ChartCard title={t('milestoneProgress')} icon={<AssignmentIcon sx={{ fontSize: 24, color: 'primary.main' }} />}>
                        <MilestoneProgressChart projectGroups={projectGroups} />
                    </ChartCard>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <ChartCard title={t('committeeSchedulingStatus')} icon={<AssignmentIcon sx={{ fontSize: 24, color: 'primary.main' }} />}>
                        <SchedulingStatusChart projectGroups={projectGroups} />
                    </ChartCard>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <ChartCard title={t('gradeDistribution')} icon={<SchoolIcon sx={{ fontSize: 24, color: 'primary.main' }} />}>
                        <FinalGradeDistribution projectGroups={projectGroups} />
                    </ChartCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AnalyticsDashboard;