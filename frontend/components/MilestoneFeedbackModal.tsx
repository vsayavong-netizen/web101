import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, ArrowPathIcon, SparklesIcon } from './icons';
import { ProjectGroup } from '../types';
import { useToast } from '../hooks/useToast';
import { GoogleGenAI } from "@google/genai";
import { useTranslations } from '../hooks/useTranslations';

type ActionType = 'approve' | 'revise';

interface MilestoneFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (feedback: string) => void;
  action: ActionType;
  milestoneName: string;
  projectGroup?: ProjectGroup;
}

const MilestoneFeedbackModal: React.FC<MilestoneFeedbackModalProps> = ({ isOpen, onClose, onConfirm, action, milestoneName, projectGroup }) => {
  const [feedback, setFeedback] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const addToast = useToast();
  const t = useTranslations();

  const config = {
      approve: {
          title: t('approveMilestone'),
          icon: <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />,
          iconBg: 'bg-green-100',
          buttonText: t('approveButton'),
          buttonBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          prompt: (milestoneName: string) => t('approveFeedbackPrompt').replace('{milestoneName}', milestoneName),
      },
      revise: {
          title: t('requestRevisionTitle'),
          icon: <ArrowPathIcon className="h-6 w-6 text-orange-600" aria-hidden="true" />,
          iconBg: 'bg-orange-100',
          buttonText: t('requestRevisionButton'),
          buttonBg: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500',
          prompt: (milestoneName: string) => t('requestRevisionPrompt').replace('{milestoneName}', milestoneName),
      }
  };

  const actionConfig = config[action];

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(feedback);
    setFeedback('');
  };

  const handleGenerateFeedback = async () => {
    if (!projectGroup) return;
    
    setIsGenerating(true);
    try {
        if (!process.env.API_KEY) throw new Error("API key is not configured.");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        let promptAction = '';
        if (action === 'approve') {
            promptAction = `The advisor is approving this milestone. The feedback should be positive and encouraging, perhaps suggesting what to focus on for the next milestone.`;
        } else { // 'revise'
            promptAction = `The advisor is requesting a revision. The feedback should be constructive, clearly and politely explaining what needs to be improved without being overly harsh.`;
        }

        const prompt = `
            You are a helpful university advisor in Laos providing feedback on a student project.
            Project Topic: "${projectGroup.project.topicEng}"
            Milestone: "${milestoneName}"
            
            Task: Draft a feedback message for the student.
            Instructions:
            - Keep it concise (2-4 sentences).
            - The tone should be professional, academic, and supportive.
            - ${promptAction}
            
            Respond with only the feedback text, without any introductory phrases like "Here's the feedback:".
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        setFeedback(response.text.trim());
        addToast({ type: 'success', message: t('feedbackGeneratedSuccess') });
    } catch (error) {
        console.error("AI feedback generation failed:", error);
        addToast({ type: 'error', message: t('feedbackGenerationFailed') });
    } finally {
        setIsGenerating(false);
    }
  };


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
                {actionConfig.prompt(milestoneName)}
              </p>
            </div>
            <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="feedback-textarea" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('feedbackLabel')}</label>
                    {projectGroup && (
                        <button
                            type="button"
                            onClick={handleGenerateFeedback}
                            disabled={isGenerating}
                            className="flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 dark:border-purple-400 mr-1.5"></div>
                                    {t('generating')}
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-4 h-4 mr-1"/>
                                    {t('suggestWithAI')}
                                </>
                            )}
                        </button>
                    )}
                </div>
                <textarea
                    id="feedback-textarea"
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600"
                    placeholder={t('feedbackPlaceholder')}
                    aria-label="Feedback for milestone"
                />
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse sm:space-x-2 space-y-2 sm:space-y-0">
          <button
            type="button"
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm ${actionConfig.buttonBg}`}
            onClick={handleConfirm}
          >
            {actionConfig.buttonText}
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

export default MilestoneFeedbackModal;