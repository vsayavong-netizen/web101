import React from 'react';
import { StudentSkillsAnalysis } from '../types';
import { SparklesIcon, ClipboardDocumentListIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface AiSkillsCardProps {
    skillsAnalysis: StudentSkillsAnalysis | null;
    isAnalyzing: boolean;
    onAnalyze: () => void;
}

const AiSkillsCard: React.FC<AiSkillsCardProps> = ({ skillsAnalysis, isAnalyzing, onAnalyze }) => {
    const t = useTranslations();

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <ClipboardDocumentListIcon className="w-6 h-6 text-blue-500" />
                {t('aiSkillsAnalysis')}
            </h3>
            
            {!skillsAnalysis && (
                <div className="text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t('aiSkillsAnalysisDescription')}</p>
                    <button onClick={onAnalyze} disabled={isAnalyzing} className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:bg-slate-400">
                        {isAnalyzing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                {t('analyzing')}
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5" />
                                {t('analyzeMySkills')}
                            </>
                        )}
                    </button>
                </div>
            )}
            
            {skillsAnalysis && (
                <div className="space-y-3 text-sm animate-fade-in">
                    <p className="italic text-slate-600 dark:text-slate-400">{skillsAnalysis.summary}</p>
                    <ul className="space-y-2">
                        {skillsAnalysis.skills.map(s => (
                            <li key={s.skill} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                <strong className="font-semibold text-slate-800 dark:text-slate-100">{s.skill}:</strong> {s.justification}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AiSkillsCard;