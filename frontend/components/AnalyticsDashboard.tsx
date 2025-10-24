import React, { useMemo, useCallback } from 'react';
import { ProjectGroup, Advisor, ProjectStatus, MilestoneStatus } from '../types';
import { ChartPieIcon, AcademicCapIcon, CalendarPlusIcon, ClipboardDocumentListIcon, TableCellsIcon } from './icons';
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
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full mr-3">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
        </div>
        <div className="min-h-[250px] flex items-center justify-center">{children}</div>
    </div>
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
        return <p className="text-slate-500 dark:text-slate-400">{t('noApprovedProjects')}</p>;
    }
    
    const ProgressBar: React.FC<{ value: number; total: number; color: string; label: string }> = ({ value, total, color, label }) => (
        <div>
            <div className="flex justify-between items-baseline mb-1 text-sm">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{label}</p>
                <p className="text-slate-500 dark:text-slate-400">{value} / {total}</p>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                <div 
                    className={`${color} h-4 rounded-full transition-all duration-500 text-white text-xs flex items-center justify-center font-bold`} 
                    style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }}
                >
                    {total > 0 && value > 0 && `${((value / total) * 100).toFixed(0)}%`}
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full space-y-6">
            <div>
                <h4 className="font-bold text-slate-600 dark:text-slate-300 mb-2">{t('committeeAssignmentStatus')}</h4>
                <div className="space-y-3">
                    <ProgressBar value={stats.fullyAssigned} total={stats.total} color="bg-green-500" label={t('fullyAssigned')} />
                    <ProgressBar value={stats.partiallyAssigned} total={stats.total} color="bg-yellow-500" label={t('partiallyAssigned')} />
                    <ProgressBar value={stats.unassigned} total={stats.total} color="bg-red-500" label={t('unassigned')} />
                </div>
            </div>
             <div>
                <h4 className="font-bold text-slate-600 dark:text-slate-300 mb-2">{t('defenseSchedulingStatus')}</h4>
                <div className="space-y-3">
                    <ProgressBar value={stats.scheduled} total={stats.total} color="bg-blue-500" label={t('scheduledDefenses')} />
                    <ProgressBar value={stats.unscheduled} total={stats.total} color="bg-slate-400" label={t('unscheduled')} />
                </div>
            </div>
        </div>
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
    if (total === 0) return <p className="text-slate-500 dark:text-slate-400">{t('noProjectsToDisplay')}</p>;
    
    const radius = 80;
    const circumference = 2 * Math.PI * radius;

    const segments = [
        { value: data.approved, color: 'stroke-green-500' },
        { value: data.pending, color: 'stroke-yellow-500' },
        { value: data.rejected, color: 'stroke-red-500' },
    ];
    
    const legend = [
        { label: t('approved'), color: 'bg-green-500', value: data.approved },
        { label: t('pending'), color: 'bg-yellow-500', value: data.pending },
        { label: t('rejected'), color: 'bg-red-500', value: data.rejected },
    ];

    let accumulatedOffset = 0;

    return (
        <div className="flex flex-col md:flex-row items-center justify-around w-full">
            <div className="relative">
                <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
                    <circle cx="100" cy="100" r={radius} fill="transparent" strokeWidth="20" className="stroke-slate-200 dark:stroke-slate-700" />
                    {segments.map((segment, index) => {
                        const dasharray = (segment.value / total) * circumference;
                        const strokeDashoffset = accumulatedOffset;
                        accumulatedOffset += dasharray;
                        return (
                             <circle key={index} cx="100" cy="100" r={radius} fill="transparent" strokeWidth="20"
                                strokeDasharray={`${dasharray} ${circumference}`}
                                strokeDashoffset={-strokeDashoffset}
                                className={segment.color}
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-800 dark:text-white">{total}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{t('projects')}</span>
                </div>
            </div>
            <div className="mt-6 md:mt-0 md:ml-6 space-y-2">
                {legend.map(item => (
                    <div key={item.label} className="flex items-center text-sm">
                        <span className={`w-3 h-3 rounded-full mr-2 ${item.color}`}></span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}:</span>
                        <span className="ml-1.5 text-slate-500 dark:text-slate-400">{item.value} ({(total > 0 ? (item.value / total * 100) : 0).toFixed(1)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


// 2. Advisor Workload Bar Chart
const AdvisorWorkloadBars: React.FC<{ advisors: Advisor[], advisorProjectCounts: Record<string, number> }> = ({ advisors, advisorProjectCounts }) => {
    const t = useTranslations();
    if (advisors.length === 0) return <p className="text-slate-500 dark:text-slate-400">{t('noAdvisorsData')}</p>;
    
    return (
        <div className="w-full space-y-4">
            {advisors.map(adv => {
                const count = advisorProjectCounts[adv.name] || 0;
                const percentage = adv.quota > 0 ? (count / adv.quota) * 100 : 0;
                const color = getAdvisorColor(adv.name);
                return (
                    <div key={adv.id}>
                        <div className="flex justify-between items-baseline mb-1 text-sm">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{adv.name}</p>
                            <p className="text-slate-500 dark:text-slate-400">{count} / {adv.quota}</p>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                            <div 
                                className="h-4 rounded-full transition-all duration-500" 
                                style={{ width: `${percentage}%`, backgroundColor: color }}
                            ></div>
                        </div>
                    </div>
                )
            })}
        </div>
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
    
    if (projectGroups.length === 0) return <p className="text-slate-500 dark:text-slate-400">{t('noProjectsToDisplay')}</p>;

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
        <div className="w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y Axis */}
                <text x="10" y={padding.top + 5} className="text-xs fill-slate-500 dark:fill-slate-400">{maxCount}</text>
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1"/>
                <text x="10" y={height - padding.bottom} className="text-xs fill-slate-500 dark:fill-slate-400">0</text>
                {/* X Axis */}
                <line x1={padding.left} y1={height - padding.bottom} x2={width-padding.right} y2={height - padding.bottom} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1"/>
                {data.labels.map((label, i) => (
                    <text key={label} x={padding.left + (i / (data.labels.length - 1)) * (width - padding.left - padding.right)} y={height - 5} textAnchor="middle" className="text-xs fill-slate-500 dark:fill-slate-400">
                        {label}
                    </text>
                ))}

                {/* Chart Data */}
                <path d={areaPath} className="fill-blue-500/20" />
                <path d={linePath} fill="none" className="stroke-blue-500" strokeWidth="2" />
                 {data.counts.map((count, i) => (
                    <circle key={i} cx={padding.left + (i / (data.counts.length - 1)) * (width - padding.left - padding.right)} cy={height - padding.bottom - (count / maxCount) * (height - padding.top - padding.bottom)} r="3" className="fill-blue-500" />
                ))}
            </svg>
        </div>
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
    
    if (data.length === 0) return <p className="text-slate-500 dark:text-slate-400">{t('noMilestonesYet')}</p>;
    
    const statusColors = {
        [MilestoneStatus.Approved]: 'bg-green-500',
        [MilestoneStatus.Submitted]: 'bg-blue-500',
        [MilestoneStatus.RequiresRevision]: 'bg-orange-500',
        [MilestoneStatus.Pending]: 'bg-slate-400 dark:bg-slate-500',
    };
    
    return (
        <div className="w-full space-y-4">
            {data.map(item => (
                <div key={item.name}>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1 truncate" title={item.name}>{item.name}</p>
                    <div className="flex w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        {Object.entries(statusColors).map(([status, color]) => {
                            const count = item[status as MilestoneStatus] || 0;
                            const percentage = item.total > 0 ? (count / item.total) * 100 : 0;
                            if(percentage === 0) return null;
                            return (
                                <div key={status} className={color} style={{ width: `${percentage}%` }} title={`${status}: ${count}`}></div>
                            )
                        })}
                    </div>
                </div>
            ))}
             <div className="flex flex-wrap gap-x-4 gap-y-1 pt-4 text-xs">
                {Object.entries(statusColors).map(([status, color]) => (
                     <div key={status} className="flex items-center">
                        <span className={`w-2.5 h-2.5 rounded-full mr-1.5 ${color}`}></span>
                        <span className="text-slate-600 dark:text-slate-400">{status}</span>
                    </div>
                ))}
            </div>
        </div>
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
        return <p className="text-slate-500 dark:text-slate-400">{t('noFinalGradesYet')}</p>;
    }

    const maxCount = Math.max(...gradeData.map(([, count]) => count), 1); // Avoid division by zero

    const gradeColors: Record<string, string> = {
        'A': 'bg-green-500', 'A+': 'bg-green-500', 'A-': 'bg-green-500',
        'B+': 'bg-sky-500', 'B': 'bg-blue-500', 'B-': 'bg-indigo-500',
        'C+': 'bg-yellow-500', 'C': 'bg-orange-500', 'C-': 'bg-orange-600',
        'D+': 'bg-red-500', 'D': 'bg-red-600',
        'F': 'bg-gray-600'
    };
    const defaultColor = 'bg-slate-400';

    return (
        <div className="w-full space-y-3 pr-4">
            {gradeData.map(([grade, count]) => {
                const percentage = (count / maxCount) * 100;
                const colorClass = gradeColors[grade] || defaultColor;
                return (
                    <div key={grade} className="flex items-center gap-4">
                        <span className="w-12 text-right font-bold text-slate-700 dark:text-slate-300">{grade}</span>
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-6 relative">
                            <div
                                className={`h-6 rounded-full flex items-center justify-end px-2 text-white text-xs font-bold transition-all duration-500 ${colorClass}`}
                                style={{ width: `${percentage}%` }}
                            >
                                {count > 0 && percentage > 10 && <span>{count}</span>}
                            </div>
                            {percentage <= 10 && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 dark:text-slate-300 pl-1" style={{left: `${percentage}%`}}>{count}</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


// Main Component
const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ projectGroups, advisors, advisorProjectCounts }) => {
    const addToast = useToast();
    const t = useTranslations();

    const handleExportExcel = useCallback(() => {
        // 1. Project Status Data
        const statusCounts = projectGroups.reduce((acc, pg) => {
            acc[pg.project.status] = (acc[pg.project.status] || 0) + 1;
            return acc;
        }, {} as Record<ProjectStatus, number>);
        const statusData = [
            [t('status'), t('count')],
            [t('approved'), statusCounts.Approved || 0],
            [t('pending'), statusCounts.Pending || 0],
            [t('rejected'), statusCounts.Rejected || 0],
        ];
        const wsStatus = XLSX.utils.aoa_to_sheet(statusData);
        wsStatus['!cols'] = [{ wch: 20 }, { wch: 10 }];

        // 2. Advisor Workload Data
        const workloadData = [
            [t('advisor'), t('projectsSupervising'), t('quota')],
            ...advisors.sort((a,b) => a.name.localeCompare(b.name)).map(adv => [
                adv.name,
                advisorProjectCounts[adv.name] || 0,
                adv.quota
            ])
        ];
        const wsWorkload = XLSX.utils.aoa_to_sheet(workloadData);
        wsWorkload['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 10 }];


        // 3. Monthly Submissions Data
        const now = new Date();
        const monthlyData = Array.from({ length: 6 }).map((_, i) => {
            const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            return { month: date.toLocaleString('default', { month: 'short', year: 'numeric' }), count: 0 };
        });
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        projectGroups.forEach(pg => {
            const submission = pg.project.history.find(h => h.status === ProjectStatus.Pending);
            if(submission){
                const submissionDate = new Date(submission.timestamp);
                if (submissionDate >= sixMonthsAgo) {
                    const monthIndex = (submissionDate.getFullYear() - sixMonthsAgo.getFullYear()) * 12 + submissionDate.getMonth() - sixMonthsAgo.getMonth();
                    if(monthIndex >= 0 && monthIndex < 6) {
                        monthlyData[monthIndex].count++;
                    }
                }
            }
        });
        const submissionSheetData = [[t('month'), t('submissions')], ...monthlyData.map(d => [d.month, d.count])];
        const wsSubmissions = XLSX.utils.aoa_to_sheet(submissionSheetData);
        wsSubmissions['!cols'] = [{ wch: 20 }, { wch: 15 }];


        // 4. Milestone Progress Data
        const approvedProjects = projectGroups.filter(pg => pg.project.status === ProjectStatus.Approved && pg.project.milestones);
        const milestoneStats: Record<string, Record<MilestoneStatus, number> & { total: number }> = {};
        approvedProjects.flatMap(pg => pg.project.milestones || []).forEach(milestone => {
            if (!milestoneStats[milestone.name]) {
                milestoneStats[milestone.name] = { Approved: 0, Pending: 0, 'Requires Revision': 0, Submitted: 0, total: 0 };
            }
            milestoneStats[milestone.name][milestone.status]++;
            milestoneStats[milestone.name].total++;
        });
        const milestoneSheetData = [
            [t('milestone'), t('approved'), t('submitted'), t('requiresRevision'), t('pending'), t('total')],
            ...Object.entries(milestoneStats).map(([name, counts]) => [ name, counts.Approved, counts.Submitted, counts['Requires Revision'], counts.Pending, counts.total ])
        ];
        const wsMilestones = XLSX.utils.aoa_to_sheet(milestoneSheetData);
        wsMilestones['!cols'] = [{ wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 10 }];


        // 5. Grade Distribution Data
        const gradeCounts: Record<string, number> = {};
        projectGroups.forEach(pg => {
            if (pg.project.finalGrade) {
                const grade = pg.project.finalGrade.trim().toUpperCase();
                gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
            }
        });
        const gradeSheetData = [[t('finalGrade'), t('count')], ...Object.entries(gradeCounts).sort((a,b) => a[0].localeCompare(b[0])).map(([grade, count]) => [grade, count])];
        const wsGrades = XLSX.utils.aoa_to_sheet(gradeSheetData);
        wsGrades['!cols'] = [{ wch: 10 }, { wch: 10 }];

        // Create and download workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsStatus, t('projectStatus'));
        XLSX.utils.book_append_sheet(wb, wsWorkload, t('advisorWorkloadOverview'));
        XLSX.utils.book_append_sheet(wb, wsSubmissions, t('monthlySubmissions'));
        XLSX.utils.book_append_sheet(wb, wsMilestones, t('milestoneProgress'));
        XLSX.utils.book_append_sheet(wb, wsGrades, t('gradeDistribution'));
        XLSX.writeFile(wb, 'Analytics_Report.xlsx');
        addToast({ type: 'success', message: t('analyticsExportSuccess') });
    }, [projectGroups, advisors, advisorProjectCounts, addToast, t]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex items-center">
                   <ChartPieIcon className="w-8 h-8 text-blue-600 mr-3"/>
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('analytics')}</h2>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">{t('analyticsDescription')}</p>
                   </div>
                </div>
                <button
                    onClick={handleExportExcel}
                    className="mt-4 sm:mt-0 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    <TableCellsIcon className="w-5 h-5 mr-2" />
                    {t('exportReport')}
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title={t('projectStatusBreakdown')} icon={<ChartPieIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}>
                    <ProjectStatusDoughnut projectGroups={projectGroups} />
                </ChartCard>
                <ChartCard title={t('advisorWorkloadOverview')} icon={<AcademicCapIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}>
                    <AdvisorWorkloadBars advisors={advisors} advisorProjectCounts={advisorProjectCounts} />
                </ChartCard>
                <ChartCard title={t('monthlySubmissions')} icon={<CalendarPlusIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}>
                    <MonthlySubmissionsAreaChart projectGroups={projectGroups} />
                </ChartCard>
                <ChartCard title={t('milestoneProgress')} icon={<ClipboardDocumentListIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}>
                    <MilestoneProgressChart projectGroups={projectGroups} />
                </ChartCard>
                <div className="lg:col-span-2">
                    <ChartCard title={t('committeeSchedulingStatus')} icon={<ClipboardDocumentListIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}>
                        <SchedulingStatusChart projectGroups={projectGroups} />
                    </ChartCard>
                </div>
                <div className="lg:col-span-2">
                    <ChartCard title={t('gradeDistribution')} icon={<AcademicCapIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}>
                        <FinalGradeDistribution projectGroups={projectGroups} />
                    </ChartCard>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;