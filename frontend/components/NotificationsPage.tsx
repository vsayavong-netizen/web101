import React from 'react';
import { Notification, NotificationType } from '../types';
import { formatTimeAgo } from '../utils/timeUtils';
import { BellIcon, InboxStackIcon, CheckCircleIcon, PencilIcon, ChatBubbleBottomCenterTextIcon, Cog6ToothIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

const notificationTypeConfig: Record<NotificationType, { icon: React.FC<any>, color: string }> = {
    Submission: { icon: InboxStackIcon, color: 'text-blue-500' },
    Approval: { icon: CheckCircleIcon, color: 'text-green-500' },
    Feedback: { icon: PencilIcon, color: 'text-purple-500' },
    Mention: { icon: ChatBubbleBottomCenterTextIcon, color: 'text-indigo-500' },
    Message: { icon: ChatBubbleBottomCenterTextIcon, color: 'text-slate-500' },
    System: { icon: Cog6ToothIcon, color: 'text-orange-500' },
};

interface NotificationsPageProps {
  notifications: Notification[];
  onSelectNotification: (notification: Notification) => void;
  onMarkAllRead: () => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications, onSelectNotification, onMarkAllRead }) => {
  const t = useTranslations();
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center">
          <BellIcon className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('notifications')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{t('allUpdatesAndMentions')}</p>
          </div>
        </div>
        <button 
          onClick={onMarkAllRead} 
          className="mt-4 sm:mt-0 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!notifications.some(n => !n.read)}
        >
          {t('markAllAsRead')}
        </button>
      </div>
      
      {notifications.length > 0 ? (
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {notifications.map(n => {
            const config = notificationTypeConfig[n.type] || notificationTypeConfig.System;
            const Icon = config.icon;
            return (
              <li key={n.id}>
                <button
                  onClick={() => onSelectNotification(n)}
                  className={`w-full text-left p-4 transition-colors ${!n.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-slate-100 dark:hover:bg-slate-700`}
                >
                  <div className="flex items-start gap-4">
                    <Icon className={`w-6 h-6 mt-0.5 flex-shrink-0 ${config.color}`} />
                    <div className="flex-grow">
                        {n.title && <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{n.title}</p>}
                        <p className={`text-sm ${n.title ? 'text-slate-600 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{n.message}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatTimeAgo(n.timestamp, t)}</p>
                    </div>
                    {!n.read && <span className="mt-1.5 block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500"></span>}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          <BellIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold">{t('allCaughtUp')}</h3>
          <p>{t('noNotifications')}</p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;