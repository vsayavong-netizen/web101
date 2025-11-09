
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Stack, IconButton, CircularProgress, Divider, Grid, Paper, Chip
} from '@mui/material';
import {
  Close as XMarkIcon, AutoAwesome as SparklesIcon, Assignment as ClipboardDocumentListIcon,
  Lightbulb as LightBulbIcon, Favorite as HeartIcon, CheckCircle as CheckCircleIcon,
  Schedule as ClockIcon, Warning as ExclamationTriangleIcon, ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon, SwapHoriz as ArrowsRightLeftIcon, Groups as UserGroupIcon
} from '@mui/icons-material';
import { CommunicationAnalysisResult } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface CommunicationAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: CommunicationAnalysisResult | null;
    isLoading: boolean;
}

const CommunicationAnalysisModal: React.FC<CommunicationAnalysisModalProps> = ({ isOpen, onClose, result, isLoading }) => {
    const t = useTranslations();

    const sentimentConfig = {
        Positive: { icon: <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />, text: t('positive'), color: 'success' as const },
        Neutral: { icon: <ClockIcon sx={{ fontSize: 20, color: 'text.secondary' }} />, text: t('neutral'), color: 'default' as const },
        'Needs Attention': { icon: <ExclamationTriangleIcon sx={{ fontSize: 20, color: 'warning.main' }} />, text: t('needsAttention'), color: 'warning' as const },
    };

    const trendConfig = {
        Improving: { icon: <ArrowUpIcon sx={{ fontSize: 16, color: 'success.main' }} />, text: t('improving') },
        Declining: { icon: <ArrowDownIcon sx={{ fontSize: 16, color: 'error.main' }} />, text: t('declining') },
        Stable: { icon: <ArrowsRightLeftIcon sx={{ fontSize: 16, color: 'text.secondary' }} />, text: t('stable') },
        Mixed: { icon: <ArrowsRightLeftIcon sx={{ fontSize: 16, color: 'secondary.main' }} />, text: t('mixed') },
    };

    const KeyMetric: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; }> = ({ icon, label, value }) => (
        <Paper elevation={1} sx={{ p: 1.5, bgcolor: 'action.hover' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                {icon}
                <Typography variant="caption" fontWeight="semibold" color="text.secondary">
                    {label}
                </Typography>
            </Stack>
            <Typography variant="body2" fontWeight="bold">
                {value}
            </Typography>
        </Paper>
    );

    const sentiment = result ? sentimentConfig[result.sentiment] || sentimentConfig.Neutral : sentimentConfig.Neutral;
    const trend = result ? trendConfig[result.sentimentTrend] || trendConfig.Stable : trendConfig.Stable;

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <SparklesIcon sx={{ fontSize: 28, color: 'secondary.main' }} />
                        <Typography variant="h6" fontWeight="bold">
                            {t('aiCommunicationAnalysis')}
                        </Typography>
                    </Stack>
                    <IconButton onClick={onClose} size="small">
                        <XMarkIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={48} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            {t('analyzingLog')}
                        </Typography>
                    </Box>
                ) : result ? (
                    <Stack spacing={3}>
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <ClipboardDocumentListIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                <Typography variant="h6" fontWeight="semibold">
                                    {t('executiveSummary')}
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                {result.summary}
                            </Typography>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6, lg: 4 }}>
                                <KeyMetric
                                    icon={<HeartIcon sx={{ fontSize: 20, color: 'secondary.main' }} />}
                                    label={t('overallSentiment')}
                                    value={
                                        <Chip
                                            icon={sentiment.icon}
                                            label={sentiment.text}
                                            size="small"
                                            color={sentiment.color}
                                            sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                                        />
                                    }
                                />
                            </Grid>
                            <Grid size={{ xs: 6, lg: 4 }}>
                                <KeyMetric icon={trend.icon} label={t('sentimentTrend')} value={trend.text} />
                            </Grid>
                            <Grid size={{ xs: 6, lg: 4 }}>
                                <KeyMetric icon={<ClockIcon sx={{ fontSize: 20, color: 'info.main' }} />} label={t('responseTime')} value={result.responseTime} />
                            </Grid>
                            <Grid size={{ xs: 6, lg: 4 }}>
                                <KeyMetric icon={<LightBulbIcon sx={{ fontSize: 20, color: 'warning.main' }} />} label={t('advisorFeedback')} value={result.feedbackClarity} />
                            </Grid>
                            <Grid size={{ xs: 6, lg: 4 }}>
                                <KeyMetric icon={<UserGroupIcon sx={{ fontSize: 20, color: 'info.main' }} />} label={t('studentEngagement')} value={result.studentEngagement} />
                            </Grid>
                        </Grid>

                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
                                <Typography variant="h6" fontWeight="semibold">
                                    {t('actionItems')}
                                </Typography>
                            </Stack>
                            {result.actionItems.length > 0 ? (
                                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                    {result.actionItems.map((item, index) => (
                                        <Typography key={index} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                            {item}
                                        </Typography>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    {t('noActionItems')}
                                </Typography>
                            )}
                        </Box>

                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <ExclamationTriangleIcon sx={{ fontSize: 20, color: 'error.main' }} />
                                <Typography variant="h6" fontWeight="semibold">
                                    {t('potentialIssues')}
                                </Typography>
                            </Stack>
                            {result.potentialIssues.length > 0 ? (
                                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                    {result.potentialIssues.map((item, index) => (
                                        <Typography key={index} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                            {item}
                                        </Typography>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    {t('noIssuesDetected')}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        {t('couldNotGenerateAnalysis')}
                    </Typography>
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

export default CommunicationAnalysisModal;
