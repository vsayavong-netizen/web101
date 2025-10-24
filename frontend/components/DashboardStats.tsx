import React, { useMemo } from 'react';
import { ChartBarIcon, UserGroupIcon, AcademicCapIcon, ClipboardDocumentListIcon, InboxStackIcon, CheckCircleIcon } from './icons';
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
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex items-center space-x-4">
        <div className="flex-shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 rounded-full p-3">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const WorkloadItem: React.FC<{ title: string; count: number; quota: number; colorClass: string }> = ({ title, count, quota, colorClass }) => {
    const percentage = quota > 0 ? (count / quota) * 100 : 0;
    const isOverloaded = count > quota;
    const displayPercentage = isOverloaded ? 100 : percentage;
    const barColor = isOverloaded ? 'bg-red-500' : colorClass;

    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className={`text-sm font-semibold ${isOverloaded ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>{count} / {quota}</p>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                <div className={`${barColor} h-2 rounded-full transition-all duration-500`} style={{width: `${displayPercentage}%`}}></div>
            </div>
        </div>
    );
};

const AdvisorWorkloadCard: React.FC<{ advisor: Advisor; projectCount: number; committeeCounts: { main: number; second: number; third: number }; t: (key: any) => string }> = ({ advisor, projectCount, committeeCounts, t }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-full p-3">
                    <AcademicCapIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                     <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">{advisor.name}</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <WorkloadItem title={t('projectSupervision')} count={projectCount} quota={advisor.quota} colorClass="bg-blue-600" />
                        <WorkloadItem title={t('mainCommittee')} count={committeeCounts.main} quota={advisor.mainCommitteeQuota} colorClass="bg-green-600" />
                        <WorkloadItem title={t('secondCommittee')} count={committeeCounts.second} quota={advisor.secondCommitteeQuota} colorClass="bg-yellow-500" />
                        <WorkloadItem title={t('thirdCommittee')} count={committeeCounts.third} quota={advisor.thirdCommitteeQuota} colorClass="bg-purple-500" />
                     </div>
                </div>
            </div>
        </div>
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
        { name: t('approved'), count: statusCounts[ProjectStatus.Approved] || 0, color: 'bg-green-500' },
        { name: t('pending'), count: statusCounts[ProjectStatus.Pending] || 0, color: 'bg-yellow-500' },
        { name: t('rejected'), count: statusCounts[ProjectStatus.Rejected] || 0, color: 'bg-red-500' },
    ];
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 rounded-full p-3">
                    <ClipboardDocumentListIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">{t('projectStatusOverview')}</p>
                    <div className="space-y-3">
                        {statusData.map(status => {
                            const percentage = total > 0 ? (status.count / total) * 100 : 0;
                            return (
                                <div key={status.name}>
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{status.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{status.count} / {total}</p>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                                        <div 
                                            className={`h-2 rounded-full ${status.color}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MilestonesReviewPanel: React.FC<{ milestones: MilestoneReviewItem[]; onSelectProjectFromId: (projectId: string) => void; t: (key: any) => string; }> = ({ milestones, onSelectProjectFromId, t }) => {
    if (milestones.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md h-full">
                <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 rounded-full p-3">
                        <CheckCircleIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{t('allCaughtUp')}</p>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('noMilestonesToReview')}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md h-full">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('reviewQueue')}</h3>
            <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {milestones.map(item => (
                    <li key={item.projectGroupId + item.milestoneName}>
                        <button onClick={() => onSelectProjectFromId(item.projectGroupId)} className="w-full text-left p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:ring-2 hover:ring-blue-500 transition-all">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{item.milestoneName}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{item.projectGroupId} - {item.studentNames}</p>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}


const DashboardStats: React.FC<DashboardStatsProps> = ({ user, stats, advisors, advisorProjectCounts, committeeCounts, projectGroups, milestonesToReview, onSelectProjectFromId }) => {
  const t = useTranslations();

  if (user.role === 'Advisor') {
      const selfAdvisor = advisors.find(adv => adv.id === user.id);
      if (!selfAdvisor) return null;
      return (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard icon={<UserGroupIcon className="w-6 h-6"/>} title={t('yourStudents')} value={stats.totalStudents} />
                  <StatCard icon={<InboxStackIcon className="w-6 h-6"/>} title={t('milestonesToReview')} value={milestonesToReview.length} />
                  <MilestonesReviewPanel milestones={milestonesToReview} onSelectProjectFromId={onSelectProjectFromId} t={t} />
              </div>
              <AdvisorWorkloadCard
                advisor={selfAdvisor}
                projectCount={advisorProjectCounts[selfAdvisor.name] || 0}
                committeeCounts={committeeCounts[selfAdvisor.id] || { main: 0, second: 0, third: 0 }}
                t={t}
              />
          </div>
      )
  }
    
  // Admin View
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={<ChartBarIcon className="w-6 h-6"/>} title={t('totalProjects')} value={stats.totalProjects} />
            <StatCard icon={<UserGroupIcon className="w-6 h-6"/>} title={t('totalStudents')} value={stats.totalStudents} />
            <StatusOverview projectGroups={projectGroups} t={t} />
        </div>
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('advisorWorkloadOverview')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {advisors.map(adv => (
                    <AdvisorWorkloadCard
                        key={adv.id}
                        advisor={adv}
                        projectCount={advisorProjectCounts[adv.name] || 0}
                        committeeCounts={committeeCounts[adv.id] || { main: 0, second: 0, third: 0 }}
                        t={t}
                    />
                ))}
            </div>
        </div>
    </div>
  );
};

export default DashboardStats;