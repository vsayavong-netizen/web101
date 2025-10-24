import React, { useEffect } from 'react';
import { Alert, AlertTitle, IconButton, Box } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ToastMessage } from '../context/ToastContext';
import { useTranslations } from '../hooks/useTranslations';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const t = useTranslations();
  
  const toastTitles = {
    success: t('success'),
    error: t('error'),
    info: t('information'),
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000); // Auto-dismiss after 4 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, onDismiss]);
  
  const title = toastTitles[toast.type] || toastTitles.info;

  return (
    <Box sx={{ maxWidth: '400px', width: '100%', pointerEvents: 'auto' }}>
      <Alert
        severity={toast.type}
        variant="filled"
        action={
          <IconButton
            aria-label={t('close')}
            color="inherit"
            size="small"
            onClick={() => onDismiss(toast.id)}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{ boxShadow: 3 }}
      >
        <AlertTitle>{title}</AlertTitle>
        {toast.message}
      </Alert>
    </Box>
  );
};

export default Toast;