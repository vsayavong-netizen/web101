import React, { useState, useEffect } from 'react';
import { Major } from '../types';
import { XMarkIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface MajorModalProps {
  onClose: () => void;
  onSave: (major: Major | Omit<Major, 'id'>) => void;
  majorToEdit: Major | null;
  allMajors: Major[];
}

const MajorModal: React.FC<MajorModalProps> = ({ onClose, onSave, majorToEdit, allMajors }) => {
  const isEditMode = !!majorToEdit;
  const t = useTranslations();
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode && majorToEdit) {
      setName(majorToEdit.name);
      setAbbreviation(majorToEdit.abbreviation);
    }
  }, [isEditMode, majorToEdit]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t('majorNameRequired');
    }
    const isDuplicateName = allMajors.some(
      m => m.name.toLowerCase() === name.trim().toLowerCase() && m.id !== majorToEdit?.id
    );
    if (isDuplicateName) {
      newErrors.name = t('majorNameExists');
    }

    if (!abbreviation.trim()) {
      newErrors.abbreviation = t('abbreviationRequired');
    }
    const isDuplicateAbbr = allMajors.some(
      m => m.abbreviation.toLowerCase() === abbreviation.trim().toLowerCase() && m.id !== majorToEdit?.id
    );
    if (isDuplicateAbbr) {
        newErrors.abbreviation = t('abbreviationExists');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const majorData = { name: name.trim(), abbreviation: abbreviation.trim().toUpperCase() };
    const finalData = isEditMode ? { ...majorToEdit, ...majorData } : majorData;
    onSave(finalData as Major | Omit<Major, 'id'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <style>{`.input-style { transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out; width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; } .dark .input-style { background-color: #334155; border-color: #475569; color: #f8fafc; }`}</style>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{isEditMode ? t('editMajor') : t('addMajor')}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('majorName')}</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className={`input-style mt-1 ${errors.name ? 'border-red-500' : ''}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
             <div>
              <label htmlFor="abbreviation" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('abbreviation')}</label>
              <input type="text" id="abbreviation" value={abbreviation} onChange={e => setAbbreviation(e.target.value.toUpperCase())} className={`input-style mt-1 ${errors.abbreviation ? 'border-red-500' : ''}`} />
              {errors.abbreviation && <p className="text-red-500 text-xs mt-1">{errors.abbreviation}</p>}
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-6 border-t dark:border-slate-700 mt-6">
            <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white font-bold py-2 px-4 rounded-lg">{t('cancel')}</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t('saveMajor')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MajorModal;