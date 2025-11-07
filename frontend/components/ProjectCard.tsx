import React, { useState, useMemo } from 'react';
import {
  Card, CardContent, Typography, Box, Button, Checkbox,
  Chip, Divider
} from '@mui/material';
import { Warning as WarningIcon, AutoAwesome as SparklesIcon } from '@mui/icons-material';
import { ProjectGroup, ProjectStatus, User, ScoringSettings, ProjectHealthStatus } from '../types';
import StatusBadge from './StatusBadge';
import { getAdvisorColor } from '../utils/colorUtils';
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

const InfoRow: React.FC<{ label: string; value?: string; children?: React.ReactNode }> = ({ label, value, children }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', mb: 0.5 }}>
    <Typography component="dt" variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography component="dd" variant="body2" fontWeight="medium" color="text.primary" sx={{ textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {value || children}
    </Typography>
  </Box>
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

    const getHealthColor = (health: string): 'success' | 'warning' | 'error' | 'default' => {
        if (health === 'On Track') return 'success';
        if (health === 'Needs Attention') return 'warning';
        if (health === 'At Risk') return 'error';
        return 'default';
    };

    return (
        <>
            <Card
                onClick={() => onSelectProject(group)}
                sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: isSelected ? 2 : 0,
                    borderColor: isSelected ? 'primary.main' : 'transparent',
                    '&:hover': {
                        boxShadow: 6,
                        border: 2,
                        borderColor: 'primary.main'
                    }
                }}
            >
                {isSelectable && (
                    <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                        <Checkbox
                            checked={isSelected}
                            onChange={onSelect}
                            onClick={(e) => e.stopPropagation()}
                            color="primary"
                        />
                    </Box>
                )}
                <CardContent>
                    <Box sx={{ pb: 2, mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ pr: 5, flex: 1, minWidth: 0 }}>
                                <Typography variant="h6" color="primary" fontWeight="bold" gutterBottom>
                                    {project.projectId}
                                </Typography>
                                <Typography variant="subtitle1" fontWeight="medium" noWrap title={project.topicLao}>
                                    {project.topicLao}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap title={project.topicEng}>
                                    {project.topicEng}
                                </Typography>
                                {project.similarityInfo && (
                                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', color: 'warning.main' }}>
                                        <WarningIcon sx={{ fontSize: 16, mr: 0.5, flexShrink: 0 }} />
                                        <Typography variant="caption" fontWeight="medium">
                                            {project.similarityInfo.similarityPercentage}% {t('similarTo')} {project.similarityInfo.similarProjectId}
                                        </Typography>
                                    </Box>
                                )}
                                {projectHealthStatus && (
                                    <Box sx={{ mt: 1 }}>
                                        <Chip
                                            icon={<SparklesIcon sx={{ fontSize: 12 }} />}
                                            label={`${t('health')}: ${projectHealthStatus.health}`}
                                            color={getHealthColor(projectHealthStatus.health)}
                                            size="small"
                                            title={`${t('aiAnalysis')}: ${projectHealthStatus.summary}`}
                                        />
                                    </Box>
                                )}
                            </Box>
                            <StatusBadge project={project} user={user} onUpdateStatus={onUpdateStatus} />
                        </Box>
                    </Box>
                    <Box component="dl" sx={{ mb: 2 }}>
                        <InfoRow label={t('advisor')}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        mr: 1,
                                        flexShrink: 0,
                                        bgcolor: getAdvisorColor(project.advisorName)
                                    }}
                                />
                                <Typography variant="body2" noWrap>
                                    {project.advisorName}
                                </Typography>
                            </Box>
                        </InfoRow>
                        <InfoRow 
                            label={t('defenseSchedule')} 
                            value={project.defenseDate ? `${project.defenseDate}, ${project.defenseTime} (${project.defenseRoom})` : t('notScheduled')} 
                        />
                    </Box>

                    {students.map((student, index) => (
                        <Box key={student.studentId} sx={{ pt: index > 0 ? 2 : 0, mt: index > 0 ? 2 : 0, borderTop: index > 0 ? 1 : 0, borderColor: 'divider' }}>
                            <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                                {student.name} {student.surname}
                            </Typography>
                            <Box component="dl">
                                <InfoRow label={t('studentId')} value={student.studentId} />
                                <InfoRow label={t('gender')} value={student.gender} />
                            </Box>
                        </Box>
                    ))}

                    {updateDetailedScore && scoringSettings && (
                        <Box sx={{ pt: 2, mt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight="medium">
                                    {t('yourScore')}: <Box component="span" fontWeight="bold">{project.mainAdvisorScore?.toFixed(2) ?? t('na')}</Box> / {advisorRubricTotal}
                                </Typography>
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsModalOpen(true);
                                    }}
                                    size="small"
                                    sx={{ textTransform: 'none' }}
                                >
                                    {project.mainAdvisorScore !== null ? t('editScore') : t('enterScore')}
                                </Button>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>
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