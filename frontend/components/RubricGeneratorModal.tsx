
import React, { useState } from 'react';
import { ScoringRubricItem } from '../types';
import { XMarkIcon, SparklesIcon } from './icons';
import { useToast } from '../hooks/useToast';
import { GoogleGenAI, Type } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { useTranslations } from '../hooks/useTranslations';

interface RubricGeneratorModalProps {
    rubricType: 'advisor' | 'committee';
    targetScore: number;
    onClose: () => void;
    onSave: (rubrics: ScoringRubricItem[]) => void;
}

const RubricGeneratorModal: React.FC<RubricGeneratorModalProps> = ({ rubricType, targetScore, onClose, onSave }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedRubric, setGeneratedRubric] = useState<ScoringRubricItem[] | null>(null);
    const addToast = useToast();
    const t = useTranslations();

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            addToast({ type: 'error', message: 'Please enter a description for the rubric.' });
            return;
        }
        if (!process.env.API_KEY) {
            addToast({ type: 'error', message: 'AI feature is not configured.' });
            return;
        }
        
        setIsLoading(true);
        setGeneratedRubric(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const apiPrompt = `
                You are an expert academic curriculum designer creating a scoring rubric for a university final project defense.
                The rubric is for the project's ${rubricType}.
                The student's project is in a business-related field. Based on the user's request below, generate a list of 3 to 5 relevant scoring criteria.
                User's Request: "${prompt}"
                For each criterion, provide a "name" and a "maxScore".
                The sum of all "maxScore" values MUST equal exactly ${targetScore}.
                Respond ONLY with a JSON object. The JSON object should have a single key "rubric" which is an array of objects. Each object in the array must have two keys: "name" (string) and "maxScore" (number).
            `;

            const schema = {
                type: Type.OBJECT,
                properties: {
                    rubric: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                maxScore: { type: Type.NUMBER }
                            },
                            required: ['name', 'maxScore']
                        }
                    }
                },
                required: ['rubric']
            };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: apiPrompt,
                config: { responseMimeType: "application/json", responseSchema: schema },
            });

            const result = JSON.parse(response.text);
            const rubricItems = result.rubric.map((item: any) => ({ ...item, id: uuidv4() }));
            
            const total = rubricItems.reduce((sum: number, item: ScoringRubricItem) => sum + item.maxScore, 0);
            if (total !== targetScore) {
                const normalizedRubric = rubricItems.map((item: ScoringRubricItem) => ({
                    ...item,
                    maxScore: Math.round((item.maxScore / total) * targetScore)
                }));
                const normalizedTotal = normalizedRubric.reduce((sum: number, item: ScoringRubricItem) => sum + item.maxScore, 0);
                if (normalizedTotal !== targetScore && normalizedRubric.length > 0) {
                    normalizedRubric[normalizedRubric.length-1].maxScore += (targetScore - normalizedTotal);
                }
                setGeneratedRubric(normalizedRubric);
                addToast({ type: 'info', message: 'AI response was adjusted to meet score requirements.'});
            } else {
                setGeneratedRubric(rubricItems);
                addToast({ type: 'success', message: t('rubricGeneratedSuccess') });
            }

        } catch (error) {
            console.error("AI Rubric Generation failed:", error);
            addToast({ type: 'error', message: t('rubricGenerationFailed') });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (generatedRubric) {
            onSave(generatedRubric);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center pb-4 border-b dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-purple-500"/>
                        {t('aiRubricGenerator')}
                    </h2>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6"/></button>
                </div>
                <div className="mt-4 flex-grow overflow-y-auto pr-2 space-y-4">
                    <div>
                        <label htmlFor="rubric-prompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            {t('rubricGeneratorDescription').replace('{targetScore}', String(targetScore))}
                        </label>
                        <textarea
                            id="rubric-prompt"
                            rows={3}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="e.g., focus on research quality, presentation skills, and originality"
                        />
                    </div>
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400">
                        {isLoading ? (
                            <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>{t('generating')}</>
                        ) : (
                           t('generateRubric')
                        )}
                    </button>
                    {generatedRubric && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">{t('generatedRubricPreview')}</h3>
                            <ul className="space-y-2">
                                {generatedRubric.map(item => (
                                    <li key={item.id} className="flex justify-between items-center p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                                        <span className="text-sm text-slate-800 dark:text-slate-200">{item.name}</span>
                                        <span className="text-sm font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full">{item.maxScore} pts</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-4 pt-4 border-t dark:border-slate-700 mt-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white font-bold py-2 px-4 rounded-lg">
                        {t('cancel')}
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSave} 
                        disabled={!generatedRubric}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400"
                    >
                        {t('acceptAndReplace')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RubricGeneratorModal;
