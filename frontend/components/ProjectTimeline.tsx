import React, { useMemo } from 'react';
import { ProjectGroup, ProjectStatus, Milestone, MilestoneStatus, FinalSubmissionFile, FinalSubmissionStatus } from '../types';
import { ClockIcon, DocumentArrowUpIcon, CheckCircleIcon, ArrowPathIcon, ExclamationTriangleIcon, ChartBarIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

// Component Props
interface ProjectTimelineProps {
  projectGroups: ProjectGroup[];
}

// Milestone Tooltip Component
const MilestoneTooltip: React.FC<{ milestone: Milestone, project: ProjectGroup, t: (key: any) => string }> = ({ milestone, project, t }) => (
    <div className="absolute bottom-full mb-2 w-64 hidden group-hover:block bg-slate-800 text-white text-xs rounded p-2 z-20 shadow-lg text-left transform -translate-x-1/2 left-1/2">
        <p className="font-bold border-b border-slate-600 pb-1 mb-1">{milestone.name}</p>
        <p><strong>{t('projectLabel')}:</strong> {project.project.projectId}</p>
        <p><strong>{t('studentsLabel')}:</strong> {project.students.map(s => s.name).join(', ')}</p>
        <p><strong>{t('dueLabel')}:</strong> {new Date(milestone.dueDate).toLocaleDateString()}</p>
        <p><strong>{t('statusLabel')}:</strong> {milestone.status}</p>
    </div>
);

// Final Submission Tooltip Component
const FinalSubmissionTooltip: React.FC<{ submission: FinalSubmissionFile, project: ProjectGroup, type: string, t: (key: any) => string }> = ({ submission, project, type, t }) => (
    <div className="absolute bottom-full mb-2 w-64 hidden group-hover:block bg-slate-800 text-white text-xs rounded p-2 z-20 shadow-lg text-left transform -translate-x-1/2 left-1/2">
        <p className="font-bold border-b border-slate-600 pb-1 mb-1">{type}</p>
        <p><strong>{t('projectLabel')}:</strong> {project.project.projectId}</p>
        <p><strong>{t('studentsLabel')}:</strong> {project.students.map(s => s.name).join(', ')}</p>
        <p><strong>{t('submittedLabel')}:</strong> {new Date(submission.submittedAt).toLocaleDateString()}</p>
        <p><strong>{t('statusLabel')}:</strong> {submission.status}</p>
    </div>
);


// Main Timeline Component
const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ projectGroups }) => {
    const t = useTranslations();

    const approvedProjects = useMemo(() => {
        return projectGroups
            .filter(pg => pg.project.status === ProjectStatus.Approved && (
                (pg.project.milestones && pg.project.milestones.length > 0) ||
                (pg.project.finalSubmissions && (pg.project.finalSubmissions.preDefenseFile || pg.project.finalSubmissions.postDefenseFile))
            ))
            .sort((a, b) => a.project.projectId.localeCompare(b.project.projectId));
    }, [projectGroups]);

    const { startDate, endDate, totalDays } = useMemo(() => {
        if (approvedProjects.length === 0) {
            const today = new Date();
            const year = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1; // Academic year starts in Aug
            const start = new Date(year, 7, 1);
            const end = new Date(year + 1, 6, 31);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
            return { startDate: start, endDate: end, totalDays: days };
        }

        const allDates: Date[] = approvedProjects.flatMap(pg => [
            ...(pg.project.milestones?.map(m => new Date(m.dueDate)) || []),
            ...(pg.project.finalSubmissions?.preDefenseFile ? [new Date(pg.project.finalSubmissions.preDefenseFile.submittedAt)] : []),
            ...(pg.project.finalSubmissions?.postDefenseFile ? [new Date(pg.project.finalSubmissions.postDefenseFile.submittedAt)] : [])
        ]).filter(Boolean);

        if (allDates.length === 0) {
            const today = new Date();
            const year = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
            const start = new Date(year, 7, 1);
            const end = new Date(year + 1, 6, 31);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
            return { startDate: start, endDate: end, totalDays: days };
        }
        
        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

        const start = new Date(minDate);
        start.setDate(start.getDate() - 15);

        const end = new Date(maxDate);
        end.setDate(end.getDate() + 15);
        
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        
        return { startDate: start, endDate: end, totalDays: days };
    }, [approvedProjects]);

    const getDayPosition = (date: Date) => {
        const diff = (date.getTime() - startDate.getTime());
        if (diff < 0) return 0;
        const diffDays = diff / (1000 * 3600 * 24);
        return (diffDays / totalDays) * 100;
    };
    
    const getMilestoneStatusInfo = (milestone: Milestone) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const dueDate = new Date(milestone.dueDate);
        const isOverdue = (milestone.status === MilestoneStatus.Pending || milestone.status === MilestoneStatus.RequiresRevision) && dueDate < today;

        if (isOverdue) {
            return { icon: <ExclamationTriangleIcon className="w-4 h-4 text-white" />, color: 'bg-red-500', label: t('overdue') };
        }

        switch (milestone.status) {
            case MilestoneStatus.Approved: return { icon: <CheckCircleIcon className="w-4 h-4 text-white"/>, color: 'bg-green-500', label: t('approved') };
            case MilestoneStatus.Submitted: return { icon: <DocumentArrowUpIcon className="w-4 h-4 text-white"/>, color: 'bg-blue-500', label: t('submitted') };
            case MilestoneStatus.RequiresRevision: return { icon: <ArrowPathIcon className="w-4 h-4 text-white"/>, color: 'bg-orange-500', label: t('requiresRevision') };
            default: return { icon: <ClockIcon className="w-4 h-4 text-white"/>, color: 'bg-slate-400 dark:bg-slate-500', label: t('pending') };
        }
    };

    const getFinalSubmissionStatusInfo = (submission: FinalSubmissionFile) => {
        switch (submission.status) {
            case FinalSubmissionStatus.Approved: return { icon: <CheckCircleIcon className="w-4 h-4 text-white"/>, color: 'bg-emerald-500', label: t('approved') };
            case FinalSubmissionStatus.Submitted: return { icon: <DocumentArrowUpIcon className="w-4 h-4 text-white"/>, color: 'bg-sky-500', label: t('submitted') };
            case FinalSubmissionStatus.RequiresRevision: return { icon: <ArrowPathIcon className="w-4 h-4 text-white"/>, color: 'bg-amber-500', label: t('requiresRevision') };
            default: return { icon: <ClockIcon className="w-4 h-4 text-white"/>, color: 'bg-slate-400 dark:bg-slate-500', label: t('unknown') };
        }
    };

    const months = useMemo(() => {
        const monthArray: { name: string; position: number; width: number }[] = [];
        let current = new Date(startDate);
        current.setDate(1);

        while (current <= endDate) {
            const nextMonth = new Date(current);
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            const startPos = getDayPosition(current > startDate ? current : startDate);
            const endPos = getDayPosition(nextMonth < endDate ? nextMonth : endDate);

            monthArray.push({
                name: current.toLocaleString('default', { month: 'short', year: 'numeric' }),
                position: startPos,
                width: endPos - startPos,
            });
            current = nextMonth;
        }
        return monthArray;
    }, [startDate, endDate]);

    const todayPosition = getDayPosition(new Date());

    if (approvedProjects.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center">
                 <ChartBarIcon className="mx-auto h-12 w-12 text-slate-400" />
                 <h3 className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-200">{t('noTimelineTitle')}</h3>
                 <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t('noTimelineData')}
                 </p>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">{t('projectTimelineTitle')}</h2>
            <div className="overflow-x-auto">
                <div className="relative" style={{ minWidth: '1200px' }}>
                    {/* Month Headers */}
                    <div className="relative h-8 mb-2 flex">
                        {months.map(month => (
                            <div key={month.name} className="text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 text-center" style={{ position: 'absolute', left: `${month.position}%`, width: `${month.width}%` }}>
                                {month.name}
                            </div>
                        ))}
                    </div>

                    {/* Today Marker */}
                    {todayPosition >= 0 && todayPosition <= 100 && (
                        <div className="absolute top-8 bottom-0 w-0.5 bg-blue-500 z-10" style={{ left: `${todayPosition}%` }}>
                           <div className="absolute -top-6 -translate-x-1/2 text-xs font-semibold bg-blue-500 text-white px-1.5 py-0.5 rounded">{t('today')}</div>
                        </div>
                    )}
                    
                    {/* Project Rows */}
                    <div className="space-y-2 pt-2">
                        {approvedProjects.map((pg, index) => (
                            <div key={pg.project.projectId} className={`h-10 flex items-center rounded ${index % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}>
                                <div className="w-48 px-2 text-sm font-semibold text-slate-700 dark:text-slate-300 truncate sticky left-0 bg-inherit z-10">
                                    {pg.project.projectId}
                                </div>
                                <div className="relative flex-1 h-full border-l border-slate-200 dark:border-slate-700">
                                    {/* Milestones */}
                                    {pg.project.milestones?.map(milestone => {
                                        const pos = getDayPosition(new Date(milestone.dueDate));
                                        const statusInfo = getMilestoneStatusInfo(milestone);
                                        return (
                                            <div key={milestone.id} className="group absolute top-1/2 -translate-y-1/2" style={{ left: `${pos}%` }}>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white cursor-pointer ${statusInfo.color} ring-2 ring-white dark:ring-slate-800`}>
                                                    {statusInfo.icon}
                                                </div>
                                                <MilestoneTooltip milestone={milestone} project={pg} t={t} />
                                            </div>
                                        );
                                    })}
                                    {/* Final Submissions */}
                                    {pg.project.finalSubmissions?.preDefenseFile && (() => {
                                        const submission = pg.project.finalSubmissions.preDefenseFile;
                                        const pos = getDayPosition(new Date(submission.submittedAt));
                                        const statusInfo = getFinalSubmissionStatusInfo(submission);
                                        return (
                                            <div className="group absolute top-1/2 -translate-y-1/2" style={{ left: `${pos}%` }}>
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white cursor-pointer ${statusInfo.color} ring-2 ring-white dark:ring-slate-800`}>
                                                    {statusInfo.icon}
                                                </div>
                                                <FinalSubmissionTooltip submission={submission} project={pg} type={t('preDefenseFilesLabel')} t={t} />
                                            </div>
                                        );
                                    })()}
                                    {pg.project.finalSubmissions?.postDefenseFile && (() => {
                                        const submission = pg.project.finalSubmissions.postDefenseFile;
                                        const pos = getDayPosition(new Date(submission.submittedAt));
                                        const statusInfo = getFinalSubmissionStatusInfo(submission);
                                        return (
                                            <div className="group absolute top-1/2 -translate-y-1/2" style={{ left: `${pos}%` }}>
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white cursor-pointer ${statusInfo.color} ring-2 ring-white dark:ring-slate-800`}>
                                                    {statusInfo.icon}
                                                </div>
                                                <FinalSubmissionTooltip submission={submission} project={pg} type={t('postDefenseFilesLabel')} t={t} />
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
             <div className="flex flex-wrap gap-x-4 gap-y-1 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full mr-1.5 bg-blue-500"></span><span className="text-slate-600 dark:text-slate-400">{t('milestoneUnit')}</span></div>
                    <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full mr-1.5 bg-red-500"></span><span className="text-slate-600 dark:text-slate-400">{t('overdueMilestone')}</span></div>
                    <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full mr-1.5 bg-green-500"></span><span className="text-slate-600 dark:text-slate-400">{t('defense')}</span></div>
                </div>
        </div>
    );
};

export default ProjectTimeline;