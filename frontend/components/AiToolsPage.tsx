
import React, { useState, useMemo, useCallback } from 'react';
import {
    Box, Paper, Typography, Button, Select, MenuItem, FormControl, InputLabel,
    TextField, Grid, CircularProgress, Chip, Divider, Stack
} from '@mui/material';
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
    <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Box sx={{ 
                flexShrink: 0, 
                bgcolor: 'primary.light', 
                borderRadius: '50%', 
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
                <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box>
            {children}
        </Box>
    </Paper>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SparklesIcon sx={{ width: 32, height: 32, color: 'primary.main' }} />
                <Box>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                        {t('aiToolsTitle')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {t('aiToolsShortDescription')}
                    </Typography>
                </Box>
            </Box>
            
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 6 }}>
                    <ToolCard 
                        title={t('systemHealthCheckTitle')} 
                        description={t('systemHealthCheckDescription')} 
                        icon={<HeartIcon sx={{ width: 24, height: 24, color: 'primary.main' }} />}
                    >
                        <Button 
                            onClick={onRunSystemHealthAnalysis} 
                            disabled={isAnalyzingSystemHealth}
                            variant="contained"
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            {isAnalyzingSystemHealth ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                t('runAnalysis')
                            )}
                        </Button>
                        <Box sx={{ maxHeight: 240, overflowY: 'auto', pr: 1 }}>
                            {systemHealthIssues === null && !isAnalyzingSystemHealth && (
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                                    {t('runAnalysisToSeeResults')}
                                </Typography>
                            )}
                            {isAnalyzingSystemHealth && (
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                                    {t('analyzing')}
                                </Typography>
                            )}
                            {systemHealthIssues?.length === 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main', py: 1 }}>
                                    <CheckCircleIcon sx={{ width: 20, height: 20 }} />
                                    <Typography variant="body2">{t('noSystemHealthIssues')}</Typography>
                                </Box>
                            )}
                            {systemHealthIssues && systemHealthIssues.length > 0 && (
                                <Stack spacing={1}>
                                    {systemHealthIssues.map((issue, index) => (
                                        <Paper key={index} elevation={0} sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                                {issue.type}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {issue.description} <em>{issue.recommendation}</em>
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </ToolCard>
                </Grid>
                
                <Grid size={{ xs: 12, lg: 6 }}>
                    <ToolCard 
                        title={t('securityAuditTitle')} 
                        description={t('securityAuditDescription')} 
                        icon={<ShieldCheckIcon sx={{ width: 24, height: 24, color: 'primary.main' }} />}
                    >
                        <Button 
                            onClick={onRunSecurityAudit} 
                            disabled={isAnalyzingSecurity}
                            variant="contained"
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            {isAnalyzingSecurity ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                t('runSecurityAudit')
                            )}
                        </Button>
                        <Box sx={{ maxHeight: 240, overflowY: 'auto', pr: 1 }}>
                            {securityIssues === null && !isAnalyzingSecurity && (
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                                    {t('runAnalysisToSeeResults')}
                                </Typography>
                            )}
                            {isAnalyzingSecurity && (
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                                    {t('analyzing')}
                                </Typography>
                            )}
                            {securityIssues?.length === 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main', py: 1 }}>
                                    <CheckCircleIcon sx={{ width: 20, height: 20 }} />
                                    <Typography variant="body2">{t('noSecurityIssues')}</Typography>
                                </Box>
                            )}
                            {securityIssues && securityIssues.length > 0 && (
                                <Stack spacing={1}>
                                    {securityIssues.map((issue, index) => (
                                        <Paper key={index} elevation={0} sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                                {issue.type}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {issue.description} <em>{issue.recommendation}</em>
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </ToolCard>
                </Grid>
                
                <Grid size={{ xs: 12, lg: 6 }}>
                    <ToolCard 
                        title={t('advisorSuggesterTitle')} 
                        description={t('advisorSuggesterDescription')} 
                        icon={<AcademicCapIcon sx={{ width: 24, height: 24, color: 'primary.main' }} />}
                    >
                        <Stack spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel id="project-select-label">{t('selectPendingProject')}</InputLabel>
                                <Select
                                    labelId="project-select-label"
                                    id="project-select"
                                    value={selectedProjectId}
                                    onChange={e => setSelectedProjectId(e.target.value)}
                                    label={t('selectPendingProject')}
                                >
                                    <MenuItem value="" disabled>{t('selectAProject')}</MenuItem>
                                    {pendingProjects.map(pg => (
                                        <MenuItem key={pg.project.projectId} value={pg.project.projectId}>
                                            {pg.project.projectId} - {pg.project.topicEng}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button 
                                onClick={handleSuggestAdvisors} 
                                disabled={isSuggesting || !selectedProjectId}
                                variant="contained"
                                fullWidth
                            >
                                {isSuggesting ? (
                                    <CircularProgress size={20} color="inherit" />
                                ) : (
                                    t('suggestAdvisors')
                                )}
                            </Button>
                            {suggestions && (
                                <Stack spacing={1.5} sx={{ pt: 1 }}>
                                    {suggestions.map(s => (
                                        <Paper key={s.advisorName} elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {s.advisorName}
                                                </Typography>
                                                <Chip 
                                                    label={`${t('match')}: ${s.matchScore}%`} 
                                                    color="primary" 
                                                    size="small"
                                                />
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {t('majors')}: {s.specializedMajors} | {t('workload')}: {s.currentWorkload}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic', display: 'block' }}>
                                                "{s.reasoning}"
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Stack>
                    </ToolCard>
                </Grid>
                
                <Grid size={{ xs: 12, lg: 6 }}>
                    <ToolCard 
                        title={t('similarityCheckerTitle')} 
                        description={t('similarityCheckerDescription')} 
                        icon={<MagnifyingGlassIcon sx={{ width: 24, height: 24, color: 'primary.main' }} />}
                    >
                        <Stack spacing={2}>
                            <TextField
                                id="topic-check"
                                label={t('topicToCheck')}
                                multiline
                                rows={2}
                                value={topicToCheck}
                                onChange={e => setTopicToCheck(e.target.value)}
                                placeholder="Enter a new project topic in English..."
                                fullWidth
                            />
                            <Button 
                                onClick={handleCheckSimilarity} 
                                disabled={isCheckingSimilarity || !topicToCheck.trim()}
                                variant="contained"
                                fullWidth
                            >
                                {isCheckingSimilarity ? (
                                    <CircularProgress size={20} color="inherit" />
                                ) : (
                                    t('checkForSimilarity')
                                )}
                            </Button>
                            {similarityResult && (
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
                                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                                        {t('result')}: <Chip 
                                            label={`${similarityResult.similarityPercentage.toFixed(1)}% ${t('similar')}`} 
                                            color="primary" 
                                            size="small"
                                            sx={{ ml: 1 }}
                                        />
                                    </Typography>
                                    {similarityResult.similarProjectId && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {t('mostSimilarTo')}: {similarityResult.similarProjectId}
                                        </Typography>
                                    )}
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic', display: 'block' }}>
                                        "{similarityResult.reason}"
                                    </Typography>
                                </Paper>
                            )}
                        </Stack>
                    </ToolCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AiToolsPage;
