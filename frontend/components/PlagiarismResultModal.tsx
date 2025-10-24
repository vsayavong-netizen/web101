

import React from 'react';
import { PlagiarismResult } from '../types';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, MagnifyingGlassIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

const ScoreIndicator: React.FC<{ score: number }> = ({ score }) => {
    const t = useTranslations();
    let colorClass = 'text-green-500';
    let bgColorClass = 'bg-green-100 dark:bg-green-900/50';
    let Icon = CheckCircleIcon;
    let label = t('lowSimilarity');

    if (score >= 20 && score < 50) {
        colorClass = 'text-yellow-500';
        bgColorClass = 'bg-yellow-100 dark:bg-yellow-900/50';
        Icon = ExclamationTriangleIcon;
        label = t('moderateSimilarity');
    } else if (score >= 50) {
        colorClass = 'text-red-500';
        bgColorClass = 'bg-red-100 dark:bg-red-900/50';
        Icon = ExclamationTriangleIcon;
        label = t('highSimilarity');
    }

    return (
        <div className={`p-4 rounded-lg flex items-center justify-center gap-4 ${bgColorClass}`}>
            <Icon className={`w-12 h-12 ${colorClass}`} />
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('overallSimilarityScore')}</p>
                <p className={`text-4xl font-bold ${colorClass}`}>{score.toFixed(1)}%</p>
                <p className={`text-sm font-semibold ${colorClass}`}>{label}</p>
            </div>
        </div>
    );
};

interface PlagiarismResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: PlagiarismResult | null;
}

const PlagiarismResultModal: React.FC<PlagiarismResultModalProps> = ({ isOpen, onClose, result }) => {
    const t = useTranslations();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center pb-4 border-b dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <MagnifyingGlassIcon className="w-7 h-7 text-blue-500" />
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('aiPlagiarismCheckResults')}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="mt-4 flex-grow overflow-y-auto pr-2">
                    {result ? (
                        <div className="space-y-4">
                            <ScoreIndicator score={result.overallSimilarityScore} />
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('potentialMatches')}</h3>
                                {result.potentialMatches.length > 0 ? (
                                    <ul className="mt-2 space-y-3">
                                        {result.potentialMatches.map((match, index) => (
                                            <li key={index} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                                                <div className="flex justify-between items-baseline">
                                                    <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{match.source}</p>
                                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 ml-4">{t('matchPercentage').replace('{percentage}', match.similarity.toFixed(1))}</span>
                                                </div>
                                                <blockquote className="mt-2 pl-3 text-sm text-slate-600 dark:text-slate-400 border-l-2 border-slate-300 dark:border-slate-600">
                                                    "{match.matchedSnippet}"
                                                </blockquote>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('noSignificantMatches')}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-slate-500 dark:text-slate-400">{t('checkingForPlagiarism')}</p>
                        </div>
                    )}
                </div>
                 <div className="flex justify-end pt-4 border-t dark:border-slate-700 mt-4 flex-shrink-0">
                    <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white font-bold py-2 px-4 rounded-lg">
                        {t('closeBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlagiarismResultModal;
