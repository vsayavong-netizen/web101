import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton, Avatar, Stack, Alert
} from '@mui/material';
import { 
  Close as CloseIcon, SwapHoriz as ArrowsRightLeftIcon 
} from '@mui/icons-material';
import { Advisor, ProjectGroup, Major } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface AdminTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newAdvisorName: string, reason: string) => void;
  projectGroup: ProjectGroup;
  advisors: Advisor[];
  advisorProjectCounts: Record<string, number>;
  majors: Major[];
}

const AdminTransferModal: React.FC<AdminTransferModalProps> = ({ isOpen, onClose, onConfirm, projectGroup, advisors, advisorProjectCounts, majors }) => {
  const [newAdvisorName, setNewAdvisorName] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const t = useTranslations();

  const availableAdvisors = useMemo(() => {
    const projectMajorId = majors.find(m => m.name === projectGroup.students[0]?.major)?.id;
    if (!projectMajorId) return []; // No major, no valid advisors to transfer to

    return advisors.filter(adv => {
        if (adv.name === projectGroup.project.advisorName) return false;
        return adv.specializedMajorIds?.includes(projectMajorId);
    });
  }, [advisors, projectGroup, majors]);

  useEffect(() => {
    // Set a default advisor if the list is available
    if (isOpen) {
      const firstAvailable = availableAdvisors.find(a => (advisorProjectCounts[a.name] || 0) < a.quota);
      setNewAdvisorName(firstAvailable?.name || '');
      setReason('');
      setError('');
    }
  }, [isOpen, availableAdvisors, advisorProjectCounts]);

  const handleConfirm = () => {
    if (!newAdvisorName) {
      setError(t('selectAdvisorToTransfer'));
      return;
    }
    if (!reason.trim()) {
      setError(t('reasonForTransferRequired'));
      return;
    }
    onConfirm(newAdvisorName, reason);
  };
  
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ 
            bgcolor: 'warning.light', 
            color: 'warning.main',
            width: { xs: 48, sm: 40 },
            height: { xs: 48, sm: 40 }
          }}>
            <ArrowsRightLeftIcon />
          </Avatar>
          <Typography variant="h6" component="span" fontWeight="bold" id="modal-title">
            {t('transfer')} {t('project')}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            {t('transferProjectPrompt').replace('{topic}', projectGroup.project.topicEng).replace('{advisor}', projectGroup.project.advisorName)}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>{t('newAdvisor')}</InputLabel>
            <Select
              id="newAdvisor"
              value={newAdvisorName}
              onChange={e => setNewAdvisorName(e.target.value)}
              label={t('newAdvisor')}
            >
              <MenuItem value="" disabled>-- {t('selectAnAdvisor')} --</MenuItem>
              {availableAdvisors.map(adv => {
                const currentCount = advisorProjectCounts[adv.name] || 0;
                const isFull = currentCount >= adv.quota;
                return (
                  <MenuItem key={adv.id} value={adv.name} disabled={isFull}>
                    {adv.name} ({currentCount}/{adv.quota}) {isFull ? `- ${t('full')}` : ''}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <TextField
            id="reason"
            multiline
            rows={3}
            fullWidth
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('transferReasonPlaceholder')}
            label={t('reason')}
            error={!!error && !reason.trim()}
          />
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
          color="primary"
          fullWidth={false}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          {t('confirmTransfer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminTransferModal;