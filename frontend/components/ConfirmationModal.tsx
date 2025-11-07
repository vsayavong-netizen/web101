import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Avatar
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useTranslations } from '../hooks/useTranslations';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    confirmText,
    confirmButtonClass
}) => {
  const t = useTranslations();
  
  const getButtonColor = (): 'error' | 'warning' | 'primary' => {
    if (confirmButtonClass?.includes('red')) return 'error';
    if (confirmButtonClass?.includes('orange')) return 'warning';
    return 'primary';
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'error.light', color: 'error.main' }}>
            <WarningIcon />
          </Avatar>
          <Typography variant="h6" component="span" fontWeight="bold">
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          {t('cancel')}
        </Button>
        <Button onClick={onConfirm} variant="contained" color={getButtonColor()}>
          {confirmText || t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;