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
  AutoAwesome as AutoAwesomeIcon, Assignment as AssignmentIcon
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
                    <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sortedAndFilteredProjects.map(pg => {
                            const hasEdits = !!edits[pg.project.projectId];
                            const hasSchedule = !!(pg.project.defenseDate || pg.project.defenseTime || pg.project.defenseRoom);
                            return (
                                <div key={pg.project.projectId} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-md p-4 space-y-3">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100">{pg.project.projectId}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{pg.project.topicEng}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t('advisor')}: {pg.project.advisorName}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div><label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('mainCommittee')}</label>{renderAdvisorSelect(pg, 'main')}</div>
                                        <div><label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('secondCommittee')}</label>{renderAdvisorSelect(pg, 'second')}</div>
                                        <div><label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('thirdCommittee')}</label>{renderAdvisorSelect(pg, 'third')}</div>
                                    </div>
                                     <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                                         <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('defenseSchedule')}</p>
                                         <div>
                                             <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('defenseDate')}</label>
                                             <input type="date" min={defenseSettings.startDefenseDate || undefined} value={edits[pg.project.projectId]?.date ?? pg.project.defenseDate ?? ''} onChange={e => handleEditChange(pg.project.projectId, 'date', e.target.value)} className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"/>
                                         </div>
                                         <div>
                                             <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('defenseTime')}</label>
                                             <select value={edits[pg.project.projectId]?.time ?? pg.project.defenseTime ?? ''} onChange={e => handleEditChange(pg.project.projectId, 'time', e.target.value)} className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                                <option value="">-- {t('selectTime')} --</option>
                                                {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                                             </select>
                                         </div>
                                          <div>
                                             <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('defenseRoom')}</label>
                                              <select value={edits[pg.project.projectId]?.room ?? pg.project.defenseRoom ?? ''} onChange={e => handleEditChange(pg.project.projectId, 'room', e.target.value)} className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                                <option value="">-- {t('selectRoom')} --</option>
                                                {roomOptions.map(room => <option key={room} value={room}>{room}</option>)}
                                              </select>
                                         </div>
                                         <div className="flex justify-end pt-2 space-x-2">
                                            <button onClick={() => handleDeleteScheduleRequest(pg.project.projectId)} disabled={!hasSchedule} className="flex items-center gap-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed px-3 py-1.5">
                                                <TrashIcon className="w-4 h-4"/> {t('clearAll')}
                                            </button>
                                            <button onClick={() => handleSaveSchedule(pg.project.projectId)} disabled={!hasEdits} className="flex items-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed px-3 py-1.5">
                                                <CheckIcon className="w-4 h-4"/> {t('saveChanges')}
                                            </button>
                                         </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {/* Desktop Table View - Edit Mode */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                                <tr>
                                    <th scope="col" className="px-2 py-3">{t('defenseDate')}</th>
                                    <th scope="col" className="px-2 py-3">{t('defenseTime')}</th>
                                    <th scope="col" className="px-2 py-3">{t('defenseRoom')}</th>
                                    <SortableHeader sortKey="projectId" title={t('projectId')} sortConfig={sortConfig} requestSort={requestSort} />
                                    <SortableHeader sortKey="topicEng" title={t('topicEng')} sortConfig={sortConfig} requestSort={requestSort} />
                                    <SortableHeader sortKey="advisorName" title={t('mainAdvisor')} sortConfig={sortConfig} requestSort={requestSort} />
                                    <th scope="col" className="px-6 py-3">{t('mainCommittee')}</th>
                                    <th scope="col" className="px-6 py-3">{t('secondCommittee')}</th>
                                    <th scope="col" className="px-6 py-3">{t('thirdCommittee')}</th>
                                    <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {sortedAndFilteredProjects.map(pg => {
                                    const hasEdits = !!edits[pg.project.projectId];
                                    const hasSchedule = !!(pg.project.defenseDate || pg.project.defenseTime || pg.project.defenseRoom);
                                    return (
                                        <tr key={pg.project.projectId} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700">
                                            <td className="px-2 py-2 w-40">
                                                <input type="date" min={defenseSettings.startDefenseDate || undefined} value={edits[pg.project.projectId]?.date ?? pg.project.defenseDate ?? ''} onChange={e => handleEditChange(pg.project.projectId, 'date', e.target.value)} className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"/>
                                            </td>
                                            <td className="px-2 py-2 w-48">
                                                <select value={edits[pg.project.projectId]?.time ?? pg.project.defenseTime ?? ''} onChange={e => handleEditChange(pg.project.projectId, 'time', e.target.value)} className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                                    <option value="">-- {t('selectTime')} --</option>
                                                    {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2 w-36">
                                                <select value={edits[pg.project.projectId]?.room ?? pg.project.defenseRoom ?? ''} onChange={e => handleEditChange(pg.project.projectId, 'room', e.target.value)} className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                                    <option value="">-- {t('selectRoom')} --</option>
                                                    {roomOptions.map(room => <option key={room} value={room}>{room}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{pg.project.projectId}</td>
                                            <td className="px-6 py-4">{pg.project.topicEng}</td>
                                            <td className="px-6 py-4">{pg.project.advisorName}</td>
                                            <td className="px-6 py-4 w-52">{renderAdvisorSelect(pg, 'main')}</td>
                                            <td className="px-6 py-4 w-52">{renderAdvisorSelect(pg, 'second')}</td>
                                            <td className="px-6 py-4 w-52">{renderAdvisorSelect(pg, 'third')}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={() => handleSaveSchedule(pg.project.projectId)} disabled={!hasEdits} className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed" aria-label={t('saveSchedule')}>
                                                    <CheckIcon className="w-5 h-5"/>
                                                </button>
                                                <button onClick={() => handleDeleteScheduleRequest(pg.project.projectId)} disabled={!hasSchedule} className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed" aria-label={t('deleteSchedule')}>
                                                    <TrashIcon className="w-5 h-5"/>
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {sortedAndFilteredProjects.length === 0 && (<div className="text-center py-10 text-slate-500 dark:text-slate-400">{searchQuery ? t('noProjectsForQuery').replace('${query}', searchQuery) : t('noProjectsAvailable')}</div>)}
                    </div>
                </>
            ) : (
                <>
                    {/* Mobile/Tablet Card View - Detail Mode */}
                     <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sortedAndFilteredProjects.map(pg => (
                            <div key={pg.project.projectId} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-md p-4 space-y-3">
                                <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
                                    <p className="font-bold text-slate-800 dark:text-slate-100">{pg.project.projectId}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{pg.project.topicEng}</p>
                                </div>
                                <div className="text-xs space-y-1">
                                    <p><strong className="font-medium text-slate-500 dark:text-slate-400">{t('defenseDate')}:</strong> {pg.project.defenseDate || 'N/A'}</p>
                                    <p><strong className="font-medium text-slate-500 dark:text-slate-400">{t('defenseTime')}:</strong> {pg.project.defenseTime || 'N/A'}</p>
                                    <p><strong className="font-medium text-slate-500 dark:text-slate-400">{t('defenseRoom')}:</strong> {pg.project.defenseRoom || 'N/A'}</p>
                                    <p><strong className="font-medium text-slate-500 dark:text-slate-400">{t('advisor')}:</strong> {pg.project.advisorName}</p>
                                    <p><strong className="font-medium text-slate-500 dark:text-slate-400">{t('mainCommittee')}:</strong> {getAdvisorNameById(pg.project.mainCommitteeId)}</p>
                                    <p><strong className="font-medium text-slate-500 dark:text-slate-400">{t('secondCommittee')}:</strong> {getAdvisorNameById(pg.project.secondCommitteeId)}</p>
                                    <p><strong className="font-medium text-slate-500 dark:text-slate-400">{t('thirdCommittee')}:</strong> {getAdvisorNameById(pg.project.thirdCommitteeId)}</p>
                                </div>
                                {pg.students.map((s, i) => (
                                     <div key={s.studentId} className={`pt-2 ${i > 0 ? 'border-t border-slate-200 dark:border-slate-700' : ''}`}>
                                        <p className="font-semibold text-sm">{s.name} {s.surname}</p>
                                        <p className="text-xs text-slate-500">{s.studentId} - {s.major}</p>
                                     </div>
                                ))}
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={() => onSelectProject(pg)}
                                        className="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                    >
                                        {t('view')}
                                    </button>
                                </div>
                            </div>
                        ))}
                     </div>
                    {/* Desktop Table View - Detail Mode */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                                <tr>
                                    <SortableHeader sortKey="defenseDate" title={t('defenseDate')} sortConfig={detailSortConfig} requestSort={requestDetailSort} />
                                    <SortableHeader sortKey="defenseTime" title={t('defenseTime')} sortConfig={detailSortConfig} requestSort={requestDetailSort} />
                                    <SortableHeader sortKey="defenseRoom" title={t('defenseRoom')} sortConfig={detailSortConfig} requestSort={requestDetailSort} />
                                    <SortableHeader sortKey="studentId" title={t('studentId')} sortConfig={detailSortConfig} requestSort={requestDetailSort} />
                                    <th scope="col" className="px-6 py-3">{t('gender')}</th>
                                    <th scope="col" className="px-6 py-3">{t('name')}</th>
                                    <th scope="col" className="px-6 py-3">{t('major')}</th>
                                    <SortableHeader sortKey="projectId" title={t('projectId')} sortConfig={detailSortConfig} requestSort={requestDetailSort} />
                                    <th scope="col" className="px-6 py-3">{t('topicLao')}</th>
                                    <SortableHeader sortKey="topicEng" title={t('topicEng')} sortConfig={detailSortConfig} requestSort={requestDetailSort} />
                                    <SortableHeader sortKey="advisorName" title={t('mainAdvisor')} sortConfig={detailSortConfig} requestSort={requestDetailSort} />
                                    <th scope="col" className="px-6 py-3">{t('mainCommittee')}</th>
                                    <th scope="col" className="px-6 py-3">{t('secondCommittee')}</th>
                                    <th scope="col" className="px-6 py-3">{t('thirdCommittee')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAndFilteredProjects.map((pg) => {
                                    const { project, students } = pg;
                                    const student1 = students[0];
                                    const student2 = students[1];

                                    return (
                                        <React.Fragment key={project.projectId}>
                                            <tr className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 align-top">
                                                <td rowSpan={2} className="px-6 py-4 align-top">{project.defenseDate || t('na')}</td>
                                                <td rowSpan={2} className="px-6 py-4 align-top">{project.defenseTime || t('na')}</td>
                                                <td rowSpan={2} className="px-6 py-4 align-top">{project.defenseRoom || t('na')}</td>
                                                
                                                <td className="px-6 py-4">{student1.studentId}</td>
                                                <td className="px-6 py-4">{student1.gender}</td>
                                                <td className="px-6 py-4">{student1.name} {student1.surname}</td>
                                                <td className="px-6 py-4">{student1.major}</td>
                                                
                                                <td rowSpan={2} className="px-6 py-4 align-top">
                                                    <button onClick={() => onSelectProject(pg)} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                                        {project.projectId}
                                                    </button>
                                                </td>
                                                <td rowSpan={2} className="px-6 py-4 align-top">{project.topicLao}</td>
                                                <td rowSpan={2} className="px-6 py-4 align-top">{project.topicEng}</td>
                                                <td rowSpan={2} className="px-6 py-4 align-top">{project.advisorName}</td>
                                                <td rowSpan={2} className="px-6 py-4 align-top">{getAdvisorNameById(project.mainCommitteeId)}</td>
                                                <td rowSpan={2} className="px-6 py-4 align-top">{getAdvisorNameById(project.secondCommitteeId)}</td>
                                                <td rowSpan={2} className="px-6 py-4 align-top">{getAdvisorNameById(project.thirdCommitteeId)}</td>
                                            </tr>
                                            <tr className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 align-top">
                                                {student2 ? (
                                                    <>
                                                        <td className="px-6 py-4">{student2.studentId}</td>
                                                        <td className="px-6 py-4">{student2.gender}</td>
                                                        <td className="px-6 py-4">{student2.name} {student2.surname}</td>
                                                        <td className="px-6 py-4">{student2.major}</td>
                                                    </>
                                                ) : (
                                                    <td className="px-6 py-4" colSpan={4}>&nbsp;</td>
                                                )}
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                        {sortedAndFilteredProjects.length === 0 && (<div className="text-center py-10 text-slate-500 dark:text-slate-400">{searchQuery ? t('noProjectsForQuery').replace('${query}', searchQuery) : t('noProjectsAvailable')}</div>)}
                    </div>
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
                    confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
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
                    confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                />
            )}
        </Paper>
    );
};

export default CommitteeManagement;