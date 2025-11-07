import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Select, MenuItem, FormControl,
  InputLabel, IconButton, Box, Typography, Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Major, Classroom } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface BulkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: { major?: string; classroom?: string }) => void;
    majors: Major[];
    classrooms: Classroom[];
    selectedCount: number;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({ isOpen, onClose, onSave, majors, classrooms, selectedCount }) => {
    const [majorName, setMajorName] = useState('');
    const [classroomName, setClassroomName] = useState('');
    const t = useTranslations();

    const filteredClassrooms = useMemo(() => {
        if (!majorName) return [];
        const selectedMajor = majors.find(m => m.name === majorName);
        if (!selectedMajor) return [];
        return classrooms.filter(c => c.majorId === selectedMajor.id);
    }, [majorName, majors, classrooms]);

    const handleSave = () => {
        const updates: { major?: string; classroom?: string } = {};
        if (majorName) updates.major = majorName;
        if (classroomName) updates.classroom = classroomName;
        onSave(updates);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
                <Box component="span" sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    {t('bulkEditTitle').replace('{count}', String(selectedCount))}
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    {t('bulkEditDescription')}
                </Typography>
                <FormControl fullWidth>
                    <InputLabel>{t('major')}</InputLabel>
                    <Select
                        id="bulk-major"
                        value={majorName}
                        onChange={e => { setMajorName(e.target.value); setClassroomName(''); }}
                        label={t('major')}
                    >
                        <MenuItem value="">-- {t('dontChange')} --</MenuItem>
                        {majors.map(m => (
                            <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl fullWidth disabled={!majorName}>
                    <InputLabel>{t('classroom')}</InputLabel>
                    <Select
                        id="bulk-classroom"
                        value={classroomName}
                        onChange={e => setClassroomName(e.target.value)}
                        label={t('classroom')}
                    >
                        <MenuItem value="">-- {t('dontChange')} --</MenuItem>
                        {filteredClassrooms.map(c => (
                            <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="outlined">
                    {t('cancel')}
                </Button>
                <Button onClick={handleSave} variant="contained">
                    {t('saveChanges')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BulkEditModal;