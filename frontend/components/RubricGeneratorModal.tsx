
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, TextField, IconButton, Stack, List, ListItem, Chip, CircularProgress
} from '@mui/material';
import { Close as CloseIcon, AutoAwesome as SparklesIcon } from '@mui/icons-material';
import { ScoringRubricItem } from '../types';
import { useToast } from '../hooks/useToast';
import { GoogleGenAI, Type } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { useTranslations } from '../hooks/useTranslations';

interface RubricGeneratorModalProps {
    rubricType: 'advisor' | 'committee';
    targetScore: number;
    onClose: () => void;
    onSave: (rubrics: ScoringRubricItem[]) => void;
}

const RubricGeneratorModal: React.FC<RubricGeneratorModalProps> = ({ rubricType, targetScore, onClose, onSave }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedRubric, setGeneratedRubric] = useState<ScoringRubricItem[] | null>(null);
    const addToast = useToast();
    const t = useTranslations();

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            addToast({ type: 'error', message: 'Please enter a description for the rubric.' });
            return;
        }
        if (!process.env.API_KEY) {
            addToast({ type: 'error', message: 'AI feature is not configured.' });
            return;
        }
        
        setIsLoading(true);
        setGeneratedRubric(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const apiPrompt = `
                You are an expert academic curriculum designer creating a scoring rubric for a university final project defense.
                The rubric is for the project's ${rubricType}.
                The student's project is in a business-related field. Based on the user's request below, generate a list of 3 to 5 relevant scoring criteria.
                User's Request: "${prompt}"
                For each criterion, provide a "name" and a "maxScore".
                The sum of all "maxScore" values MUST equal exactly ${targetScore}.
                Respond ONLY with a JSON object. The JSON object should have a single key "rubric" which is an array of objects. Each object in the array must have two keys: "name" (string) and "maxScore" (number).
            `;

            const schema = {
                type: Type.OBJECT,
                properties: {
                    rubric: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                maxScore: { type: Type.NUMBER }
                            },
                            required: ['name', 'maxScore']
                        }
                    }
                },
                required: ['rubric']
            };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: apiPrompt,
                config: { responseMimeType: "application/json", responseSchema: schema },
            });

            const result = JSON.parse(response.text);
            const rubricItems = result.rubric.map((item: any) => ({ ...item, id: uuidv4() }));
            
            const total = rubricItems.reduce((sum: number, item: ScoringRubricItem) => sum + item.maxScore, 0);
            if (total !== targetScore) {
                const normalizedRubric = rubricItems.map((item: ScoringRubricItem) => ({
                    ...item,
                    maxScore: Math.round((item.maxScore / total) * targetScore)
                }));
                const normalizedTotal = normalizedRubric.reduce((sum: number, item: ScoringRubricItem) => sum + item.maxScore, 0);
                if (normalizedTotal !== targetScore && normalizedRubric.length > 0) {
                    normalizedRubric[normalizedRubric.length-1].maxScore += (targetScore - normalizedTotal);
                }
                setGeneratedRubric(normalizedRubric);
                addToast({ type: 'info', message: 'AI response was adjusted to meet score requirements.'});
            } else {
                setGeneratedRubric(rubricItems);
                addToast({ type: 'success', message: t('rubricGeneratedSuccess') });
            }

        } catch (error) {
            console.error("AI Rubric Generation failed:", error);
            addToast({ type: 'error', message: t('rubricGenerationFailed') });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (generatedRubric) {
            onSave(generatedRubric);
        }
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <SparklesIcon sx={{ color: 'secondary.main' }} />
                        <Typography variant="h6" fontWeight="bold">
                            {t('aiRubricGenerator')}
                        </Typography>
                    </Stack>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {t('rubricGeneratorDescription').replace('{targetScore}', String(targetScore))}
                        </Typography>
                        <TextField
                            id="rubric-prompt"
                            multiline
                            rows={3}
                            fullWidth
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., focus on research quality, presentation skills, and originality"
                        />
                    </Box>
                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        variant="contained"
                        color="primary"
                        fullWidth
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SparklesIcon />}
                    >
                        {isLoading ? t('generating') : t('generateRubric')}
                    </Button>
                    {generatedRubric && (
                        <Box>
                            <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                                {t('generatedRubricPreview')}
                            </Typography>
                            <List>
                                {generatedRubric.map(item => (
                                    <ListItem
                                        key={item.id}
                                        sx={{
                                            bgcolor: 'action.hover',
                                            borderRadius: 1,
                                            mb: 1,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Typography variant="body2">
                                            {item.name}
                                        </Typography>
                                        <Chip
                                            label={`${item.maxScore} pts`}
                                            size="small"
                                            color="primary"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button onClick={onClose} variant="outlined">
                    {t('cancel')}
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={!generatedRubric}
                    variant="contained"
                    color="primary"
                >
                    {t('acceptAndReplace')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RubricGeneratorModal;
