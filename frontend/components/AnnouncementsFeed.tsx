import React, { useMemo } from 'react';
import { Announcement, User } from '../types';
import { MegaphoneIcon } from './icons';
import { formatTimeAgo } from '../utils/timeUtils';
import { useTranslations } from '../hooks/useTranslations';

interface AnnouncementsFeedProps {
    announcements: Announcement[];
    user: User;
}

const parseMarkdown = (text: string = '') => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/(\r\n|\n|\r)/g, '<br />');
};

const AnnouncementsFeed: React.FC<AnnouncementsFeedProps> = ({ announcements, user }) => {
    const t = useTranslations();
    const relevantAnnouncements = useMemo(() => {
        return announcements
            .filter(a => {
                if (a.audience === 'All') return true;
                if (a.audience === 'Students' && user.role === 'Student') return true;
                if (a.audience === 'Advisors' && (user.role === 'Advisor' || user.role === 'Admin')) return true;
                return false;
            })
            .slice(0, 5); // Show latest 5
    }, [announcements, user.role]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full mr-3">
                     <MegaphoneIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('recentAnnouncements')}</h3>
            </div>
            {relevantAnnouncements.length > 0 ? (
                <ul className="space-y-4">
                    {relevantAnnouncements.map((announcement, index) => (
                        <li key={announcement.id} className={`pt-4 ${index > 0 ? 'border-t border-slate-200 dark:border-slate-700' : ''}`}>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{announcement.title}</p>
                            <div 
                                className="mt-1 text-sm text-slate-600 dark:text-slate-300 prose"
                                dangerouslySetInnerHTML={{ __html: parseMarkdown(announcement.content) }}
                            />
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                {t('postedBy').replace('{author}', announcement.authorName)} &bull; {formatTimeAgo(announcement.createdAt, t)}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">{t('noAnnouncements')}</p>
            )}
        </div>
    );
};

export default AnnouncementsFeed;