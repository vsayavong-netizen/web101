import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, Box, Typography, Grid, Divider,
  Checkbox, FormControlLabel, FormHelperText
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Advisor, Major, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface AdvisorModalProps {
  onClose: () => void;
  onSave: (advisor: Advisor | Omit<Advisor, 'id'>) => void;
  advisorToEdit: Advisor | null;
  allAdvisors: Advisor[];
  majors: Major[];
  user: User;
}

const AdvisorModal: React.FC<AdvisorModalProps> = ({ onClose, onSave, advisorToEdit, allAdvisors, majors, user }) => {
  const isEditMode = !!advisorToEdit;
  const t = useTranslations();
  const [advisor, setAdvisor] = useState<Partial<Advisor>>(advisorToEdit || { quota: 5, mainCommitteeQuota: 5, secondCommitteeQuota: 5, thirdCommitteeQuota: 5, specializedMajorIds: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { if (advisorToEdit) setAdvisor(advisorToEdit); }, [advisorToEdit]);

  const handleMajorSelection = (majorId: string) => {
    const currentIds = advisor.specializedMajorIds || [];
    const newIds = currentIds.includes(majorId) ? currentIds.filter(id => id !== majorId) : [...currentIds, majorId];
    setAdvisor(prev => ({ ...prev, specializedMajorIds: newIds }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!advisor.name?.trim()) newErrors.name = t('nameRequired');
    if (allAdvisors.some(a => a.name.toLowerCase() === advisor.name?.trim().toLowerCase() && a.id !== advisorToEdit?.id)) newErrors.name = t('advisorNameExists');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const finalData = isEditMode ? { ...advisorToEdit, ...advisor } : { ...advisor, password: 'password12p3', mustChangePassword: true };
    onSave(finalData as Advisor);
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Box component="span" sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          {isEditMode ? t('editAdvisor') : t('addAdvisorTitle')}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
          <TextField
            fullWidth
            label={t('fullName')}
            id="name"
            value={advisor.name || ''}
            onChange={e => setAdvisor(prev => ({ ...prev, name: e.target.value }))}
            error={!!errors.name}
            helperText={errors.name}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('supervisingQuota')}
                id="quota"
                type="number"
                value={advisor.quota ?? ''}
                onChange={e => setAdvisor(prev => ({...prev, quota: Number(e.target.value)}))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('mainCommitteeQuota')}
                id="mainCommitteeQuota"
                type="number"
                value={advisor.mainCommitteeQuota ?? ''}
                onChange={e => setAdvisor(prev => ({...prev, mainCommitteeQuota: Number(e.target.value)}))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('secondCommitteeQuota')}
                id="secondCommitteeQuota"
                type="number"
                value={advisor.secondCommitteeQuota ?? ''}
                onChange={e => setAdvisor(prev => ({...prev, secondCommitteeQuota: Number(e.target.value)}))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('thirdCommitteeQuota')}
                id="thirdCommitteeQuota"
                type="number"
                value={advisor.thirdCommitteeQuota ?? ''}
                onChange={e => setAdvisor(prev => ({...prev, thirdCommitteeQuota: Number(e.target.value)}))}
              />
            </Grid>
          </Grid>
          <Box>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 2 }}>
              {t('specializedMajors')}
            </Typography>
            <Grid container spacing={1}>
              {majors.map(major => (
                <Grid item xs={12} sm={6} key={major.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={advisor.specializedMajorIds?.includes(major.id) || false}
                        onChange={() => handleMajorSelection(major.id)}
                      />
                    }
                    label={major.name}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained">
            {t('saveAdvisor')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AdvisorModal;