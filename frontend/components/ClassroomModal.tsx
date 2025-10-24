import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Classroom, Major, User, Advisor } from '../types';
import { XMarkIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface ClassroomModalProps {
  onClose: () => void;
  onSave: (classroom: Classroom | Omit<Classroom, 'id'>) => void;
  classroomToEdit: Classroom | null;
  allClassrooms: Classroom[];
  majors: Major[];
  user: User;
}

const ClassroomModal: React.FC<ClassroomModalProps> = ({ onClose, onSave, classroomToEdit, allClassrooms, majors, user }) => {
  const isEditMode = !!classroomToEdit;
  const t = useTranslations();

  const availableMajors = useMemo(() => {
    if (user.role === 'DepartmentAdmin') {
        const deptAdminUser = user as User & Partial<Advisor>;
        const managedMajorIds = new Set(deptAdminUser.specializedMajorIds || []);
        return majors.filter(m => managedMajorIds.has(m.id));
    }
    return majors;
  }, [user, majors]);

  const getInitialMajorId = useCallback(() => {
      if (classroomToEdit) return classroomToEdit.majorId;
      return availableMajors[0]?.id || '';
  }, [classroomToEdit, availableMajors]);

  const [name, setName] = useState(classroomToEdit?.name || '');
  const [majorId, setMajorId] = useState<string>(getInitialMajorId());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (classroomToEdit) {
      setName(classroomToEdit.name);
      setMajorId(classroomToEdit.majorId);
    } else {
      setMajorId(availableMajors[0]?.id || '');
    }
  }, [classroomToEdit, availableMajors]);


  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t('classroomNameRequired');
    }
    const isDuplicate = allClassrooms.some(
      c => c.name.toLowerCase() === name.trim().toLowerCase() && c.id !== classroomToEdit?.id
    );
    if (isDuplicate) {
      newErrors.name = t('classroomNameExists');
    }
    if (!majorId) {
        newErrors.majorId = t('majorRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const selectedMajor = majors.find(m => m.id === majorId);
    if (!selectedMajor) {
        setErrors(prev => ({...prev, majorId: t('invalidMajorSelected')}));
        return;
    };

    const classroomData = { 
        name: name.trim(), 
        majorId, 
        majorName: selectedMajor.name 
    };

    const finalData = isEditMode ? { ...classroomToEdit, ...classroomData } : classroomData;
    onSave(finalData as Classroom | Omit<Classroom, 'id'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <style>{`.input-style { transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out; width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; } .dark .input-style { background-color: #334155; border-color: #475569; color: #f8fafc; }`}</style>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{isEditMode ? t('editClassroom') : t('addClassroom')}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('classroomName')}</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className={`input-style mt-1 ${errors.name ? 'border-red-500' : ''}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
             <div>
              <label htmlFor="major" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('major')}</label>
              <select id="major" value={majorId} onChange={e => setMajorId(e.target.value)} className={`input-style mt-1 ${errors.majorId ? 'border-red-500' : ''}`}>
                {availableMajors.length === 0 ? (
                    <option disabled>{t('pleaseAddMajorFirst')}</option>
                ) : (
                    availableMajors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)
                )}
              </select>
              {errors.majorId && <p className="text-red-500 text-xs mt-1">{errors.majorId}</p>}
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-6 border-t dark:border-slate-700 mt-6">
            <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white font-bold py-2 px-4 rounded-lg">{t('cancel')}</button>
            <button type="submit" disabled={availableMajors.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed">{t('saveClassroom')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassroomModal;