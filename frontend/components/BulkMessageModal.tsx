import React, { useState } from 'react';
import { XMarkIcon, PaperAirplaneIcon, SparklesIcon } from './icons';
import { ProjectGroup, User } from '../types';
import { GoogleGenAI } from "@google/genai";
import { useToast } from '../hooks/useToast';
import { useTranslations } from '../hooks/useTranslations';

interface BulkMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (message: string) => void;
    selectedProjects: ProjectGroup[];
    user: User;
}

const BulkMessageModal: React.FC<BulkMessageModalProps> = ({ isOpen, onClose, onSend, selectedProjects, user }) => {
    const [message, setMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const addToast = useToast();
    const t = useTranslations();

    if (!isOpen) return null;

    const handleGenerateMessage = async (templateType: 'overdue' | 'reminder') => {
        setIsGenerating(true);
        try {
            if (!process.env.API_KEY) throw new Error("API key not configured.");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            let promptAction;
            if (templateType === 'overdue') {
                promptAction = 'The students have missed a deadline. The message should be a firm but supportive reminder to submit their work and contact the advisor.';
            } else {
                promptAction = 'The students have an upcoming deadline. The message should be a friendly reminder to prepare their submission.';
            }

            const prompt = `
              You are an academic advisor named ${user.name}. Draft a concise and professional message to be sent to multiple student groups.
              Task: ${promptAction}
              Instructions:
              - The message should be general enough for multiple projects.
              - Address the students respectfully.
              - Keep it to 2-3 sentences.
              - Do not include a greeting or signature; that will be added automatically.
              - Respond with only the message text.
            `;
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
            setMessage(response.text.trim());
            addToast({ type: 'success', message: t('aiMessageGenerated') });
        } catch (error) {
            console.error("AI message generation failed:", error);
            addToast({ type: 'error', message: t('couldNotGenerateMessage') });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSend = () => {
        if (!message.trim()) {
            addToast({ type: 'error', message: t('messageCannotBeEmpty') });
            return;
        }
        onSend(message);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center pb-4 border-b dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('sendBulkMessage')}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="my-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t('messageWillBeSentTo').replace('${count}', String(selectedProjects.length))}</p>
                    <ul className="text-xs text-slate-500 dark:text-slate-500 mt-2 list-disc list-inside max-h-24 overflow-y-auto">
                        {selectedProjects.map(p => <li key={p.project.projectId}>{p.project.projectId} - {p.students.map(s => s.name).join(', ')}</li>)}
                    </ul>
                </div>

                <div className="flex-grow flex flex-col">
                    <label htmlFor="bulk-message" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('message')}</label>
                    <textarea
                        id="bulk-message"
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        placeholder={t('typeYourMessage')}
                    />
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('aiTemplates')}</span>
                        <button onClick={() => handleGenerateMessage('reminder')} disabled={isGenerating} className="flex items-center text-xs font-semibold text-purple-600 hover:underline disabled:opacity-50"><SparklesIcon className="w-4 h-4 mr-1"/>{t('deadlineReminder')}</button>
                        <button onClick={() => handleGenerateMessage('overdue')} disabled={isGenerating} className="flex items-center text-xs font-semibold text-purple-600 hover:underline disabled:opacity-50"><SparklesIcon className="w-4 h-4 mr-1"/>{t('overdueNotice')}</button>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t dark:border-slate-700 mt-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white font-bold py-2 px-4 rounded-lg">{t('cancel')}</button>
                    <button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                        <PaperAirplaneIcon className="w-5 h-5"/> {t('sendMessage')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkMessageModal;