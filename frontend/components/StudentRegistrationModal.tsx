
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Box,
  Typography,
  Grid,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Student, Gender, Major, Classroom } from '../types';
import { useToast } from '../hooks/useToast';
import { useTranslations } from '../hooks/useTranslations';

interface StudentRegistrationModalProps {
  onClose: () => void;
  onRegister: (student: Student) => void;
  allStudents: Student[];
  majors: Major[];
  classrooms: Classroom[];
}

const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({ 
  onClose, 
  onRegister, 
  allStudents, 
  majors, 
  classrooms 
}) => {
  const addToast = useToast();
  const t = useTranslations();
  
  const [student, setStudent] = useState<Partial<Student>>(() => {
    const defaultMajorName = majors[0]?.name || '';
    const selectedMajor = majors.find(m => m.name === defaultMajorName);
    const defaultClassrooms = selectedMajor ? classrooms.filter(c => c.majorId === selectedMajor.id) : [];
    return {
      gender: Gender.Male,
      major: defaultMajorName,
      classroom: defaultClassrooms[0]?.name || ''
    };
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredClassrooms = useMemo(() => {
    if (!student.major) return [];
    const selectedMajor = majors.find(m => m.name === student.major);
    if (!selectedMajor) return [];
    return classrooms.filter(c => c.majorId === selectedMajor.id);
  }, [student.major, majors, classrooms]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const studentIdRegex = /^\d{3}[A-Z]{1,2}\d{3,4}\/\d{2}$/i;
    const telRegex = /^[\d, -]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const studentId = student.studentId?.trim();
    if (!studentId) {
      newErrors.studentId = t('studentIdRequired');
    } else if (!studentIdRegex.test(studentId)) {
      newErrors.studentId = t('invalidIdFormat');
    } else if (allStudents.some(s => s.studentId?.toLowerCase() === studentId.toLowerCase())) {
      newErrors.studentId = t('studentIdExists');
    }

    if (!student.name?.trim()) newErrors.name = t('nameRequired');
    if (!student.surname?.trim()) newErrors.surname = t('surnameRequired');
    if (!student.major?.trim()) newErrors.major = t('majorRequired');
    if (!student.classroom?.trim()) newErrors.classroom = t('classroomRequired');
    
    if (!student.email?.trim()) {
      newErrors.email = t('emailRequired');
    } else if (!emailRegex.test(student.email)) {
      newErrors.email = t('invalidEmail');
    }
    
    if (!student.tel) newErrors.tel = t('telRequired');
    else if (!telRegex.test(student.tel)) newErrors.tel = t('invalidTel');

    if (password.length < 6) {
        newErrors.password = t('passwordLengthError');
    } else if (password !== confirmPassword) {
        newErrors.confirmPassword = t('passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const studentData: Student = {
        studentId: student.studentId!.trim().toUpperCase(),
        name: student.name!.trim(),
        surname: student.surname!.trim(),
        gender: student.gender!,
        major: student.major!,
        classroom: student.classroom!,
        email: student.email!.trim(),
        tel: student.tel!.trim(),
        status: 'Pending',
        password: password,
    };

    onRegister(studentData);
    addToast({ type: 'success', message: t('registrationSuccess') });
    onClose();
  };

  const handleChange = (field: keyof Student, value: string) => {
    let updatedStudent = { ...student, [field]: value };

    if (field === 'studentId') {
      updatedStudent[field] = value.toUpperCase();
    }
    
    if (field === 'major') {
        const selectedMajor = majors.find(m => m.name === value);
        const newClassrooms = selectedMajor ? classrooms.filter(c => c.majorId === selectedMajor.id) : [];
        const newClassroom = newClassrooms[0]?.name || '';
        updatedStudent.classroom = newClassroom;
    } 
    
    setStudent(updatedStudent);
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="registration-title"
    >
      <DialogTitle id="registration-title">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            {t('studentRegistration')}
          </Typography>
          <IconButton onClick={onClose} aria-label={t('closeRegistrationModal')}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('studentId')}
                id="studentId"
                value={student.studentId || ''}
                onChange={e => handleChange('studentId', e.target.value)}
                placeholder={t('studentIdExample')}
                error={!!errors.studentId}
                helperText={errors.studentId}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label={t('gender')}
                id="gender"
                value={student.gender || Gender.Male}
                onChange={e => handleChange('gender', e.target.value)}
              >
                <MenuItem value={Gender.Male}>{t('male')}</MenuItem>
                <MenuItem value={Gender.Female}>{t('female')}</MenuItem>
                <MenuItem value={Gender.Monk}>{t('monk')}</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
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

            <Grid size={{ xs: 12, sm: 6 }}>
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

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label={t('major')}
                id="major"
                value={student.major || ''}
                onChange={e => handleChange('major', e.target.value)}
                error={!!errors.major}
                helperText={errors.major}
              >
                {majors.map(m => (
                  <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label={t('classroom')}
                id="classroom"
                value={student.classroom || ''}
                onChange={e => handleChange('classroom', e.target.value)}
                disabled={filteredClassrooms.length === 0}
                error={!!errors.classroom}
                helperText={errors.classroom}
              >
                {filteredClassrooms.length > 0 ? (
                  filteredClassrooms.map(c => (
                    <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>{t('noClassroomsForMajor')}</MenuItem>
                )}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                type="email"
                label={t('email')}
                id="email"
                value={student.email || ''}
                onChange={e => handleChange('email', e.target.value)}
                placeholder={t('emailExample')}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                type="tel"
                label={t('telephone')}
                id="tel"
                value={student.tel || ''}
                onChange={e => handleChange('tel', e.target.value)}
                placeholder={t('telExample')}
                error={!!errors.tel}
                helperText={errors.tel}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="password"
                label={t('password')}
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="password"
                label={t('confirmPassword')}
                id="confirmPassword"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          {t('cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {t('register')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentRegistrationModal;
