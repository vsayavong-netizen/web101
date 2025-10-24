
import React, { useState, useMemo, useCallback } from 'react';
import { User, ProjectGroup, Advisor, Major, SystemHealthIssue, AdvisorSuggestion, SimilarityInfo, SystemSecurityIssue, Student } from '../types';
import { SparklesIcon, HeartIcon, AcademicCapIcon, MagnifyingGlassIcon, ShieldCheckIcon, CheckCircleIcon } from './icons';
import { useToast } from '../hooks/useToast';
import { GoogleGenAI, Type } from '@google/genai';
import { useTranslations } from '../hooks/useTranslations';

interface AiToolsPageProps {
    user: User;
    projectGroups: ProjectGroup[];
    advisors: Advisor[];
    students: Student[];
    majors: Major[];
    advisorProjectCounts: Record<string, number>;
    systemHealthIssues: SystemHealthIssue[] | null;
    isAnalyzingSystemHealth: boolean;
    onRunSystemHealthAnalysis: () => void;
    securityIssues: SystemSecurityIssue[] | null;
    isAnalyzingSecurity: boolean;
    onRunSecurityAudit: () => void;
}

const ToolCard: React.FC<{ title: string; description: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, description, icon, children }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/50 rounded-full p-3">
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            </div>
        </div>
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            {children}
        </div>
    </div>
);

const AiToolsPage: React.FC<AiToolsPageProps> = ({ user, projectGroups, advisors, students, majors, advisorProjectCounts, systemHealthIssues, isAnalyzingSystemHealth, onRunSystemHealthAnalysis, securityIssues, isAnalyzingSecurity, onRunSecurityAudit }) => {
    const addToast = useToast();
    const t = useTranslations();
    
    // State for Advisor Suggester
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [suggestions, setSuggestions] = useState<AdvisorSuggestion[] | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // State for Similarity Checker
    const [topicToCheck, setTopicToCheck] = useState('');
    const [similarityResult, setSimilarityResult] = useState<SimilarityInfo | null>(null);
    const [isCheckingSimilarity, setIsCheckingSimilarity] = useState(false);
    
    const pendingProjects = useMemo(() => projectGroups.filter(pg => pg.project.status === 'Pending'), [projectGroups]);
    
    const handleSuggestAdvisors = async () => {
        if (!selectedProjectId) {
            addToast({ type: 'error', message: t('selectProjectFirst') });
            return;
        }
        if (!process.env.API_KEY) {
            addToast({ type: 'error', message: t('aiFeatureNotConfigured') });
            return;
        }

        setIsSuggesting(true);
        setSuggestions(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const project = projectGroups.find(p => p.project.projectId === selectedProjectId);
            if (!project) throw new Error('Project not found');

            const advisorData = advisors.map(adv => ({
                name: adv.name,
                specializedMajors: adv.specializedMajorIds.map(id => majors.find(m => m.id === id)?.abbreviation || '').join(', '),
                currentLoad: `${advisorProjectCounts[adv.name] || 0}/${adv.quota}`
            }));

            const prompt = `
              You are an expert academic administrator. Your task is to suggest the best-fit advisors for a new final project.
              
              Project Details:
              - Topic: "${project.project.topicEng}"
              - Major: "${project.students[0].major}"

              Available Advisors:
              ${JSON.stringify(advisorData)}

              Analyze the advisors based on two primary criteria:
              1.  **Specialization Match**: How well their specialized majors align with the project's major and topic.
              2.  **Workload**: Prioritize advisors who are not at or over their quota.

              Suggest the top 3 best-fit advisors. Respond ONLY with a JSON object. The JSON object should have a key "suggestions" which is an array of objects. Each object must have these keys:
              - "advisorName": string
              - "matchScore": number (a percentage from 0-100 representing your confidence in the match)
              - "reasoning": string (a concise explanation for your suggestion, mentioning specialization and workload)
              - "specializedMajors": string
              - "currentWorkload": string
            `;

            const schema = {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                advisorName: { type: Type.STRING },
                                matchScore: { type: Type.NUMBER },
                                reasoning: { type: Type.STRING },
                                specializedMajors: { type: Type.STRING },
                                currentWorkload: { type: Type.STRING },
                            },
                            required: ["advisorName", "matchScore", "reasoning", "specializedMajors", "currentWorkload"]
                        }
                    }
                },
                required: ["suggestions"]
            };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: schema },
            });
            
            const result = JSON.parse(response.text);
            setSuggestions(result.suggestions);

        } catch (error) {
            console.error("AI Advisor Suggestion failed:", error);
            addToast({ type: 'error', message: t('advisorSuggestionFailed') });
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleCheckSimilarity = async () => {
        if (!topicToCheck.trim()) {
            addToast({ type: 'error', message: t('enterTopicToCheck') });
            return;
        }
        if (!process.env.API_KEY) {
            addToast({ type: 'error', message: t('aiFeatureNotConfigured') });
            return;
        }

        setIsCheckingSimilarity(true);
        setSimilarityResult(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const existingProjects = projectGroups.map(p => ({ id: p.project.projectId, topic: p.project.topicEng }));
            
            const prompt = `
                Analyze the 'proposed_topic' for semantic similarity against the 'existing_topics'.
                Proposed Topic: "${topicToCheck}"
                Existing Topics: ${JSON.stringify(existingProjects)}
                Respond ONLY with a JSON object with three fields:
                1. "similarProjectId": String ID of the most similar project, or empty string if none are similar.
                2. "similarityPercentage": Number between 0 and 100.
                3. "reason": A string explaining why they are similar, or state that it appears unique.
            `;

            const schema = {
                type: Type.OBJECT,
                properties: {
                    similarProjectId: { type: Type.STRING },
                    similarityPercentage: { type: Type.NUMBER },
                    reason: { type: Type.STRING }
                },
                required: ["similarProjectId", "similarityPercentage", "reason"]
            };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: schema },
            });
            
            setSimilarityResult(JSON.parse(response.text));

        } catch (error) {
            console.error("AI Similarity Check failed:", error);
            addToast({ type: 'error', message: t('similarityCheckFailed') });
        } finally {
            setIsCheckingSimilarity(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center">
               <SparklesIcon className="w-8 h-8 text-blue-600 mr-3"/>
               <div>
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('aiToolsTitle')}</h2>
                 <p className="text-slate-500 dark:text-slate-400 mt-1">{t('aiToolsShortDescription')}</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ToolCard title={t('systemHealthCheckTitle')} description={t('systemHealthCheckDescription')} icon={<HeartIcon className="w-6 h-6 text-blue-600"/>}>
                    <button onClick={onRunSystemHealthAnalysis} disabled={isAnalyzingSystemHealth} className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400">
                        {isAnalyzingSystemHealth ? (<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>) : t('runAnalysis')}
                    </button>
                    <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-2">
                        {systemHealthIssues === null && !isAnalyzingSystemHealth && (<p className="text-sm text-center text-slate-500 dark:text-slate-400">{t('runAnalysisToSeeResults')}</p>)}
                        {isAnalyzingSystemHealth && (<div className="text-sm text-center text-slate-500 dark:text-slate-400">{t('analyzing')}</div>)}
                        {systemHealthIssues?.length === 0 && (<div className="flex items-center gap-2 text-green-600 dark:text-green-400"><CheckCircleIcon className="w-5 h-5"/> <p>{t('noSystemHealthIssues')}</p></div>)}
                        {systemHealthIssues && systemHealthIssues.length > 0 && systemHealthIssues.map((issue, index) => (
                            <div key={index} className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{issue.type}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">{issue.description} <em className="text-slate-500">{issue.recommendation}</em></p>
                            </div>
                        ))}
                    </div>
                </ToolCard>
                <ToolCard title={t('securityAuditTitle')} description={t('securityAuditDescription')} icon={<ShieldCheckIcon className="w-6 h-6 text-blue-600"/>}>
                    <button onClick={onRunSecurityAudit} disabled={isAnalyzingSecurity} className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400">
                        {isAnalyzingSecurity ? (<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>) : t('runSecurityAudit')}
                    </button>
                    <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-2">
                        {securityIssues === null && !isAnalyzingSecurity && (<p className="text-sm text-center text-slate-500 dark:text-slate-400">{t('runAnalysisToSeeResults')}</p>)}
                        {isAnalyzingSecurity && (<div className="text-sm text-center text-slate-500 dark:text-slate-400">{t('analyzing')}</div>)}
                        {/* FIX: Use existing translation key 'noSecurityIssues' */}
                        {securityIssues?.length === 0 && (<div className="flex items-center gap-2 text-green-600 dark:text-green-400"><CheckCircleIcon className="w-5 h-5"/> <p>{t('noSecurityIssues')}</p></div>)}
                        {securityIssues && securityIssues.length > 0 && securityIssues.map((issue, index) => (
                            <div key={index} className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{issue.type}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">{issue.description} <em className="text-slate-500">{issue.recommendation}</em></p>
                            </div>
                        ))}
                    </div>
                </ToolCard>
                <ToolCard title={t('advisorSuggesterTitle')} description={t('advisorSuggesterDescription')} icon={<AcademicCapIcon className="w-6 h-6 text-blue-600"/>}>
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="project-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('selectPendingProject')}</label>
                            <select id="project-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                <option value="" disabled>{t('selectAProject')}</option>
                                {pendingProjects.map(pg => <option key={pg.project.projectId} value={pg.project.projectId}>{pg.project.projectId} - {pg.project.topicEng}</option>)}
                            </select>
                         </div>
                         <button onClick={handleSuggestAdvisors} disabled={isSuggesting || !selectedProjectId} className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400">
                             {isSuggesting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : t('suggestAdvisors')}
                         </button>
                         {suggestions && (
                             <div className="space-y-3 pt-2">
                                {suggestions.map(s => (
                                    <div key={s.advisorName} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{s.advisorName}</p>
                                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{t('match')}: {s.matchScore}%</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t('majors')}: {s.specializedMajors} | {t('workload')}: {s.currentWorkload}</p>
                                        <p className="text-xs italic text-slate-600 dark:text-slate-300 mt-1">"{s.reasoning}"</p>
                                    </div>
                                ))}
                             </div>
                         )}
                    </div>
                </ToolCard>
                 <ToolCard title={t('similarityCheckerTitle')} description={t('similarityCheckerDescription')} icon={<MagnifyingGlassIcon className="w-6 h-6 text-blue-600"/>}>
                     <div className="space-y-4">
                         <div>
                            <label htmlFor="topic-check" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('topicToCheck')}</label>
                            <textarea id="topic-check" rows={2} value={topicToCheck} onChange={e => setTopicToCheck(e.target.value)} className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Enter a new project topic in English..."/>
                         </div>
                         <button onClick={handleCheckSimilarity} disabled={isCheckingSimilarity || !topicToCheck} className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400">
                            {isCheckingSimilarity ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : t('checkForSimilarity')}
                         </button>
                         {similarityResult && (
                             <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                <p className="text-sm font-semibold">{t('result')}: <span className="font-bold text-blue-600 dark:text-blue-400">{similarityResult.similarityPercentage.toFixed(1)}% {t('similar')}</span></p>
                                {similarityResult.similarProjectId && <p className="text-xs">{t('mostSimilarTo')}: {similarityResult.similarProjectId}</p>}
                                <p className="text-xs italic mt-1">"{similarityResult.reason}"</p>
                             </div>
                         )}
                     </div>
                </ToolCard>
            </div>
        </div>
    );
};

export default AiToolsPage;
