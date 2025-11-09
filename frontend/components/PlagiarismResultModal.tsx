

import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Stack, IconButton, CircularProgress, Paper, Divider
} from '@mui/material';
import {
  Close as XMarkIcon, Warning as ExclamationTriangleIcon,
  CheckCircle as CheckCircleIcon, Search as MagnifyingGlassIcon
} from '@mui/icons-material';
import { PlagiarismResult } from '../types';
import { useTranslations } from '../hooks/useTranslations';

const ScoreIndicator: React.FC<{ score: number }> = ({ score }) => {
    const t = useTranslations();
    let color: 'success' | 'warning' | 'error' = 'success';
    let Icon = CheckCircleIcon;
    let label = t('lowSimilarity');

    if (score >= 20 && score < 50) {
        color = 'warning';
        Icon = ExclamationTriangleIcon;
        label = t('moderateSimilarity');
    } else if (score >= 50) {
        color = 'error';
        Icon = ExclamationTriangleIcon;
        label = t('highSimilarity');
    }

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                bgcolor: `${color}.light`
            }}
        >
            <Icon sx={{ fontSize: 48, color: `${color}.main` }} />
            <Box>
                <Typography variant="body2" fontWeight="medium" color="text.secondary">
                    {t('overallSimilarityScore')}
                </Typography>
                <Typography variant="h3" fontWeight="bold" color={`${color}.main`}>
                    {score.toFixed(1)}%
                </Typography>
                <Typography variant="body2" fontWeight="semibold" color={`${color}.main`}>
                    {label}
                </Typography>
            </Box>
        </Paper>
    );
};

interface PlagiarismResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: PlagiarismResult | null;
}

const PlagiarismResultModal: React.FC<PlagiarismResultModalProps> = ({ isOpen, onClose, result }) => {
    const t = useTranslations();

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <MagnifyingGlassIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight="bold">
                            {t('aiPlagiarismCheckResults')}
                        </Typography>
                    </Stack>
                    <IconButton onClick={onClose} size="small">
                        <XMarkIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {result ? (
                    <Stack spacing={2}>
                        <ScoreIndicator score={result.overallSimilarityScore} />
                        <Box>
                            <Typography variant="h6" fontWeight="semibold" sx={{ mb: 1 }}>
                                {t('potentialMatches')}
                            </Typography>
                            {result.potentialMatches.length > 0 ? (
                                <Stack spacing={1.5}>
                                    {result.potentialMatches.map((match, index) => (
                                        <Paper key={index} elevation={1} sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                                                <Typography variant="body2" fontWeight="semibold" noWrap sx={{ flexGrow: 1, mr: 2 }}>
                                                    {match.source}
                                                </Typography>
                                                <Typography variant="body2" fontWeight="bold" color="primary.main" sx={{ flexShrink: 0 }}>
                                                    {t('matchPercentage').replace('{percentage}', match.similarity.toFixed(1))}
                                                </Typography>
                                            </Box>
                                            <Box
                                                component="blockquote"
                                                sx={{
                                                    mt: 1,
                                                    pl: 1.5,
                                                    borderLeft: 2,
                                                    borderColor: 'divider',
                                                    fontStyle: 'italic'
                                                }}
                                            >
                                                <Typography variant="body2" color="text.secondary">
                                                    "{match.matchedSnippet}"
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    ))}
                                </Stack>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    {t('noSignificantMatches')}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={48} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            {t('checkingForPlagiarism')}
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained" color="primary">
                    {t('closeBtn')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PlagiarismResultModal;
