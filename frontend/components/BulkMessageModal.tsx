import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, Box, Typography, Divider,
  List, ListItem, ListItemText, CircularProgress
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Send as PaperAirplaneIcon, 
  AutoAwesome as SparklesIcon 
} from '@mui/icons-material';
import { ProjectGroup, User } from '../types';
import { GoogleGenAI } from "@google/genai";
import { useToast } from '../hooks/useToast';
import { useTranslations } from '../hooks/useTranslations';

interface BulkMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (message: string) => void;
    selectedProjects: ProjectGroup[];
    user: User;
}

const BulkMessageModal: React.FC<BulkMessageModalProps> = ({ isOpen, onClose, onSend, selectedProjects, user }) => {
    const [message, setMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const addToast = useToast();
    const t = useTranslations();

    if (!isOpen) return null;

    const handleGenerateMessage = async (templateType: 'overdue' | 'reminder') => {
        setIsGenerating(true);
        try {
            if (!process.env.API_KEY) throw new Error("API key not configured.");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            let promptAction;
            if (templateType === 'overdue') {
                promptAction = 'The students have missed a deadline. The message should be a firm but supportive reminder to submit their work and contact the advisor.';
            } else {
                promptAction = 'The students have an upcoming deadline. The message should be a friendly reminder to prepare their submission.';
            }

            const prompt = `
              You are an academic advisor named ${user.name}. Draft a concise and professional message to be sent to multiple student groups.
              Task: ${promptAction}
              Instructions:
              - The message should be general enough for multiple projects.
              - Address the students respectfully.
              - Keep it to 2-3 sentences.
              - Do not include a greeting or signature; that will be added automatically.
              - Respond with only the message text.
            `;
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
            setMessage(response.text.trim());
            addToast({ type: 'success', message: t('aiMessageGenerated') });
        } catch (error) {
            console.error("AI message generation failed:", error);
            addToast({ type: 'error', message: t('couldNotGenerateMessage') });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSend = () => {
        if (!message.trim()) {
            addToast({ type: 'error', message: t('messageCannotBeEmpty') });
            return;
        }
        onSend(message);
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                    {t('sendBulkMessage')}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {t('messageWillBeSentTo').replace('${count}', String(selectedProjects.length))}
                    </Typography>
                    <List dense sx={{ maxHeight: 100, overflow: 'auto', bgcolor: 'background.default', borderRadius: 1, mt: 1 }}>
                        {selectedProjects.map(p => (
                            <ListItem key={p.project.projectId} sx={{ py: 0.5 }}>
                                <ListItemText 
                                    primary={`${p.project.projectId} - ${p.students.map(s => s.name).join(', ')}`}
                                    primaryTypographyProps={{ variant: 'caption' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={6}
                        id="bulk-message"
                        label={t('message')}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t('typeYourMessage')}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" fontWeight="medium">
                            {t('aiTemplates')}:
                        </Typography>
                        <Button
                            size="small"
                            startIcon={isGenerating ? <CircularProgress size={14} /> : <SparklesIcon />}
                            onClick={() => handleGenerateMessage('reminder')}
                            disabled={isGenerating}
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                            {t('deadlineReminder')}
                        </Button>
                        <Button
                            size="small"
                            startIcon={isGenerating ? <CircularProgress size={14} /> : <SparklesIcon />}
                            onClick={() => handleGenerateMessage('overdue')}
                            disabled={isGenerating}
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                            {t('overdueNotice')}
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="outlined">
                    {t('cancel')}
                </Button>
                <Button 
                    onClick={handleSend} 
                    variant="contained"
                    startIcon={<PaperAirplaneIcon />}
                >
                    {t('sendMessage')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BulkMessageModal;