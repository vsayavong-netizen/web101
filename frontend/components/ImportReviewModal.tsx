import React, { useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, IconButton, Box, Typography, Divider, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslations } from '../hooks/useTranslations';

interface ImportReviewModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (validData: T[]) => void;
  data: (T & { _status: 'new' | 'update' | 'error'; _error?: string })[];
  columns: { key: keyof T | '_status' | '_error'; header: string }[];
  dataTypeName: string;
}

const getStatusChipProps = (status: 'new' | 'update' | 'error') => {
    switch (status) {
        case 'new':
            return { color: 'success' as const, label: 'New' };
        case 'update':
            return { color: 'primary' as const, label: 'Update' };
        case 'error':
            return { color: 'error' as const, label: 'Error' };
    }
};

function ImportReviewModal<T extends object>({ isOpen, onClose, onConfirm, data, columns, dataTypeName }: ImportReviewModalProps<T>) {
  const t = useTranslations();
  const { validData, errorData, newCount, updateCount } = useMemo(() => {
    const valid: T[] = [];
    const errors: (T & { _status: 'error'; _error?: string })[] = [];
    let newItems = 0;
    let updatedItems = 0;

    data.forEach(item => {
      if (item._status === 'error') {
        errors.push(item as T & { _status: 'error'; _error?: string });
      } else {
        const cleanItem = { ...item };
        delete (cleanItem as any)._status;
        delete (cleanItem as any)._error;
        valid.push(cleanItem);
        if (item._status === 'new') newItems++;
        if (item._status === 'update') updatedItems++;
      }
    });
    return { validData: valid, errorData: errors, newCount: newItems, updateCount: updatedItems };
  }, [data]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(validData);
  };
  
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
            <Box component="span" sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                Review Imported {dataTypeName}
            </Box>
            <IconButton onClick={onClose} size="small">
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Import Summary
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                    <Typography variant="body2">
                        <Typography component="span" fontWeight="bold" color="success.main">{newCount}</Typography> new {dataTypeName.toLowerCase()} to be added.
                    </Typography>
                    <Typography variant="body2">
                        <Typography component="span" fontWeight="bold" color="primary.main">{updateCount}</Typography> existing {dataTypeName.toLowerCase()} to be updated.
                    </Typography>
                    <Typography variant="body2">
                        <Typography component="span" fontWeight="bold" color="error.main">{errorData.length}</Typography> rows with errors (will be ignored).
                    </Typography>
                </Box>
            </Paper>

            {validData.length > 0 && (
                <Box>
                    <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                        Data to be Imported ({validData.length} rows)
                    </Typography>
                    <TableContainer sx={{ maxHeight: 300, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    {columns.filter(c => c.key !== '_error').map(col => (
                                        <TableCell key={String(col.key)}>{col.header}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.filter(item => item._status !== 'error').map((item, index) => (
                                    <TableRow key={index}>
                                        {columns.filter(c => c.key !== '_error').map(col => (
                                            <TableCell key={String(col.key)}>
                                                {col.key === '_status' ? (
                                                    <Chip {...getStatusChipProps(item._status)} size="small" />
                                                ) : (
                                                    String((item as any)[col.key] ?? '')
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
            
            {errorData.length > 0 && (
                <Box>
                    <Typography variant="subtitle2" fontWeight="medium" color="error.main" gutterBottom>
                        Rows with Errors ({errorData.length} rows)
                    </Typography>
                    <TableContainer sx={{ maxHeight: 300, border: 1, borderColor: 'error.main', borderRadius: 1 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'error.light' }}>
                                    {columns.filter(c => c.key !== '_status').map(col => (
                                        <TableCell key={String(col.key)} sx={{ color: 'error.dark', fontWeight: 'bold' }}>
                                            {col.header}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {errorData.map((item, index) => (
                                    <TableRow key={index} sx={{ bgcolor: 'error.light', opacity: 0.7 }}>
                                        {columns.filter(c => c.key !== '_status').map(col => (
                                            <TableCell key={String(col.key)} sx={{ color: 'error.dark' }}>
                                                {String((item as any)[col.key] ?? '')}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={onClose} variant="outlined">
                {t('cancel')}
            </Button>
            <Button 
                onClick={handleConfirm}
                variant="contained"
                disabled={validData.length === 0}
            >
                {t('confirm')} Import ({validData.length})
            </Button>
        </DialogActions>
    </Dialog>
  );
}

export default ImportReviewModal;
