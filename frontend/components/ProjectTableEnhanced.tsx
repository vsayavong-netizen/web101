import React, { useMemo, useState } from 'react';
import { GridColDef } from '@mui/x-data-grid';
import {
  Box, Paper, Grid, Typography, Chip, Tooltip, Button,
  useTheme, useMediaQuery
} from '@mui/material';
import { Warning as ExclamationTriangleIcon, AutoAwesome as SparklesIcon } from '@mui/icons-material';
import { EnhancedDataGrid } from './EnhancedDataGrid';
import { TableSkeleton } from './LoadingSkeletons';
import { ProjectGroup, ProjectStatus, User, ScoringSettings, ProjectHealthStatus, Role } from '../types';
import EmptyState from './EmptyState';
import ProjectCard from './ProjectCard';
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

interface ProjectTableEnhancedProps {
  user: User;
  effectiveRole?: Role;
  projectGroups: ProjectGroup[];
  onSelectProject: (group: ProjectGroup) => void;
  onRegisterClick: () => void;
  onUpdateStatus: (projectId: string, status: ProjectStatus) => void;
  updateDetailedScore?: (projectId: string, evaluatorId: string, scores: Record<string, number>) => void;
  addToast?: (toast: Omit<ToastMessage, 'id'>) => void;
  scoringSettings?: ScoringSettings;
  projectHealth?: Record<string, ProjectHealthStatus>;
  onOpenAiAssistant?: () => void;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  onSelectAll?: () => void;
  loading?: boolean;
}

const ProjectTableEnhanced: React.FC<ProjectTableEnhancedProps> = ({
  user,
  effectiveRole,
  projectGroups,
  onSelectProject,
  onRegisterClick,
  onUpdateStatus,
  updateDetailedScore,
  addToast,
  scoringSettings,
  projectHealth,
  onOpenAiAssistant,
  selectedIds,
  onSelect,
  onSelectAll,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const t = useTranslations();
  
  const isSelectable = effectiveRole && ['Admin', 'DepartmentAdmin', 'Advisor'].includes(effectiveRole) && onSelect && onSelectAll && selectedIds;
  
  const maxAdvisorScore = useMemo(() => {
    if (!scoringSettings) return 100;
    return scoringSettings.advisorRubrics.reduce((sum, rubric) => sum + rubric.maxScore, 0);
  }, [scoringSettings]);

  const getHealthColor = (health: string): 'success' | 'warning' | 'error' => {
    if (health === 'On Track') return 'success';
    if (health === 'Needs Attention') return 'warning';
    if (health === 'At Risk') return 'error';
    return 'success';
  };

  // Flatten project groups for DataGrid (one row per project, not per student)
  const flattenedRows = useMemo(() => {
    return projectGroups.map((group) => ({
      id: group.project.projectId,
      projectGroup: group,
      projectId: group.project.projectId,
      topicLao: group.project.topicLao,
      topicEng: group.project.topicEng,
      advisorName: group.project.advisorName,
      status: group.project.status,
      students: group.students,
      student1: group.students[0],
      student2: group.students[1] || null,
      similarityInfo: group.project.similarityInfo,
      healthStatus: projectHealth?.[group.project.projectId],
      defenseDate: group.project.defenseDate,
      defenseTime: group.project.defenseTime,
      defenseRoom: group.project.defenseRoom,
      mainAdvisorScore: group.project.mainAdvisorScore,
    }));
  }, [projectGroups, projectHealth]);

  const columns: GridColDef[] = useMemo(() => {
    const baseColumns: GridColDef[] = [
      {
        field: 'projectId',
        headerName: t('projectId') || 'Project ID',
        width: 120,
        renderCell: (params) => (
          <Typography variant="body2" fontWeight="medium" color="primary">
            {params.row.projectId}
          </Typography>
        ),
      },
      {
        field: 'student1',
        headerName: t('studentId') || 'Student ID',
        width: 120,
        renderCell: (params) => (
          <Box>
            <Typography variant="body2">{params.row.student1?.studentId || '-'}</Typography>
            {params.row.student2 && (
              <Typography variant="caption" color="text.secondary">
                {params.row.student2.studentId}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'students',
        headerName: t('name') || 'Name',
        width: 200,
        renderCell: (params) => (
          <Box>
            {params.row.students.map((student: any, index: number) => (
              <Typography key={index} variant="body2">
                {student.name} {student.surname}
              </Typography>
            ))}
          </Box>
        ),
      },
      {
        field: 'topicLao',
        headerName: t('topicLao') || 'Topic (Lao)',
        width: 250,
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" noWrap title={params.row.topicLao}>
            {params.row.topicLao}
          </Typography>
        ),
      },
      {
        field: 'topicEng',
        headerName: t('topicEng') || 'Topic (English)',
        width: 250,
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" noWrap title={params.row.topicEng}>
            {params.row.topicEng}
          </Typography>
        ),
      },
      {
        field: 'advisorName',
        headerName: t('advisor') || 'Advisor',
        width: 150,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                mr: 1,
                bgcolor: getAdvisorColor(params.row.advisorName),
              }}
            />
            <Typography variant="body2">{params.row.advisorName}</Typography>
          </Box>
        ),
      },
      {
        field: 'status',
        headerName: t('status') || 'Status',
        width: 150,
        renderCell: (params) => (
          <StatusBadge
            project={params.row.projectGroup.project}
            user={user}
            onUpdateStatus={onUpdateStatus}
          />
        ),
      },
    ];

    if (projectHealth && onOpenAiAssistant) {
      baseColumns.push({
        field: 'health',
        headerName: t('health') || 'Health',
        width: 150,
        renderCell: (params) => {
          const healthStatus = params.row.healthStatus;
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
        },
      });
    }

    if (scoringSettings && updateDetailedScore && addToast) {
      baseColumns.push({
        field: 'advisorScore',
        headerName: `${t('advisorScore')} (/${maxAdvisorScore})`,
        width: 150,
        renderCell: (params) => (
          <ScoreEntryCell
            projectGroup={params.row.projectGroup}
            user={user}
            scoringSettings={scoringSettings}
            updateDetailedScore={updateDetailedScore}
            addToast={addToast}
          />
        ),
      });
    }

    baseColumns.push({
      field: 'defenseSchedule',
      headerName: t('defenseSchedule') || 'Defense Schedule',
      width: 180,
      renderCell: (params) => (
        <Box>
          {params.row.defenseDate ? (
            <>
              <Typography variant="caption" fontWeight="medium" display="block">
                {params.row.defenseDate}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {params.row.defenseTime} {t('inRoom')} {params.row.defenseRoom}
              </Typography>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">
              {t('notScheduled')}
            </Typography>
          )}
        </Box>
      ),
    });

    if (flattenedRows.some((row) => row.similarityInfo)) {
      baseColumns.push({
        field: 'similarity',
        headerName: t('similarity') || 'Similarity',
        width: 120,
        renderCell: (params) => {
          if (params.row.similarityInfo) {
            return (
              <Tooltip
                title={
                  <Box>
                    <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
                      {t('potentialOverlap')}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {t('similarTo')} <strong>{params.row.similarityInfo.similarProjectId}</strong>
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      {t('reason')}: {params.row.similarityInfo.reason}
                    </Typography>
                  </Box>
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'warning.main' }}>
                  <ExclamationTriangleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="caption" fontWeight="medium">
                    {params.row.similarityInfo.similarityPercentage}%
                  </Typography>
                </Box>
              </Tooltip>
            );
          }
          return null;
        },
      });
    }

    return baseColumns;
  }, [
    t,
    user,
    onUpdateStatus,
    projectHealth,
    onOpenAiAssistant,
    scoringSettings,
    updateDetailedScore,
    addToast,
    maxAdvisorScore,
    flattenedRows,
  ]);

  const handleSelectionChange = (selectedIds: string[]) => {
    // Sync with parent component if callbacks are provided
    if (onSelect && selectedIds) {
      // Get currently selected IDs from parent
      const currentSelected = Array.from(selectedIds || []);
      
      // Find newly selected items
      const newlySelected = selectedIds.filter(id => !currentSelected.includes(id));
      newlySelected.forEach(id => onSelect(id));
      
      // Find deselected items (would need onDeselect callback, but for now just track)
      // Note: DataGrid manages its own selection state, this is just for syncing
    }
  };

  if (loading) {
    return <TableSkeleton rows={10} columns={8} />;
  }

  if (!projectGroups || projectGroups.length === 0) {
    return (
      <Paper elevation={3} sx={{ textAlign: 'center', py: 5 }}>
        <EmptyState user={user} onRegisterClick={onRegisterClick} />
      </Paper>
    );
  }

  // Mobile: Use card view
  if (isMobile) {
    return (
      <Grid container spacing={2}>
        {projectGroups.map((group) => (
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
              isSelected={isSelectable ? selectedIds?.has(group.project.projectId) : undefined}
              onSelect={isSelectable ? () => onSelect?.(group.project.projectId) : undefined}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  // Desktop: Use EnhancedDataGrid
  return (
    <EnhancedDataGrid
      rows={flattenedRows}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(row) => onSelectProject(row.projectGroup)}
      loading={loading}
      title={t('projects') || 'Projects'}
      height={600}
      pageSize={25}
      pageSizeOptions={[10, 25, 50, 100]}
      checkboxSelection={isSelectable}
      onSelectionChange={isSelectable ? handleSelectionChange : undefined}
      enableFiltering
      enableSorting
      enableExport
      emptyMessage={t('noProjectsFound') || 'No projects found'}
    />
  );
};

export default ProjectTableEnhanced;

