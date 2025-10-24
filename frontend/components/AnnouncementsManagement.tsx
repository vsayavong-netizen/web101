import React, { useState } from 'react';
import { Announcement, User } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, MegaphoneIcon } from './icons';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';
import AnnouncementModal from './AnnouncementModal';
import { useTranslations } from '../hooks/useTranslations';

interface AnnouncementsManagementProps {
    announcements: Announcement[];
    user: User;
    addAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateAnnouncement: (announcement: Announcement) => void;
    deleteAnnouncement: (announcementId: string) => void;
}

const AnnouncementsManagement: React.FC<AnnouncementsManagementProps> = ({ announcements, user, addAnnouncement, updateAnnouncement, deleteAnnouncement }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
    const addToast = useToast();
    const t = useTranslations();

    const handleAddClick = () => {
        setEditingAnnouncement(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setIsModalOpen(true);
    };

    const confirmDelete = () => {
        if (announcementToDelete) {
            deleteAnnouncement(announcementToDelete.id);
            addToast({ type: 'success', message: t('announcementDeletedSuccess') });
            setAnnouncementToDelete(null);
        }
    };

    const handleSave = (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'authorName'>) => {
        if (editingAnnouncement) {
            updateAnnouncement({ ...editingAnnouncement, ...data });
            addToast({ type: 'success', message: t('announcementUpdatedSuccess') });
        } else {
            addAnnouncement({ ...data, authorName: user.name });
            addToast({ type: 'success', message: t('announcementPostedSuccess') });
        }
        setIsModalOpen(false);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div className="flex items-center">
                   <MegaphoneIcon className="w-8 h-8 text-blue-600 mr-3"/>
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('manageAnnouncements')}</h2>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">{t('manageAnnouncementsDescription')}</p>
                   </div>
                </div>
                <button
                    onClick={handleAddClick}
                    className="mt-4 sm:mt-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('newAnnouncement')}
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('title')}</th>
                            <th scope="col" className="px-6 py-3">{t('audience')}</th>
                            <th scope="col" className="px-6 py-3">{t('author')}</th>
                            <th scope="col" className="px-6 py-3">{t('date')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {announcements.map(announcement => (
                            <tr key={announcement.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{announcement.title}</td>
                                <td className="px-6 py-4">{announcement.audience}</td>
                                <td className="px-6 py-4">{announcement.authorName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(announcement.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleEditClick(announcement)} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => setAnnouncementToDelete(announcement)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {announcements.length === 0 && (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                        {t('noAnnouncementsFound').replace('${newAnnouncement}', t('newAnnouncement'))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <AnnouncementModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave} 
                    announcementToEdit={editingAnnouncement}
                />
            )}
            {announcementToDelete && (
                <ConfirmationModal 
                    isOpen={!!announcementToDelete}
                    onClose={() => setAnnouncementToDelete(null)}
                    onConfirm={confirmDelete}
                    title={t('deleteAnnouncementTitle')}
                    message={t('deleteAnnouncementMessage').replace('${title}', announcementToDelete.title)}
                />
            )}
        </div>
    );
};

export default AnnouncementsManagement;
