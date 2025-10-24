import React from 'react';
import { Advisor, User } from '../types';
import { PencilIcon, TrashIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface AdvisorCardProps {
    advisor: Advisor;
    user: User;
    projectCount: number;
    getMajorNames: (majorIds: string[]) => string;
    onEdit: () => void;
    onDelete: () => void;
    onSelect: (advisorId: string) => void;
    isSelected: boolean;
    onToggleAiAssistant: () => void;
}

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (e: React.MouseEvent) => void; }> = ({ enabled, onChange }) => (
    <button
        type="button"
        className={`${enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        role="switch"
        aria-checked={enabled}
        onClick={onChange}
    >
        <span
            aria-hidden="true"
            className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);


const AdvisorCard: React.FC<AdvisorCardProps> = ({ advisor, user, projectCount, getMajorNames, onEdit, onDelete, onSelect, isSelected, onToggleAiAssistant }) => {
    const t = useTranslations();
    const isOverloaded = projectCount > advisor.quota;

    const handleToggleAiAssistant = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleAiAssistant();
    };

    return (
        <div className={`relative bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-md p-4 flex flex-col justify-between ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
             <div>
                <div className="flex justify-between items-start">
                    <div className="pr-10">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{advisor.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">{advisor.id}</p>
                    </div>
                     <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        checked={isSelected}
                        onChange={() => onSelect(advisor.id)}
                    />
                </div>
                <div className="mt-4 space-y-2 text-sm">
                    <p><strong>{t('projects')}:</strong> <span className={isOverloaded ? 'text-red-500 dark:text-red-400 font-bold' : ''}>{projectCount} / {advisor.quota}</span></p>
                    <p><strong>{t('majors')}:</strong> {getMajorNames(advisor.specializedMajorIds)}</p>
                    {user.role === 'Admin' && (
                        <div className="flex items-center justify-between">
                            <strong>{t('aiAssistant')}:</strong>
                            <ToggleSwitch enabled={advisor.isAiAssistantEnabled ?? true} onChange={handleToggleAiAssistant} />
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-2">
                <button onClick={onEdit} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                    <PencilIcon className="w-5 h-5" />
                </button>
                <button onClick={onDelete} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default AdvisorCard;