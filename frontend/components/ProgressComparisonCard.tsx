import React from 'react';
import { ChartPieIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface ProgressComparisonCardProps {
    userProgress: number;
    majorAverageProgress: number | null;
}

const ProgressBar: React.FC<{ progress: number; label: string; color: string; bgColor: string; }> = ({ progress, label, color, bgColor }) => (
    <div>
        <div className="flex justify-between items-baseline mb-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
            <p className={`text-sm font-bold ${color}`}>{progress.toFixed(1)}%</p>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div className={`${bgColor} h-2.5 rounded-full`} style={{ width: `${progress}%` }}></div>
        </div>
    </div>
);


const ProgressComparisonCard: React.FC<ProgressComparisonCardProps> = ({ userProgress, majorAverageProgress }) => {
    const t = useTranslations();

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <ChartPieIcon className="w-6 h-6 text-blue-500" />
                {t('progressComparison')}
            </h3>
            <div className="space-y-4">
                <ProgressBar progress={userProgress} label={t('yourProgress')} color="text-blue-500" bgColor="bg-blue-500" />
                {majorAverageProgress !== null ? (
                    <ProgressBar progress={majorAverageProgress} label={t('majorAverage')} color="text-green-500" bgColor="bg-green-500" />
                ) : (
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2">{t('noDataForMajorComparison')}</p>
                )}
            </div>
        </div>
    );
};

export default ProgressComparisonCard;