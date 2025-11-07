import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, Box, Typography, Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ScoringRubricItem } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface ScoreEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (scores: Record<string, number>) => void;
    rubric: ScoringRubricItem[];
    initialScores: Record<string, number>;
    evaluatorName: string;
    maxTotalScore: number;
}

const ScoreEntryModal: React.FC<ScoreEntryModalProps> = ({ isOpen, onClose, onSave, rubric, initialScores, evaluatorName, maxTotalScore }) => {
    const [scores, setScores] = useState<Record<string, number>>(initialScores);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const t = useTranslations();

    useEffect(() => {
        setScores(initialScores);
    }, [initialScores, isOpen]);

    const totalScore = useMemo(() => {
        return rubric.reduce((sum, item) => sum + (scores[item.id] || 0), 0);
    }, [scores, rubric]);
    
    const handleScoreChange = (rubricId: string, value: string, maxScore: number) => {
        const numValue = Number(value);
        setScores(prev => ({ ...prev, [rubricId]: numValue }));

        if (numValue < 0 || numValue > maxScore) {
            setErrors(prev => ({ ...prev, [rubricId]: t('scoreBoundaryError').replace('{max}', String(maxScore)) }));
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[rubricId];
                return newErrors;
            });
        }
    };
    
    const handleSubmit = () => {
        if (Object.keys(errors).length > 0) return;
        
        // Ensure all fields have a value (default to 0 if empty)
        const finalScores: Record<string, number> = {};
        rubric.forEach(item => {
            finalScores[item.id] = scores[item.id] || 0;
        });

        onSave(finalScores);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 2 }}>
                <Box>
                    <Box component="span" sx={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'block' }}>
                        {t('enterScore')}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {t('forEvaluator').replace('{name}', evaluatorName)}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
                {rubric.map(item => (
                    <Box key={item.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                                {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('maxScoreLabel')}: {item.maxScore}
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            type="number"
                            id={`score-${item.id}`}
                            value={scores[item.id] ?? ''}
                            onChange={(e) => handleScoreChange(item.id, e.target.value, item.maxScore)}
                            inputProps={{ min: 0, max: item.maxScore }}
                            error={!!errors[item.id]}
                            helperText={errors[item.id]}
                            size="small"
                        />
                    </Box>
                ))}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                <Typography variant="body1">
                    <Typography component="span" color="text.secondary">{t('total')}: </Typography>
                    <Typography component="span" fontWeight="bold">{totalScore.toFixed(2)} / {maxTotalScore}</Typography>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={onClose} variant="outlined">
                        {t('cancel')}
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        disabled={Object.keys(errors).length > 0}
                    >
                        {t('saveScore')}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default ScoreEntryModal;