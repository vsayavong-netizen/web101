import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Stack, Divider
} from '@mui/material';
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
    <Grid container spacing={2} sx={{ py: 1.5 }} alignItems="center">
        <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="body2" fontWeight="medium" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {evaluatorName}
            </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.primary">
                    {score !== null ? `${score.toFixed(2)} / ${total}` : t('pending')}
                </Typography>
                {canEdit && (
                    <Button
                        onClick={onEdit}
                        size="small"
                        sx={{ 
                            fontWeight: 500,
                            textTransform: 'none',
                            minWidth: 'auto'
                        }}
                    >
                        {score !== null ? t('editScore') : t('enterScore')}
                    </Button>
                )}
            </Box>
        </Grid>
    </Grid>
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
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    {t('scoringDetails')}
                </Typography>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                        {t('scoresConfidential')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {t('consultOffice')}
                    </Typography>
                </Box>
            </Paper>
        );
    }

    const canSeeAllScores = user.role === 'Admin' || user.role === 'DepartmentAdmin';
    const isMainAdvisor = mainAdvisor?.id === user.id;
    const committeeRole = evaluators.find(e => e.id === user.id && e.type.includes('Committee'));
    const isUserInvolved = isMainAdvisor || committeeRole;

    if (user.role === 'Advisor' && !isUserInvolved && !canSeeAllScores) {
        return (
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    {t('scoringDetails')}
                </Typography>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                        {t('noScoreViewPermission')}
                    </Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    {t('scoringDetails')}
                </Typography>
                <Stack divider={<Divider />}>
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
                        <Grid container spacing={2} sx={{ py: 1.5 }} alignItems="center">
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                                    {t('finalScoreAndGrade')}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6" color="text.primary">
                                        {finalScore !== null ? finalScore.toFixed(2) : t('na')}
                                    </Typography>
                                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                                        {finalGrade}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </Stack>
            </Paper>
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