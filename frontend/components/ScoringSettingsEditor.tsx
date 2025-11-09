
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Grid, Stack, Alert, Divider
} from '@mui/material';
import { Add as PlusIcon, Delete as TrashIcon, AutoAwesome as SparklesIcon } from '@mui/icons-material';
import { ScoringSettings, ScoringRubricItem, GradeBoundary } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useTranslations } from '../hooks/useTranslations';
import RubricGeneratorModal from './RubricGeneratorModal';

interface ScoringSettingsEditorProps {
    scoringSettings: ScoringSettings;
    updateScoringSettings: (settings: ScoringSettings) => void;
}

interface RubricEditorProps {
    rubrics: ScoringRubricItem[];
    setRubrics: (updater: React.SetStateAction<ScoringRubricItem[]>) => void;
    onGenerate: () => void;
    title: string;
}

const RubricEditor: React.FC<RubricEditorProps> = ({ rubrics, setRubrics, onGenerate, title }) => {
    const t = useTranslations();
    const totalScore = useMemo(() => rubrics.reduce((sum: number, item: ScoringRubricItem) => sum + (Number(item.maxScore) || 0), 0), [rubrics]);

    const handleAdd = () => setRubrics(prev => [...prev, { id: uuidv4(), name: '', maxScore: 10 }]);
    const handleRemove = (id: string) => setRubrics(prev => prev.filter(item => item.id !== id));
    const handleUpdate = (id: string, field: 'name' | 'maxScore', value: string | number) => {
        setRubrics(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    
    return (
        <Paper sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Typography variant="h6" fontWeight="medium">
                    {title} ({t('totalPoints')}: {totalScore})
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                        type="button"
                        onClick={onGenerate}
                        size="small"
                        startIcon={<SparklesIcon />}
                        sx={{ 
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'secondary.main',
                            textTransform: 'none',
                            '&:hover': { color: 'secondary.dark' }
                        }}
                    >
                        {t('generateWithAI')}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleAdd}
                        size="small"
                        startIcon={<PlusIcon />}
                        color="primary"
                        sx={{ textTransform: 'none' }}
                    >
                        {t('addItem')}
                    </Button>
                </Stack>
            </Box>
            <Stack spacing={1.5} sx={{ maxHeight: 240, overflowY: 'auto', pr: 1 }}>
                {rubrics.map(item => (
                    <Grid container spacing={1} alignItems="center" key={item.id}>
                        <Grid size={{ xs: 7 }}>
                            <TextField
                                type="text"
                                size="small"
                                fullWidth
                                value={item.name}
                                onChange={e => handleUpdate(item.id, 'name', e.target.value)}
                                placeholder="Criterion Name"
                            />
                        </Grid>
                        <Grid size={{ xs: 3 }}>
                            <TextField
                                type="number"
                                size="small"
                                fullWidth
                                value={item.maxScore}
                                onChange={e => handleUpdate(item.id, 'maxScore', Number(e.target.value))}
                                inputProps={{ min: 1 }}
                            />
                        </Grid>
                        <Grid size={{ xs: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <IconButton
                                    type="button"
                                    onClick={() => handleRemove(item.id)}
                                    size="small"
                                    color="error"
                                    aria-label="Remove item"
                                >
                                    <TrashIcon />
                                </IconButton>
                            </Box>
                        </Grid>
                    </Grid>
                ))}
            </Stack>
        </Paper>
    );
};


export const ScoringSettingsEditor: React.FC<ScoringSettingsEditorProps> = ({ scoringSettings, updateScoringSettings }) => {
    const [localAdvisorRubrics, setLocalAdvisorRubrics] = useState<ScoringRubricItem[]>(scoringSettings.advisorRubrics);
    const [localCommitteeRubrics, setLocalCommitteeRubrics] = useState<ScoringRubricItem[]>(scoringSettings.committeeRubrics);
    const [gradeBoundaries, setGradeBoundaries] = useState<GradeBoundary[]>(scoringSettings.gradeBoundaries);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [generatorType, setGeneratorType] = useState<'advisor' | 'committee'>('advisor');
    const t = useTranslations();

    useEffect(() => {
        setLocalAdvisorRubrics(scoringSettings.advisorRubrics);
        setLocalCommitteeRubrics(scoringSettings.committeeRubrics);
        setGradeBoundaries(scoringSettings.gradeBoundaries);
    }, [scoringSettings]);

    const totalAdvisorScore = useMemo(() => localAdvisorRubrics.reduce((sum, item) => sum + (Number(item.maxScore) || 0), 0), [localAdvisorRubrics]);
    const totalCommitteeScore = useMemo(() => localCommitteeRubrics.reduce((sum, item) => sum + (Number(item.maxScore) || 0), 0), [localCommitteeRubrics]);
    
    const handleBoundaryChange = (index: number, field: 'grade' | 'minScore', value: string | number) => {
        const newBoundaries = [...gradeBoundaries];
        (newBoundaries[index] as any)[field] = value;
        setGradeBoundaries(newBoundaries);
    };

    const handleAddBoundary = () => {
        setGradeBoundaries([...gradeBoundaries, { grade: '', minScore: 0 }]);
    };

    const handleRemoveBoundary = (indexToRemove: number) => {
        setGradeBoundaries(gradeBoundaries.filter((_, index) => index !== indexToRemove));
    };

    const validateAndSave = () => {
        const newErrors: Record<string, string> = {};
        const totalPoints = totalAdvisorScore + totalCommitteeScore;
        if (totalPoints !== 100) {
            newErrors.total = t('totalPointsMustBe').replace('{total}', '100').replace('{current}', String(totalPoints));
        }

        const scoreSet = new Set();
        gradeBoundaries.forEach((boundary, index) => {
            if (scoreSet.has(boundary.minScore)) {
                newErrors[`boundary_${index}`] = t('duplicateMinScoreError').replace('{score}', String(boundary.minScore));
            }
            scoreSet.add(boundary.minScore);
            if (boundary.minScore < 0 || boundary.minScore > 100) {
                 newErrors[`boundary_${index}`] = t('gradeScoreError').replace('{grade}', boundary.grade);
            }
        });

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            const sortedBoundaries = [...gradeBoundaries].sort((a, b) => b.minScore - a.minScore);
            updateScoringSettings({
                ...scoringSettings,
                advisorRubrics: localAdvisorRubrics,
                committeeRubrics: localCommitteeRubrics,
                gradeBoundaries: sortedBoundaries,
            });
        }
    };

    const openGenerator = (type: 'advisor' | 'committee') => {
        setGeneratorType(type);
        setIsGeneratorOpen(true);
    };

    const handleGeneratedRubric = (newRubrics: ScoringRubricItem[]) => {
        if (generatorType === 'advisor') {
            setLocalAdvisorRubrics(newRubrics);
        } else {
            setLocalCommitteeRubrics(newRubrics);
        }
        setIsGeneratorOpen(false);
    };

    return (
        <Stack spacing={3}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Stack spacing={3}>
                    <RubricEditor title={t('advisorRubric')} rubrics={localAdvisorRubrics} setRubrics={setLocalAdvisorRubrics} onGenerate={() => openGenerator('advisor')} />
                    <RubricEditor title={t('committeeRubric')} rubrics={localCommitteeRubrics} setRubrics={setLocalCommitteeRubrics} onGenerate={() => openGenerator('committee')} />
                    {errors.total && (
                        <Alert severity="error" sx={{ fontWeight: 600 }}>
                            {errors.total}
                        </Alert>
                    )}
                </Stack>
            </Paper>

            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                        {t('gradeBoundaries')}
                    </Typography>
                    <Button
                        type="button"
                        onClick={handleAddBoundary}
                        size="small"
                        startIcon={<PlusIcon />}
                        color="primary"
                        sx={{ textTransform: 'none' }}
                    >
                        {t('addItem')}
                    </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('gradeBoundariesDescription')}
                </Typography>
                <Stack spacing={1.5}>
                    {gradeBoundaries.map((boundary, index) => (
                        <Box key={index}>
                            <Grid container spacing={1} alignItems="flex-start">
                                <Grid size={{ xs: 5 }}>
                                    <TextField
                                        type="text"
                                        size="small"
                                        fullWidth
                                        value={boundary.grade}
                                        onChange={e => handleBoundaryChange(index, 'grade', e.target.value)}
                                        placeholder="Grade"
                                    />
                                </Grid>
                                <Grid size={{ xs: 5 }}>
                                    <TextField
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={boundary.minScore}
                                        onChange={e => handleBoundaryChange(index, 'minScore', Number(e.target.value))}
                                        placeholder="Min Score"
                                    />
                                </Grid>
                                <Grid size={{ xs: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', pt: 0.5 }}>
                                        <IconButton
                                            type="button"
                                            onClick={() => handleRemoveBoundary(index)}
                                            size="small"
                                            color="error"
                                        >
                                            <TrashIcon />
                                        </IconButton>
                                    </Box>
                                </Grid>
                            </Grid>
                            {errors[`boundary_${index}`] && (
                                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                                    {errors[`boundary_${index}`]}
                                </Typography>
                            )}
                        </Box>
                    ))}
                </Stack>
            </Paper>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    onClick={validateAndSave}
                    sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                >
                    {t('saveSettings')}
                </Button>
            </Box>
            {isGeneratorOpen && (
                <RubricGeneratorModal 
                    rubricType={generatorType}
                    targetScore={generatorType === 'advisor' ? totalAdvisorScore : totalCommitteeScore}
                    onClose={() => setIsGeneratorOpen(false)}
                    onSave={handleGeneratedRubric}
                />
            )}
        </Stack>
    );
};
