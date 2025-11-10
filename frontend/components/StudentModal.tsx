import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Select, MenuItem, FormControl,
  InputLabel, FormHelperText, IconButton, Box, Typography, Grid, Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Student, Gender, Major, Classroom } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface StudentModalProps {
  onClose: () => void;
  onSave: (student: Student | Omit<Student, 'id'>) => void;
  studentToEdit: Student | null;
  allStudents: Student[];
  majors: Major[];
  classrooms: Classroom[];
}

const StudentModal: React.FC<StudentModalProps> = ({ onClose, onSave, studentToEdit, allStudents, majors, classrooms }) => {
  const isEditMode = !!studentToEdit;
  const t = useTranslations();
  
  const [student, setStudent] = useState<Partial<Student>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (studentToEdit) {
      setStudent(studentToEdit);
    } else {
      const defaultMajorName = majors[0]?.name || '';
      const selectedMajor = majors.find(m => m.name === defaultMajorName);
      const defaultClassrooms = selectedMajor ? classrooms.filter(c => c.majorId === selectedMajor.id) : [];
      setStudent({ gender: Gender.Male, status: 'Approved', major: defaultMajorName, classroom: defaultClassrooms[0]?.name || '' });
    }
  }, [studentToEdit, majors, classrooms]);

  const filteredClassrooms = useMemo(() => {
    if (!student.major) return [];
    const selectedMajor = majors.find(m => m.name === student.major);
    return selectedMajor ? classrooms.filter(c => c.majorId === selectedMajor.id) : [];
  }, [student.major, majors, classrooms]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const studentId = student.studentId?.trim().toUpperCase();
    if (!studentId) {
      newErrors.studentId = t('studentIdRequired');
    } else {
      // Check for duplicate student ID (case-insensitive, exclude current student if editing)
      const normalizedCurrentId = studentToEdit?.studentId?.trim().toUpperCase();
      if (allStudents.some(s => {
        const normalizedId = s.studentId?.trim().toUpperCase();
        return normalizedId === studentId && normalizedId !== normalizedCurrentId;
      })) {
        newErrors.studentId = t('studentIdExists');
      }
    }
    if (!student.name?.trim()) newErrors.name = t('nameRequired');
    if (!student.surname?.trim()) newErrors.surname = t('surnameRequired');
    if (!student.major) newErrors.major = t('majorRequired');
    if (!student.classroom) newErrors.classroom = t('classroomRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const studentData: Student = { ...student, studentId: student.studentId!.trim().toUpperCase(), name: student.name!.trim(), surname: student.surname!.trim() } as Student;
    const finalData = isEditMode ? { ...studentToEdit, ...studentData } : { ...studentData, password: 'password123', mustChangePassword: true };
    onSave(finalData as Student);
  };
  
  const handleChange = (field: keyof Student, value: string) => {
    let updatedStudent = { ...student, [field]: value };
    if (field === 'major') {
        const selectedMajor = majors.find(m => m.name === value);
        const newClassrooms = selectedMajor ? classrooms.filter(c => c.majorId === selectedMajor.id) : [];
        updatedStudent.classroom = newClassrooms[0]?.name || '';
    } 
    setStudent(updatedStudent);
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
          {isEditMode ? t('editStudent') : t('addStudent')}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('studentId')}
                id="studentId"
                value={student.studentId || ''}
                onChange={e => handleChange('studentId', e.target.value)}
                disabled={isEditMode}
                error={!!errors.studentId}
                helperText={errors.studentId}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>{t('gender')}</InputLabel>
                <Select
                  id="gender"
                  value={student.gender || Gender.Male}
                  onChange={e => handleChange('gender', e.target.value)}
                  label={t('gender')}
                >
                  <MenuItem value={Gender.Male}>{t('male')}</MenuItem>
                  <MenuItem value={Gender.Female}>{t('female')}</MenuItem>
                  <MenuItem value={Gender.Monk}>{t('monk')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('name')}
                id="name"
                value={student.name || ''}
                onChange={e => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('surname')}
                id="surname"
                value={student.surname || ''}
                onChange={e => handleChange('surname', e.target.value)}
                error={!!errors.surname}
                helperText={errors.surname}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth error={!!errors.major}>
                <InputLabel>{t('major')}</InputLabel>
                <Select
                  id="major"
                  value={student.major || ''}
                  onChange={e => handleChange('major', e.target.value)}
                  label={t('major')}
                >
                  {majors.map(m => (
                    <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
                  ))}
                </Select>
                {errors.major && <FormHelperText>{errors.major}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth error={!!errors.classroom} disabled={filteredClassrooms.length === 0}>
                <InputLabel>{t('classroom')}</InputLabel>
                <Select
                  id="classroom"
                  value={student.classroom || ''}
                  onChange={e => handleChange('classroom', e.target.value)}
                  label={t('classroom')}
                  renderValue={(selected) => {
                    if (!selected) {
                      if (filteredClassrooms.length === 0 && student.major) {
                        return (
                          <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                            {t('noClassroomsForMajor') || 'No classrooms for this major'}
                          </Typography>
                        );
                      }
                      return '';
                    }
                    return selected;
                  }}
                  displayEmpty
                >
                  {filteredClassrooms.length > 0 ? (
                    filteredClassrooms.map(c => (
                      <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      {student.major ? t('noClassroomsForMajor') || 'No classrooms available for this major' : t('selectMajorFirst') || 'Please select a major first'}
                    </MenuItem>
                  )}
                </Select>
                {errors.classroom && <FormHelperText>{errors.classroom}</FormHelperText>}
                {!errors.classroom && filteredClassrooms.length === 0 && student.major && (
                  <FormHelperText sx={{ color: 'warning.main', fontSize: '0.75rem' }}>
                    {t('noClassroomsForMajor') || 'No classrooms available for this major. Please add a classroom first.'}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('email')}
                id="email"
                type="email"
                value={student.email || ''}
                onChange={e => handleChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('telephone')}
                id="tel"
                type="tel"
                value={student.tel || ''}
                onChange={e => handleChange('tel', e.target.value)}
                error={!!errors.tel}
                helperText={errors.tel}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>{t('status')}</InputLabel>
                <Select
                  id="status"
                  value={student.status || 'Approved'}
                  onChange={e => handleChange('status', e.target.value)}
                  label={t('status')}
                >
                  <MenuItem value="Approved">{t('approved')}</MenuItem>
                  <MenuItem value="Pending">{t('pending')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained">
            {t('saveStudent')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default StudentModal;