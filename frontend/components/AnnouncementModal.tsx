import React, { useState, useEffect } from 'react';
import { Announcement, AnnouncementAudience } from '../types';
import { XMarkIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface AnnouncementModalProps {
  onClose: () => void;
  onSave: (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'authorName'>) => void;
  announcementToEdit: Announcement | null;
}

const parseMarkdown = (text: string = '') => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>')         // Italic
    .replace(/(\r\n|\n|\r)/g, '<br />');      // Newlines
};

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ onClose, onSave, announcementToEdit }) => {
  const isEditMode = !!announcementToEdit;
  const t = useTranslations();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('All');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (announcementToEdit) {
      setTitle(announcementToEdit.title);
      setContent(announcementToEdit.content);
      setAudience(announcementToEdit.audience);
    }
  }, [announcementToEdit]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = t('titleRequired');
    if (!content.trim()) newErrors.content = t('contentRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ title, content, audience });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <style>{`.input-style { transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out; width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; } .dark .input-style { background-color: #334155; border-color: #475569; color: #f8fafc; } .prose strong { color: inherit; } .prose em { color: inherit; }`}</style>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-slate-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{isEditMode ? t('editAnnouncement') : t('newAnnouncement')}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate className="flex-grow min-h-0 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('title')}</label>
              <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className={`input-style mt-1 ${errors.title ? 'border-red-500' : ''}`} />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
              <label htmlFor="audience" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('audience')}</label>
              <select id="audience" value={audience} onChange={e => setAudience(e.target.value as AnnouncementAudience)} className="input-style mt-1">
                <option value="All">{t('allUsers')}</option>
                <option value="Students">{t('studentsOnly')}</option>
                <option value="Advisors">{t('advisorsOnly')}</option>
              </select>
            </div>
          </div>

          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
            <div className="flex flex-col">
                <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('contentMarkdown')}</label>
                <textarea 
                    id="content" 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    className={`input-style flex-grow resize-none ${errors.content ? 'border-red-500' : ''}`}
                    placeholder={t('markdownHelp')}
                />
                {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
            </div>
            <div className="flex flex-col">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('preview')}</label>
                 <div className="input-style flex-grow prose prose-sm max-w-none dark:text-slate-200" dangerouslySetInnerHTML={{ __html: parseMarkdown(content) || `<p class="text-slate-400">${t('previewPlaceholder')}</p>` }}></div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t dark:border-slate-700 mt-6 flex-shrink-0">
            <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white font-bold py-2 px-4 rounded-lg">{t('cancel')}</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                {isEditMode ? t('saveChanges') : t('postAnnouncement')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementModal;
