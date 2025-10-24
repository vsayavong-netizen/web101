import React, { useMemo, useState } from 'react';
import { Advisor, Major, Classroom, DefenseSettings, ScoringSettings, MilestoneTemplate, ProjectGroup, Student, ProjectStatus } from '../types';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, ArrowPathIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface AppReadinessModalProps {
    onClose: () => void;
    advisors: Advisor[];
    majors: Major[];
    classrooms: Classroom[];
    defenseSettings: DefenseSettings;
    scoringSettings: ScoringSettings;
    milestoneTemplates: MilestoneTemplate[];
    projectGroups: ProjectGroup[];
    students: Student[];
}

type CheckStatus = 'success' | 'warning' | 'error' | 'info';

interface CheckResult {
    title: string;
    status: CheckStatus;
    message: string;
}

const StatusItem: React.FC<CheckResult> = ({ title, status, message }) => {
    const config = {
        success: { icon: <CheckCircleIcon className="w-6 h-6 text-green-500" />, color: 'border-green-500' },
        warning: { icon: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />, color: 'border-yellow-500' },
        error: { icon: <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />, color: 'border-red-500' },
        info: { icon: <InformationCircleIcon className="w-6 h-6 text-blue-500" />, color: 'border-blue-500' },
    };
    
    const { icon, color } = config[status];

    return (
        <div className={`flex items-start gap-4 p-3 border-l-4 ${color}`}>
            <div className="flex-shrink-0 mt-1">{icon}</div>
            <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
            </div>
        </div>
    );
};


const AppReadinessModal: React.FC<AppReadinessModalProps> = ({ onClose, advisors, majors, classrooms, defenseSettings, scoringSettings, milestoneTemplates, projectGroups, students }) => {
    const t = useTranslations();
    const [key, setKey] = useState(0); // Used to force a re-render for re-running checks

    const checks = useMemo(() => {
        // Configuration
        const defenseCheck: CheckResult = {
            title: t('defenseSettingsConfigured'),
            status: 'error',
            message: t('defenseSettingsConfigured_error')
        };
        if (defenseSettings.startDefenseDate && defenseSettings.timeSlots && defenseSettings.rooms.length > 0) {
            defenseCheck.status = 'success';
            defenseCheck.message = t('defenseSettingsConfigured_ok');
        }

        const scoringCheck: CheckResult = {
            title: t('scoringSettingsConfigured'),
            status: 'error',
            message: t('scoringSettingsConfigured_error')
        };
        if (scoringSettings.gradeBoundaries.length > 0 && scoringSettings.advisorRubrics.length > 0 && scoringSettings.committeeRubrics.length > 0) {
            scoringCheck.status = 'success';
            scoringCheck.message = t('scoringSettingsConfigured_ok');
        }

        const templateCheck: CheckResult = {
            title: t('milestoneTemplatesExist'),
            status: 'warning',
            message: t('milestoneTemplatesExist_warning')
        };
        if (milestoneTemplates.length > 0) {
            templateCheck.status = 'success';
            templateCheck.message = t('milestoneTemplatesExist_ok');
        }

        // Core Data
        const advisorCheck: CheckResult = { title: t('advisorsExist'), status: 'error', message: t('advisorsExist_error') };
        if (advisors.length > 0) {
            advisorCheck.status = 'success';
            advisorCheck.message = t('advisorsExist_ok');
        }
        
        const majorCheck: CheckResult = { title: t('majorsExist'), status: 'error', message: t('majorsExist_error') };
        if (majors.length > 0) {
            majorCheck.status = 'success';
            majorCheck.message = t('majorsExist_ok');
        }
        
        const classroomCheck: CheckResult = { title: t('classroomsExist'), status: 'warning', message: t('classroomsExist_warning') };
        if (classrooms.length > 0) {
            classroomCheck.status = 'success';
            classroomCheck.message = t('classroomsExist_ok');
        }
        
        // Data Integrity
        const assignedStudentIds = new Set(projectGroups.flatMap(pg => pg.students.map(s => s.studentId)));
        const unassignedStudents = students.filter(s => s.status === 'Approved' && !assignedStudentIds.has(s.studentId));
        const studentProjectCheck: CheckResult = {
            title: t('studentsWithoutProjects'),
            status: 'success',
            message: t('studentsWithoutProjects_ok'),
        };
        if (unassignedStudents.length > 0) {
            studentProjectCheck.status = 'info';
            studentProjectCheck.message = t('studentsWithoutProjects_warning').replace('{count}', String(unassignedStudents.length));
        }

        const advisorProjectCounts = projectGroups.reduce((acc, group) => {
            if(group.project.status === ProjectStatus.Approved || group.project.status === ProjectStatus.Pending) {
                acc[group.project.advisorName] = (acc[group.project.advisorName] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        const overloadedAdvisors = advisors.filter(adv => (advisorProjectCounts[adv.name] || 0) > adv.quota);
        const advisorQuotaCheck: CheckResult = {
            title: t('advisorsOverQuota'),
            status: 'success',
            message: t('advisorsOverQuota_ok'),
        };
        if (overloadedAdvisors.length > 0) {
            advisorQuotaCheck.status = 'warning';
            advisorQuotaCheck.message = t('advisorsOverQuota_warning').replace('{count}', String(overloadedAdvisors.length)).replace('{names}', overloadedAdvisors.map(a => a.name).join(', '));
        }
        
        const projectsMissingMilestones = projectGroups.filter(pg => pg.project.status === ProjectStatus.Approved && (!pg.project.milestones || pg.project.milestones.length === 0));
        const projectMilestoneCheck: CheckResult = {
            title: t('projectsWithoutMilestones'),
            status: 'success',
            message: t('projectsWithoutMilestones_ok'),
        };
        if (projectsMissingMilestones.length > 0) {
            projectMilestoneCheck.status = 'warning';
            projectMilestoneCheck.message = t('projectsWithoutMilestones_warning').replace('{count}', String(projectsMissingMilestones.length));
        }

        return {
            configuration: [defenseCheck, scoringCheck, templateCheck],
            coreData: [advisorCheck, majorCheck, classroomCheck],
            dataIntegrity: [studentProjectCheck, advisorQuotaCheck, projectMilestoneCheck],
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, advisors, majors, classrooms, defenseSettings, scoringSettings, milestoneTemplates, projectGroups, students, t]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center pb-4 border-b dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('appReadinessStatus')}</h2>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6"/></button>
                </div>
                <div className="my-4 text-sm text-slate-600 dark:text-slate-400">
                    <p>{t('readinessCheckDescription')}</p>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">{t('readinessConfiguration')}</h3>
                        <div className="space-y-3">{checks.configuration.map(check => <StatusItem key={check.title} {...check} />)}</div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">{t('readinessCoreData')}</h3>
                        <div className="space-y-3">{checks.coreData.map(check => <StatusItem key={check.title} {...check} />)}</div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">{t('readinessDataIntegrity')}</h3>
                        <div className="space-y-3">{checks.dataIntegrity.map(check => <StatusItem key={check.title} {...check} />)}</div>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 pt-4 mt-4 border-t border-slate-700">
                    <button onClick={() => setKey(k => k + 1)} className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 font-bold py-2 px-4 rounded-lg">
                        <ArrowPathIcon className="w-5 h-5"/> {t('rerunChecks')}
                    </button>
                    <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t('closeBtn')}</button>
                </div>
            </div>
        </div>
    );
};

export default AppReadinessModal;