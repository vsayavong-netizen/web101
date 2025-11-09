/**
 * Example: RegisterProjectModal using React Hook Form
 * This is a reference implementation showing how to use React Hook Form
 * with Material UI components and validation
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { FormTextField } from '../FormTextField';
import { FormSelectField } from '../FormSelectField';
import { DatePickerField } from '../DatePickerField';
import { useTranslations } from '../../hooks/useTranslations';

// Validation schema
const projectSchema = yup.object({
  topicLao: yup.string().required('Lao topic is required').min(10, 'Topic must be at least 10 characters'),
  topicEng: yup.string().required('English topic is required').min(10, 'Topic must be at least 10 characters'),
  advisorName: yup.string().required('Advisor is required'),
  student1Id: yup.string().required('First student is required'),
  student2Id: yup.string().nullable(),
  deadline: yup.date().nullable(),
});

type ProjectFormData = yup.InferType<typeof projectSchema>;

interface RegisterProjectFormExampleProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
  advisors: Array<{ id: string; name: string }>;
  students: Array<{ studentId: string; name: string; surname: string }>;
}

export const RegisterProjectFormExample: React.FC<RegisterProjectFormExampleProps> = ({
  isOpen,
  onClose,
  onSubmit,
  advisors,
  students,
}) => {
  const t = useTranslations();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProjectFormData>({
    resolver: yupResolver(projectSchema),
    defaultValues: {
      topicLao: '',
      topicEng: '',
      advisorName: '',
      student1Id: '',
      student2Id: null,
      deadline: null,
    },
  });

  const handleFormSubmit = async (data: ProjectFormData) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const advisorOptions = advisors.map((adv) => ({
    value: adv.name,
    label: adv.name,
  }));

  const studentOptions = students.map((s) => ({
    value: s.studentId,
    label: `${s.name} ${s.surname} (${s.studentId})`,
  }));

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Register New Project</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormTextField
              name="topicLao"
              control={control}
              label={t('topicLao') || 'Topic (Lao)'}
              error={errors.topicLao}
              required
              fullWidth
              multiline
              rows={2}
            />

            <FormTextField
              name="topicEng"
              control={control}
              label={t('topicEng') || 'Topic (English)'}
              error={errors.topicEng}
              required
              fullWidth
              multiline
              rows={2}
            />

            <FormSelectField
              name="advisorName"
              control={control}
              label={t('advisor') || 'Advisor'}
              options={advisorOptions}
              error={errors.advisorName}
              required
            />

            <FormSelectField
              name="student1Id"
              control={control}
              label={t('student1') || 'Student 1'}
              options={studentOptions}
              error={errors.student1Id}
              required
            />

            <FormSelectField
              name="student2Id"
              control={control}
              label={t('student2') || 'Student 2 (Optional)'}
              options={studentOptions}
              error={errors.student2Id}
            />

            <DatePickerField
              name="deadline"
              control={control}
              label={t('deadline') || 'Deadline'}
              variant="date"
              error={errors.deadline}
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">
            {t('cancel') || 'Cancel'}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('submitting') || 'Submitting...' : t('submit') || 'Submit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RegisterProjectFormExample;

