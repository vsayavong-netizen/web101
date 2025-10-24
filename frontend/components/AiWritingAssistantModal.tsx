import React from 'react';
import { XMarkIcon, SparklesIcon } from './icons';
import { GrammarCheckResult } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface AiWritingAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    result: GrammarCheckResult | null;
    fileName: string;
    originalText: string;
}

const AiWritingAssistantModal: React.FC<AiWritingAssistantModalProps> = ({ isOpen, onClose, isLoading, result, fileName, originalText }) => {
    const t = useTranslations();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center pb-4 border-b dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-purple-500" />
                        {t('aiWritingAssistant')}
                    </h2>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6"/></button>
                </div>
                <div className="mt-4 flex-grow overflow-y-auto pr-2 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t('analyzingDocument')}: <span className="font-semibold">{fileName}</span></p>
                    {isLoading ? (
                         <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-slate-500 dark:text-slate-400">{t('analyzingDocument')}</p>
                        </div>
                    ) : result ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{t('summaryOfImprovements')}</h3>
                                <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">{result.summary}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300">{t('originalText')}</h4>
                                    <div className="mt-2 p-3 h-64 overflow-y-auto rounded-md bg-slate-100 dark:bg-slate-900 text-sm whitespace-pre-wrap">{originalText}</div>
                                </div>
                                 <div>
                                    <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300">{t('suggestedText')}</h4>
                                    <div className="mt-2 p-3 h-64 overflow-y-auto rounded-md bg-green-50 dark:bg-green-900/50 text-sm whitespace-pre-wrap">{result.correctedText}</div>
                                </div>
                            </div>
                        </div>
                    ) : <p className="text-center text-slate-500 dark:text-slate-400">{t('couldNotGenerateAnalysis')}</p>}
                </div>
                 <div className="flex justify-end space-x-4 pt-4 border-t dark:border-slate-700 mt-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 font-bold py-2 px-4 rounded-lg">{t('closeBtn')}</button>
                    <button type="button" onClick={onClose} disabled={!result} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400">
                        {t('acceptAndReplace')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiWritingAssistantModal;
