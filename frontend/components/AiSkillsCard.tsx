import React from 'react';
import {
  Paper, Typography, Box, Button, List, ListItem, CircularProgress
} from '@mui/material';
import { AutoAwesome as SparklesIcon, Assignment as ClipboardDocumentListIcon } from '@mui/icons-material';
import { StudentSkillsAnalysis } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface AiSkillsCardProps {
    skillsAnalysis: StudentSkillsAnalysis | null;
    isAnalyzing: boolean;
    onAnalyze: () => void;
}

const AiSkillsCard: React.FC<AiSkillsCardProps> = ({ skillsAnalysis, isAnalyzing, onAnalyze }) => {
    const t = useTranslations();

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ClipboardDocumentListIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="medium">
                    {t('aiSkillsAnalysis')}
                </Typography>
            </Box>
            
            {!skillsAnalysis && (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('aiSkillsAnalysisDescription')}
                    </Typography>
                    <Button
                        onClick={onAnalyze}
                        disabled={isAnalyzing}
                        variant="contained"
                        color="secondary"
                        startIcon={isAnalyzing ? <CircularProgress size={16} color="inherit" /> : <SparklesIcon />}
                        sx={{ textTransform: 'none' }}
                    >
                        {isAnalyzing ? t('analyzing') : t('analyzeMySkills')}
                    </Button>
                </Box>
            )}
            
            {skillsAnalysis && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography variant="body2" fontStyle="italic" color="text.secondary">
                        {skillsAnalysis.summary}
                    </Typography>
                    <List>
                        {skillsAnalysis.skills.map(s => (
                            <ListItem
                                key={s.skill}
                                sx={{
                                    bgcolor: 'action.hover',
                                    borderRadius: 1,
                                    mb: 0.5,
                                    flexDirection: 'column',
                                    alignItems: 'flex-start'
                                }}
                            >
                                <Typography variant="body2">
                                    <Box component="strong" fontWeight="medium">{s.skill}:</Box> {s.justification}
                                </Typography>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
        </Paper>
    );
};

export default AiSkillsCard;