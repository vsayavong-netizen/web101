import React from 'react';
import { PlusIcon, ChartBarIcon } from './icons';
import { User } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface EmptyStateProps {
    onRegisterClick: () => void;
    user: User;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onRegisterClick, user }) => {
  const t = useTranslations();
  return (
    <div className="text-center py-12 px-6">
      <ChartBarIcon className="mx-auto h-12 w-12 text-slate-400" />
      <h3 className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-200">{t('noProjectsFound')}</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {user.role === 'Admin' 
          ? t('getStartedRegister')
          : t('noProjectsToDisplay')}
      </p>
      {user.role === 'Admin' && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onRegisterClick}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            {t('registerNewProject')}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;