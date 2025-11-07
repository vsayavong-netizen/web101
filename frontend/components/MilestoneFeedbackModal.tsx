import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, Box, Typography, Divider,
  Avatar, CircularProgress
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CheckCircle as CheckCircleIcon, 
  Refresh as ArrowPathIcon, 
  AutoAwesome as SparklesIcon 
} from '@mui/icons-material';
import { ProjectGroup } from '../types';
import { useToast } from '../hooks/useToast';
import { GoogleGenAI } from "@google/genai";
import { useTranslations } from '../hooks/useTranslations';

type ActionType = 'approve' | 'revise';

interface MilestoneFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (feedback: string) => void;
  action: ActionType;
  milestoneName: string;
  projectGroup?: ProjectGroup;
}

const MilestoneFeedbackModal: React.FC<MilestoneFeedbackModalProps> = ({ isOpen, onClose, onConfirm, action, milestoneName, projectGroup }) => {
  const [feedback, setFeedback] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const addToast = useToast();
  const t = useTranslations();

  const config = {
      approve: {
          title: t('approveMilestone'),
          icon: CheckCircleIcon,
          iconColor: 'success' as const,
          buttonText: t('approveButton'),
          buttonColor: 'success' as const,
          prompt: (milestoneName: string) => t('approveFeedbackPrompt').replace('{milestoneName}', milestoneName),
      },
      revise: {
          title: t('requestRevisionTitle'),
          icon: ArrowPathIcon,
          iconColor: 'warning' as const,
          buttonText: t('requestRevisionButton'),
          buttonColor: 'warning' as const,
          prompt: (milestoneName: string) => t('requestRevisionPrompt').replace('{milestoneName}', milestoneName),
      }
  };

  const actionConfig = config[action];

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(feedback);
    setFeedback('');
  };

  const handleGenerateFeedback = async () => {
    if (!projectGroup) return;
    
    setIsGenerating(true);
    try {
        if (!process.env.API_KEY) throw new Error("API key is not configured.");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        let promptAction = '';
        if (action === 'approve') {
            promptAction = `The advisor is approving this milestone. The feedback should be positive and encouraging, perhaps suggesting what to focus on for the next milestone.`;
        } else { // 'revise'
            promptAction = `The advisor is requesting a revision. The feedback should be constructive, clearly and politely explaining what needs to be improved without being overly harsh.`;
        }

        const prompt = `
            You are a helpful university advisor in Laos providing feedback on a student project.
            Project Topic: "${projectGroup.project.topicEng}"
            Milestone: "${milestoneName}"
            
            Task: Draft a feedback message for the student.
            Instructions:
            - Keep it concise (2-4 sentences).
            - The tone should be professional, academic, and supportive.
            - ${promptAction}
            
            Respond with only the feedback text, without any introductory phrases like "Here's the feedback:".
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        setFeedback(response.text.trim());
        addToast({ type: 'success', message: t('feedbackGeneratedSuccess') });
    } catch (error) {
        console.error("AI feedback generation failed:", error);
        addToast({ type: 'error', message: t('feedbackGenerationFailed') });
    } finally {
        setIsGenerating(false);
    }
  };


  const IconComponent = actionConfig.icon;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 2 }}>
        <Avatar sx={{ bgcolor: `${actionConfig.iconColor}.light`, color: `${actionConfig.iconColor}.main` }}>
          <IconComponent />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {actionConfig.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {actionConfig.prompt(milestoneName)}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            {t('feedbackLabel')}
          </Typography>
          {projectGroup && (
            <Button
              size="small"
              onClick={handleGenerateFeedback}
              disabled={isGenerating}
              startIcon={isGenerating ? <CircularProgress size={16} /> : <SparklesIcon />}
              sx={{ 
                textTransform: 'none',
                fontSize: '0.75rem',
                minWidth: 'auto'
              }}
            >
              {isGenerating ? t('generating') : t('suggestWithAI')}
            </Button>
          )}
        </Box>
        <TextField
          fullWidth
          multiline
          rows={4}
          id="feedback-textarea"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={t('feedbackPlaceholder')}
          aria-label="Feedback for milestone"
        />
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          {t('cancel')}
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color={actionConfig.buttonColor}
        >
          {actionConfig.buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MilestoneFeedbackModal;