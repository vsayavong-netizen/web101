
import React, { useState, useMemo, useEffect } from 'react';
import { ScoringSettings, ScoringRubricItem, GradeBoundary } from '../types';
import { PlusIcon, TrashIcon, SparklesIcon } from './icons';
import { v4 as uuidv4 } from 'uuid';
import { useTranslations } from '../hooks/useTranslations';
import RubricGeneratorModal from './RubricGeneratorModal';

interface ScoringSettingsEditorProps {
    scoringSettings: ScoringSettings;
    updateScoringSettings: (settings: ScoringSettings) => void;
}

interface RubricEditorProps {
    rubrics: ScoringRubricItem[];
    setRubrics: (updater: React.SetStateAction<ScoringRubricItem[]>) => void;
    onGenerate: () => void;
    title: string;
}

const RubricEditor: React.FC<RubricEditorProps> = ({ rubrics, setRubrics, onGenerate, title }) => {
    const t = useTranslations();
    const totalScore = useMemo(() => rubrics.reduce((sum: number, item: ScoringRubricItem) => sum + (Number(item.maxScore) || 0), 0), [rubrics]);

    const handleAdd = () => setRubrics(prev => [...prev, { id: uuidv4(), name: '', maxScore: 10 }]);
    const handleRemove = (id: string) => setRubrics(prev => prev.filter(item => item.id !== id));
    const handleUpdate = (id: string, field: 'name' | 'maxScore', value: string | number) => {
        setRubrics(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    
    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
            <div className="flex justify-between items-center flex-wrap gap-2">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title} ({t('totalPoints')}: {totalScore})</h4>
                <div className="flex items-center gap-4">
                    <button type="button" onClick={onGenerate} className="flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300">
                        <SparklesIcon className="w-4 h-4 mr-1"/>
                        {t('generateWithAI')}
                    </button>
                    <button type="button" onClick={handleAdd} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"><PlusIcon className="w-4 h-4 mr-1"/> {t('addItem')}</button>
                </div>
            </div>
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-2">
                {rubrics.map(item => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                        <input type="text" value={item.name} onChange={e => handleUpdate(item.id, 'name', e.target.value)} placeholder="Criterion Name" className="col-span-7 block w-full text-sm rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                        <input type="number" value={item.maxScore} onChange={e => handleUpdate(item.id, 'maxScore', Number(e.target.value))} min="1" className="col-span-3 block w-full text-sm rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                        <div className="col-span-2 flex justify-end">
                            <button type="button" onClick={() => handleRemove(item.id)} className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400" aria-label="Remove item">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


export const ScoringSettingsEditor: React.FC<ScoringSettingsEditorProps> = ({ scoringSettings, updateScoringSettings }) => {
    const [localAdvisorRubrics, setLocalAdvisorRubrics] = useState<ScoringRubricItem[]>(scoringSettings.advisorRubrics);
    const [localCommitteeRubrics, setLocalCommitteeRubrics] = useState<ScoringRubricItem[]>(scoringSettings.committeeRubrics);
    const [gradeBoundaries, setGradeBoundaries] = useState<GradeBoundary[]>(scoringSettings.gradeBoundaries);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [generatorType, setGeneratorType] = useState<'advisor' | 'committee'>('advisor');
    const t = useTranslations();

    useEffect(() => {
        setLocalAdvisorRubrics(scoringSettings.advisorRubrics);
        setLocalCommitteeRubrics(scoringSettings.committeeRubrics);
        setGradeBoundaries(scoringSettings.gradeBoundaries);
    }, [scoringSettings]);

    const totalAdvisorScore = useMemo(() => localAdvisorRubrics.reduce((sum, item) => sum + (Number(item.maxScore) || 0), 0), [localAdvisorRubrics]);
    const totalCommitteeScore = useMemo(() => localCommitteeRubrics.reduce((sum, item) => sum + (Number(item.maxScore) || 0), 0), [localCommitteeRubrics]);
    
    const handleBoundaryChange = (index: number, field: 'grade' | 'minScore', value: string | number) => {
        const newBoundaries = [...gradeBoundaries];
        (newBoundaries[index] as any)[field] = value;
        setGradeBoundaries(newBoundaries);
    };

    const handleAddBoundary = () => {
        setGradeBoundaries([...gradeBoundaries, { grade: '', minScore: 0 }]);
    };

    const handleRemoveBoundary = (indexToRemove: number) => {
        setGradeBoundaries(gradeBoundaries.filter((_, index) => index !== indexToRemove));
    };

    const validateAndSave = () => {
        const newErrors: Record<string, string> = {};
        const totalPoints = totalAdvisorScore + totalCommitteeScore;
        if (totalPoints !== 100) {
            newErrors.total = t('totalPointsMustBe').replace('{total}', '100').replace('{current}', String(totalPoints));
        }

        const scoreSet = new Set();
        gradeBoundaries.forEach((boundary, index) => {
            if (scoreSet.has(boundary.minScore)) {
                newErrors[`boundary_${index}`] = t('duplicateMinScoreError').replace('{score}', String(boundary.minScore));
            }
            scoreSet.add(boundary.minScore);
            if (boundary.minScore < 0 || boundary.minScore > 100) {
                 newErrors[`boundary_${index}`] = t('gradeScoreError').replace('{grade}', boundary.grade);
            }
        });

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            const sortedBoundaries = [...gradeBoundaries].sort((a, b) => b.minScore - a.minScore);
            updateScoringSettings({
                ...scoringSettings,
                advisorRubrics: localAdvisorRubrics,
                committeeRubrics: localCommitteeRubrics,
                gradeBoundaries: sortedBoundaries,
            });
        }
    };

    const openGenerator = (type: 'advisor' | 'committee') => {
        setGeneratorType(type);
        setIsGeneratorOpen(true);
    };

    const handleGeneratedRubric = (newRubrics: ScoringRubricItem[]) => {
        if (generatorType === 'advisor') {
            setLocalAdvisorRubrics(newRubrics);
        } else {
            setLocalCommitteeRubrics(newRubrics);
        }
        setIsGeneratorOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
                <RubricEditor title={t('advisorRubric')} rubrics={localAdvisorRubrics} setRubrics={setLocalAdvisorRubrics} onGenerate={() => openGenerator('advisor')} />
                <RubricEditor title={t('committeeRubric')} rubrics={localCommitteeRubrics} setRubrics={setLocalCommitteeRubrics} onGenerate={() => openGenerator('committee')} />
                {errors.total && <p className="text-red-500 text-sm font-semibold text-center">{errors.total}</p>}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('gradeBoundaries')}</h3>
                    <button type="button" onClick={handleAddBoundary} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                        <PlusIcon className="w-4 h-4 mr-1"/> {t('addItem')}
                    </button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('gradeBoundariesDescription')}</p>
                <div className="mt-4 space-y-2">
                    {gradeBoundaries.map((boundary, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-start">
                            <div className="col-span-5"><input type="text" value={boundary.grade} onChange={e => handleBoundaryChange(index, 'grade', e.target.value)} placeholder="Grade" className="block w-full text-sm rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
                            <div className="col-span-5"><input type="number" value={boundary.minScore} onChange={e => handleBoundaryChange(index, 'minScore', Number(e.target.value))} placeholder="Min Score" className="block w-full text-sm rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
                            <div className="col-span-2 flex items-center pt-2"><button type="button" onClick={() => handleRemoveBoundary(index)} className="text-slate-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button></div>
                            {errors[`boundary_${index}`] && <p className="text-red-500 text-xs col-span-12">{errors[`boundary_${index}`]}</p>}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                    type="button"
                    className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                    onClick={validateAndSave}
                >
                    {t('saveSettings')}
                </button>
            </div>
            {isGeneratorOpen && (
                <RubricGeneratorModal 
                    rubricType={generatorType}
                    targetScore={generatorType === 'advisor' ? totalAdvisorScore : totalCommitteeScore}
                    onClose={() => setIsGeneratorOpen(false)}
                    onSave={handleGeneratedRubric}
                />
            )}
        </div>
    );
};
