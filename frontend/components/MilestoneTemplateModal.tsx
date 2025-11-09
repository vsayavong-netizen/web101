import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, Box, Typography, Grid, Divider,
  Paper
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Add as PlusIcon, 
  Delete as TrashIcon 
} from '@mui/icons-material';
import { MilestoneTemplate, MilestoneTask } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useTranslations } from '../hooks/useTranslations';

interface MilestoneTemplateModalProps {
  onClose: () => void;
  onSave: (template: MilestoneTemplate | Omit<MilestoneTemplate, 'id'>) => void;
  templateToEdit: MilestoneTemplate | null;
  allTemplates: MilestoneTemplate[];
}

const MilestoneTemplateModal: React.FC<MilestoneTemplateModalProps> = ({ onClose, onSave, templateToEdit, allTemplates }) => {
  const isEditMode = !!templateToEdit;
  const t = useTranslations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState<MilestoneTask[]>([]);
  const [errors, setErrors] = useState<Record<string, any>>({});

  useEffect(() => {
    if (templateToEdit) {
      setName(templateToEdit.name);
      setDescription(templateToEdit.description);
      setTasks([...templateToEdit.tasks]);
    } else {
        // Start with one default task
        setTasks([{ id: uuidv4(), name: '', durationDays: 30 }]);
    }
  }, [templateToEdit]);

  const validate = () => {
    const newErrors: Record<string, any> = { tasks: {} };
    if (!name.trim()) {
      newErrors.name = t('templateNameRequired');
    } else {
        const isDuplicate = allTemplates.some(
            t => t.name.toLowerCase() === name.trim().toLowerCase() && t.id !== templateToEdit?.id
        );
        if (isDuplicate) {
            newErrors.name = t('templateNameExists');
        }
    }
    if (!description.trim()) newErrors.description = t('descriptionRequired');
    if (tasks.length === 0) newErrors.tasksError = t('atLeastOneTask');
    
    tasks.forEach((task, index) => {
        if (!task.name.trim()) {
            newErrors.tasks[index] = { ...newErrors.tasks[index], name: t('taskNameRequired') };
        }
        if (task.durationDays <= 0) {
            newErrors.tasks[index] = { ...newErrors.tasks[index], duration: t('daysPositiveError') };
        }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 1 && Object.keys(newErrors.tasks).length === 0 && !newErrors.tasksError;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const templateData = { name, description, tasks };
    const finalData = isEditMode ? { ...templateToEdit, ...templateData } : templateData;
    onSave(finalData);
  };

  const handleTaskChange = (index: number, field: keyof MilestoneTask, value: string | number) => {
    const newTasks = [...tasks];
    (newTasks[index] as any)[field] = value;
    setTasks(newTasks);
  };
  
  const handleAddTask = () => {
    setTasks([...tasks, { id: uuidv4(), name: '', durationDays: 30 }]);
  };
  
  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };


  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          {isEditMode ? t('editTemplate') : t('addTemplate')}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
          <TextField
            fullWidth
            label={t('templateName')}
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label={t('description')}
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
          />
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              {t('milestoneTasks')}
            </Typography>
            {errors.tasksError && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                {errors.tasksError}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {tasks.map((task, index) => (
                <Paper key={task.id} elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Grid container spacing={2} alignItems="flex-start">
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g., Chapter 1: Introduction"
                        id={`task-name-${index}`}
                        value={task.name}
                        onChange={e => handleTaskChange(index, 'name', e.target.value)}
                        error={!!errors.tasks?.[index]?.name}
                        helperText={errors.tasks?.[index]?.name}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        id={`task-days-${index}`}
                        value={task.durationDays}
                        onChange={e => handleTaskChange(index, 'durationDays', parseInt(e.target.value, 10) || 0)}
                        inputProps={{ min: 1 }}
                        error={!!errors.tasks?.[index]?.duration}
                        helperText={errors.tasks?.[index]?.duration}
                        InputProps={{
                          endAdornment: (
                            <Typography variant="caption" sx={{ mr: 1 }}>
                              {t('days')}
                            </Typography>
                          )
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 1 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveTask(index)}
                        color="error"
                        aria-label={t('removeTask')}
                      >
                        <TrashIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
            <Button
              startIcon={<PlusIcon />}
              onClick={handleAddTask}
              sx={{ mt: 2 }}
              size="small"
            >
              {t('addTask')}
            </Button>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained">
            {t('saveTemplate')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MilestoneTemplateModal;