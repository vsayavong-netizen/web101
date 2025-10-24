import React, { useState } from 'react';
import { XMarkIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface AdvisorBulkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: {
        quota?: number;
        mainCommitteeQuota?: number;
        secondCommitteeQuota?: number;
        thirdCommitteeQuota?: number;
    }) => void;
    selectedCount: number;
}

const AdvisorBulkEditModal: React.FC<AdvisorBulkEditModalProps> = ({ isOpen, onClose, onSave, selectedCount }) => {
    const [updates, setUpdates] = useState<Record<string, string>>({});
    const t = useTranslations();
    
    const handleSave = () => {
        const finalUpdates: any = {};
        if (updates.quota) finalUpdates.quota = Number(updates.quota);
        if (updates.mainCommitteeQuota) finalUpdates.mainCommitteeQuota = Number(updates.mainCommitteeQuota);
        if (updates.secondCommitteeQuota) finalUpdates.secondCommitteeQuota = Number(updates.secondCommitteeQuota);
        if (updates.thirdCommitteeQuota) finalUpdates.thirdCommitteeQuota = Number(updates.thirdCommitteeQuota);
        onSave(finalUpdates);
    };

    if (!isOpen) return null;
    
    const fields = [
        { key: 'quota', label: t('supervisingQuota') },
        { key: 'mainCommitteeQuota', label: t('mainCommitteeQuota') },
        { key: 'secondCommitteeQuota', label: t('secondCommitteeQuota') },
        { key: 'thirdCommitteeQuota', label: t('thirdCommitteeQuota') },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center pb-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('bulkEditAdvisorTitle').replace('{count}', String(selectedCount))}</h2>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6"/></button>
                </div>
                <div className="mt-4 space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('bulkEditAdvisorDescription')}</p>
                    {fields.map(field => (
                        <div key={field.key}>
                            <label htmlFor={`bulk-${field.key}`} className="block text-sm font-medium">{field.label}</label>
                            <input
                                type="number"
                                id={`bulk-${field.key}`}
                                placeholder={t('leaveBlankNoChange')}
                                onChange={e => setUpdates(prev => ({...prev, [field.key]: e.target.value}))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end space-x-2 pt-4 mt-4 border-t dark:border-slate-700">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 py-2 px-4 rounded-lg">{t('cancel')}</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg">{t('saveChanges')}</button>
                </div>
            </div>
        </div>
    );
};

export default AdvisorBulkEditModal;
