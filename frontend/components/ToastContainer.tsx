
import React, { useContext } from 'react';
import { Box, Stack } from '@mui/material';
import { ToastContext } from '../context/ToastContext';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast } = context;

  return (
    <Box
      aria-live="assertive"
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        display: 'flex',
        alignItems: { xs: 'flex-end', sm: 'flex-start' },
        px: 2,
        py: 3,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <Stack
        spacing={2}
        sx={{
          width: '100%',
          alignItems: { xs: 'center', sm: 'flex-end' },
        }}
      >
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </Stack>
    </Box>
  );
};

export default ToastContainer;
