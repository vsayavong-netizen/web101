import React from 'react';
import { Notification, NotificationType } from '../types';
import { formatTimeAgo } from '../utils/timeUtils';
import { BellIcon, InboxStackIcon, CheckCircleIcon, PencilIcon, ChatBubbleBottomCenterTextIcon, Cog6ToothIcon, ChevronRightIcon } from './icons';
import { useTranslations, TranslationKey } from '../hooks/useTranslations';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onSelectNotification: (notification: Notification) => void;
  onViewAll: () => void;
}

const notificationTypeConfig: Record<NotificationType, { icon: React.FC<any>, color: string }> = {
    Submission: { icon: InboxStackIcon, color: 'text-blue-500' },
    Approval: { icon: CheckCircleIcon, color: 'text-green-500' },
    Feedback: { icon: PencilIcon, color: 'text-purple-500' },
    Mention: { icon: ChatBubbleBottomCenterTextIcon, color: 'text-indigo-500' },
    Message: { icon: ChatBubbleBottomCenterTextIcon, color: 'text-slate-500' },
    System: { icon: Cog6ToothIcon, color: 'text-orange-500' },
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onMarkAllRead, onSelectNotification, onViewAll }) => {
    const t = useTranslations();
    const unreadCount = notifications.filter(n => !n.read).length;
    const notificationsToShow = notifications.slice(0, 7); // Show up to 7 recent notifications

    return (
        <div className="origin-top-right absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 z-50 animate-fade-in-down">
            <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-white">{t('notifications')}</h3>
                {unreadCount > 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onMarkAllRead(); }} 
                      className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {t('markAllAsRead')}
                    </button>
                )}
            </div>
            <ul className="max-h-80 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700">
                {notificationsToShow.length > 0 ? (
                    notificationsToShow.map(n => {
                        const config = notificationTypeConfig[n.type] || notificationTypeConfig.System;
                        const Icon = config.icon;
                        return (
                            <li key={n.id}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSelectNotification(n); }}
                                    className={`w-full text-left p-3 transition-colors ${!n.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-slate-100 dark:hover:bg-slate-700`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                                        <div className="flex-grow">
                                            {n.title && <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{n.title}</p>}
                                            <p className={`text-sm ${n.title ? 'text-slate-600 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{n.message}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatTimeAgo(n.timestamp, t)}</p>
                                        </div>
                                        {!n.read && <span className="mt-1.5 block h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>}
                                    </div>
                                </button>
                            </li>
                        );
                    })
                ) : (
                    <li className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        <BellIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        {t('noNotifications')}
                    </li>
                )}
            </ul>
            <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                <button onClick={(e) => {e.stopPropagation(); onViewAll();}} className="w-full flex items-center justify-center gap-2 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md py-2 transition-colors">
                    <span>{t('viewAllNotifications')}</span>
                    <ChevronRightIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default NotificationPanel;