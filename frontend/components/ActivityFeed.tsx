import React from 'react';
import { Notification } from '../types';
import { formatTimeAgo } from '../utils/timeUtils';
import { 
    InboxIcon, BellIcon, CheckCircleIcon, XCircleIcon, 
    DocumentArrowUpIcon, ChatBubbleBottomCenterTextIcon, PencilIcon, 
    ArrowsRightLeftIcon, UserGroupIcon, CalendarDaysIcon 
} from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface ActivityFeedProps {
    notifications: Notification[];
    onSelectNotification: (notification: Notification) => void;
}

const getNotificationIcon = (message: string) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('approved')) return { Icon: CheckCircleIcon, color: 'text-green-500' };
    if (lowerMessage.includes('rejected')) return { Icon: XCircleIcon, color: 'text-red-500' };
    if (lowerMessage.includes('submitted') || lowerMessage.includes('submission')) return { Icon: DocumentArrowUpIcon, color: 'text-blue-500' };
    if (lowerMessage.includes('feedback')) return { Icon: ChatBubbleBottomCenterTextIcon, color: 'text-purple-500' };
    if (lowerMessage.includes('updated') || lowerMessage.includes('changed')) return { Icon: PencilIcon, color: 'text-yellow-500' };
    if (lowerMessage.includes('transferred')) return { Icon: ArrowsRightLeftIcon, color: 'text-orange-500' };
    if (lowerMessage.includes('assigned')) return { Icon: UserGroupIcon, color: 'text-indigo-500' };
    if (lowerMessage.includes('scheduled')) return { Icon: CalendarDaysIcon, color: 'text-teal-500' };
    return { Icon: BellIcon, color: 'text-slate-500' };
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ notifications, onSelectNotification }) => {
    const recentNotifications = notifications.slice(0, 10);
    const t = useTranslations();

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 h-full">
            <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full mr-3">
                     <InboxIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('recentActivity')}</h3>
            </div>
            {recentNotifications.length > 0 ? (
                <ul className="space-y-2">
                    {recentNotifications.map(notification => {
                        const { Icon, color } = getNotificationIcon(notification.message);
                        return (
                            <li key={notification.id}>
                                <button
                                    onClick={() => onSelectNotification(notification)}
                                    className="w-full text-left p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <Icon className={`w-5 h-5 ${color}`} />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-sm text-slate-700 dark:text-slate-300">{notification.message}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatTimeAgo(notification.timestamp, t)}</p>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        )
                    })}
                </ul>
            ) : (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">{t('noRecentActivity')}</p>
            )}
        </div>
    );
};

export default ActivityFeed;
