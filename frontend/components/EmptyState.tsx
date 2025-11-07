import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as PlusIcon, BarChart as ChartBarIcon } from '@mui/icons-material';
import { User } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface EmptyStateProps {
    onRegisterClick: () => void;
    user: User;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onRegisterClick, user }) => {
  const t = useTranslations();
  return (
    <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
      <ChartBarIcon sx={{ mx: 'auto', fontSize: 48, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" fontWeight="medium" gutterBottom>
        {t('noProjectsFound')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {user.role === 'Admin' 
          ? t('getStartedRegister')
          : t('noProjectsToDisplay')}
      </Typography>
      {user.role === 'Admin' && (
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<PlusIcon />}
            onClick={onRegisterClick}
          >
            {t('registerNewProject')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default EmptyState;