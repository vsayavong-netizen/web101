import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Paper,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  AutoAwesome as SparklesIcon,
  Lightbulb as LightBulbIcon,
} from '@mui/icons-material';
import { useToast } from '../hooks/useToast';
import { GoogleGenAI, Type } from "@google/genai";
import { Major, Student } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface TopicSuggesterModalProps {
    onClose: () => void;
    onSelectTopic: (topic: { lao: string; eng: string }) => void;
    student: Student;
    majors: Major[];
}

interface SuggestedTopic {
    topicEng: string;
    topicLao: string;
}

const TopicSuggesterModal: React.FC<TopicSuggesterModalProps> = ({ 
  onClose, 
  onSelectTopic, 
  student, 
  majors 
}) => {
    const [interest, setInterest] = useState('');
    const [suggestions, setSuggestions] = useState<SuggestedTopic[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const addToast = useToast();
    const t = useTranslations();

    const studentMajor = useMemo(() => {
        return majors.find(m => m.name === student.major);
    }, [student, majors]);

    const handleGenerate = async () => {
        if (!interest.trim()) {
            addToast({ type: 'error', message: t('interestRequiredError') });
            return;
        }
        if (!process.env.API_KEY) {
            addToast({ type: 'error', message: t('aiFeatureNotConfigured') });
            return;
        }
        
        setIsLoading(true);
        setSuggestions([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                You are an academic advisor for a university in Laos. A student from the '${studentMajor?.name || 'Business'}' major is looking for a final project topic.
                Their area of interest is: "${interest}".

                Please generate 5 distinct, specific, and academic-style final project topics relevant to their major and interest.
                For each topic, provide both an English version and a professional Lao translation.

                Respond ONLY with a JSON object containing a single key "topics" which is an array of objects. Each object in the array must have two string keys: "topicEng" and "topicLao".
            `;
            const schema = {
                type: Type.OBJECT,
                properties: {
                    topics: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                topicEng: { type: Type.STRING },
                                topicLao: { type: Type.STRING }
                            },
                            required: ['topicEng', 'topicLao']
                        }
                    }
                },
                required: ['topics']
            };
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: schema },
            });
            
            const result = JSON.parse(response.text);
            setSuggestions(result.topics);
            addToast({ type: 'success', message: t('topicIdeasSuccess') });

        } catch (error) {
            console.error("AI topic suggestion failed:", error);
            addToast({ type: 'error', message: t('topicGenerationError') });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSelect = (topic: SuggestedTopic) => {
        onSelectTopic({ lao: topic.topicLao, eng: topic.topicEng });
    };

    return (
        <Dialog
            open={true}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { maxHeight: '90vh' }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <LightBulbIcon sx={{ fontSize: 28, color: 'warning.main' }} />
                        <Typography variant="h5" fontWeight="bold">
                            {t('aiTopicSuggester')}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={3}>
                    <Typography variant="body2" color="text.secondary">
                        {t('topicSuggesterDescription').replace('{majorName}', studentMajor?.name || 'Business')}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                        <TextField
                            fullWidth
                            value={interest}
                            onChange={(e) => setInterest(e.target.value)}
                            placeholder={t('topicSuggesterPlaceholder')}
                            size="small"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !isLoading) {
                                    handleGenerate();
                                }
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleGenerate}
                            disabled={isLoading}
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SparklesIcon />}
                            sx={{ minWidth: 120 }}
                        >
                            {t('generate')}
                        </Button>
                    </Stack>

                    {suggestions.length > 0 && (
                        <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                            {suggestions.map((topic, index) => (
                                <ListItem
                                    key={index}
                                    component={Paper}
                                    elevation={1}
                                    sx={{
                                        mb: 2,
                                        flexDirection: 'column',
                                        alignItems: 'stretch',
                                        p: 2,
                                        '&:hover': {
                                            bgcolor: 'action.hover'
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {topic.topicEng}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                {topic.topicLao}
                                            </Typography>
                                        }
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Button
                                            size="small"
                                            onClick={() => handleSelect(topic)}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            {t('useThisTopic')}
                                        </Button>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default TopicSuggesterModal;
