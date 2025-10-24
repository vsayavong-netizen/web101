import React, { useMemo, useState } from 'react';
import { User, ProjectGroup, Advisor, Student, Announcement, ProjectStatus, Project, ScoringSettings, ScoringRubricItem, Notification, MilestoneReviewItem, Major, Role } from '../types';
import { ClipboardDocumentListIcon, InboxStackIcon, UserGroupIcon, AcademicCapIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon, CalendarDaysIcon } from './icons';
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

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; onClick?: () => void; color: string; }> = ({ title, value, icon, onClick, color }) => (
    <button onClick={onClick} disabled={!onClick} className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex items-center space-x-4 w-full text-left ${onClick ? 'transition-transform transform hover:scale-105 hover:shadow-lg' : 'cursor-default'}`}>
        <div className={`flex-shrink-0 ${color} rounded-full p-3`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </button>
);

const WorkloadItem: React.FC<{ title: string; count: number; quota: number; colorClass: string }> = ({ title, count, quota, colorClass }) => {
    const percentage = quota > 0 ? (count / quota) * 100 : 0;
    const isOverloaded = count > quota;
    const displayPercentage = isOverloaded ? 100 : percentage;
    const barColor = isOverloaded ? 'bg-red-500' : colorClass;

    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className={`text-sm font-semibold ${isOverloaded ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>{count} / {quota}</p>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                <div className={`${barColor} h-2 rounded-full transition-all duration-500`} style={{width: `${displayPercentage}%`}}></div>
            </div>
        </div>
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
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('advisorDashboardWelcome').replace('{name}', user.name)}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{t('advisorDashboardDescription')}</p>
            </div>
            <div id="dashboard-stats-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('projectsToReview')} value={projectsToReview.length} icon={<ClipboardDocumentListIcon className="w-6 h-6 text-orange-800" />} color="bg-orange-100 dark:bg-orange-900/50" />
                <StatCard title={t('milestonesToReview')} value={milestonesToReview.length} icon={<InboxStackIcon className="w-6 h-6 text-blue-800" />} color="bg-blue-100 dark:bg-blue-900/50" />
                <StatCard title={t('supervisingProjects')} value={projectCount} icon={<AcademicCapIcon className="w-6 h-6 text-green-800" />} onClick={() => onNavigate('projects')} color="bg-green-100 dark:bg-green-900/50" />
                <StatCard title={t('totalStudents')} value={studentCount} icon={<UserGroupIcon className="w-6 h-6 text-indigo-800" />} color="bg-indigo-100 dark:bg-indigo-900/50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('actionCenter')}</h3>
                         {(projectsToReview.length === 0 && milestonesToReview.length === 0) ? (
                            <p className="text-slate-500 dark:text-slate-400 text-center py-8">{t('allCaughtUp')}</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">{t('projectApprovals')}</h4>
                                    <div className="space-y-3">
                                        {projectsToReview.length > 0 ? projectsToReview.map(pg => (
                                            <div key={pg.project.projectId} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate" onClick={() => onSelectProject(pg)}>{pg.project.topicEng}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{pg.students.map(s => `${s.name} ${s.surname}`).join(', ')}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button onClick={() => onUpdateStatus(pg.project.projectId, ProjectStatus.Approved, user, {})} className="flex-1 text-xs text-white bg-green-600 hover:bg-green-700 rounded-md px-2 py-1">{t('approve')}</button>
                                                    <button onClick={() => onUpdateStatus(pg.project.projectId, ProjectStatus.Rejected, user, {})} className="flex-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded-md px-2 py-1">{t('reject')}</button>
                                                </div>
                                            </div>
                                        )) : <p className="text-sm text-slate-500 dark:text-slate-400">{t('noProjectsAwaitingApproval')}</p>}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">{t('milestoneReviews')}</h4>
                                    <div className="space-y-3">
                                        {milestonesToReview.length > 0 ? milestonesToReview.map(m => {
                                            const pg = allProjectsForAdvisor.find(p => p.project.projectId === m.projectGroupId);
                                            return (
                                             <div key={m.projectGroupId + m.milestoneName} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate" onClick={() => pg && onSelectProject(pg)}>{m.milestoneName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{m.studentNames}</p>
                                                <button onClick={() => pg && onSelectProject(pg)} className="mt-2 w-full text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-md px-2 py-1">{t('reviewSubmission')}</button>
                                            </div>)
                                        }) : <p className="text-sm text-slate-500 dark:text-slate-400">{t('noMilestonesToReview')}</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t('recentlyUpdatedProjects')}</h3>
                            <button onClick={() => onNavigate('projects')} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">{t('viewAllMyProjects')}</button>
                        </div>
                        <div className="space-y-3">
                            {recentlyUpdatedProjects.map(pg => (
                                <button key={pg.project.projectId} onClick={() => onSelectProject(pg)} className="w-full text-left p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{pg.project.topicEng}</p>
                                    <div className="flex justify-between items-baseline text-xs text-slate-500 dark:text-slate-400">
                                        <span>{pg.students.map(s => s.name).join(', ')}</span>
                                        <span>{t('lastActivity')}: {pg.project.log?.length ? formatTimeAgo(pg.project.log[pg.project.log.length - 1].timestamp, t) : t('na')}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('committeeAssignments')}</h3>
                        {committeeAssignments.length > 0 ? (
                             <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                {committeeAssignments.map(pg => {
                                    const role = getCommitteeRole(pg.project, user.id);
                                    let score: number | null = null;
                                    if (role === t('mainCommittee')) score = pg.project.mainCommitteeScore;
                                    else if (role === t('secondCommittee')) score = pg.project.secondCommitteeScore;
                                    else if (role === t('thirdCommittee')) score = pg.project.thirdCommitteeScore;

                                    return (
                                        <div key={pg.project.projectId} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <button onClick={() => onSelectProject(pg)} className="text-left">
                                                    <p className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">{pg.project.projectId}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{role}</p>
                                                </button>
                                                {pg.project.defenseDate && (
                                                    <button onClick={() => handleOpenScoreModal(pg.project)} className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full px-3 py-1">
                                                        {score !== null ? t('editScore') : t('scoreNow')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                             </div>
                        ) : (
                             <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">{t('noCommitteeAssignments')}</p>
                        )}
                     </div>
                </div>
                <div className="lg:col-span-1 space-y-8">
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('yourWorkload')}</h3>
                        <div className="space-y-4">
                            <WorkloadItem title={t('projectSupervision')} count={projectCount} quota={advisorData.quota} colorClass="bg-blue-600" />
                            <WorkloadItem title={t('mainCommittee')} count={committeeCounts[user.id]?.main || 0} quota={advisorData.mainCommitteeQuota} colorClass="bg-green-600" />
                            <WorkloadItem title={t('secondCommittee')} count={committeeCounts[user.id]?.second || 0} quota={advisorData.secondCommitteeQuota} colorClass="bg-yellow-500" />
                            <WorkloadItem title={t('thirdCommittee')} count={committeeCounts[user.id]?.third || 0} quota={advisorData.thirdCommitteeQuota} colorClass="bg-purple-500" />
                        </div>
                     </div>
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('yourWeekAhead')}</h3>
                        {upcomingEvents.length > 0 ? (
                            <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                {upcomingEvents.map((event, index) => (
                                    <li key={index}>
                                        <button onClick={() => onSelectProject(event.project)} className="w-full text-left p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 text-center w-12">
                                                    <p className="font-bold text-blue-600 dark:text-blue-400">{formatEventDate(event.date)}</p>
                                                    {event.type === 'defense' && <p className="text-xs">{event.project.project.defenseTime}</p>}
                                                </div>
                                                <div className="flex items-center">
                                                    <span className={`w-1 h-full rounded-full mr-2 ${event.type === 'milestone' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                                                    <div>
                                                        <p className="text-sm font-semibold truncate">{event.text}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{event.project.project.projectId}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                <CalendarDaysIcon className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                                <p className="text-sm">{t('noUpcomingEvents')}</p>
                            </div>
                        )}
                     </div>
                    <ActivityFeed notifications={advisorNotifications} onSelectNotification={onSelectNotification} />
                </div>
            </div>
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
        </div>
    );
};
