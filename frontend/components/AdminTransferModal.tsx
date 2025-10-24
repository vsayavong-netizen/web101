import React, { useState, useMemo, useEffect } from 'react';
import { XMarkIcon, ArrowsRightLeftIcon } from './icons';
import { Advisor, ProjectGroup, Major } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface AdminTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newAdvisorName: string, reason: string) => void;
  projectGroup: ProjectGroup;
  advisors: Advisor[];
  advisorProjectCounts: Record<string, number>;
  majors: Major[];
}

const AdminTransferModal: React.FC<AdminTransferModalProps> = ({ isOpen, onClose, onConfirm, projectGroup, advisors, advisorProjectCounts, majors }) => {
  const [newAdvisorName, setNewAdvisorName] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const t = useTranslations();

  const availableAdvisors = useMemo(() => {
    const projectMajorId = majors.find(m => m.name === projectGroup.students[0]?.major)?.id;
    if (!projectMajorId) return []; // No major, no valid advisors to transfer to

    return advisors.filter(adv => {
        if (adv.name === projectGroup.project.advisorName) return false;
        return adv.specializedMajorIds?.includes(projectMajorId);
    });
  }, [advisors, projectGroup, majors]);

  useEffect(() => {
    // Set a default advisor if the list is available
    if (isOpen) {
      const firstAvailable = availableAdvisors.find(a => (advisorProjectCounts[a.name] || 0) < a.quota);
      setNewAdvisorName(firstAvailable?.name || '');
      setReason('');
      setError('');
    }
  }, [isOpen, availableAdvisors, advisorProjectCounts]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!newAdvisorName) {
      setError(t('selectAdvisorToTransfer'));
      return;
    }
    if (!reason.trim()) {
      setError(t('reasonForTransferRequired'));
      return;
    }
    onConfirm(newAdvisorName, reason);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
            <ArrowsRightLeftIcon className="h-6 w-6 text-orange-600" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
            <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
              {t('transfer')} {t('project')}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {t('transferProjectPrompt').replace('{topic}', projectGroup.project.topicEng).replace('{advisor}', projectGroup.project.advisorName)}
              </p>
            </div>
            <div className="mt-4 space-y-4">
               <div>
                  <label htmlFor="newAdvisor" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('newAdvisor')}</label>
                  <select 
                      id="newAdvisor"
                      value={newAdvisorName} 
                      onChange={e => setNewAdvisorName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                      <option value="" disabled>-- {t('selectAnAdvisor')} --</option>
                      {availableAdvisors.map(adv => {
                          const currentCount = advisorProjectCounts[adv.name] || 0;
                          const isFull = currentCount >= adv.quota;
                          return (
                              <option key={adv.id} value={adv.name} disabled={isFull}>
                                  {adv.name} ({currentCount}/{adv.quota}) {isFull ? `- ${t('full')}` : ''}
                              </option>
                          )
                      })}
                  </select>
               </div>
               <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('reason')}</label>
                  <textarea
                      id="reason"
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className={`mt-1 block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600 ${error && !reason.trim() ? 'ring-red-500 focus:ring-red-500' : 'focus:ring-blue-600'}`}
                      placeholder={t('transferReasonPlaceholder')}
                  />
               </div>
            </div>
            {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>
        <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse sm:space-x-2 space-y-2 sm:space-y-0">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm focus:ring-blue-500"
            onClick={handleConfirm}
          >
            {t('confirmTransfer')}
          </button>
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm dark:bg-slate-600 dark:text-white dark:border-slate-500 dark:hover:bg-slate-500"
            onClick={onClose}
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTransferModal;