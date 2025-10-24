
import React from 'react';
import { CommunicationAnalysisResult } from '../types';
import { 
    XMarkIcon, SparklesIcon, ClipboardDocumentListIcon, LightBulbIcon, HeartIcon, 
    CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, ArrowUpIcon, ArrowDownIcon, 
    ArrowsRightLeftIcon, UserGroupIcon
} from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface CommunicationAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: CommunicationAnalysisResult | null;
    isLoading: boolean;
}

const CommunicationAnalysisModal: React.FC<CommunicationAnalysisModalProps> = ({ isOpen, onClose, result, isLoading }) => {
    const t = useTranslations();
    if (!isOpen) return null;

    const sentimentConfig = {
        Positive: { icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />, text: t('positive'), classes: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' },
        Neutral: { icon: <ClockIcon className="w-5 h-5 text-slate-500" />, text: t('neutral'), classes: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300' },
        'Needs Attention': { icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />, text: t('needsAttention'), classes: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' },
    };

    const trendConfig = {
        Improving: { icon: <ArrowUpIcon className="w-4 h-4 text-green-500" />, text: t('improving') },
        Declining: { icon: <ArrowDownIcon className="w-4 h-4 text-red-500" />, text: t('declining') },
        Stable: { icon: <ArrowsRightLeftIcon className="w-4 h-4 text-slate-500" />, text: t('stable') },
        Mixed: { icon: <ArrowsRightLeftIcon className="w-4 h-4 text-purple-500" />, text: t('mixed') },
    };

    const KeyMetric: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; }> = ({ icon, label, value }) => (
        <div className="bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
                {icon}
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
            </div>
            <div className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{value}</div>
        </div>
    );

    const sentiment = result ? sentimentConfig[result.sentiment] || sentimentConfig.Neutral : sentimentConfig.Neutral;
    const trend = result ? trendConfig[result.sentimentTrend] || trendConfig.Stable : trendConfig.Stable;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center pb-4 border-b dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-7 h-7 text-purple-500" />
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('aiCommunicationAnalysis')}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="mt-4 flex-grow overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-slate-500 dark:text-slate-400">{t('analyzingLog')}</p>
                        </div>
                    ) : result ? (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                                    <ClipboardDocumentListIcon className="w-5 h-5 text-blue-500" />
                                    {t('executiveSummary')}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 prose prose-sm max-w-none dark:prose-invert">{result.summary}</p>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <KeyMetric icon={<HeartIcon className="w-5 h-5 text-pink-500" />} label={t('overallSentiment')} value={<span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-semibold ${sentiment.classes}`}>{sentiment.icon}{sentiment.text}</span>} />
                                <KeyMetric icon={trend.icon} label={t('sentimentTrend')} value={trend.text} />
                                <KeyMetric icon={<ClockIcon className="w-5 h-5 text-cyan-500" />} label={t('responseTime')} value={result.responseTime} />
                                <KeyMetric icon={<LightBulbIcon className="w-5 h-5 text-yellow-500" />} label={t('advisorFeedback')} value={result.feedbackClarity} />
                                <KeyMetric icon={<UserGroupIcon className="w-5 h-5 text-indigo-500" />} label={t('studentEngagement')} value={result.studentEngagement} />
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    {t('actionItems')}
                                </h3>
                                {result.actionItems.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                        {result.actionItems.map((item, index) => <li key={index}>{item}</li>)}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('noActionItems')}</p>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                                    {t('potentialIssues')}
                                </h3>
                                {result.potentialIssues.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                        {result.potentialIssues.map((item, index) => <li key={index}>{item}</li>)}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('noIssuesDetected')}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 dark:text-slate-400">{t('couldNotGenerateAnalysis')}</p>
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

export default CommunicationAnalysisModal;
