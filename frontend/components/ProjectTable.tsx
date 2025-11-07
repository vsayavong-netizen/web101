import React, { useState, useMemo } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Button, Tooltip, Grid, Chip, Typography
} from '@mui/material';
import { Warning as ExclamationTriangleIcon, AutoAwesome as SparklesIcon } from '@mui/icons-material';
import { ProjectGroup, ProjectStatus, User, ScoringSettings, ProjectHealthStatus, Role } from '../types';
import EmptyState from './EmptyState';
import ProjectCard from './ProjectCard';
import SortableHeader, { SortConfig } from './SortableHeader';
import StatusBadge from './StatusBadge';
import { getAdvisorColor } from '../utils/colorUtils';
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
                {project.mainAdvisorScore?.toFixed(2) ?? t('na')}
            </Typography>
            <Button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                }}
                size="small"
                sx={{ textTransform: 'none', minWidth: 'auto', fontSize: '0.75rem' }}
            >
                {project.mainAdvisorScore !== null ? t('editAction') : t('enterAction')}
            </Button>
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
        </Box>
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
        <Paper elevation={3} sx={{ textAlign: 'center', py: 5 }}>
            <EmptyState user={user} onRegisterClick={onRegisterClick} />
        </Paper>
    );
  }

  const getHealthColor = (health: string): 'success' | 'warning' | 'error' | 'default' => {
    if (health === 'On Track') return 'success';
    if (health === 'Needs Attention') return 'warning';
    if (health === 'At Risk') return 'error';
    return 'default';
  };

  return (
    <>
      {/* Mobile Card View */}
      <Box sx={{ display: { lg: 'none' } }}>
        <Grid container spacing={2}>
          {projectGroups.map(group => (
            <Grid size={{ xs: 12, sm: 6 }} key={group.project.projectId}>
              <ProjectCard
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
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* Desktop Table View */}
      <TableContainer component={Paper} elevation={3} sx={{ display: { xs: 'none', lg: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {isSelectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={projectGroups.length > 0 && selectedIds.size === projectGroups.length}
                    onChange={onSelectAll}
                    color="primary"
                  />
                </TableCell>
              )}
              <TableCell>{t('no')}</TableCell>
              <SortableHeader sortKey="studentId" title={t('studentId')} sortConfig={sortConfig} requestSort={requestSort} />
              <TableCell>{t('gender')}</TableCell>
              <TableCell>{t('name')}</TableCell>
              <TableCell>{t('major')}</TableCell>
              <SortableHeader sortKey="projectId" title={t('projectId')} sortConfig={sortConfig} requestSort={requestSort} />
              <TableCell>{t('topicLao')}</TableCell>
              <TableCell>{t('topicEng')}</TableCell>
              {projectHealth && onOpenAiAssistant && <TableCell>{t('health')}</TableCell>}
              <TableCell>{t('similarity')}</TableCell>
              <SortableHeader sortKey="advisorName" title={t('advisor')} sortConfig={sortConfig} requestSort={requestSort} />
              <TableCell>{t('defenseSchedule')}</TableCell>
              <TableCell>{t('status')}</TableCell>
              {updateDetailedScore && scoringSettings && <TableCell>{t('advisorScore')} (/{maxAdvisorScore})</TableCell>}
              <TableCell>{t('details')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projectGroups.map((group, index) => {
              const { project, students } = group;
              const student1 = students[0];
              const student2 = students[1];
              const rowSpanValue = 2;
              const isSelected = isSelectable && selectedIds.has(project.projectId);

              return (
                <React.Fragment key={project.projectId}>
                  <TableRow 
                    sx={{ 
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    {isSelectable && (
                      <TableCell padding="checkbox" rowSpan={rowSpanValue}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => onSelect(project.projectId)}
                          onClick={(e) => e.stopPropagation()}
                          color="primary"
                        />
                      </TableCell>
                    )}
                    <TableCell rowSpan={rowSpanValue} align="center">
                      {index + 1}
                    </TableCell>
                    <TableCell>{student1.studentId}</TableCell>
                    <TableCell>{student1.gender}</TableCell>
                    <TableCell>{student1.name} {student1.surname}</TableCell>
                    <TableCell>{student1.major}</TableCell>
                    <TableCell rowSpan={rowSpanValue} sx={{ bgcolor: 'action.hover' }}>
                      {project.projectId}
                    </TableCell>
                    <TableCell rowSpan={rowSpanValue} sx={{ bgcolor: 'action.hover' }}>
                      {project.topicLao}
                    </TableCell>
                    <TableCell rowSpan={rowSpanValue} sx={{ bgcolor: 'action.hover' }}>
                      {project.topicEng}
                    </TableCell>
                    {projectHealth && onOpenAiAssistant && (
                      <TableCell rowSpan={rowSpanValue} sx={{ bgcolor: 'action.hover' }}>
                        {(() => {
                          const healthStatus = projectHealth[project.projectId];
                          if (healthStatus) {
                            return (
                              <Tooltip title={`${t('aiAnalysis')}: ${healthStatus.summary}`}>
                                <Chip
                                  icon={<SparklesIcon sx={{ fontSize: 12 }} />}
                                  label={healthStatus.health}
                                  color={getHealthColor(healthStatus.health)}
                                  size="small"
                                />
                              </Tooltip>
                            );
                          }
                          return <Typography variant="caption" color="text.secondary">{t('na')}</Typography>;
                        })()}
                      </TableCell>
                    )}
                    <TableCell rowSpan={rowSpanValue} sx={{ bgcolor: 'action.hover' }}>
                      {project.similarityInfo && (
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
                                {t('potentialOverlap')}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {t('similarTo')} <strong>{project.similarityInfo.similarProjectId}</strong>
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                {t('reason')}: {project.similarityInfo.reason}
                              </Typography>
                            </Box>
                          }
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'warning.main' }}>
                            <ExclamationTriangleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            <Typography variant="caption" fontWeight="medium">
                              {project.similarityInfo.similarityPercentage}%
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell rowSpan={rowSpanValue} sx={{ bgcolor: 'action.hover' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                        <Typography variant="body2">{project.advisorName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell rowSpan={rowSpanValue} sx={{ bgcolor: 'action.hover', whiteSpace: 'nowrap' }}>
                      {project.defenseDate ? (
                        <Box>
                          <Typography variant="caption" fontWeight="medium" display="block">
                            {project.defenseDate}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {project.defenseTime} {t('inRoom')} {project.defenseRoom}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {t('notScheduled')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell rowSpan={rowSpanValue} sx={{ bgcolor: 'action.hover' }}>
                      <StatusBadge project={project} user={user} onUpdateStatus={onUpdateStatus} />
                    </TableCell>
                    {updateDetailedScore && addToast && scoringSettings && (
                      <TableCell rowSpan={rowSpanValue} sx={{ bgcolor: 'action.hover' }}>
                        <ScoreEntryCell
                          projectGroup={group}
                          user={user}
                          scoringSettings={scoringSettings}
                          updateDetailedScore={updateDetailedScore}
                          addToast={addToast}
                        />
                      </TableCell>
                    )}
                    <TableCell rowSpan={rowSpanValue} align="center" sx={{ bgcolor: 'action.hover' }}>
                      <Button
                        onClick={() => onSelectProject(group)}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ textTransform: 'none' }}
                        aria-label={t('viewDetailsForProject').replace('${projectId}', project.projectId)}
                      >
                        {t('view')}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow
                    sx={{
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    {student2 ? (
                      <>
                        <TableCell>{student2.studentId}</TableCell>
                        <TableCell>{student2.gender}</TableCell>
                        <TableCell>{student2.name} {student2.surname}</TableCell>
                        <TableCell>{student2.major}</TableCell>
                      </>
                    ) : (
                      <TableCell colSpan={4}>&nbsp;</TableCell>
                    )}
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default ProjectTable;