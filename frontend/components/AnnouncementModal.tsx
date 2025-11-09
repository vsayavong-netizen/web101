import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Select, MenuItem, FormControl,
  InputLabel, IconButton, Box, Typography, Grid, Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Announcement, AnnouncementAudience } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface AnnouncementModalProps {
  onClose: () => void;
  onSave: (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'authorName'>) => void;
  announcementToEdit: Announcement | null;
}

const parseMarkdown = (text: string = '') => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>')         // Italic
    .replace(/(\r\n|\n|\r)/g, '<br />');      // Newlines
};

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ onClose, onSave, announcementToEdit }) => {
  const isEditMode = !!announcementToEdit;
  const t = useTranslations();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('All');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (announcementToEdit) {
      setTitle(announcementToEdit.title);
      setContent(announcementToEdit.content);
      setAudience(announcementToEdit.audience);
    }
  }, [announcementToEdit]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = t('titleRequired');
    if (!content.trim()) newErrors.content = t('contentRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ title, content, audience });
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Box component="span" sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          {isEditMode ? t('editAnnouncement') : t('newAnnouncement')}
        </Box>
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
                label={t('title')}
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>{t('audience')}</InputLabel>
                <Select
                  id="audience"
                  value={audience}
                  onChange={e => setAudience(e.target.value as AnnouncementAudience)}
                  label={t('audience')}
                >
                  <MenuItem value="All">{t('allUsers')}</MenuItem>
                  <MenuItem value="Students">{t('studentsOnly')}</MenuItem>
                  <MenuItem value="Advisors">{t('advisorsOnly')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ flexGrow: 1, minHeight: 0 }}>
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                {t('contentMarkdown')}
              </Typography>
              <TextField
                fullWidth
                multiline
                id="content"
                value={content}
                onChange={e => setContent(e.target.value)}
                error={!!errors.content}
                helperText={errors.content}
                placeholder={t('markdownHelp')}
                sx={{ flexGrow: 1, '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' } }}
                inputProps={{ style: { height: '100%', overflow: 'auto' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                {t('preview')}
              </Typography>
              <Box
                sx={{
                  flexGrow: 1,
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  overflow: 'auto',
                  minHeight: 200,
                  '& strong': { fontWeight: 'bold' },
                  '& em': { fontStyle: 'italic' }
                }}
                dangerouslySetInnerHTML={{ 
                  __html: parseMarkdown(content) || `<p style="color: #9ca3af;">${t('previewPlaceholder')}</p>` 
                }}
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
            {isEditMode ? t('saveChanges') : t('postAnnouncement')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AnnouncementModal;
