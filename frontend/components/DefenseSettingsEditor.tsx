

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Grid, Stack, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Divider
} from '@mui/material';
import { Add as PlusIcon, Delete as TrashIcon, AutoAwesome as SparklesIcon } from '@mui/icons-material';
import { DefenseSettings, Major, DefenseRoom, Advisor } from '../types';
import { useToast } from '../hooks/useToast';
import { useTranslations } from '../hooks/useTranslations';

interface DefenseSettingsEditorProps {
    defenseSettings: DefenseSettings;
    majors: Major[];
    advisors: Advisor[];
    updateDefenseSettings: (settings: DefenseSettings) => void;
    autoScheduleDefenses: (settings: DefenseSettings) => { committeesAssigned: number; defensesScheduled: number; };
}

const timezones = [
    { value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok, Hanoi, Jakarta, Vientiane' },
    { value: 'Asia/Singapore', label: '(UTC+08:00) Singapore, Kuala Lumpur, Shanghai' },
    { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo, Seoul' },
    { value: 'Europe/London', label: '(UTC+00:00) London, Dublin' },
    { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: '(UTC-06:00) Central Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time (US & Canada)' },
    { value: 'UTC', label: '(UTC+00:00) Coordinated Universal Time' },
];

export const DefenseSettingsEditor: React.FC<DefenseSettingsEditorProps> = ({ defenseSettings, majors, advisors, updateDefenseSettings, autoScheduleDefenses }) => {
    const [localSettings, setLocalSettings] = useState<DefenseSettings>(defenseSettings);
    const addToast = useToast();
    const t = useTranslations();

    useEffect(() => {
        setLocalSettings(defenseSettings);
    }, [defenseSettings]);
    
    const handleSettingsChange = useCallback((field: keyof Omit<DefenseSettings, 'rooms' | 'stationaryAdvisors'>, value: string) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleAddRoom = () => {
        setLocalSettings(prev => {
            const existingNumbers = prev.rooms.map(r => parseInt(r.name.replace('Room ', '')) || 0);
            const newRoomNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
            const newRoom: DefenseRoom = {
                id: `R${Date.now()}`,
                name: `Room ${newRoomNumber}`,
                majorIds: []
            };
            return { ...prev, rooms: [...prev.rooms, newRoom] };
        });
    };

    const handleRemoveRoom = (roomIdToRemove: string) => {
        setLocalSettings(prev => ({ 
            ...prev, 
            rooms: prev.rooms.filter(room => room.id !== roomIdToRemove),
            stationaryAdvisors: { ...prev.stationaryAdvisors, [roomIdToRemove]: null }
        }));
    };
    
    const handleRoomNameChange = (roomId: string, newName: string) => {
        setLocalSettings(prev => ({ ...prev, rooms: prev.rooms.map(room => room.id === roomId ? { ...room, name: newName } : room) }));
    };

    const handleRoomMajorChange = (roomId: string, majorId: string, isChecked: boolean) => {
        setLocalSettings(prev => ({
            ...prev,
            rooms: prev.rooms.map(room => {
                if (room.id === roomId) {
                    const newMajorIds = isChecked ? [...room.majorIds, majorId] : room.majorIds.filter(id => id !== majorId);
                    return { ...room, majorIds: newMajorIds };
                }
                return room;
            })
        }));
    };

    const handleStationaryAdvisorChange = (roomId: string, advisorId: string) => {
        setLocalSettings(prev => ({
            ...prev,
            stationaryAdvisors: {
                ...prev.stationaryAdvisors,
                [roomId]: advisorId || null
            }
        }));
    };

    const handleSave = () => {
        updateDefenseSettings(localSettings);
    };

    const handleRunAutoSchedule = () => {
        if (!localSettings.startDefenseDate) {
            addToast({ type: 'error', message: t('setStartDateFirst') });
            return;
        }
        updateDefenseSettings(localSettings);
        const { committeesAssigned, defensesScheduled } = autoScheduleDefenses(localSettings);
        
        let message = t('autoScheduleCompleteToast');
        if (committeesAssigned > 0 && defensesScheduled > 0) {
            message = t('autoScheduleResultToast').replace('${committeesAssigned}', String(committeesAssigned)).replace('${defensesScheduled}', String(defensesScheduled));
        } else if (committeesAssigned > 0) {
            message = t('autoScheduleCommitteesToast').replace('${committeesAssigned}', String(committeesAssigned));
        } else if (defensesScheduled > 0) {
            message = t('autoScheduleDefensesToast').replace('${defensesScheduled}', String(defensesScheduled));
        } else {
            message = t('autoScheduleNoChangesToast');
        }
        addToast({ type: 'success', message });
    };

    return (
        <Stack spacing={3}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    {t('generalScheduleSettings')}
                </Typography>
                <Stack spacing={3}>
                    <TextField
                        id="startDefenseDate"
                        type="date"
                        label={t('startDefenseDate')}
                        value={localSettings.startDefenseDate}
                        onChange={e => handleSettingsChange('startDefenseDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        sx={{ maxWidth: { sm: '50%' } }}
                    />
                    <Box>
                        <TextField
                            id="timeSlots"
                            type="text"
                            label={t('defenseTimeSlots')}
                            value={localSettings.timeSlots}
                            onChange={e => handleSettingsChange('timeSlots', e.target.value)}
                            placeholder="09:00-10:00,10:15-11:15"
                            fullWidth
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {t('timeSlotsHelp')}
                        </Typography>
                    </Box>
                    <Box>
                        <FormControl fullWidth sx={{ maxWidth: { sm: '50%' } }}>
                            <InputLabel>{t('timezone')}</InputLabel>
                            <Select
                                id="timezone"
                                value={localSettings.timezone}
                                onChange={e => handleSettingsChange('timezone', e.target.value)}
                                label={t('timezone')}
                            >
                                {timezones.map(tz => (
                                    <MenuItem key={tz.value} value={tz.value}>{tz.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {t('timezoneHelp')}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">
                            {t('roomAssignments')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {t('roomAssignmentsHelp')}
                        </Typography>
                    </Box>
                    <Button
                        type="button"
                        onClick={handleAddRoom}
                        size="small"
                        startIcon={<PlusIcon />}
                        color="primary"
                        sx={{ textTransform: 'none', flexShrink: 0 }}
                    >
                        {t('addRoom')}
                    </Button>
                </Box>
                <Stack spacing={1.5} sx={{ maxHeight: 320, overflowY: 'auto', pr: 1 }}>
                    {localSettings.rooms.map((room) => (
                        <Paper key={room.id} sx={{ p: 2, bgcolor: 'action.hover' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <TextField
                                    type="text"
                                    value={room.name}
                                    onChange={(e) => handleRoomNameChange(room.id, e.target.value)}
                                    variant="standard"
                                    sx={{
                                        fontWeight: 600,
                                        '& .MuiInput-underline:before': { borderBottom: '2px solid transparent' },
                                        '& .MuiInput-underline:hover:before': { borderBottom: '2px solid rgba(0, 0, 0, 0.42)' },
                                        '& .MuiInput-underline:after': { borderBottom: '2px solid' }
                                    }}
                                />
                                <IconButton
                                    type="button"
                                    onClick={() => handleRemoveRoom(room.id)}
                                    size="small"
                                    color="error"
                                    aria-label={`Remove ${room.name}`}
                                >
                                    <TrashIcon />
                                </IconButton>
                            </Box>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                {majors.map(major => (
                                    <Grid size={{ xs: 6, sm: 3 }} key={major.id}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={room.majorIds.includes(major.id)}
                                                    onChange={(e) => handleRoomMajorChange(room.id, major.id, e.target.checked)}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Typography variant="body2" noWrap title={major.name}>
                                                    {major.abbreviation}
                                                </Typography>
                                            }
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    ))}
                </Stack>
            </Paper>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {t('stationaryAssignments')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('stationaryAssignmentsHelp')}
                </Typography>
                <Stack spacing={1.5}>
                    {localSettings.rooms.map(room => (
                        <Paper key={room.id} sx={{ p: 2, bgcolor: 'action.hover' }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Typography variant="body2" fontWeight="medium">
                                        {room.name}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 8 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>{t('anyAdvisor')}</InputLabel>
                                        <Select
                                            value={localSettings.stationaryAdvisors?.[room.id] || ''}
                                            onChange={e => handleStationaryAdvisorChange(room.id, e.target.value)}
                                            label={t('anyAdvisor')}
                                        >
                                            <MenuItem value="">{t('anyAdvisor')}</MenuItem>
                                            {advisors.map(adv => (
                                                <MenuItem key={adv.id} value={adv.id}>{adv.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Paper>
                    ))}
                </Stack>
            </Paper>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'flex-end', alignItems: 'center', gap: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                >
                    {t('saveSettings')}
                </Button>
                <Button
                    type="button"
                    variant="contained"
                    color="secondary"
                    startIcon={<SparklesIcon />}
                    onClick={handleRunAutoSchedule}
                    sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                >
                    {t('runAutoScheduler')}
                </Button>
            </Box>
        </Stack>
    );
};

export default DefenseSettingsEditor;
