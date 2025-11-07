import React from 'react';
import {
  Paper, TextField, Select, MenuItem, FormControl, InputLabel,
  Checkbox, FormControlLabel, Box, Grid, Chip, IconButton
} from '@mui/material';
import { Search as MagnifyingGlassIcon, Cancel as XCircleIcon, Warning as ExclamationTriangleIcon } from '@mui/icons-material';
import { Advisor, User, ProjectHealth, Major, Gender, ProjectStatus } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface ProjectFiltersProps {
    user: User;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    advisorFilter: string;
    setAdvisorFilter: (filter: string) => void;
    advisors: Advisor[];
    healthFilter?: ProjectHealth | null;
    onClearHealthFilter?: () => void;
    majors: Major[];
    genderFilter: string;
    setGenderFilter: (filter: string) => void;
    majorFilter: string;
    setMajorFilter: (filter: string) => void;
    statusFilter: string;
    setStatusFilter: (filter: string) => void;
    scheduleFilter: string;
    setScheduleFilter: (filter: string) => void;
    similarityFilter: boolean;
    setSimilarityFilter: (value: boolean) => void;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({ user, searchQuery, setSearchQuery, advisorFilter, setAdvisorFilter, advisors, healthFilter, onClearHealthFilter, majors, genderFilter, setGenderFilter, majorFilter, setMajorFilter, statusFilter, setStatusFilter, scheduleFilter, setScheduleFilter, similarityFilter, setSimilarityFilter }) => {
    const t = useTranslations();
    
    return (
        <Paper elevation={2} sx={{ p: 2 }}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 12, lg: 12 }}>
                    <TextField
                        fullWidth
                        placeholder={t('searchByIdTopicStudent')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <MagnifyingGlassIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                    />
                </Grid>
                {user.role !== 'Student' && (
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>{t('allAdvisors')}</InputLabel>
                            <Select
                                value={advisorFilter}
                                onChange={(e) => setAdvisorFilter(e.target.value)}
                                label={t('allAdvisors')}
                            >
                                <MenuItem value="all">{t('allAdvisors')}</MenuItem>
                                {advisors.map(adv => (
                                    <MenuItem key={adv.id} value={adv.name}>{adv.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel>{t('allMajors')}</InputLabel>
                        <Select
                            value={majorFilter}
                            onChange={(e) => setMajorFilter(e.target.value)}
                            label={t('allMajors')}
                        >
                            <MenuItem value="all">{t('allMajors')}</MenuItem>
                            {majors.map(m => (
                                <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel>{t('allStatuses')}</InputLabel>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            label={t('allStatuses')}
                        >
                            <MenuItem value="all">{t('allStatuses')}</MenuItem>
                            {Object.values(ProjectStatus).map(s => (
                                <MenuItem key={s} value={s}>{s}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel>{t('allGenders')}</InputLabel>
                        <Select
                            value={genderFilter}
                            onChange={(e) => setGenderFilter(e.target.value)}
                            label={t('allGenders')}
                        >
                            <MenuItem value="all">{t('allGenders')}</MenuItem>
                            {Object.values(Gender).map(g => (
                                <MenuItem key={g} value={g}>{g}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel>{t('allSchedules')}</InputLabel>
                        <Select
                            value={scheduleFilter}
                            onChange={(e) => setScheduleFilter(e.target.value)}
                            label={t('allSchedules')}
                        >
                            <MenuItem value="all">{t('allSchedules')}</MenuItem>
                            <MenuItem value="scheduled">{t('scheduled')}</MenuItem>
                            <MenuItem value="unscheduled">{t('unscheduled')}</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                {healthFilter && onClearHealthFilter && (
                    <Grid size={{ xs: 12 }}>
                        <Chip
                            label={`${t('health')}: ${healthFilter}`}
                            onDelete={onClearHealthFilter}
                            deleteIcon={<XCircleIcon />}
                            color="primary"
                            variant="outlined"
                        />
                    </Grid>
                )}
                <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={similarityFilter}
                                onChange={(e) => setSimilarityFilter(e.target.checked)}
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ExclamationTriangleIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                {t('showOnlySimilar')}
                            </Box>
                        }
                    />
                </Grid>
            </Grid>
        </Paper>
    );
};

export default ProjectFilters;