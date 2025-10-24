import React, { useState, useMemo } from 'react';
import { ProjectGroup, ProjectStatus, User, ScoringSettings, ProjectHealthStatus, Role } from '../types';
import EmptyState from './EmptyState';
import ProjectCard from './ProjectCard';
import SortableHeader, { SortConfig } from './SortableHeader';
import StatusBadge from './StatusBadge';
import { getAdvisorColor } from '../utils/colorUtils';
import { ExclamationTriangleIcon, SparklesIcon } from './icons';
import { ToastMessage } from '../context/ToastContext';
import ScoreEntryModal from './ScoreEntryModal';
import { useTranslations } from '../hooks/useTranslations';

const ScoreEntryCell: React.FC<{
    projectGroup: ProjectGroup;
    user: User;
    scoringSettings: ScoringSettings;
    updateDetailedScore: (projectId: string, evaluatorId: string, scores: Record<string, number>) => void;
    addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}> = ({ projectGroup, user, scoringSettings, updateDetailedScore, addToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { project } = projectGroup;
    const t = useTranslations();
    
    const maxTotalScore = useMemo(() => {
        return scoringSettings.advisorRubrics.reduce((sum, rubric) => sum + rubric.maxScore, 0);
    }, [scoringSettings.advisorRubrics]);

    const handleSave = (scores: Record<string, number>) => {
        updateDetailedScore(project.projectId, user.id, scores);
        addToast({ type: 'success', message: t('advisorScoreSubmitted') });
        setIsModalOpen(false);
    };

    return (
        <div className="flex items-center gap-2">
            <span>{project.mainAdvisorScore?.toFixed(2) ?? t('na')}</span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                }}
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-xs"
            >
                {project.mainAdvisorScore !== null ? t('editAction') : t('enterAction')}
            </button>
            {isModalOpen && (
                <ScoreEntryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    rubric={scoringSettings.advisorRubrics}
                    initialScores={project.detailedScores?.[user.id] || {}}
                    evaluatorName={user.name}
                    maxTotalScore={maxTotalScore}
                />
            )}
        </div>
    );
};

type SortKey = 'studentId' | 'projectId' | 'advisorName';

interface ProjectTableProps {
  user: User;
  effectiveRole?: Role;
  projectGroups: ProjectGroup[];
  onSelectProject: (group: ProjectGroup) => void;
  onRegisterClick: () => void;
  sortConfig: SortConfig<SortKey> | null;
  requestSort: (key: SortKey) => void;
  onUpdateStatus: (projectId: string, status: ProjectStatus) => void;
  updateDetailedScore?: (projectId: string, evaluatorId: string, scores: Record<string, number>) => void;
  addToast?: (toast: Omit<ToastMessage, 'id'>) => void;
  scoringSettings?: ScoringSettings;
  projectHealth?: Record<string, ProjectHealthStatus>;
  onOpenAiAssistant?: () => void;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  onSelectAll?: () => void;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ user, effectiveRole, projectGroups, onSelectProject, onRegisterClick, sortConfig, requestSort, onUpdateStatus, updateDetailedScore, addToast, scoringSettings, projectHealth, onOpenAiAssistant, selectedIds, onSelect, onSelectAll }) => {
  const hasProjects = projectGroups && projectGroups.length > 0;
  const t = useTranslations();
  
  const isSelectable = effectiveRole && ['Admin', 'DepartmentAdmin', 'Advisor'].includes(effectiveRole) && onSelect && onSelectAll && selectedIds;
  
  const maxAdvisorScore = useMemo(() => {
    if (!scoringSettings) return 100;
    return scoringSettings.advisorRubrics.reduce((sum, rubric) => sum + rubric.maxScore, 0);
  }, [scoringSettings]);

  if (!hasProjects) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg text-center py-10 text-slate-500 dark:text-slate-400">
             <EmptyState user={user} onRegisterClick={onRegisterClick} />
        </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projectGroups.map(group => (
            <ProjectCard
              key={group.project.projectId}
              group={group}
              user={user}
              onSelectProject={onSelectProject}
              onUpdateStatus={onUpdateStatus}
              updateDetailedScore={updateDetailedScore}
              addToast={addToast}
              scoringSettings={scoringSettings}
              projectHealthStatus={projectHealth?.[group.project.projectId]}
              onOpenAiAssistant={onOpenAiAssistant}
              isSelected={isSelectable ? selectedIds.has(group.project.projectId) : undefined}
              onSelect={isSelectable ? () => onSelect(group.project.projectId) : undefined}
            />
        ))}
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg">
        <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
            <tr>
              {isSelectable && (
                <th scope="col" className="p-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    checked={projectGroups.length > 0 && selectedIds.size === projectGroups.length}
                    onChange={onSelectAll}
                  />
                </th>
              )}
              <th scope="col" className="px-6 py-3">{t('no')}</th>
              <SortableHeader sortKey="studentId" title={t('studentId')} sortConfig={sortConfig} requestSort={requestSort} />
              <th scope="col" className="px-6 py-3">{t('gender')}</th>
              <th scope="col" className="px-6 py-3">{t('name')}</th>
              <th scope="col" className="px-6 py-3">{t('major')}</th>
              <SortableHeader sortKey="projectId" title={t('projectId')} sortConfig={sortConfig} requestSort={requestSort} />
              <th scope="col" className="px-6 py-3">{t('topicLao')}</th>
              <th scope="col" className="px-6 py-3">{t('topicEng')}</th>
              {projectHealth && onOpenAiAssistant && <th scope="col" className="px-4 py-3">{t('health')}</th>}
              <th scope="col" className="px-4 py-3">{t('similarity')}</th>
              <SortableHeader sortKey="advisorName" title={t('advisor')} sortConfig={sortConfig} requestSort={requestSort} />
              <th scope="col" className="px-6 py-3">{t('defenseSchedule')}</th>
              <th scope="col" className="px-6 py-3">{t('status')}</th>
              {updateDetailedScore && scoringSettings && <th scope="col" className="px-6 py-3">{t('advisorScore')} (/{maxAdvisorScore})</th>}
              <th scope="col" className="px-6 py-3">{t('details')}</th>
            </tr>
          </thead>
          <tbody>
            {projectGroups.map((group, index) => {
              const { project, students } = group;
              const student1 = students[0];
              const student2 = students[1];
              const rowSpanValue = 2; // Always 2 rows for consistency
              const isSelected = isSelectable && selectedIds.has(project.projectId);

              return (
                <React.Fragment key={project.projectId}>
                  <tr className={`project-table-row align-top ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                    {isSelectable && (
                        <td className="p-4 align-middle" rowSpan={rowSpanValue}>
                           <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                            checked={isSelected}
                            onChange={() => onSelect(project.projectId)}
                            onClick={(e) => e.stopPropagation()}
                           />
                        </td>
                    )}
                    <td className="px-6 py-4 align-middle" rowSpan={rowSpanValue}>
                        {index + 1}
                    </td>
                    {/* Student 1 Info */}
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{student1.studentId}</td>
                    <td className="px-6 py-4">{student1.gender}</td>
                    <td className="px-6 py-4">{student1.name} {student1.surname}</td>
                    <td className="px-6 py-4">{student1.major}</td>

                    {/* Shared Project Info */}
                    <td className="px-6 py-4 align-middle bg-slate-50 dark:bg-slate-900/50" rowSpan={rowSpanValue}>
                        {project.projectId}
                    </td>
                    <td className="px-6 py-4 align-middle bg-slate-50 dark:bg-slate-900/50" rowSpan={rowSpanValue}>{project.topicLao}</td>
                    <td className="px-6 py-4 align-middle bg-slate-50 dark:bg-slate-900/50" rowSpan={rowSpanValue}>{project.topicEng}</td>
                    {projectHealth && onOpenAiAssistant && (
                        <td className="px-4 py-4 align-middle bg-slate-50 dark:bg-slate-900/50" rowSpan={rowSpanValue}>
                            {(() => {
                                const healthStatus = projectHealth[project.projectId];
                                if (healthStatus) {
                                    let colorClass = 'bg-slate-400';
                                    if (healthStatus.health === 'On Track') colorClass = 'bg-green-500';
                                    if (healthStatus.health === 'Needs Attention') colorClass = 'bg-yellow-500';
                                    if (healthStatus.health === 'At Risk') colorClass = 'bg-red-500';
                                    if (healthStatus.health === 'N/A') colorClass = 'bg-slate-400';
                                    
                                    return (
                                        <span 
                                            className={`flex items-center gap-2 text-xs font-semibold text-white px-2.5 py-1 rounded-full ${colorClass}`}
                                            title={`${t('aiAnalysis')}: ${healthStatus.summary}`}
                                        >
                                            <SparklesIcon className="w-3 h-3" />
                                            {healthStatus.health}
                                        </span>
                                    );
                                }
                                return <span className="text-xs text-slate-400">{t('na')}</span>;
                            })()}
                        </td>
                    )}
                    <td className="px-4 py-4 align-middle bg-slate-50 dark:bg-slate-900/50" rowSpan={rowSpanValue}>
                      {project.similarityInfo && (
                        <div className="group relative flex justify-center">
                          <span className="flex items-center text-amber-600 dark:text-amber-400 text-xs font-semibold">
                            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                            {project.similarityInfo.similarityPercentage}%
                          </span>
                          <div className="absolute bottom-full mb-2 hidden w-64 group-hover:block bg-slate-800 text-white text-xs rounded p-2 z-10 shadow-lg text-left transform -translate-x-1/2 left-1/2">
                            <p className="font-bold border-b border-slate-600 pb-1 mb-1">{t('potentialOverlap')}</p>
                            <p>{t('similarTo')} <strong className="text-amber-300">{project.similarityInfo.similarProjectId}</strong></p>
                            <p className="mt-1 whitespace-normal">{t('reason')}: {project.similarityInfo.reason}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 align-middle bg-slate-50 dark:bg-slate-900/50" rowSpan={rowSpanValue}>
                      <div className="flex items-center">
                        <span className="h-2 w-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: getAdvisorColor(project.advisorName) }}></span>
                        <span>{project.advisorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle bg-slate-50 dark:bg-slate-900/50 whitespace-nowrap" rowSpan={rowSpanValue}>
                      {project.defenseDate ? (
                          <div className="text-xs">
                              <p className="font-semibold">{project.defenseDate}</p>
                              <p className="text-slate-500">{project.defenseTime} {t('inRoom')} {project.defenseRoom}</p>
                          </div>
                      ) : (
                          <span className="text-xs text-slate-400">{t('notScheduled')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-middle bg-slate-50 dark:bg-slate-900/50" rowSpan={rowSpanValue}>
                        <StatusBadge project={project} user={user} onUpdateStatus={onUpdateStatus} />
                    </td>
                    {updateDetailedScore && addToast && scoringSettings && (
                        <td className="px-6 py-4 align-middle bg-slate-50 dark:bg-slate-900/50" rowSpan={rowSpanValue}>
                            <ScoreEntryCell
                                projectGroup={group}
                                user={user}
                                scoringSettings={scoringSettings}
                                updateDetailedScore={updateDetailedScore}
                                addToast={addToast}
                            />
                        </td>
                    )}
                    <td className="px-6 py-4 align-middle text-center bg-slate-50 dark:bg-slate-900/50" rowSpan={rowSpanValue}>
                        <button
                            onClick={() => onSelectProject(group)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                            aria-label={t('viewDetailsForProject').replace('${projectId}', project.projectId)}
                        >
                            {t('view')}
                        </button>
                    </td>
                  </tr>
                  <tr className={`border-b dark:border-slate-700 align-top ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                      {student2 ? (
                          <>
                              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{student2.studentId}</td>
                              <td className="px-6 py-4">{student2.gender}</td>
                              <td className="px-6 py-4">{student2.name} {student2.surname}</td>
                              <td className="px-6 py-4">{student2.major}</td>
                          </>
                      ) : (
                          <td className="px-6 py-4" colSpan={4}>&nbsp;</td>
                      )}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ProjectTable;