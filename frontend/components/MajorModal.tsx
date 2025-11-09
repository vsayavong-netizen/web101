import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, Box, Typography, Grid, Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Major } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface MajorModalProps {
  onClose: () => void;
  onSave: (major: Major | Omit<Major, 'id'>) => void;
  majorToEdit: Major | null;
  allMajors: Major[];
}

const MajorModal: React.FC<MajorModalProps> = ({ onClose, onSave, majorToEdit, allMajors }) => {
  const isEditMode = !!majorToEdit;
  const t = useTranslations();
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode && majorToEdit) {
      setName(majorToEdit.name);
      setAbbreviation(majorToEdit.abbreviation);
    }
  }, [isEditMode, majorToEdit]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t('majorNameRequired');
    }
    const isDuplicateName = allMajors.some(
      m => m.name.toLowerCase() === name.trim().toLowerCase() && m.id !== majorToEdit?.id
    );
    if (isDuplicateName) {
      newErrors.name = t('majorNameExists');
    }

    if (!abbreviation.trim()) {
      newErrors.abbreviation = t('abbreviationRequired');
    }
    const isDuplicateAbbr = allMajors.some(
      m => m.abbreviation.toLowerCase() === abbreviation.trim().toLowerCase() && m.id !== majorToEdit?.id
    );
    if (isDuplicateAbbr) {
        newErrors.abbreviation = t('abbreviationExists');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const majorData = { name: name.trim(), abbreviation: abbreviation.trim().toUpperCase() };
    const finalData = isEditMode ? { ...majorToEdit, ...majorData } : majorData;
    onSave(finalData as Major | Omit<Major, 'id'>);
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          {isEditMode ? t('editMajor') : t('addMajor')}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label={t('majorName')}
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={t('abbreviation')}
                id="abbreviation"
                value={abbreviation}
                onChange={e => setAbbreviation(e.target.value.toUpperCase())}
                error={!!errors.abbreviation}
                helperText={errors.abbreviation}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained">
            {t('saveMajor')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MajorModal;