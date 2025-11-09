import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, TextField, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Grid, Stack, FormControl, InputLabel, ToggleButton, ToggleButtonGroup,
  InputAdornment, Card, CardContent
} from '@mui/material';
import { 
  Search as SearchIcon, Download as DownloadIcon, UploadFile as UploadFileIcon,
  Delete as DeleteIcon, Check as CheckIcon, Settings as SettingsIcon,
  AutoAwesome as AutoAwesomeIcon, Assignment as AssignmentIcon,
  Delete as TrashIcon
} from '@mui/icons-material';
import { ProjectGroup, Advisor, DefenseSettings, Major, User } from '../types';
import { useToast } from '../hooks/useToast';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import { ExcelUtils } from '../utils/excelUtils';
import ImportReviewModal from './ImportReviewModal';
import ConfirmationModal from './ConfirmationModal';
import { useTranslations } from '../hooks/useTranslations';

type EditSortKey = 'projectId' | 'topicEng' | 'advisorName';
type DetailSortKey = 'defenseDate' | 'defenseTime' | 'defenseRoom' | 'studentId' | 'projectId' | 'topicEng' | 'advisorName';
type ReviewData = {
    projectId: string;
    date: string;
    time: string;
    room: string;
    _status: 'update' | 'error';
    _error?: string;
};
type ActiveView = 'projects' | 'students' | 'advisors' | 'majors' | 'classrooms' | 'milestoneTemplates' | 'submissions' | 'timeline' | 'analytics' | 'announcements' | 'committees' | 'scoring' | 'finalGrades' | 'settings' | 'calendar' | 'reporting';


interface CommitteeManagementProps {
    projectGroups: ProjectGroup[];
    advisors: Advisor[];
    majors: Major[];
    user: User;
    committeeCounts: Record<string, { main: number; second: number; third: number }>;
    updateProjectCommittee: (projectId: string, actor: User, committeeType: 'main' | 'second' | 'third', advisorId: string | null) => void;
    updateProjectDefenseSchedule: (projectId: string, actor: User, schedule: { date: string | null; time: string | null; room: string | null }) => void;
    onSelectProject: (projectGroup: ProjectGroup) => void;
    defenseSettings: DefenseSettings;
    bulkUpdateSchedules: (updates: { projectId: string; date: string | null; time: string | null; room: string | null }[]) => void;
    autoScheduleDefenses: (settings: DefenseSettings) => { committeesAssigned: number; defensesScheduled: number; };
    clearAllSchedulesAndCommittees: () => void;
    onNavigate: (view: ActiveView) => void;
}

const CommitteeManagement: React.FC<CommitteeManagementProps> = ({ projectGroups, advisors, majors, committeeCounts, updateProjectCommittee, updateProjectDefenseSchedule, onSelectProject, defenseSettings, bulkUpdateSchedules, autoScheduleDefenses, clearAllSchedulesAndCommittees, onNavigate, user }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig<EditSortKey> | null>({ key: 'projectId', direction: 'ascending' });
    const [detailSortConfig, setDetailSortConfig] = useState<SortConfig<DetailSortKey> | null>({ key: 'defenseDate', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');
    const [edits, setEdits] = useState<Record<string, { date: string; time: string; room: string }>>({});
    const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');
    const [scheduleFilter, setScheduleFilter] = useState<'all' | 'scheduled' | 'unscheduled'>('all');
    const [committeeFilter, setCommitteeFilter] = useState<'all' | 'full' | 'partial' | 'unassigned'>('all');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewData, setReviewData] = useState<ReviewData[]>([]);
    const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
    const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const addToast = useToast();
    const t = useTranslations();

    const timeSlots = useMemo(() => defenseSettings.timeSlots.split(',').map(s => s.trim()).filter(Boolean), [defenseSettings.timeSlots]);
    const roomOptions = useMemo(() => defenseSettings.rooms.map(room => room.name), [defenseSettings.rooms]);
    
    const requestSort = (key: EditSortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const requestDetailSort = (key: DetailSortKey) => {
        let direction: SortDirection = 'ascending';
        if (detailSortConfig && detailSortConfig.key === key && detailSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setDetailSortConfig({ key, direction });
    };

    const filteredProjects = useMemo(() => {
        let projects = [...projectGroups];

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            projects = projects.filter(pg =>
                pg.project.projectId.toLowerCase().includes(lowercasedQuery) ||
                pg.project.topicEng.toLowerCase().includes(lowercasedQuery) ||
                pg.project.advisorName.toLowerCase().includes(lowercasedQuery) ||
                pg.students.some(s => `${s.name} ${s.surname}`.toLowerCase().includes(lowercasedQuery))
            );
        }

        if (scheduleFilter !== 'all') {
            projects = projects.filter(pg => {
                const isScheduled = pg.project.defenseDate && pg.project.defenseTime && pg.project.defenseRoom;
                return scheduleFilter === 'scheduled' ? isScheduled : !isScheduled;
            });
        }

        if (committeeFilter !== 'all') {
            projects = projects.filter(pg => {
                const { mainCommitteeId, secondCommitteeId, thirdCommitteeId } = pg.project;
                const assignedCount = [mainCommitteeId, secondCommitteeId, thirdCommitteeId].filter(Boolean).length;
                
                if (committeeFilter === 'full') return assignedCount === 3;
                if (committeeFilter === 'partial') return assignedCount > 0 && assignedCount < 3;
                if (committeeFilter === 'unassigned') return assignedCount === 0;
                return true;
            });
        }

        return projects;
    }, [projectGroups, searchQuery, scheduleFilter, committeeFilter]);

    const getAdvisorNameById = useCallback((id: string | null): string => {
        if (!id) return t('na');
        return advisors.find(a => a.id === id)?.name || 'Unknown';
    }, [advisors, t]);

    const sortedAndFilteredProjects = useMemo(() => {
        let sortableItems = [...filteredProjects];
        if (sortConfig !== null && viewMode === 'edit') {
            sortableItems.sort((a, b) => {
                const aValue = a.project[sortConfig.key];
                const bValue = b.project[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        } else if (viewMode === 'view') {
            sortableItems.sort((a, b) => {
                const chronologicalKeys: DetailSortKey[] = ['defenseDate', 'defenseTime', 'defenseRoom'];
                const primaryKey = detailSortConfig?.key || 'defenseDate';
                const primaryDirection = detailSortConfig?.direction || 'ascending';
                const sortOrder = [
                    primaryKey,
                    ...chronologicalKeys.filter(k => k !== primaryKey)
                ];

                for (const key of sortOrder) {
                    const direction = (key === primaryKey) ? primaryDirection : 'ascending';
                    const order = direction === 'ascending' ? 1 : -1;
                    
                    let valA: string, valB: string;

                    switch(key) {
                        case 'defenseDate':
                            valA = a.project.defenseDate || 'z';
                            valB = b.project.defenseDate || 'z';
                            break;
                        case 'defenseTime':
                            valA = a.project.defenseTime || 'z';
                            valB = b.project.defenseTime || 'z';
                            break;
                        case 'defenseRoom':
                            valA = a.project.defenseRoom || 'z';
                            valB = b.project.defenseRoom || 'z';
                            break;
                        case 'studentId':
                            valA = a.students[0]?.studentId || '';
                            valB = b.students[0]?.studentId || '';
                            break;
                        case 'projectId':
                            valA = a.project.projectId;
                            valB = b.project.projectId;
                            break;
                        case 'topicEng':
                            valA = a.project.topicEng;
                            valB = b.project.topicEng;
                            break;
                        case 'advisorName':
                            valA = a.project.advisorName;
                            valB = b.project.advisorName;
                            break;
                        default:
                            valA = '';
                            valB = '';
                    }
                    
                    const comparison = valA.localeCompare(valB, undefined, { numeric: key === 'defenseRoom' });
                    if (comparison !== 0) {
                        return comparison * order;
                    }
                }
                return a.project.projectId.localeCompare(b.project.projectId);
            });
        }
        return sortableItems;
    }, [filteredProjects, sortConfig, detailSortConfig, viewMode]);

    const handleCommitteeChange = (projectId: string, committeeType: 'main' | 'second' | 'third', advisorId: string | null) => {
        updateProjectCommittee(projectId, user, committeeType, advisorId);
        const advisorName = advisorId ? advisors.find(a => a.id === advisorId)?.name : 'None';
        addToast({ type: 'success', message: t('committeeUpdatedToast').replace('${projectId}', projectId).replace('${advisorName}', advisorName) });
    };

    const handleEditChange = (projectId: string, field: 'date' | 'time' | 'room', value: string) => {
        const project = projectGroups.find(pg => pg.project.projectId === projectId)?.project;
        if (!project) return;
        
        setEdits(prev => ({
            ...prev,
            [projectId]: {
                date: prev[projectId]?.date ?? project.defenseDate ?? '',
                time: prev[projectId]?.time ?? project.defenseTime ?? '',
                room: prev[projectId]?.room ?? project.defenseRoom ?? '',
                [field]: value,
            }
        }));
    };
    
    const handleSaveSchedule = (projectId: string) => {
        const newSchedule = edits[projectId];
        if (!newSchedule) return;

        updateProjectDefenseSchedule(projectId, user, {
            date: newSchedule.date || null,
            time: newSchedule.time || null,
            room: newSchedule.room || null,
        });

        setEdits(prev => {
            const newEdits = { ...prev };
            delete newEdits[projectId];
            return newEdits;
        });

        addToast({ type: 'success', message: t('scheduleUpdatedToast').replace('${projectId}', projectId) });
    };

    const handleDeleteScheduleRequest = (projectId: string) => {
        setScheduleToDelete(projectId);
    };

    const confirmDeleteSchedule = () => {
        if (scheduleToDelete) {
            updateProjectDefenseSchedule(scheduleToDelete, user, { date: null, time: null, room: null });
            // Also clear pending edits for this project to avoid confusion
            setEdits(prev => {
                const newEdits = { ...prev };
                delete newEdits[scheduleToDelete];
                return newEdits;
            });
            addToast({ type: 'success', message: t('scheduleClearedToast').replace('${scheduleToDelete}', scheduleToDelete) });
            setScheduleToDelete(null);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const json = await ExcelUtils.readExcelFile(file);

                const existingProjectIds = new Set(projectGroups.map(p => p.project.projectId));

                const processedData: ReviewData[] = json
                    .filter(row => row['Project ID'] && row['Project ID'].toString().trim()) // Only process rows that have a non-empty Project ID
                    .map(row => {
                        const projectId = row['Project ID']?.toString().trim();
                        let dateStr = row['Defense Date'];
                        if (dateStr instanceof Date) {
                            const year = dateStr.getFullYear();
                            const month = (dateStr.getMonth() + 1).toString().padStart(2, '0');
                            const day = dateStr.getDate().toString().padStart(2, '0');
                            dateStr = `${year}-${month}-${day}`;
                        } else if (typeof dateStr === 'string') {
                            dateStr = dateStr.trim();
                        } else {
                            dateStr = '';
                        }

                        const time = row['Defense Time']?.toString().trim();
                        const room = row['Defense Room']?.toString().trim();

                        if (!projectId) return { projectId: '', date: '', time: '', room: '', _status: 'error', _error: 'Missing Project ID' };
                        
                        if (!existingProjectIds.has(projectId)) {
                            return { projectId, date: dateStr, time, room, _status: 'error', _error: 'Project ID not found.' };
                        }
                        if (dateStr && isNaN(new Date(dateStr).getTime())) {
                            return { projectId, date: dateStr, time, room, _status: 'error', _error: 'Invalid date format. Use YYYY-MM-DD.' };
                        }
                        if (time && !timeSlots.includes(time)) {
                            return { projectId, date: dateStr, time, room, _status: 'error', _error: `Time slot "${time}" is not in settings.` };
                        }
                        if (room && !roomOptions.includes(room)) {
                            return { projectId, date: dateStr, time, room, _status: 'error', _error: `Room "${room}" is not in settings.` };
                        }

                        return { projectId, date: dateStr || '', time: time || '', room: room || '', _status: 'update' };
                    });

            setReviewData(processedData);
            setIsReviewModalOpen(true);
        } catch (error) {
            addToast({ type: 'error', message: t('fileParseError') });
            console.error("File parse error:", error);
        } finally {
            if (event.target) event.target.value = '';
        }
    };

    const handleConfirmImport = (validData: Omit<ReviewData, '_status' | '_error'>[]) => {
        const updates = validData.map(d => ({
            projectId: d.projectId,
            date: d.date || null,
            time: d.time || null,
            room: d.room || null,
        }));
        bulkUpdateSchedules(updates);
        addToast({ type: 'success', message: t('importSchedulesSuccessToast').replace('${count}', String(updates.length)) });
        setIsReviewModalOpen(false);
    };
    
    const handleExportExcel = useCallback(async () => {
        const dataToExport = sortedAndFilteredProjects.flatMap(pg => {
            const project = pg.project;
            const student1 = pg.students[0];
            const student2 = pg.students[1];
            
            const baseData = {
                [t('defenseDate')]: project.defenseDate || t('na'),
                [t('defenseTime')]: project.defenseTime || t('na'),
                [t('defenseRoom')]: project.defenseRoom || t('na'),
                [t('projectId')]: project.projectId,
                [t('topicLao')]: project.topicLao,
                [t('topicEng')]: project.topicEng,
                [t('mainAdvisor')]: project.advisorName,
                [t('mainCommittee')]: getAdvisorNameById(project.mainCommitteeId),
                [t('secondCommittee')]: getAdvisorNameById(project.secondCommitteeId),
                [t('thirdCommittee')]: getAdvisorNameById(project.thirdCommitteeId),
            };
            
            const result = [];
            if (student1) {
                result.push({
                    ...baseData,
                    [t('studentId')]: student1.studentId,
                    [t('gender')]: student1.gender,
                    [t('studentName')]: `${student1.name} ${student1.surname}`,
                    [t('major')]: student1.major,
                });
            }
            if (student2) {
                result.push({
                    ...baseData,
                    [t('studentId')]: student2.studentId,
                    [t('gender')]: student2.gender,
                    [t('studentName')]: `${student2.name} ${student2.surname}`,
                    [t('major')]: student2.major,
                });
            }
            return result;
        });
    
        if (dataToExport.length === 0) {
            addToast({ type: 'info', message: t('noDataToExport') });
            return;
        }
    
        await ExcelUtils.exportToExcel(dataToExport, 'committee_schedules.xlsx');
        addToast({ type: 'success', message: t('exportMergedSuccessToast') });
    }, [sortedAndFilteredProjects, getAdvisorNameById, addToast, t]);
    
    const handleDownloadTemplate = useCallback(async () => {
        const templateData = [
            {
                [t('projectId')]: 'EXAMPLE-001',
                [t('defenseDate')]: '2024-12-15',
                [t('defenseTime')]: timeSlots[0] || '',
                [t('defenseRoom')]: roomOptions[0] || '',
            },
        ];
        
        await ExcelUtils.exportToExcel(templateData, 'committee_schedule_template.xlsx');
        addToast({ type: 'success', message: t('scheduleTemplateDownloaded') });
    }, [addToast, timeSlots, roomOptions, t]);

    const handleRunAutoSchedule = () => {
        const { committeesAssigned, defensesScheduled } = autoScheduleDefenses(defenseSettings);
        
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

    const handleConfirmClearAll = () => {
        clearAllSchedulesAndCommittees();
        setIsClearAllModalOpen(false);
    };

    const renderAdvisorSelect = (projectGroup: ProjectGroup, committeeType: 'main' | 'second' | 'third') => {
        const { project, students } = projectGroup;
        const committeeKey = `${committeeType}CommitteeId` as const;
        const committeeQuotaKey = `${committeeType}CommitteeQuota` as const;
        const projectMajor = majors.find(m => m.name === students[0]?.major);

        return (
            <FormControl fullWidth size="small">
                <Select
                    value={project[committeeKey] || ''}
                    onChange={(e) => handleCommitteeChange(project.projectId, committeeType, e.target.value || null)}
                >
                    <MenuItem value="">-- {t('selectAnAdvisor')} --</MenuItem>
                    {advisors.map(adv => {
                        const currentCount = committeeCounts[adv.id]?.[committeeType] || 0;
                        const quota = adv[committeeQuotaKey];
                        const isFull = currentCount >= quota;
                        
                        const isMainAdvisor = adv.name === project.advisorName;

                        const isAssignedElsewhere = (adv.id === project.mainCommitteeId && committeeType !== 'main') ||
                                                  (adv.id === project.secondCommitteeId && committeeType !== 'second') ||
                                                  (adv.id === project.thirdCommitteeId && committeeType !== 'third');
                        
                        const isSpecialized = projectMajor && adv.specializedMajorIds?.includes(projectMajor.id);

                        const isDisabled = (!isSpecialized || isFull || isAssignedElsewhere || isMainAdvisor) && adv.id !== project[committeeKey];

                        let label = `${adv.name} (${currentCount}/${quota})`;
                        if (isDisabled && adv.id !== project[committeeKey]) {
                            const reasons = [];
                            if (!isSpecialized) reasons.push(t('notSpecialized'));
                            if (isFull) reasons.push(t('quotaFull'));
                            if (isAssignedElsewhere) reasons.push(t('assigned'));
                            if (isMainAdvisor) reasons.push(t('mainAdvisor'));
                            if (reasons.length > 0) {
                                label += ` - ${reasons.join(', ')}`;
                            }
                        }

                        return (
                            <MenuItem key={adv.id} value={adv.id} disabled={isDisabled}>
                                {label}
                            </MenuItem>
                        );
                    })}
                </Select>
            </FormControl>
        );
    };

    return (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 3,
                gap: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                   <AssignmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                   <Box>
                     <Typography variant="h5" component="h2" fontWeight="bold">
                       {t('committeeManagement')}
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                       {t('committeeManagementDescription')}
                     </Typography>
                   </Box>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: { xs: 2, sm: 0 } }}>
                    <Button
                        onClick={() => setIsClearAllModalOpen(true)}
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        sx={{ fontWeight: 'bold' }}
                    >
                        {t('clearAll')}
                    </Button>
                    <Button
                        onClick={handleRunAutoSchedule}
                        variant="contained"
                        sx={{ bgcolor: 'purple.600', '&:hover': { bgcolor: 'purple.700' }, fontWeight: 'bold' }}
                        startIcon={<AutoAwesomeIcon />}
                    >
                        {t('autoSchedule')}
                    </Button>
                    <Button
                        onClick={() => onNavigate('settings')}
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        sx={{ fontWeight: 'bold' }}
                    >
                        {t('settings')}
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".xlsx, .xls" />
                    <Button
                        onClick={handleDownloadTemplate}
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        sx={{ fontWeight: 'bold' }}
                    >
                        {t('template')}
                    </Button>
                    <Button
                        onClick={handleImportClick}
                        variant="contained"
                        startIcon={<UploadFileIcon />}
                        sx={{ bgcolor: 'teal.600', '&:hover': { bgcolor: 'teal.700' }, fontWeight: 'bold' }}
                    >
                        {t('import')}
                    </Button>
                    <Button
                        onClick={handleExportExcel}
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        sx={{ bgcolor: 'green.600', '&:hover': { bgcolor: 'green.700' }, fontWeight: 'bold' }}
                    >
                        {t('export')}
                    </Button>
                </Stack>
            </Box>
            
            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, newMode) => newMode && setViewMode(newMode)}
                    size="small"
                >
                    <ToggleButton value="edit">{t('editView')}</ToggleButton>
                    <ToggleButton value="view">{t('detailView')}</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <TextField
                    placeholder={t('searchByIdTopicAdvisor')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>{t('schedule')}</InputLabel>
                    <Select
                        value={scheduleFilter}
                        onChange={(e) => setScheduleFilter(e.target.value as any)}
                        label={t('schedule')}
                    >
                        <MenuItem value="all">{t('allSchedules')}</MenuItem>
                        <MenuItem value="scheduled">{t('scheduled')}</MenuItem>
                        <MenuItem value="unscheduled">{t('unscheduled')}</MenuItem>
                    </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>{t('committees')}</InputLabel>
                    <Select
                        value={committeeFilter}
                        onChange={(e) => setCommitteeFilter(e.target.value as any)}
                        label={t('committees')}
                    >
                        <MenuItem value="all">{t('allCommittees')}</MenuItem>
                        <MenuItem value="full">{t('fullyAssigned')}</MenuItem>
                        <MenuItem value="partial">{t('partiallyAssigned')}</MenuItem>
                        <MenuItem value="unassigned">{t('unassigned')}</MenuItem>
                    </Select>
                </FormControl>
            </Stack>
            
            {viewMode === 'edit' ? (
                <>
                    {/* Mobile/Tablet Card View - Edit Mode */}
                    <Box sx={{ display: { lg: 'none' } }}>
                        <Grid container spacing={2}>
                            {sortedAndFilteredProjects.map(pg => {
                                const hasEdits = !!edits[pg.project.projectId];
                                const hasSchedule = !!(pg.project.defenseDate || pg.project.defenseTime || pg.project.defenseRoom);
                                return (
                                    <Grid size={{ xs: 12, sm: 6 }} key={pg.project.projectId}>
                                        <Card sx={{ bgcolor: 'action.hover', p: 2 }}>
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                                    {pg.project.projectId}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {pg.project.topicEng}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {t('advisor')}: {pg.project.advisorName}
                                                </Typography>
                                            </Box>
                                            <Stack spacing={1.5} sx={{ mb: 2 }}>
                                                <Box>
                                                    <Typography variant="caption" fontWeight="medium" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                        {t('mainCommittee')}
                                                    </Typography>
                                                    {renderAdvisorSelect(pg, 'main')}
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" fontWeight="medium" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                        {t('secondCommittee')}
                                                    </Typography>
                                                    {renderAdvisorSelect(pg, 'second')}
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" fontWeight="medium" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                        {t('thirdCommittee')}
                                                    </Typography>
                                                    {renderAdvisorSelect(pg, 'third')}
                                                </Box>
                                            </Stack>
                                            <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1.5 }}>
                                                    {t('defenseSchedule')}
                                                </Typography>
                                                <Stack spacing={1.5}>
                                                    <Box>
                                                        <Typography variant="caption" fontWeight="medium" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                            {t('defenseDate')}
                                                        </Typography>
                                                        <TextField
                                                            type="date"
                                                            size="small"
                                                            fullWidth
                                                            InputLabelProps={{ shrink: true }}
                                                            inputProps={{ min: defenseSettings.startDefenseDate || undefined }}
                                                            value={edits[pg.project.projectId]?.date ?? pg.project.defenseDate ?? ''}
                                                            onChange={e => handleEditChange(pg.project.projectId, 'date', e.target.value)}
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" fontWeight="medium" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                            {t('defenseTime')}
                                                        </Typography>
                                                        <FormControl fullWidth size="small">
                                                            <Select
                                                                value={edits[pg.project.projectId]?.time ?? pg.project.defenseTime ?? ''}
                                                                onChange={e => handleEditChange(pg.project.projectId, 'time', e.target.value)}
                                                            >
                                                                <MenuItem value="">-- {t('selectTime')} --</MenuItem>
                                                                {timeSlots.map(slot => <MenuItem key={slot} value={slot}>{slot}</MenuItem>)}
                                                            </Select>
                                                        </FormControl>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" fontWeight="medium" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                            {t('defenseRoom')}
                                                        </Typography>
                                                        <FormControl fullWidth size="small">
                                                            <Select
                                                                value={edits[pg.project.projectId]?.room ?? pg.project.defenseRoom ?? ''}
                                                                onChange={e => handleEditChange(pg.project.projectId, 'room', e.target.value)}
                                                            >
                                                                <MenuItem value="">-- {t('selectRoom')} --</MenuItem>
                                                                {roomOptions.map(room => <MenuItem key={room} value={room}>{room}</MenuItem>)}
                                                            </Select>
                                                        </FormControl>
                                                    </Box>
                                                </Stack>
                                                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 2 }}>
                                                    <Button
                                                        variant="contained"
                                                        color="error"
                                                        size="small"
                                                        startIcon={<TrashIcon />}
                                                        onClick={() => handleDeleteScheduleRequest(pg.project.projectId)}
                                                        disabled={!hasSchedule}
                                                    >
                                                        {t('clearAll')}
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        size="small"
                                                        startIcon={<CheckIcon />}
                                                        onClick={() => handleSaveSchedule(pg.project.projectId)}
                                                        disabled={!hasEdits}
                                                    >
                                                        {t('saveChanges')}
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        </Card>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </Box>
                    {/* Desktop Table View - Edit Mode */}
                    <Box sx={{ display: { xs: 'none', lg: 'block' }, overflowX: 'auto' }}>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ px: 2, py: 1.5 }}>{t('defenseDate')}</TableCell>
                                        <TableCell sx={{ px: 2, py: 1.5 }}>{t('defenseTime')}</TableCell>
                                        <TableCell sx={{ px: 2, py: 1.5 }}>{t('defenseRoom')}</TableCell>
                                        <SortableHeader sortKey="projectId" title={t('projectId')} sortConfig={sortConfig} requestSort={requestSort} />
                                        <SortableHeader sortKey="topicEng" title={t('topicEng')} sortConfig={sortConfig} requestSort={requestSort} />
                                        <SortableHeader sortKey="advisorName" title={t('mainAdvisor')} sortConfig={sortConfig} requestSort={requestSort} />
                                        <TableCell sx={{ px: 3, py: 1.5 }}>{t('mainCommittee')}</TableCell>
                                        <TableCell sx={{ px: 3, py: 1.5 }}>{t('secondCommittee')}</TableCell>
                                        <TableCell sx={{ px: 3, py: 1.5 }}>{t('thirdCommittee')}</TableCell>
                                        <TableCell align="right" sx={{ px: 3, py: 1.5 }}>{t('actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedAndFilteredProjects.map(pg => {
                                        const hasEdits = !!edits[pg.project.projectId];
                                        const hasSchedule = !!(pg.project.defenseDate || pg.project.defenseTime || pg.project.defenseRoom);
                                        return (
                                            <TableRow 
                                                key={pg.project.projectId}
                                                sx={{ 
                                                    '&:hover': { bgcolor: 'action.hover' }
                                                }}
                                            >
                                                <TableCell sx={{ px: 2, py: 1, width: 160 }}>
                                                    <TextField
                                                        type="date"
                                                        size="small"
                                                        fullWidth
                                                        InputLabelProps={{ shrink: true }}
                                                        inputProps={{ min: defenseSettings.startDefenseDate || undefined }}
                                                        value={edits[pg.project.projectId]?.date ?? pg.project.defenseDate ?? ''}
                                                        onChange={e => handleEditChange(pg.project.projectId, 'date', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ px: 2, py: 1, width: 192 }}>
                                                    <FormControl fullWidth size="small">
                                                        <Select
                                                            value={edits[pg.project.projectId]?.time ?? pg.project.defenseTime ?? ''}
                                                            onChange={e => handleEditChange(pg.project.projectId, 'time', e.target.value)}
                                                        >
                                                            <MenuItem value="">-- {t('selectTime')} --</MenuItem>
                                                            {timeSlots.map(slot => <MenuItem key={slot} value={slot}>{slot}</MenuItem>)}
                                                        </Select>
                                                    </FormControl>
                                                </TableCell>
                                                <TableCell sx={{ px: 2, py: 1, width: 144 }}>
                                                    <FormControl fullWidth size="small">
                                                        <Select
                                                            value={edits[pg.project.projectId]?.room ?? pg.project.defenseRoom ?? ''}
                                                            onChange={e => handleEditChange(pg.project.projectId, 'room', e.target.value)}
                                                        >
                                                            <MenuItem value="">-- {t('selectRoom')} --</MenuItem>
                                                            {roomOptions.map(room => <MenuItem key={room} value={room}>{room}</MenuItem>)}
                                                        </Select>
                                                    </FormControl>
                                                </TableCell>
                                                <TableCell sx={{ px: 3, py: 2, fontWeight: 'medium', whiteSpace: 'nowrap' }}>
                                                    {pg.project.projectId}
                                                </TableCell>
                                                <TableCell sx={{ px: 3, py: 2 }}>{pg.project.topicEng}</TableCell>
                                                <TableCell sx={{ px: 3, py: 2 }}>{pg.project.advisorName}</TableCell>
                                                <TableCell sx={{ px: 3, py: 2, width: 208 }}>{renderAdvisorSelect(pg, 'main')}</TableCell>
                                                <TableCell sx={{ px: 3, py: 2, width: 208 }}>{renderAdvisorSelect(pg, 'second')}</TableCell>
                                                <TableCell sx={{ px: 3, py: 2, width: 208 }}>{renderAdvisorSelect(pg, 'third')}</TableCell>
                                                <TableCell align="right" sx={{ px: 3, py: 2 }}>
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleSaveSchedule(pg.project.projectId)}
                                                            disabled={!hasEdits}
                                                            aria-label={t('saveSchedule')}
                                                        >
                                                            <CheckIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteScheduleRequest(pg.project.projectId)}
                                                            disabled={!hasSchedule}
                                                            aria-label={t('deleteSchedule')}
                                                        >
                                                            <TrashIcon />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {sortedAndFilteredProjects.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                                {searchQuery ? t('noProjectsForQuery').replace('${query}', searchQuery) : t('noProjectsAvailable')}
                            </Box>
                        )}
                    </Box>
                </>
            ) : (
                <>
                    {/* Mobile/Tablet Card View - Detail Mode */}
                    <Box sx={{ display: { lg: 'none' } }}>
                        <Grid container spacing={2}>
                            {sortedAndFilteredProjects.map(pg => (
                                <Grid size={{ xs: 12, sm: 6 }} key={pg.project.projectId}>
                                    <Card sx={{ bgcolor: 'action.hover', p: 2 }}>
                                        <Box sx={{ pb: 2, mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                                {pg.project.projectId}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {pg.project.topicEng}
                                            </Typography>
                                        </Box>
                                        <Stack spacing={0.5} sx={{ mb: 2 }}>
                                            <Typography variant="caption">
                                                <Typography component="span" fontWeight="medium" color="text.secondary">{t('defenseDate')}:</Typography> {pg.project.defenseDate || 'N/A'}
                                            </Typography>
                                            <Typography variant="caption">
                                                <Typography component="span" fontWeight="medium" color="text.secondary">{t('defenseTime')}:</Typography> {pg.project.defenseTime || 'N/A'}
                                            </Typography>
                                            <Typography variant="caption">
                                                <Typography component="span" fontWeight="medium" color="text.secondary">{t('defenseRoom')}:</Typography> {pg.project.defenseRoom || 'N/A'}
                                            </Typography>
                                            <Typography variant="caption">
                                                <Typography component="span" fontWeight="medium" color="text.secondary">{t('advisor')}:</Typography> {pg.project.advisorName}
                                            </Typography>
                                            <Typography variant="caption">
                                                <Typography component="span" fontWeight="medium" color="text.secondary">{t('mainCommittee')}:</Typography> {getAdvisorNameById(pg.project.mainCommitteeId)}
                                            </Typography>
                                            <Typography variant="caption">
                                                <Typography component="span" fontWeight="medium" color="text.secondary">{t('secondCommittee')}:</Typography> {getAdvisorNameById(pg.project.secondCommitteeId)}
                                            </Typography>
                                            <Typography variant="caption">
                                                <Typography component="span" fontWeight="medium" color="text.secondary">{t('thirdCommittee')}:</Typography> {getAdvisorNameById(pg.project.thirdCommitteeId)}
                                            </Typography>
                                        </Stack>
                                        {pg.students.map((s, i) => (
                                            <Box key={s.studentId} sx={{ pt: i > 0 ? 1 : 0, ...(i > 0 && { borderTop: 1, borderColor: 'divider' }) }}>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {s.name} {s.surname}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {s.studentId} - {s.major}
                                                </Typography>
                                            </Box>
                                        ))}
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => onSelectProject(pg)}
                                                sx={{ 
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                    borderRadius: 3
                                                }}
                                            >
                                                {t('view')}
                                            </Button>
                                        </Box>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                    {/* Desktop Table View - Detail Mode */}
                    <Box sx={{ display: { xs: 'none', lg: 'block' }, overflowX: 'auto' }}>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <SortableHeader sortKey="defenseDate" title={t('defenseDate')} sortConfig={detailSortConfig} requestSort={requestDetailSort} />
                                        <SortableHeader sortKey="defenseTime" title={t('defenseTime')} sortConfig={detailSortConfig} requestSort={requestDetailSort} />
                                        <SortableHeader sortKey="defenseRoom" title={t('defenseRoom')} sortConfig={detailSortConfig} requestSort={requestDetailSort} />
                                        <SortableHeader sortKey="studentId" title={t('studentId')} sortConfig={detailSortConfig} requestSort={requestDetailSort} />
                                        <TableCell sx={{ px: 3, py: 1.5 }}>{t('gender')}</TableCell>
                                        <TableCell sx={{ px: 3, py: 1.5 }}>{t('name')}</TableCell>
                                        <TableCell sx={{ px: 3, py: 1.5 }}>{t('major')}</TableCell>
                                        <SortableHeader sortKey="projectId" title={t('projectId')} sortConfig={detailSortConfig} requestSort={requestDetailSort} />
                                        <TableCell sx={{ px: 3, py: 1.5 }}>{t('topicLao')}</TableCell>
                                        <SortableHeader sortKey="topicEng" title={t('topicEng')} sortConfig={detailSortConfig} requestSort={requestDetailSort} />
                                        <SortableHeader sortKey="advisorName" title={t('mainAdvisor')} sortConfig={detailSortConfig} requestSort={requestDetailSort} />
                                        <TableCell sx={{ px: 3, py: 1.5 }}>{t('mainCommittee')}</TableCell>
                                        <TableCell sx={{ px: 3, py: 1.5 }}>{t('secondCommittee')}</TableCell>
                                        <TableCell sx={{ px: 3, py: 1.5 }}>{t('thirdCommittee')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedAndFilteredProjects.map((pg) => {
                                        const { project, students } = pg;
                                        const student1 = students[0];
                                        const student2 = students[1];

                                        return (
                                            <React.Fragment key={project.projectId}>
                                                <TableRow sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                    <TableCell rowSpan={2} sx={{ px: 3, py: 2, verticalAlign: 'top' }}>
                                                        {project.defenseDate || t('na')}
                                                    </TableCell>
                                                    <TableCell rowSpan={2} sx={{ px: 3, py: 2, verticalAlign: 'top' }}>
                                                        {project.defenseTime || t('na')}
                                                    </TableCell>
                                                    <TableCell rowSpan={2} sx={{ px: 3, py: 2, verticalAlign: 'top' }}>
                                                        {project.defenseRoom || t('na')}
                                                    </TableCell>
                                                    <TableCell sx={{ px: 3, py: 2 }}>{student1.studentId}</TableCell>
                                                    <TableCell sx={{ px: 3, py: 2 }}>{student1.gender}</TableCell>
                                                    <TableCell sx={{ px: 3, py: 2 }}>{student1.name} {student1.surname}</TableCell>
                                                    <TableCell sx={{ px: 3, py: 2 }}>{student1.major}</TableCell>
                                                    <TableCell rowSpan={2} sx={{ px: 3, py: 2, verticalAlign: 'top' }}>
                                                        <Button
                                                            onClick={() => onSelectProject(pg)}
                                                            sx={{ 
                                                                fontWeight: 500,
                                                                textTransform: 'none',
                                                                minWidth: 'auto',
                                                                p: 0
                                                            }}
                                                        >
                                                            {project.projectId}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell rowSpan={2} sx={{ px: 3, py: 2, verticalAlign: 'top' }}>
                                                        {project.topicLao}
                                                    </TableCell>
                                                    <TableCell rowSpan={2} sx={{ px: 3, py: 2, verticalAlign: 'top' }}>
                                                        {project.topicEng}
                                                    </TableCell>
                                                    <TableCell rowSpan={2} sx={{ px: 3, py: 2, verticalAlign: 'top' }}>
                                                        {project.advisorName}
                                                    </TableCell>
                                                    <TableCell rowSpan={2} sx={{ px: 3, py: 2, verticalAlign: 'top' }}>
                                                        {getAdvisorNameById(project.mainCommitteeId)}
                                                    </TableCell>
                                                    <TableCell rowSpan={2} sx={{ px: 3, py: 2, verticalAlign: 'top' }}>
                                                        {getAdvisorNameById(project.secondCommitteeId)}
                                                    </TableCell>
                                                    <TableCell rowSpan={2} sx={{ px: 3, py: 2, verticalAlign: 'top' }}>
                                                        {getAdvisorNameById(project.thirdCommitteeId)}
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                    {student2 ? (
                                                        <>
                                                            <TableCell sx={{ px: 3, py: 2 }}>{student2.studentId}</TableCell>
                                                            <TableCell sx={{ px: 3, py: 2 }}>{student2.gender}</TableCell>
                                                            <TableCell sx={{ px: 3, py: 2 }}>{student2.name} {student2.surname}</TableCell>
                                                            <TableCell sx={{ px: 3, py: 2 }}>{student2.major}</TableCell>
                                                        </>
                                                    ) : (
                                                        <TableCell colSpan={4} sx={{ px: 3, py: 2 }}>&nbsp;</TableCell>
                                                    )}
                                                </TableRow>
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {sortedAndFilteredProjects.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                                {searchQuery ? t('noProjectsForQuery').replace('${query}', searchQuery) : t('noProjectsAvailable')}
                            </Box>
                        )}
                    </Box>
                </>
            )}
            {isReviewModalOpen && (
                <ImportReviewModal<ReviewData>
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    onConfirm={handleConfirmImport}
                    data={reviewData}
                    columns={[
                        { key: '_status', header: 'Status' },
                        { key: 'projectId', header: 'Project ID' },
                        { key: 'date', header: 'Defense Date' },
                        { key: 'time', header: 'Defense Time' },
                        { key: 'room', header: 'Defense Room' },
                        { key: '_error', header: 'Error' },
                    ]}
                    dataTypeName={t('schedules')}
                />
            )}
            {scheduleToDelete && (
                <ConfirmationModal
                    isOpen={!!scheduleToDelete}
                    onClose={() => setScheduleToDelete(null)}
                    onConfirm={confirmDeleteSchedule}
                    title={t('clearScheduleTitle')}
                    message={t('clearScheduleMessage').replace('${projectId}', scheduleToDelete)}
                    confirmText={t('clearScheduleConfirm')}
                    confirmButtonColor="error"
                />
            )}
            {isClearAllModalOpen && (
                <ConfirmationModal
                    isOpen={isClearAllModalOpen}
                    onClose={() => setIsClearAllModalOpen(false)}
                    onConfirm={handleConfirmClearAll}
                    title={t('clearAllTitle')}
                    message={t('clearAllMessage')}
                    confirmText={t('clearAllConfirm')}
                    confirmButtonColor="error"
                />
            )}
        </Paper>
    );
};

export default CommitteeManagement;