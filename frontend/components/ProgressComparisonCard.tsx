import React from 'react';
import {
  Paper, Typography, Box, LinearProgress
} from '@mui/material';
import { PieChart as ChartPieIcon } from '@mui/icons-material';
import { useTranslations } from '../hooks/useTranslations';

interface ProgressComparisonCardProps {
    userProgress: number;
    majorAverageProgress: number | null;
}

const ProgressBar: React.FC<{ progress: number; label: string; color: 'primary' | 'success' | 'warning' | 'error' | 'info' }> = ({ progress, label, color }) => (
    <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
            <Typography variant="body2" fontWeight="medium">
                {label}
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={`${color}.main`}>
                {progress.toFixed(1)}%
            </Typography>
        </Box>
        <LinearProgress 
            variant="determinate" 
            value={Math.min(progress, 100)} 
            color={color}
            sx={{ height: 10, borderRadius: 1 }}
        />
    </Box>
);


const ProgressComparisonCard: React.FC<ProgressComparisonCardProps> = ({ userProgress, majorAverageProgress }) => {
    const t = useTranslations();

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ChartPieIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="medium">
                    {t('progressComparison')}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <ProgressBar progress={userProgress} label={t('yourProgress')} color="primary" />
                {majorAverageProgress !== null ? (
                    <ProgressBar progress={majorAverageProgress} label={t('majorAverage')} color="success" />
                ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', pt: 1 }}>
                        {t('noDataForMajorComparison')}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

export default ProgressComparisonCard;