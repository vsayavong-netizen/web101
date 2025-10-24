
import React, { useState, useMemo } from 'react';
import { User, ProjectGroup, Advisor, Student, Announcement, Notification, ProjectStatus, Major, DefenseSettings, ScoringSettings, MilestoneTemplate, Classroom } from '../types';
import { ClipboardDocumentListIcon, UserGroupIcon, AcademicCapIcon, ClockIcon, ExclamationTriangleIcon, ChevronRightIcon, SparklesIcon, CheckCircleIcon, ShieldCheckIcon } from './icons';
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

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; onClick?: () => void; color: string; }> = ({ title, value, icon, onClick, color }) => (
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
            <div className="space-y-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('adminDashboardTitle')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{t('adminDashboardDescription')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title={t('totalProjects')} value={projectGroups.length} icon={<ClipboardDocumentListIcon className="w-6 h-6 text-blue-800" />} onClick={() => onNavigate('projects')} color="bg-blue-100 dark:bg-blue-900/50" />
                    <StatCard title={t('totalStudents')} value={students.length} icon={<UserGroupIcon className="w-6 h-6 text-green-800" />} onClick={() => onNavigate('students')} color="bg-green-100 dark:bg-green-900/50" />
                    <StatCard title={t('totalAdvisors')} value={advisors.length} icon={<AcademicCapIcon className="w-6 h-6 text-indigo-800" />} onClick={() => onNavigate('advisors')} color="bg-indigo-100 dark:bg-indigo-900/50" />
                    <StatCard title={t('pendingProjects')} value={pendingProjects.length} icon={<ClockIcon className="w-6 h-6 text-yellow-800" />} onClick={() => onViewProjects('pending')} color="bg-yellow-100 dark:bg-yellow-900/50" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Column 1: Action Center & System Tools */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('actionCenter')}</h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">{t('pendingProjectsToReview')} ({pendingProjects.length})</h4>
                                    {pendingProjects.length > 0 ? (
                                        <button onClick={() => onViewProjects('pending')} className="w-full text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 flex justify-between items-center">
                                            <span>{t('viewPendingProjects')}</span>
                                            <ChevronRightIcon className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('noPendingProjectsToReview')}</p>
                                    )}
                                </div>
                                 <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">{t('pendingStudentApprovals')} ({pendingStudents.length})</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                        {pendingStudents.length > 0 ? pendingStudents.map(student => (
                                            <div key={student.studentId} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-md">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{student.name} {student.surname}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{student.major}</p>
                                                </div>
                                                <button onClick={() => handleApproveStudent(student)} className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-full px-3 py-1">{t('approve')}</button>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('noPendingStudents')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('systemTools')}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t('checkAppReadinessDescription')}</p>
                            <button onClick={() => setIsReadinessModalOpen(true)} className="w-full flex items-center justify-center gap-2 text-sm text-white bg-slate-600 hover:bg-slate-700 rounded-lg px-4 py-2">
                                <ShieldCheckIcon className="w-5 h-5"/>
                                <span>{t('checkAppReadiness')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Column 2: Workload & Activity */}
                    <div className="space-y-8">
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('advisorWorkloadSnapshot')}</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('overloadedAdvisors')}</span>
                                    <span className={`font-bold ${overloadedAdvisors.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>{overloadedAdvisors.length}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('avgLoad')}</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{averageLoad}</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">{t('mostLoadedAdvisors')}</h4>
                                    <div className="space-y-2">
                                        {mostLoadedAdvisors.map(adv => (
                                            <button key={adv.id} onClick={() => onManageAdvisorProjects(adv.name)} className="w-full text-left p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="font-medium text-slate-800 dark:text-slate-200">{adv.name}</span>
                                                    <span className="font-semibold text-slate-600 dark:text-slate-300">{advisorProjectCounts[adv.name] || 0} / {adv.quota} {t('projects')}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <ActivityFeed notifications={notifications} onSelectNotification={onSelectNotification} />
                    </div>

                    {/* Column 3: Announcements */}
                    <AnnouncementsFeed announcements={announcements} user={user} />
                </div>
            </div>
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
