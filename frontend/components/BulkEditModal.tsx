import React, { useState, useMemo } from 'react';
import { Major, Classroom } from '../types';
import { XMarkIcon } from './icons';
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
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center pb-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('bulkEditTitle').replace('{count}', String(selectedCount))}</h2>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6"/></button>
                </div>
                <div className="mt-4 space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('bulkEditDescription')}</p>
                    <div>
                        <label htmlFor="bulk-major" className="block text-sm font-medium">{t('major')}</label>
                        <select id="bulk-major" value={majorName} onChange={e => { setMajorName(e.target.value); setClassroomName(''); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600">
                            <option value="">-- {t('dontChange')} --</option>
                            {majors.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="bulk-classroom" className="block text-sm font-medium">{t('classroom')}</label>
                        <select id="bulk-classroom" value={classroomName} onChange={e => setClassroomName(e.target.value)} disabled={!majorName} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-slate-200 dark:bg-slate-700 dark:border-slate-600">
                            <option value="">-- {t('dontChange')} --</option>
                            {filteredClassrooms.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="flex justify-end space-x-2 pt-4 mt-4 border-t dark:border-slate-700">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 py-2 px-4 rounded-lg">{t('cancel')}</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg">{t('saveChanges')}</button>
                </div>
            </div>
        </div>
    );
};

export default BulkEditModal;