import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Stack, IconButton, CircularProgress, Divider, Grid, Paper
} from '@mui/material';
import { Close as XMarkIcon, AutoAwesome as SparklesIcon } from '@mui/icons-material';
import { GrammarCheckResult } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface AiWritingAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    result: GrammarCheckResult | null;
    fileName: string;
    originalText: string;
}

const AiWritingAssistantModal: React.FC<AiWritingAssistantModalProps> = ({ isOpen, onClose, isLoading, result, fileName, originalText }) => {
    const t = useTranslations();

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <SparklesIcon sx={{ fontSize: 24, color: 'secondary.main' }} />
                        <Typography variant="h6" fontWeight="bold">
                            {t('aiWritingAssistant')}
                        </Typography>
                    </Stack>
                    <IconButton onClick={onClose} size="small">
                        <XMarkIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('analyzingDocument')}: <Typography component="span" fontWeight="semibold">{fileName}</Typography>
                </Typography>
                {isLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                        <CircularProgress size={48} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            {t('analyzingDocument')}
                        </Typography>
                    </Box>
                ) : result ? (
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="h6" fontWeight="semibold" sx={{ mb: 1 }}>
                                {t('summaryOfImprovements')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {result.summary}
                            </Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle2" fontWeight="semibold" sx={{ mb: 1 }}>
                                    {t('originalText')}
                                </Typography>
                                <Paper
                                    elevation={1}
                                    sx={{
                                        p: 1.5,
                                        height: 256,
                                        overflowY: 'auto',
                                        bgcolor: 'action.hover',
                                        whiteSpace: 'pre-wrap',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {originalText}
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle2" fontWeight="semibold" sx={{ mb: 1 }}>
                                    {t('suggestedText')}
                                </Typography>
                                <Paper
                                    elevation={1}
                                    sx={{
                                        p: 1.5,
                                        height: 256,
                                        overflowY: 'auto',
                                        bgcolor: 'success.light',
                                        whiteSpace: 'pre-wrap',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {result.correctedText}
                                </Paper>
                            </Grid>
                        </Grid>
                    </Stack>
                ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        {t('couldNotGenerateAnalysis')}
                    </Typography>
                )}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="outlined">
                    {t('closeBtn')}
                </Button>
                <Button onClick={onClose} disabled={!result} variant="contained" color="primary">
                    {t('acceptAndReplace')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AiWritingAssistantModal;
