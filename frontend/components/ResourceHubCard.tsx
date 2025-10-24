import React from 'react';
import { BookOpenIcon, LinkIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

const ResourceHubCard: React.FC = () => {
    const t = useTranslations();
    const resources = [
        { title: 'Thesis Writing Guide', url: '#' },
        { title: 'Presentation Skills Workshop', url: '#' },
        { title: 'Library Research Database', url: '#' },
    ];
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <BookOpenIcon className="w-6 h-6 text-blue-500" />
                {t('resourceHub')}
            </h3>
            <ul className="space-y-2">
                {resources.map((res, index) => (
                    <li key={index}>
                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            <LinkIcon className="w-4 h-4" />
                            <span>{res.title}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ResourceHubCard;