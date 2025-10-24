import React, { useState, useMemo, useCallback, useRef } from 'react';
import { ProjectGroup, Advisor, DefenseSettings, Major, User } from '../types';
import { useToast } from '../hooks/useToast';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import { MagnifyingGlassIcon, ClipboardDocumentListIcon, CheckIcon, DocumentArrowUpIcon, TableCellsIcon, ArrowDownTrayIcon, SparklesIcon, Cog6ToothIcon, TrashIcon } from './icons';
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

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
        reader.readAsBinaryString(file);
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
    
    const handleExportExcel = useCallback(() => {
        const headers = [
            t('defenseDate'), t('defenseTime'), t('defenseRoom'), t('projectId'), t('topicLao'), t('topicEng'),
            t('mainAdvisor'), t('mainCommittee'), t('secondCommittee'), t('thirdCommittee'),
            t('studentId'), t('gender'), t('studentName'), t('major')
        ];
    
        const rows: (string | number)[][] = [headers];
        const merges: XLSX.Range[] = [];
    
        let rowIndex = 1; // Start from row 1 (after headers)
    
        sortedAndFilteredProjects.forEach(pg => {
            const project = pg.project;
            const student1 = pg.students[0];
            const student2 = pg.students[1];
    
            const projectData = [
                project.defenseDate || t('na'),
                project.defenseTime || t('na'),
                project.defenseRoom || t('na'),
                project.projectId,
                project.topicLao,
                project.topicEng,
                project.advisorName,
                getAdvisorNameById(project.mainCommitteeId),
                getAdvisorNameById(project.secondCommitteeId),
                getAdvisorNameById(project.thirdCommitteeId),
            ];
    
            const student1Data = student1 ? [
                student1.studentId,
                student1.gender,
                `${student1.name} ${student1.surname}`,
                student1.major,
            ] : Array(4).fill('');
            rows.push([...projectData, ...student1Data]);
    
            const emptyProjectData = Array(projectData.length).fill('');
            const student2Data = student2 ? [
                student2.studentId,
                student2.gender,
                `${student2.name} ${student2.surname}`,
                student2.major,
            ] : Array(4).fill('');
            rows.push([...emptyProjectData, ...student2Data]);
    
            // Define merges for the 10 project-related columns
            for (let colIndex = 0; colIndex < 10; colIndex++) {
                merges.push({
                    s: { r: rowIndex, c: colIndex },
                    e: { r: rowIndex + 1, c: colIndex }
                });
            }
    
            rowIndex += 2;
        });
    
        if (rows.length <= 1) {
            addToast({ type: 'info', message: t('noDataToExport') });
            return;
        }
    
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        worksheet['!merges'] = merges;
    
        const columnWidths = [
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 }, { wch: 40 },
            { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 },
            { wch: 20 }, { wch: 10 }, { wch: 25 }, { wch: 25 }
        ];
        worksheet['!cols'] = columnWidths;
    
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Committee Schedules');
    
        XLSX.writeFile(workbook, 'committee_schedules_merged.xlsx');
        addToast({ type: 'success', message: t('exportMergedSuccessToast') });
    }, [sortedAndFilteredProjects, getAdvisorNameById, addToast, t]);
    
    const handleDownloadTemplate = useCallback(() => {
        const headers = [t('projectId'), t('defenseDate'), t('defenseTime'), t('defenseRoom')];
        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        const notes = [
            [t('noteScheduleFormat')],
            [t('availableTimes').replace('${timeSlots}', timeSlots.join(', '))],
            [t('availableRooms').replace('${roomOptions}', roomOptions.join(', '))],
        ];
        XLSX.utils.sheet_add_aoa(worksheet, notes, { origin: "A2" });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule Template');

        const columnWidths = [ { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 } ];
        worksheet['!cols'] = columnWidths;
        
        XLSX.writeFile(workbook, 'committee_schedule_template.xlsx');
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
            <select
                value={project[committeeKey] || ''}
                onChange={(e) => handleCommitteeChange(project.projectId, committeeType, e.target.value || null)}
                className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600"
            >
                <option value="">-- {t('selectAnAdvisor')} --</option>
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
                        <option key={adv.id} value={adv.id} disabled={isDisabled}>
                            {label}
                        </option>
                    );
                })}
            </select>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div className="flex items-center">
                   <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600 mr-3"/>
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('committeeManagement')}</h2>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">{t('committeeManagementDescription')}</p>
                   </div>
                </div>
                 <div className="flex items-center flex-wrap gap-2 mt-4 sm:mt-0">
                    <button onClick={() => setIsClearAllModalOpen(true)} className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <TrashIcon className="w-5 h-5 mr-2" />
                        {t('clearAll')}
                    </button>
                    <button onClick={handleRunAutoSchedule} className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        {t('autoSchedule')}
                    </button>
                     <button onClick={() => onNavigate('settings')} className="flex items-center justify-center bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <Cog6ToothIcon className="w-5 h-5 mr-2" />
                        {t('settings')}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                    <button onClick={handleDownloadTemplate} className="flex items-center justify-center bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> {t('template')}
                    </button>
                    <button onClick={handleImportClick} className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <DocumentArrowUpIcon className="w-5 h-5 mr-2" /> {t('import')}
                    </button>
                    <button onClick={handleExportExcel} className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <TableCellsIcon className="w-5 h-5 mr-2" /> {t('export')}
                    </button>
                </div>
            </div>
            
             <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setViewMode('edit')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${viewMode === 'edit' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                    {t('editView')}
                </button>
                <button onClick={() => setViewMode('view')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${viewMode === 'view' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                    {t('detailView')}
                </button>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                 <div className="relative w-full sm:w-auto sm:flex-grow">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600 dark:placeholder:text-gray-400"
                        placeholder={t('searchByIdTopicAdvisor')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <label htmlFor="schedule-filter" className="sr-only">{t('allSchedules')}</label>
                    <select id="schedule-filter" value={scheduleFilter} onChange={e => setScheduleFilter(e.target.value as any)} className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600">
                        <option value="all">{t('allSchedules')}</option>
                        <option value="scheduled">{t('scheduled')}</option>
                        <option value="unscheduled">{t('unscheduled')}</option>
                    </select>
                </div>
                 <div className="w-full sm:w-auto">
                    <label htmlFor="committee-filter" className="sr-only">{t('committees')}</label>
                    <select id="committee-filter" value={committeeFilter} onChange={e => setCommitteeFilter(e.target.value as any)} className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600">
                        <option value="all">{t('allCommittees')}</option>
                        <option value="full">{t('fullyAssigned')}</option>
                        <option value="partial">{t('partiallyAssigned')}</option>
                        <option value="unassigned">{t('unassigned')}</option>
                    </select>
                </div>
            </div>
            
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
        </div>
    );
};

export default CommitteeManagement;