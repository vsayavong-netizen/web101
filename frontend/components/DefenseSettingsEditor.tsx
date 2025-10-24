

import React, { useState, useCallback, useEffect } from 'react';
import { DefenseSettings, Major, DefenseRoom, Advisor } from '../types';
import { PlusIcon, TrashIcon, SparklesIcon } from './icons';
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
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('generalScheduleSettings')}</h3>
                <div>
                    <label htmlFor="startDefenseDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('startDefenseDate')}</label>
                    <input type="date" id="startDefenseDate" value={localSettings.startDefenseDate} onChange={e => handleSettingsChange('startDefenseDate', e.target.value)} className="block w-full sm:w-1/2 mt-1 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"/>
                </div>
                <div>
                    <label htmlFor="timeSlots" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('defenseTimeSlots')}</label>
                    <input type="text" id="timeSlots" value={localSettings.timeSlots} onChange={e => handleSettingsChange('timeSlots', e.target.value)} placeholder="09:00-10:00,10:15-11:15" className="block w-full mt-1 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"/>
                    <p className="text-xs text-slate-500 mt-1">{t('timeSlotsHelp')}</p>
                </div>
                 <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('timezone')}</label>
                    <select 
                        id="timezone" 
                        value={localSettings.timezone} 
                        onChange={e => handleSettingsChange('timezone', e.target.value)} 
                        className="block w-full sm:w-1/2 mt-1 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    >
                        {timezones.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">{t('timezoneHelp')}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="text-xl font-bold text-slate-800 dark:text-white">{t('roomAssignments')}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('roomAssignmentsHelp')}</p>
                    </div>
                    <button type="button" onClick={handleAddRoom} className="flex-shrink-0 flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                        <PlusIcon className="w-4 h-4 mr-1"/> {t('addRoom')}
                    </button>
                </div>
                <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-2">
                    {localSettings.rooms.map((room) => (
                        <div key={room.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                            <div className="flex justify-between items-center">
                                <input 
                                    type="text"
                                    value={room.name}
                                    onChange={(e) => handleRoomNameChange(room.id, e.target.value)}
                                    className="font-semibold text-slate-800 dark:text-slate-200 bg-transparent border-0 border-b-2 border-transparent focus:border-blue-500 focus:ring-0 p-1 -ml-1"
                                />
                                <button type="button" onClick={() => handleRemoveRoom(room.id)} className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400" aria-label={`Remove ${room.name}`}>
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mt-2">
                                {majors.map(major => (
                                    <div key={major.id} className="flex items-center">
                                        <input
                                            id={`room-${room.id}-major-${major.id}`}
                                            type="checkbox"
                                            checked={room.majorIds.includes(major.id)}
                                            onChange={(e) => handleRoomMajorChange(room.id, major.id, e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor={`room-${room.id}-major-${major.id}`} className="ml-2 block text-sm text-slate-800 dark:text-slate-200 truncate" title={major.name}>{major.abbreviation}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <h4 className="text-xl font-bold text-slate-800 dark:text-white">{t('stationaryAssignments')}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('stationaryAssignmentsHelp')}</p>
                <div className="mt-4 space-y-3">
                    {localSettings.rooms.map(room => (
                        <div key={room.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{room.name}</span>
                            <select 
                                value={localSettings.stationaryAdvisors?.[room.id] || ''} 
                                onChange={e => handleStationaryAdvisorChange(room.id, e.target.value)}
                                className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            >
                                <option value="">{t('anyAdvisor')}</option>
                                {advisors.map(adv => (
                                    <option key={adv.id} value={adv.id}>{adv.name}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                    type="button"
                    className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={handleSave}
                >
                    {t('saveSettings')}
                </button>
                <button
                    type="button"
                    className="w-full sm:w-auto inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-6 py-2 text-base font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    onClick={handleRunAutoSchedule}
                >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    {t('runAutoScheduler')}
                </button>
            </div>
        </div>
    );
};

export default DefenseSettingsEditor;
