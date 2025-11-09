/**
 * Example: ProjectTable using EnhancedDataGrid
 * This shows how to migrate from the old ProjectTable to EnhancedDataGrid
 */

import React, { useMemo } from 'react';
import { GridColDef } from '@mui/x-data-grid';
import { Chip, Box, Typography } from '@mui/material';
import { EnhancedDataGrid } from '../EnhancedDataGrid';
import { ProjectGroup, ProjectStatus, User } from '../../types';
import StatusBadge from '../StatusBadge';
import { useTranslations } from '../../hooks/useTranslations';

interface ProjectTableWithDataGridProps {
  projectGroups: ProjectGroup[];
  user: User;
  onSelectProject: (group: ProjectGroup) => void;
  onEdit?: (group: ProjectGroup) => void;
  onDelete?: (group: ProjectGroup) => void;
  loading?: boolean;
}

export const ProjectTableWithDataGrid: React.FC<ProjectTableWithDataGridProps> = ({
  projectGroups,
  user,
  onSelectProject,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const t = useTranslations();

  const columns: GridColDef<ProjectGroup>[] = useMemo(
    () => [
      {
        field: 'projectId',
        headerName: t('projectId') || 'Project ID',
        width: 120,
        renderCell: (params) => (
          <Typography variant="body2" fontWeight="medium" color="primary">
            {params.row.project.projectId}
          </Typography>
        ),
      },
      {
        field: 'topicEng',
        headerName: t('topicEng') || 'Topic (English)',
        width: 300,
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" noWrap title={params.row.project.topicEng}>
            {params.row.project.topicEng}
          </Typography>
        ),
      },
      {
        field: 'topicLao',
        headerName: t('topicLao') || 'Topic (Lao)',
        width: 300,
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" noWrap title={params.row.project.topicLao}>
            {params.row.project.topicLao}
          </Typography>
        ),
      },
      {
        field: 'students',
        headerName: t('students') || 'Students',
        width: 200,
        renderCell: (params) => (
          <Box>
            {params.row.students.map((student, index) => (
              <Typography key={index} variant="body2">
                {student.name} {student.surname}
              </Typography>
            ))}
          </Box>
        ),
      },
      {
        field: 'advisorName',
        headerName: t('advisor') || 'Advisor',
        width: 150,
        renderCell: (params) => (
          <Typography variant="body2">{params.row.project.advisorName}</Typography>
        ),
      },
      {
        field: 'status',
        headerName: t('status') || 'Status',
        width: 150,
        renderCell: (params) => (
          <StatusBadge status={params.row.project.status} />
        ),
      },
      {
        field: 'mainAdvisorScore',
        headerName: t('advisorScore') || 'Advisor Score',
        width: 120,
        renderCell: (params) => (
          <Typography variant="body2">
            {params.row.project.mainAdvisorScore !== null
              ? params.row.project.mainAdvisorScore.toFixed(2)
              : t('na') || 'N/A'}
          </Typography>
        ),
      },
    ],
    [t]
  );

  return (
    <EnhancedDataGrid
      rows={projectGroups}
      columns={columns}
      getRowId={(row) => row.project.projectId}
      onRowClick={onSelectProject}
      onEdit={onEdit}
      onDelete={onDelete}
      loading={loading}
      title={t('projects') || 'Projects'}
      height={600}
      pageSize={25}
      pageSizeOptions={[10, 25, 50, 100]}
      checkboxSelection={user.role === 'Admin' || user.role === 'Advisor'}
      enableFiltering
      enableSorting
      enableExport
      emptyMessage={t('noProjectsFound') || 'No projects found'}
    />
  );
};

export default ProjectTableWithDataGrid;

