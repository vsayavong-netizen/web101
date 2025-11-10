import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Select, MenuItem, FormControl,
  InputLabel, FormHelperText, IconButton, Box, Typography, Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Classroom, Major, User, Advisor } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface ClassroomModalProps {
  onClose: () => void;
  onSave: (classroom: Classroom | Omit<Classroom, 'id'>) => void;
  classroomToEdit: Classroom | null;
  allClassrooms: Classroom[];
  majors: Major[];
  user: User;
}

const ClassroomModal: React.FC<ClassroomModalProps> = ({ onClose, onSave, classroomToEdit, allClassrooms, majors, user }) => {
  const isEditMode = !!classroomToEdit;
  const t = useTranslations();

  const availableMajors = useMemo(() => {
    if (user.role === 'DepartmentAdmin') {
        const deptAdminUser = user as User & Partial<Advisor>;
        const managedMajorIds = new Set(deptAdminUser.specializedMajorIds || []);
        return majors.filter(m => managedMajorIds.has(m.id));
    }
    return majors;
  }, [user, majors]);

  const getInitialMajorId = useCallback(() => {
      if (classroomToEdit) return classroomToEdit.majorId;
      return availableMajors[0]?.id || '';
  }, [classroomToEdit, availableMajors]);

  const [name, setName] = useState('');
  const [majorId, setMajorId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (classroomToEdit) {
      setName(classroomToEdit.name || '');
      setMajorId(classroomToEdit.majorId || '');
    } else {
      const initialMajorId = availableMajors[0]?.id || '';
      setName('');
      setMajorId(initialMajorId);
    }
  }, [classroomToEdit, availableMajors]);


  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t('classroomNameRequired');
    }
    const isDuplicate = allClassrooms.some(
      c => c.name.toLowerCase() === name.trim().toLowerCase() && c.id !== classroomToEdit?.id
    );
    if (isDuplicate) {
      newErrors.name = t('classroomNameExists');
    }
    if (!majorId) {
        newErrors.majorId = t('majorRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const selectedMajor = majors.find(m => m.id === majorId);
    if (!selectedMajor) {
        setErrors(prev => ({...prev, majorId: t('invalidMajorSelected')}));
        return;
    };

    const classroomData = { 
        name: name.trim(), 
        majorId, 
        majorName: selectedMajor.name 
    };

    const finalData = isEditMode ? { ...classroomToEdit, ...classroomData } : classroomData;
    onSave(finalData as Classroom | Omit<Classroom, 'id'>);
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
          {isEditMode ? t('editClassroom') : t('addClassroom')}
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
            label={t('classroomName')}
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
          />
          <FormControl fullWidth error={!!errors.majorId} disabled={availableMajors.length === 0}>
            <InputLabel>{t('major')}</InputLabel>
            <Select
              id="major"
              value={majorId || ''}
              onChange={e => setMajorId(e.target.value)}
              label={t('major')}
            >
              {availableMajors.length === 0 ? (
                <MenuItem value="" disabled>{t('pleaseAddMajorFirst')}</MenuItem>
              ) : (
                availableMajors.map(m => (
                  <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                ))
              )}
            </Select>
            {errors.majorId && <FormHelperText>{errors.majorId}</FormHelperText>}
          </FormControl>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={availableMajors.length === 0}>
            {t('saveClassroom')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ClassroomModal;