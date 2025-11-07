import React from 'react';
import {
  Box, Button, Typography, IconButton, Paper
} from '@mui/material';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { useTranslations } from '../hooks/useTranslations';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) => {
  const t = useTranslations();
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        borderTop: 1, 
        borderColor: 'divider',
        px: { xs: 2, sm: 3 },
        py: 2,
        borderRadius: '0 0 4px 4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2
      }}
    >
      <Box sx={{ display: { xs: 'flex', sm: 'none' }, flex: 1, justifyContent: 'space-between', width: '100%' }}>
        <Button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          variant="outlined"
          size="small"
        >
          {t('previous')}
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          variant="outlined"
          size="small"
        >
          {t('next')}
        </Button>
      </Box>
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {t('showing')} <Box component="span" fontWeight="medium">{startItem}</Box> {t('to')} <Box component="span" fontWeight="medium">{endItem}</Box> {t('of')} <Box component="span" fontWeight="medium">{totalItems}</Box> {t('results')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            onClick={handlePrevious}
            disabled={currentPage === 1}
            size="small"
            sx={{ border: 1, borderColor: 'divider', borderRadius: '4px 0 0 4px' }}
            aria-label={t('previous')}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Box
            sx={{
              px: 2,
              py: 1,
              borderTop: 1,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Typography variant="body2" fontWeight="medium">
              {t('page')} {currentPage} / {totalPages}
            </Typography>
          </Box>
          <IconButton
            onClick={handleNext}
            disabled={currentPage === totalPages}
            size="small"
            sx={{ border: 1, borderColor: 'divider', borderRadius: '0 4px 4px 0' }}
            aria-label={t('next')}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default Pagination;