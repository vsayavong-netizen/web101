import { useState, useCallback } from 'react';
import { ProjectGroup, User, Student, StudentSkillsAnalysis, CareerPathSuggestion } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { useToast } from './useToast';
import { useTranslations } from './useTranslations';

export const useAiStudentAnalysis = (projectGroup: ProjectGroup | null, user: User) => {
    const [skillsAnalysis, setSkillsAnalysis] = useState<StudentSkillsAnalysis | null>(null);
    const [isAnalyzingSkills, setIsAnalyzingSkills] = useState(false);
    const [careerPaths, setCareerPaths] = useState<CareerPathSuggestion[] | null>(null);
    const [isSuggestingCareers, setIsSuggestingCareers] = useState(false);
    const addToast = useToast();
    const t = useTranslations();

    const analyzeSkills = useCallback(async () => {
        if (!projectGroup || !process.env.API_KEY) {
            addToast({ type: 'error', message: t('aiFeatureNotConfigured') });
            return;
        }
        setIsAnalyzingSkills(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const logSummary = (projectGroup.project.log || []).filter(l => l.authorId === user.id).slice(-10).map(l => l.message).join('\n');
            const prompt = `
                Analyze the skills of a student based on their project.
                Project Topic: "${projectGroup.project.topicEng}"
                Student's recent communications:
                ${logSummary || "No communications logged."}

                Identify 3-5 key academic or soft skills this student is demonstrating. For each skill, provide a brief justification based on the provided data.
                Provide a one-sentence summary of their overall skill profile.
                Respond ONLY with a JSON object.
            `;
            const schema = {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    skills: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                skill: { type: Type.STRING },
                                justification: { type: Type.STRING }
                            },
                            required: ["skill", "justification"]
                        }
                    }
                },
                required: ["summary", "skills"]
            };
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
            setSkillsAnalysis(JSON.parse(response.text));
        } catch (e) {
            addToast({ type: 'error', message: t('couldNotAnalyzeSkills') });
        } finally {
            setIsAnalyzingSkills(false);
        }
    }, [projectGroup, user.id, addToast, t]);

    const suggestCareers = useCallback(async () => {
        if (!skillsAnalysis || !process.env.API_KEY) {
            addToast({ type: 'error', message: t('runSkillsAnalysisFirst') });
            return;
        }
        setIsSuggestingCareers(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const skillsList = skillsAnalysis.skills.map(s => s.skill).join(', ');
            const prompt = `
                Based on the following skills: ${skillsList}.
                Suggest three potential career paths. For each path, provide a brief reasoning connecting it to the skills.
                Respond ONLY with a JSON object containing a "careers" key, which is an array of objects. Each object must have "path" and "reasoning" keys.
            `;
            const schema = {
                type: Type.OBJECT,
                properties: {
                    careers: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                path: { type: Type.STRING },
                                reasoning: { type: Type.STRING }
                            },
                            required: ["path", "reasoning"]
                        }
                    }
                },
                required: ["careers"]
            };
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
            setCareerPaths(JSON.parse(response.text).careers);
        } catch (e) {
            addToast({ type: 'error', message: t('couldNotSuggestCareers') });
        } finally {
            setIsSuggestingCareers(false);
        }
    }, [skillsAnalysis, addToast, t]);

    return {
        skillsAnalysis, isAnalyzingSkills, analyzeSkills,
        careerPaths, isSuggestingCareers, suggestCareers
    };
};