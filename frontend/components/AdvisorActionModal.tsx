import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons';
import { Advisor, MilestoneTemplate, ProjectGroup, Major } from '../types';
import { useTranslations } from '../hooks/useTranslations';

type ActionType = 'approve' | 'reject';

interface AdvisorActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: { comment: string; transferTo?: string; templateId?: string }) => void;
  projectGroup: ProjectGroup;
  action: ActionType;
  advisors: Advisor[];
  advisorProjectCounts: Record<string, number>;
  currentAdvisorName: string;
  milestoneTemplates: MilestoneTemplate[];
  majors: Major[];
}

const AdvisorActionModal: React.FC<AdvisorActionModalProps> = (props) => {
  const { 
    isOpen, onClose, onConfirm, projectGroup, action, 
    advisors, advisorProjectCounts, currentAdvisorName, milestoneTemplates, majors
  } = props;
  
  const [comment, setComment] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [error, setError] = useState('');
  const t = useTranslations();

  const config = useMemo(() => ({
    approve: {
        title: t('approveProject'),
        icon: <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />,
        iconBg: 'bg-green-100',
        buttonText: t('confirmApproval'),
        buttonBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        prompt: (projectName: string) => t('approveProjectPrompt').replace('${projectName}', projectName),
    },
    reject: {
        title: t('rejectProject'),
        icon: <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />,
        iconBg: 'bg-red-100',
        buttonText: t('confirmRejection'),
        buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        prompt: (projectName: string) => t('rejectProjectPrompt').replace('${projectName}', projectName),
    }
  }), [t]);

  const actionConfig = config[action];

  useEffect(() => {
    if (isOpen) {
      setComment('');
      setIsTransferring(false);
      setTransferTo('');
      setSelectedTemplateId(milestoneTemplates[0]?.id || '');
      setError('');
    }
  }, [isOpen, milestoneTemplates]);
  
  const availableAdvisorsForTransfer = useMemo(() => {
    const projectMajorId = majors.find(m => m.name === projectGroup.students[0]?.major)?.id;
    if (!projectMajorId) return []; // No major, no valid advisors to transfer to

    return advisors.filter(adv => {
        if (adv.name === currentAdvisorName) return false;
        // Advisor must have the specialized major
        return adv.specializedMajorIds?.includes(projectMajorId);
    });
  }, [advisors, majors, projectGroup, currentAdvisorName]);

  const handleConfirm = () => {
    if (action === 'reject' && !comment.trim() && !isTransferring) {
        setError(t('commentRequiredForRejection'));
        return;
    }
    if (action === 'reject' && isTransferring && !transferTo) {
         setError(t('selectAdvisorToTransfer'));
         return;
    }
    if (action === 'approve' && !selectedTemplateId) {
        setError(t('selectMilestoneTemplate'));
        return;
    }
    setError('');
    onConfirm({
        comment,
        transferTo: isTransferring ? transferTo : undefined,
        templateId: action === 'approve' ? selectedTemplateId : undefined,
    });
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="sm:flex sm:items-start">
          <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${actionConfig.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
            {actionConfig.icon}
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
            <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
              {actionConfig.title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {actionConfig.prompt(projectGroup.project.topicEng)}
              </p>
            </div>
            {action === 'approve' && (
              <div className="mt-4">
                  <label htmlFor="templateId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('milestoneTemplate')}</label>
                  <select id="templateId" value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    {milestoneTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
              </div>
            )}
            <div className="mt-4">
                <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600"
                    placeholder={t('enterCommentPlaceholder')}
                    aria-label="Comment"
                />
            </div>
            {action === 'reject' && (
                <div className="mt-4">
                    <div className="flex items-center">
                        <input type="checkbox" id="isTransferring" checked={isTransferring} onChange={e => setIsTransferring(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="isTransferring" className="ml-2 block text-sm text-slate-800 dark:text-slate-200">{t('transferToAnotherAdvisor')}</label>
                    </div>
                    {isTransferring && (
                         <div className="mt-2">
                            <select value={transferTo} onChange={e => setTransferTo(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                <option value="" disabled>{t('selectAnAdvisor')}</option>
                                {availableAdvisorsForTransfer.map(adv => {
                                    const count = advisorProjectCounts[adv.name] || 0;
                                    const isFull = count >= adv.quota;
                                    return <option key={adv.id} value={adv.name} disabled={isFull}>{adv.name} ({count}/{adv.quota}) {isFull ? ` - ${t('full')}` : ''}</option>
                                })}
                            </select>
                         </div>
                    )}
                </div>
            )}
            {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>
        <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse sm:space-x-2 space-y-2 sm:space-y-0">
          <button
            type="button"
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm ${actionConfig.buttonBg}`}
            onClick={handleConfirm}
          >
            {isTransferring ? t('confirmTransfer') : actionConfig.buttonText}
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

export default AdvisorActionModal;
