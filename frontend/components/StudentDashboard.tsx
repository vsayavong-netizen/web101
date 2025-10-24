import React, { useMemo } from 'react';
import { User, ProjectGroup, Announcement, MilestoneStatus, Notification, NotificationType, Student, StudentSkillsAnalysis } from '../types';
import { ClipboardDocumentListIcon, AcademicCapIcon, ClockIcon, CheckCircleIcon, ChevronRightIcon, BellIcon, InboxStackIcon, PencilIcon, ChatBubbleBottomCenterTextIcon, Cog6ToothIcon } from './icons';
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
    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg flex items-center gap-4">
        <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/50 rounded-full p-3 text-blue-600 dark:text-blue-400">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <div className="text-lg font-bold text-slate-900 dark:text-white truncate">{value}</div>
        </div>
    </div>
);

const notificationTypeConfig: Record<NotificationType, { icon: React.FC<any>, color: string }> = {
    Submission: { icon: InboxStackIcon, color: 'text-blue-500' },
    Approval: { icon: CheckCircleIcon, color: 'text-green-500' },
    Feedback: { icon: PencilIcon, color: 'text-purple-500' },
    Mention: { icon: ChatBubbleBottomCenterTextIcon, color: 'text-indigo-500' },
    Message: { icon: ChatBubbleBottomCenterTextIcon, color: 'text-slate-500' },
    System: { icon: Cog6ToothIcon, color: 'text-orange-500' },
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
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('studentDashboardTitle')}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{t('studentDashboardDescription')}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{project.projectId}</p>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{project.topicEng}</h2>
                        <p className="text-md text-slate-500 dark:text-slate-400">{project.topicLao}</p>
                    </div>
                    <button onClick={onViewProject} className="flex-shrink-0 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-transform transform hover:scale-105">
                        {t('viewFullDetails')}
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard 
                        title={t('projectStatus')} 
                        value={<StatusBadge project={project} user={user} onUpdateStatus={() => {}} />} 
                        icon={<ClipboardDocumentListIcon className="w-6 h-6"/>} 
                    />
                    <StatCard 
                        title={t('advisor')} 
                        value={project.advisorName} 
                        icon={<AcademicCapIcon className="w-6 h-6"/>} 
                    />
                    <StatCard 
                        title={t('nextMilestoneDue')} 
                        value={upcomingMilestones.length > 0 ? new Date(upcomingMilestones[0].dueDate).toLocaleDateString() : t('allDone')} 
                        icon={<ClockIcon className="w-6 h-6"/>} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
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
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('yourNotifications')}</h3>
                        {notificationsToShow.length > 0 ? (
                            <ul className="space-y-2">
                                {notificationsToShow.map(notification => {
                                    const config = notificationTypeConfig[notification.type] || notificationTypeConfig.System;
                                    const Icon = config.icon;
                                    return (
                                        <li key={notification.id}>
                                            <button onClick={() => onSelectNotification(notification)} className={`w-full text-left p-2 rounded-md transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-slate-100 dark:hover:bg-slate-700`}>
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 mt-1"><Icon className={`w-5 h-5 ${config.color}`} /></div>
                                                    <div>
                                                        {notification.title && <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{notification.title}</p>}
                                                        <p className={`text-sm ${notification.title ? 'text-slate-600 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{notification.message}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatTimeAgo(notification.timestamp, t)}</p>
                                                    </div>
                                                    {!notification.read && <div className="flex-shrink-0 mt-1.5 h-2 w-2 rounded-full bg-blue-500"></div>}
                                                </div>
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                 <BellIcon className="mx-auto h-10 w-10 text-slate-400" />
                                <p className="mt-2 text-sm">{t('noNotificationsYet')}</p>
                            </div>
                        )}
                    </div>
                     <ResourceHubCard />
                </div>
            </div>
        </div>
    );
};