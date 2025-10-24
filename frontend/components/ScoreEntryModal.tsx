import React, { useState, useMemo, useEffect } from 'react';
import { ScoringRubricItem } from '../types';
import { XMarkIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface ScoreEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (scores: Record<string, number>) => void;
    rubric: ScoringRubricItem[];
    initialScores: Record<string, number>;
    evaluatorName: string;
    maxTotalScore: number;
}

const ScoreEntryModal: React.FC<ScoreEntryModalProps> = ({ isOpen, onClose, onSave, rubric, initialScores, evaluatorName, maxTotalScore }) => {
    const [scores, setScores] = useState<Record<string, number>>(initialScores);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const t = useTranslations();

    useEffect(() => {
        setScores(initialScores);
    }, [initialScores, isOpen]);

    const totalScore = useMemo(() => {
        return rubric.reduce((sum, item) => sum + (scores[item.id] || 0), 0);
    }, [scores, rubric]);
    
    const handleScoreChange = (rubricId: string, value: string, maxScore: number) => {
        const numValue = Number(value);
        setScores(prev => ({ ...prev, [rubricId]: numValue }));

        if (numValue < 0 || numValue > maxScore) {
            setErrors(prev => ({ ...prev, [rubricId]: t('scoreBoundaryError').replace('{max}', String(maxScore)) }));
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[rubricId];
                return newErrors;
            });
        }
    };
    
    const handleSubmit = () => {
        if (Object.keys(errors).length > 0) return;
        
        // Ensure all fields have a value (default to 0 if empty)
        const finalScores: Record<string, number> = {};
        rubric.forEach(item => {
            finalScores[item.id] = scores[item.id] || 0;
        });

        onSave(finalScores);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center pb-4 border-b dark:border-slate-700 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('enterScore')}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('forEvaluator').replace('{name}', evaluatorName)}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="mt-4 flex-grow overflow-y-auto pr-2 space-y-4">
                    {rubric.map(item => (
                        <div key={item.id}>
                             <div className="flex justify-between items-baseline">
                                <label htmlFor={`score-${item.id}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {item.name}
                                </label>
                                <span className="text-sm text-slate-500 dark:text-slate-400">{t('maxScoreLabel')}: {item.maxScore}</span>
                            </div>
                            <input
                                type="number"
                                id={`score-${item.id}`}
                                value={scores[item.id] ?? ''}
                                onChange={(e) => handleScoreChange(item.id, e.target.value, item.maxScore)}
                                min="0"
                                max={item.maxScore}
                                className={`block w-full mt-1 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white ${errors[item.id] ? 'border-red-500' : ''}`}
                            />
                            {errors[item.id] && <p className="text-red-500 text-xs mt-1">{errors[item.id]}</p>}
                        </div>
                    ))}
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700 mt-4 flex-shrink-0">
                    <div className="text-lg">
                        <span className="font-medium text-slate-500 dark:text-slate-400">{t('total')}: </span>
                        <span className="font-bold text-slate-800 dark:text-white">{totalScore.toFixed(2)} / {maxTotalScore}</span>
                    </div>
                    <div className="space-x-2">
                        <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white font-bold py-2 px-4 rounded-lg">
                            {t('cancel')}
                        </button>
                        <button 
                            type="button" 
                            onClick={handleSubmit} 
                            disabled={Object.keys(errors).length > 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400"
                        >
                            {t('saveScore')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScoreEntryModal;