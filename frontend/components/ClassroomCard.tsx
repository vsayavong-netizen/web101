import React from 'react';
import { Classroom } from '../types';
import { PencilIcon, TrashIcon, UserGroupIcon, ClipboardDocumentListIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface ClassroomCardProps {
    classroom: Classroom;
    studentCount: number;
    maleCount: number;
    femaleCount: number;
    monkCount: number;
    projectCount: number;
    soloProjectCount: number;
    duoProjectCount: number;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
    onEdit: () => void;
    onDelete: () => void;
    index: number;
}

const ClassroomCard: React.FC<ClassroomCardProps> = ({
    classroom,
    studentCount,
    maleCount,
    femaleCount,
    monkCount,
    projectCount,
    soloProjectCount,
    duoProjectCount,
    approvedCount,
    pendingCount,
    rejectedCount,
    onEdit,
    onDelete,
    index
}) => {
    const t = useTranslations();

    return (
        <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-md p-4 flex flex-col justify-between">
            <div className="absolute top-2 left-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {index}
            </div>
            <div>
                <div className="pl-8">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{classroom.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">{classroom.majorName}</p>
                </div>
                
                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-slate-500 dark:text-slate-400">
                            <UserGroupIcon className="w-4 h-4 mr-2" />
                            <span>{t('students')}</span>
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                            {studentCount} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">({t('male').charAt(0)}:{maleCount} {t('female').charAt(0)}:{femaleCount} {t('monk')}:{monkCount})</span>
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-slate-500 dark:text-slate-400">
                            <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
                            <span>{t('projects')}</span>
                        </div>
                         <span className="font-medium text-slate-700 dark:text-slate-300">
                            {projectCount}{' '}
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                (1P:{soloProjectCount}, 2P:{duoProjectCount})
                            </span>
                        </span>
                    </div>
                    <div className="pl-6 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-green-600 dark:text-green-400">{t('approved')}: {approvedCount}</span>,{' '}
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">{t('pending')}: {pendingCount}</span>,{' '}
                        <span className="font-semibold text-red-600 dark:text-red-400">{t('rejected')}: {rejectedCount}</span>
                    </div>
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

export default ClassroomCard;