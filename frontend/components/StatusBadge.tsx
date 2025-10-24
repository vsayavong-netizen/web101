import React, { useState, useEffect, useRef } from 'react';
import { Chip, Menu, MenuItem, Box } from '@mui/material';
import { CheckCircle as CheckCircleIcon, Cancel as XCircleIcon } from '@mui/icons-material';
import { ProjectStatus, User, Project } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface StatusBadgeProps {
  project: Project;
  user: User;
  onUpdateStatus: (projectId: string, status: ProjectStatus) => void;
}

const getStatusColor = (status: ProjectStatus): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
        case ProjectStatus.Approved:
            return 'success';
        case ProjectStatus.Pending:
            return 'warning';
        case ProjectStatus.Rejected:
            return 'error';
        default:
            return 'default';
    }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ project, user, onUpdateStatus }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { status, projectId, advisorName } = project;
  const t = useTranslations();

  const canUpdate = (status === ProjectStatus.Pending) && 
    ((user.role === 'Advisor' && user.name === advisorName) || 
     (user.role === 'Admin' || user.role === 'DepartmentAdmin'));

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (canUpdate) {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (newStatus: ProjectStatus) => {
    onUpdateStatus(projectId, newStatus);
    handleClose();
  };

  return (
    <Box sx={{ display: 'inline-block' }}>
      <Chip
        label={status}
        color={getStatusColor(status)}
        size="small"
        onClick={canUpdate ? handleClick : undefined}
        sx={{
          cursor: canUpdate ? 'pointer' : 'default',
          '&:hover': canUpdate ? {
            boxShadow: 2,
          } : {}
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleStatusChange(ProjectStatus.Approved)}>
          <CheckCircleIcon sx={{ mr: 1, color: 'success.main', fontSize: 20 }} />
          {t('approve')}
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(ProjectStatus.Rejected)}>
          <XCircleIcon sx={{ mr: 1, color: 'error.main', fontSize: 20 }} />
          {t('reject')}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default StatusBadge;
