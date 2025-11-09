import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, Checkbox, FormControlLabel,
  IconButton, Avatar, Stack, Alert
} from '@mui/material';
import { 
  Close as CloseIcon, CheckCircle as CheckCircleIcon, 
  Warning as ExclamationTriangleIcon 
} from '@mui/icons-material';
import { Advisor, MilestoneTemplate, ProjectGroup, Major } from '../types';
import { useTranslations } from '../hooks/useTranslations';

type ActionType = 'approve' | 'reject';

interface AdvisorActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: { comment: string; transferTo?: string; templateId?: string }) => void;
  projectGroup: ProjectGroup;
  action: ActionType;
  advisors: Advisor[];
  advisorProjectCounts: Record<string, number>;
  currentAdvisorName: string;
  milestoneTemplates: MilestoneTemplate[];
  majors: Major[];
}

const AdvisorActionModal: React.FC<AdvisorActionModalProps> = (props) => {
  const { 
    isOpen, onClose, onConfirm, projectGroup, action, 
    advisors, advisorProjectCounts, currentAdvisorName, milestoneTemplates, majors
  } = props;
  
  const [comment, setComment] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [error, setError] = useState('');
  const t = useTranslations();

  const config = useMemo(() => ({
    approve: {
        title: t('approveProject'),
        iconColor: 'success' as const,
        buttonColor: 'success' as const,
        buttonText: t('confirmApproval'),
        prompt: (projectName: string) => t('approveProjectPrompt').replace('${projectName}', projectName),
    },
    reject: {
        title: t('rejectProject'),
        iconColor: 'error' as const,
        buttonColor: 'error' as const,
        buttonText: t('confirmRejection'),
        prompt: (projectName: string) => t('rejectProjectPrompt').replace('${projectName}', projectName),
    }
  }), [t]);

  const actionConfig = config[action];

  useEffect(() => {
    if (isOpen) {
      setComment('');
      setIsTransferring(false);
      setTransferTo('');
      setSelectedTemplateId(milestoneTemplates[0]?.id || '');
      setError('');
    }
  }, [isOpen, milestoneTemplates]);
  
  const availableAdvisorsForTransfer = useMemo(() => {
    const projectMajorId = majors.find(m => m.name === projectGroup.students[0]?.major)?.id;
    if (!projectMajorId) return []; // No major, no valid advisors to transfer to

    return advisors.filter(adv => {
        if (adv.name === currentAdvisorName) return false;
        // Advisor must have the specialized major
        return adv.specializedMajorIds?.includes(projectMajorId);
    });
  }, [advisors, majors, projectGroup, currentAdvisorName]);

  const handleConfirm = () => {
    if (action === 'reject' && !comment.trim() && !isTransferring) {
        setError(t('commentRequiredForRejection'));
        return;
    }
    if (action === 'reject' && isTransferring && !transferTo) {
         setError(t('selectAdvisorToTransfer'));
         return;
    }
    if (action === 'approve' && !selectedTemplateId) {
        setError(t('selectMilestoneTemplate'));
        return;
    }
    setError('');
    onConfirm({
        comment,
        transferTo: isTransferring ? transferTo : undefined,
        templateId: action === 'approve' ? selectedTemplateId : undefined,
    });
  };
  
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ 
            bgcolor: `${actionConfig.iconColor}.light`, 
            color: `${actionConfig.iconColor}.main`,
            width: { xs: 48, sm: 40 },
            height: { xs: 48, sm: 40 }
          }}>
            {action === 'approve' ? <CheckCircleIcon /> : <ExclamationTriangleIcon />}
          </Avatar>
          <Typography variant="h6" component="span" fontWeight="bold" id="modal-title">
            {actionConfig.title}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {actionConfig.prompt(projectGroup.project.topicEng)}
          </Typography>
          {action === 'approve' && (
            <FormControl fullWidth>
              <InputLabel>{t('milestoneTemplate')}</InputLabel>
              <Select
                id="templateId"
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                label={t('milestoneTemplate')}
              >
                {milestoneTemplates.map(t => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            multiline
            rows={4}
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('enterCommentPlaceholder')}
            label="Comment"
            aria-label="Comment"
          />
          {action === 'reject' && (
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isTransferring}
                    onChange={e => setIsTransferring(e.target.checked)}
                  />
                }
                label={t('transferToAnotherAdvisor')}
              />
              {isTransferring && (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>{t('selectAnAdvisor')}</InputLabel>
                  <Select
                    value={transferTo}
                    onChange={e => setTransferTo(e.target.value)}
                    label={t('selectAnAdvisor')}
                  >
                    {availableAdvisorsForTransfer.map(adv => {
                      const count = advisorProjectCounts[adv.name] || 0;
                      const isFull = count >= adv.quota;
                      return (
                        <MenuItem key={adv.id} value={adv.name} disabled={isFull}>
                          {adv.name} ({count}/{adv.quota}) {isFull ? ` - ${t('full')}` : ''}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ fontSize: '0.75rem' }}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" fullWidth={false} sx={{ minWidth: { xs: '100%', sm: 'auto' } }}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={actionConfig.buttonColor}
          fullWidth={false}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          {isTransferring ? t('confirmTransfer') : actionConfig.buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvisorActionModal;
