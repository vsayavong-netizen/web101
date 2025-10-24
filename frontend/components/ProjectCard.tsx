import React, { useState, useMemo } from 'react';
import { ProjectGroup, ProjectStatus, User, ScoringSettings, ProjectHealthStatus } from '../types';
import StatusBadge from './StatusBadge';
import { getAdvisorColor } from '../utils/colorUtils';
import { ExclamationTriangleIcon, SparklesIcon } from './icons';
import { ToastMessage } from '../context/ToastContext';
import ScoreEntryModal from './ScoreEntryModal';
import { useTranslations } from '../hooks/useTranslations';

interface ProjectCardProps {
    group: ProjectGroup;
    user: User;
    onSelectProject: (group: ProjectGroup) => void;
    onUpdateStatus: (projectId: string, status: ProjectStatus) => void;
    updateDetailedScore?: (projectId: string, evaluatorId: string, scores: Record<string, number>) => void;
    addToast?: (toast: Omit<ToastMessage, 'id'>) => void;
    scoringSettings?: ScoringSettings;
    projectHealthStatus?: ProjectHealthStatus;
    onOpenAiAssistant?: () => void;
    isSelected?: boolean;
    onSelect?: () => void;
}

const InfoRow: React.FC<{ label: string; value?: string; children?: React.ReactNode; className?: string }> = ({ label, value, children, className = '' }) => (
  <div className={`flex justify-between text-sm ${className}`}>
    <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
    <dd className="text-slate-700 dark:text-slate-300 font-medium text-right truncate">{value || children}</dd>
  </div>
);

const ProjectCard: React.FC<ProjectCardProps> = ({ group, user, onSelectProject, onUpdateStatus, updateDetailedScore, addToast, scoringSettings, projectHealthStatus, onOpenAiAssistant, isSelected, onSelect }) => {
    const { project, students } = group;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const t = useTranslations();
    
    const isSelectable = user.role === 'Advisor' && onSelect && isSelected !== undefined;

    const advisorRubricTotal = useMemo(() => {
        if (!scoringSettings) return 100;
        return scoringSettings.advisorRubrics.reduce((sum, item) => sum + item.maxScore, 0);
    }, [scoringSettings]);

    const handleSaveScore = (scores: Record<string, number>) => {
        if (!updateDetailedScore || !addToast) return;
        updateDetailedScore(project.projectId, user.id, scores);
        addToast({ type: 'success', message: t('advisorScoreSubmitted') });
        setIsModalOpen(false);
    };

    return (
        <>
            <div onClick={() => onSelectProject(group)} className={`relative bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 flex flex-col justify-between cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-xl hover:ring-2 hover:ring-blue-500'}`}>
                {isSelectable && (
                    <div className="absolute top-3 right-3 z-10">
                         <input
                            type="checkbox"
                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded"
                            checked={isSelected}
                            onChange={onSelect}
                            onClick={(e) => e.stopPropagation()}
                           />
                    </div>
                )}
                <div>
                    {/* Project Info */}
                    <div className="pb-3 mb-3 border-b border-slate-200 dark:border-slate-700">
                         <div className="flex justify-between items-start">
                            <div className="pr-10">
                               <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400">{project.projectId}</h3>
                               <p className="font-semibold text-slate-800 dark:text-slate-100 truncate" title={project.topicLao}>{project.topicLao}</p>
                               <p className="text-sm text-slate-600 dark:text-slate-300 truncate" title={project.topicEng}>{project.topicEng}</p>
                               {project.similarityInfo && (
                                    <div className="mt-2 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center">
                                        <ExclamationTriangleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                                        <span>{project.similarityInfo.similarityPercentage}% {t('similarTo')} {project.similarityInfo.similarProjectId}</span>
                                    </div>
                                )}
                                {projectHealthStatus && (
                                    <div className="mt-2">
                                        {(() => {
                                            let colorClass = 'bg-slate-400';
                                            if (projectHealthStatus.health === 'On Track') colorClass = 'bg-green-500';
                                            if (projectHealthStatus.health === 'Needs Attention') colorClass = 'bg-yellow-500';
                                            if (projectHealthStatus.health === 'At Risk') colorClass = 'bg-red-500';
                                            if (projectHealthStatus.health === 'N/A') colorClass = 'bg-slate-400';
                                            return (
                                                <span 
                                                    className={`inline-flex items-center gap-2 text-xs font-semibold text-white px-2 py-1 rounded-full ${colorClass}`}
                                                    title={`${t('aiAnalysis')}: ${projectHealthStatus.summary}`}
                                                >
                                                    <SparklesIcon className="w-3 h-3"/>
                                                    {t('health')}: {projectHealthStatus.health}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                            <StatusBadge project={project} user={user} onUpdateStatus={onUpdateStatus} />
                        </div>
                    </div>
                    <dl className="space-y-2 mb-4">
                        <InfoRow label={t('advisor')}>
                          <div className="flex items-center justify-end">
                            <span className="h-2 w-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: getAdvisorColor(project.advisorName) }}></span>
                            <span className="truncate">{project.advisorName}</span>
                          </div>
                        </InfoRow>
                        <InfoRow label={t('defenseSchedule')} value={project.defenseDate ? `${project.defenseDate}, ${project.defenseTime} (${project.defenseRoom})` : t('notScheduled')} />
                    </dl>

                    {/* Student Info */}
                    {students.map((student, index) => (
                        <div key={student.studentId} className={`pt-3 ${index > 0 ? 'mt-3 border-t border-slate-200 dark:border-slate-700' : ''}`}>
                             <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{student.name} {student.surname}</h4>
                             <dl className="space-y-1.5">
                                <InfoRow label={t('studentId')} value={student.studentId} />
                                <InfoRow label={t('gender')} value={student.gender} />
                             </dl>
                        </div>
                    ))}

                    {updateDetailedScore && scoringSettings && (
                        <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium">{t('yourScore')}: <span className="font-bold">{project.mainAdvisorScore?.toFixed(2) ?? t('na')}</span> / {advisorRubricTotal}</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsModalOpen(true);
                                    }}
                                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {project.mainAdvisorScore !== null ? t('editScore') : t('enterScore')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isModalOpen && scoringSettings && (
                 <ScoreEntryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveScore}
                    rubric={scoringSettings.advisorRubrics}
                    initialScores={project.detailedScores?.[user.id] || {}}
                    evaluatorName={user.name}
                    maxTotalScore={advisorRubricTotal}
                />
            )}
        </>
    );
};

export default ProjectCard;