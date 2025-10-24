import React, { useState, useEffect } from 'react';
import { Advisor, Major, User } from '../types';
import { XMarkIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface AdvisorModalProps {
  onClose: () => void;
  onSave: (advisor: Advisor | Omit<Advisor, 'id'>) => void;
  advisorToEdit: Advisor | null;
  allAdvisors: Advisor[];
  majors: Major[];
  user: User;
}

const AdvisorModal: React.FC<AdvisorModalProps> = ({ onClose, onSave, advisorToEdit, allAdvisors, majors, user }) => {
  const isEditMode = !!advisorToEdit;
  const t = useTranslations();
  const [advisor, setAdvisor] = useState<Partial<Advisor>>(advisorToEdit || { quota: 5, mainCommitteeQuota: 5, secondCommitteeQuota: 5, thirdCommitteeQuota: 5, specializedMajorIds: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { if (advisorToEdit) setAdvisor(advisorToEdit); }, [advisorToEdit]);

  const handleMajorSelection = (majorId: string) => {
    const currentIds = advisor.specializedMajorIds || [];
    const newIds = currentIds.includes(majorId) ? currentIds.filter(id => id !== majorId) : [...currentIds, majorId];
    setAdvisor(prev => ({ ...prev, specializedMajorIds: newIds }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!advisor.name?.trim()) newErrors.name = t('nameRequired');
    if (allAdvisors.some(a => a.name.toLowerCase() === advisor.name?.trim().toLowerCase() && a.id !== advisorToEdit?.id)) newErrors.name = t('advisorNameExists');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const finalData = isEditMode ? { ...advisorToEdit, ...advisor } : { ...advisor, password: 'password12p3', mustChangePassword: true };
    onSave(finalData as Advisor);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <style>{`.input-style { transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out; width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; } .dark .input-style { background-color: #334155; border-color: #475569; color: #f8fafc; }`}</style>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-slate-700">
          <h2 className="text-2xl font-bold">{isEditMode ? t('editAdvisor') : t('addAdvisorTitle')}</h2>
          <button onClick={onClose}><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} noValidate className="flex-grow overflow-y-auto pr-2 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('fullName')}</label>
            <input type="text" id="name" value={advisor.name || ''} onChange={e => setAdvisor(prev => ({ ...prev, name: e.target.value }))} className={`input-style mt-1 ${errors.name ? 'border-red-500' : ''}`} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label htmlFor="quota" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('supervisingQuota')}</label>
                <input type="number" id="quota" value={advisor.quota ?? ''} onChange={e => setAdvisor(prev => ({...prev, quota: Number(e.target.value)}))} className="input-style mt-1"/>
             </div>
             <div>
                <label htmlFor="mainCommitteeQuota" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('mainCommitteeQuota')}</label>
                <input type="number" id="mainCommitteeQuota" value={advisor.mainCommitteeQuota ?? ''} onChange={e => setAdvisor(prev => ({...prev, mainCommitteeQuota: Number(e.target.value)}))} className="input-style mt-1"/>
             </div>
             <div>
                <label htmlFor="secondCommitteeQuota" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('secondCommitteeQuota')}</label>
                <input type="number" id="secondCommitteeQuota" value={advisor.secondCommitteeQuota ?? ''} onChange={e => setAdvisor(prev => ({...prev, secondCommitteeQuota: Number(e.target.value)}))} className="input-style mt-1"/>
             </div>
              <div>
                <label htmlFor="thirdCommitteeQuota" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('thirdCommitteeQuota')}</label>
                <input type="number" id="thirdCommitteeQuota" value={advisor.thirdCommitteeQuota ?? ''} onChange={e => setAdvisor(prev => ({...prev, thirdCommitteeQuota: Number(e.target.value)}))} className="input-style mt-1"/>
             </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('specializedMajors')}</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
                {majors.map(major => <div key={major.id} className="flex items-center"><input id={`major-${major.id}`} type="checkbox" checked={advisor.specializedMajorIds?.includes(major.id)} onChange={() => handleMajorSelection(major.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600"/><label htmlFor={`major-${major.id}`} className="ml-2 block text-sm text-slate-800 dark:text-slate-200">{major.name}</label></div>)}
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-6 border-t dark:border-slate-700 mt-6">
            <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 font-bold py-2 px-4 rounded-lg">{t('cancel')}</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t('saveAdvisor')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdvisorModal;