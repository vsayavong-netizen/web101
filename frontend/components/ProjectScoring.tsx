import React, { useState, useMemo, useCallback } from 'react';
import { ProjectGroup, User, ScoringSettings, Advisor, ScoringRubricItem } from '../types';
import { useToast } from '../hooks/useToast';
import ScoreEntryModal from './ScoreEntryModal';
import { useTranslations } from '../hooks/useTranslations';

interface ProjectScoringProps {
    projectGroup: ProjectGroup;
    user: User;
    scoringSettings: ScoringSettings;
    advisors: Advisor[];
    updateDetailedScore: (projectId: string, evaluatorId: string, scores: Record<string, number>) => void;
}

const ScoreDisplayRow: React.FC<{
    label: string;
    evaluatorName: string;
    score: number | null;
    total: number;
    canEdit: boolean;
    onEdit: () => void;
    t: (key: any) => string;
}> = ({ label, evaluatorName, score, total, canEdit, onEdit, t }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
            <span className="block text-xs font-normal text-slate-400 dark:text-slate-500">{evaluatorName}</span>
        </dt>
        <dd className="mt-1 text-sm text-slate-900 dark:text-white sm:col-span-2 sm:mt-0 flex justify-between items-center">
            <span>
                {score !== null ? `${score.toFixed(2)} / ${total}` : t('pending')}
            </span>
            {canEdit && (
                <button
                    onClick={onEdit}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                    {score !== null ? t('editScore') : t('enterScore')}
                </button>
            )}
        </dd>
    </div>
);


const ProjectScoring: React.FC<ProjectScoringProps> = ({ projectGroup, user, scoringSettings, advisors, updateDetailedScore }) => {
    const { project } = projectGroup;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<{
        evaluatorId: string;
        evaluatorName: string;
        rubric: ScoringRubricItem[];
        maxTotalScore: number;
    } | null>(null);

    const addToast = useToast();
    const t = useTranslations();

    const getAdvisorNameById = useCallback((id: string | null) => {
        if (!id) return t('notAssigned');
        return advisors.find(a => a.id === id)?.name || t('unknownAdvisor');
    }, [advisors, t]);

    const mainAdvisor = useMemo(() => advisors.find(a => a.name === project.advisorName), [advisors, project.advisorName]);
    
    const advisorRubricTotal = useMemo(() => scoringSettings.advisorRubrics.reduce((sum, item) => sum + item.maxScore, 0), [scoringSettings.advisorRubrics]);
    const committeeRubricTotal = useMemo(() => scoringSettings.committeeRubrics.reduce((sum, item) => sum + item.maxScore, 0), [scoringSettings.committeeRubrics]);


    const canEdit = useCallback((evaluatorId: string | undefined | null) => {
        if (!evaluatorId) return false;
        // Admin can edit anyone's score in this view if needed
        if (user.role === 'Admin' || user.role === 'DepartmentAdmin') return true;
        // Advisors can only edit their own score
        if (user.role === 'Advisor') return user.id === evaluatorId;
        return false;
    }, [user]);

    const handleEditClick = (evaluatorId: string, evaluatorName: string, rubric: ScoringRubricItem[], maxTotalScore: number) => {
        setModalData({ evaluatorId, evaluatorName, rubric, maxTotalScore });
        setIsModalOpen(true);
    };

    const handleSaveScore = (scores: Record<string, number>) => {
        if (modalData) {
            updateDetailedScore(project.projectId, modalData.evaluatorId, scores);
            addToast({ type: 'success', message: t('scoreSavedSuccess') });
            setIsModalOpen(false);
            setModalData(null);
        }
    };
    
    const evaluators = useMemo(() => [
        { type: t('mainAdvisor'), id: mainAdvisor?.id, name: mainAdvisor?.name, score: project.mainAdvisorScore, rubric: scoringSettings.advisorRubrics, maxScore: advisorRubricTotal },
        { type: t('mainCommittee'), id: project.mainCommitteeId, name: getAdvisorNameById(project.mainCommitteeId), score: project.mainCommitteeScore, rubric: scoringSettings.committeeRubrics, maxScore: committeeRubricTotal },
        { type: t('secondCommittee'), id: project.secondCommitteeId, name: getAdvisorNameById(project.secondCommitteeId), score: project.secondCommitteeScore, rubric: scoringSettings.committeeRubrics, maxScore: committeeRubricTotal },
        { type: t('thirdCommittee'), id: project.thirdCommitteeId, name: getAdvisorNameById(project.thirdCommitteeId), score: project.thirdCommitteeScore, rubric: scoringSettings.committeeRubrics, maxScore: committeeRubricTotal },
    ], [project, mainAdvisor, getAdvisorNameById, scoringSettings, advisorRubricTotal, committeeRubricTotal, t]);

    const { finalScore, finalGrade } = useMemo(() => {
        const { mainAdvisorScore, mainCommitteeScore, secondCommitteeScore, thirdCommitteeScore } = project;
        if ([mainAdvisorScore, mainCommitteeScore, secondCommitteeScore, thirdCommitteeScore].some(s => s === null)) {
            return { finalScore: null, finalGrade: t('incomplete') };
        }
        
        const avgCommitteeScore = (mainCommitteeScore! + secondCommitteeScore! + thirdCommitteeScore!) / 3;
        const score = mainAdvisorScore! + avgCommitteeScore;

        const grade = scoringSettings.gradeBoundaries.find(b => score >= b.minScore)?.grade || 'F';
        return { finalScore: score, finalGrade: grade };
    }, [project, scoringSettings.gradeBoundaries, t]);

    // Role-based privacy logic
    if (user.role === 'Student') {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('scoringDetails')}</h3>
                <div className="text-center py-4">
                    <p className="text-slate-600 dark:text-slate-400">{t('scoresConfidential')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">{t('consultOffice')}</p>
                </div>
            </div>
        );
    }

    const canSeeAllScores = user.role === 'Admin' || user.role === 'DepartmentAdmin';
    const isMainAdvisor = mainAdvisor?.id === user.id;
    const committeeRole = evaluators.find(e => e.id === user.id && e.type.includes('Committee'));
    const isUserInvolved = isMainAdvisor || committeeRole;

    if (user.role === 'Advisor' && !isUserInvolved && !canSeeAllScores) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('scoringDetails')}</h3>
                <div className="text-center py-4">
                    <p className="text-slate-600 dark:text-slate-400">{t('noScoreViewPermission')}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('scoringDetails')}</h3>
                <dl className="divide-y divide-slate-200 dark:divide-slate-700">
                    {evaluators.map(e => {
                        // Render logic for different roles
                        const shouldRender = canSeeAllScores ||
                                           (isMainAdvisor && e.type === t('mainAdvisor')) ||
                                           (committeeRole && e.type === committeeRole.type);
                        
                        if (shouldRender && e.id && e.name) {
                            return (
                                <ScoreDisplayRow
                                    key={e.type}
                                    label={e.type}
                                    evaluatorName={e.name}
                                    score={e.score}
                                    total={e.maxScore}
                                    canEdit={canEdit(e.id)}
                                    onEdit={() => handleEditClick(e.id!, e.name!, e.rubric, e.maxScore)}
                                    t={t}
                                />
                            )
                        }
                        return null;
                    })}
                    {canSeeAllScores && (
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-center font-bold">
                            <dt className="text-sm text-slate-600 dark:text-slate-300">{t('finalScoreAndGrade')}</dt>
                            <dd className="mt-1 text-lg text-slate-900 dark:text-white sm:col-span-2 sm:mt-0 flex justify-between items-center">
                               <span>{finalScore !== null ? finalScore.toFixed(2) : t('na')}</span>
                               <span className="text-blue-600 dark:text-blue-400">{finalGrade}</span>
                            </dd>
                        </div>
                    )}
                </dl>
            </div>
            {isModalOpen && modalData && (
                <ScoreEntryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveScore}
                    rubric={modalData.rubric}
                    initialScores={project.detailedScores?.[modalData.evaluatorId] || {}}
                    evaluatorName={modalData.evaluatorName}
                    maxTotalScore={modalData.maxTotalScore}
                />
            )}
        </>
    );
};

export default ProjectScoring;