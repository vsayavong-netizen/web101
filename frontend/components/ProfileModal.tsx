import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, Box, Typography, Divider,
  Avatar, Grid, Paper, Accordion, AccordionSummary, AccordionDetails,
  CircularProgress, Alert, List, ListItem, ListItemText, Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as UserCircleIcon,
  Edit as PencilIcon,
  Check as CheckIcon,
  AutoAwesome as SparklesIcon,
  ExpandMore as ChevronDownIcon,
  Assignment as ClipboardDocumentListIcon,
  School as AcademicCapIcon,
  Favorite as HeartIcon,
  Lock as KeyIcon
} from '@mui/icons-material';
import { User, Student, Advisor, ProjectGroup, StudentSkillsAnalysis, CareerPathSuggestion, AdvisorMentoringAnalysis } from '../types';
import { useToast } from '../hooks/useToast';
import { GoogleGenAI, Type } from "@google/genai";
import { useTranslations } from '../hooks/useTranslations';
import { useAiStudentAnalysis } from '../hooks/useAiStudentAnalysis';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  userData: Student | Advisor | null;
  onUpdateStudent: (student: Student) => void;
  onUpdateAdvisor: (advisor: Advisor) => void;
  allAdvisors: Advisor[];
  studentProjectGroup: ProjectGroup | null;
  allProjectGroups: ProjectGroup[];
  isPasswordChangeForced: boolean;
  onPasswordChanged?: () => void;
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <Grid container spacing={2} sx={{ py: 1 }}>
        <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
                {label}
            </Typography>
        </Grid>
        <Grid item xs={12} sm={9}>
            <Typography variant="body2">
                {value}
            </Typography>
        </Grid>
    </Grid>
);

const EditableField: React.FC<{
    label: string;
    value: string;
    onSave: (newValue: string) => void;
    error?: string;
    type?: 'text' | 'tel' | 'email';
}> = ({ label, value, onSave, error, type = 'text' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleSave = () => {
        if (currentValue.trim() !== value.trim()) {
            onSave(currentValue);
        }
        setIsEditing(false);
    };

    return (
        <Grid container spacing={2} sx={{ py: 1 }} alignItems="center">
            <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    {label}
                </Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
                {isEditing ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                            fullWidth
                            size="small"
                            type={type}
                            value={currentValue}
                            onChange={(e) => setCurrentValue(e.target.value)}
                            error={!!error}
                            helperText={error}
                        />
                        <IconButton onClick={handleSave} color="success" size="small">
                            <CheckIcon />
                        </IconButton>
                        <IconButton onClick={() => { setIsEditing(false); setCurrentValue(value); }} color="error" size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">{value}</Typography>
                        <IconButton onClick={() => setIsEditing(true)} size="small" color="primary">
                            <PencilIcon fontSize="small" />
                        </IconButton>
                    </Box>
                )}
            </Grid>
        </Grid>
    );
};

const CollapsibleSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
    return (
        <Accordion defaultExpanded={defaultOpen}>
            <AccordionSummary expandIcon={<ChevronDownIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {icon}
                    <Typography variant="subtitle2" fontWeight="medium">
                        {title}
                    </Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                {children}
            </AccordionDetails>
        </Accordion>
    );
};


const CollapsibleAiSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; onAnalyze: () => void; isLoading: boolean; analysisPerformed: boolean; canAnalyze: boolean; }> = ({ title, icon, children, onAnalyze, isLoading, analysisPerformed, canAnalyze }) => {
    const t = useTranslations();
    return (
        <CollapsibleSection title={title} icon={icon}>
            <Box>
                {!analysisPerformed && canAnalyze && (
                    <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={onAnalyze}
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} /> : <SparklesIcon />}
                    >
                        {isLoading ? t('analyzing') : t('analyzeWithAI')}
                    </Button>
                )}
                {!canAnalyze && !analysisPerformed && (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        {t('notEnoughData')}
                    </Typography>
                )}
                {isLoading && !analysisPerformed && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress />
                    </Box>
                )}
                {analysisPerformed && children}
            </Box>
        </CollapsibleSection>
    );
};


const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, userData, onUpdateStudent, onUpdateAdvisor, allAdvisors, studentProjectGroup, allProjectGroups, isPasswordChangeForced, onPasswordChanged }) => {
    const addToast = useToast();
    const t = useTranslations();
    const [advisorNameError, setAdvisorNameError] = useState('');
    const [studentErrors, setStudentErrors] = useState<{ email?: string; tel?: string }>({});
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const { 
        skillsAnalysis, isAnalyzingSkills, analyzeSkills,
        careerPaths, isSuggestingCareers, suggestCareers,
    } = useAiStudentAnalysis(studentProjectGroup, user);

    const [mentoringAnalysis, setMentoringAnalysis] = useState<AdvisorMentoringAnalysis | null>(null);
    const [isAnalyzingMentoring, setIsAnalyzingMentoring] = useState(false);
    
    if (!isOpen) return null;

    const handleUpdateAdvisorName = (newName: string) => {
        setAdvisorNameError('');
        if (!newName.trim()) {
            setAdvisorNameError(t('nameRequired'));
            return;
        }
        const isDuplicate = allAdvisors.some(
            adv => adv.name.toLowerCase() === newName.trim().toLowerCase() && adv.id !== user.id
        );
        if (isDuplicate) {
            setAdvisorNameError(t('advisorNameExists'));
            return;
        }
        onUpdateAdvisor({ ...(userData as Advisor), name: newName.trim() });
        addToast({ type: 'success', message: t('nameUpdatedSuccess') });
    };
    
    const handleUpdateStudentField = (field: 'email' | 'tel', value: string) => {
        setStudentErrors({});
        const newErrors: { email?: string; tel?: string } = {};
        
        if (field === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if(!value.trim()) newErrors.email = t('emailRequired');
            else if (!emailRegex.test(value)) newErrors.email = t('invalidEmail');
        }
        
        if (field === 'tel') {
             const telRegex = /^[\d, -]+$/;
             if(!value.trim()) newErrors.tel = t('telRequired');
             else if (!telRegex.test(value)) newErrors.tel = t('invalidTel');
        }

        if (Object.keys(newErrors).length > 0) {
            setStudentErrors(newErrors);
            return;
        }

        onUpdateStudent({ ...(userData as Student), [field]: value.trim() });
        addToast({ type: 'success', message: field === 'email' ? t('emailUpdatedSuccess') : t('telUpdatedSuccess') });
    };

    const handlePasswordChange = () => {
        setPasswordError('');
        if (userData?.password !== currentPassword) {
            setPasswordError(t('currentPasswordMismatch'));
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError(t('passwordLengthError'));
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setPasswordError(t('passwordMismatch'));
            return;
        }

        if (user.role === 'Student') {
            onUpdateStudent({ ...(userData as Student), password: newPassword, mustChangePassword: false });
        } else if (user.role === 'Advisor' || user.role === 'DepartmentAdmin') {
            onUpdateAdvisor({ ...(userData as Advisor), password: newPassword, mustChangePassword: false });
        }
        
        addToast({ type: 'success', message: t('passwordUpdatedSuccess') });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');

        if (isPasswordChangeForced && onPasswordChanged) {
            onPasswordChanged();
            onClose();
        }
    };
    
    const handleAnalyzeMentoring = async () => {
        if (!process.env.API_KEY) return;
        setIsAnalyzingMentoring(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const advisorMessages = allProjectGroups
                .filter(pg => pg.project.advisorName === user.name)
                .flatMap(pg => pg.project.log || [])
                .filter(l => l.authorId === user.id)
                .slice(-20)
                .map(l => l.message)
                .join('\n---\n');
            
            if (!advisorMessages) {
                addToast({ type: 'info', message: t('notEnoughDataToAnalyze') });
                setIsAnalyzingMentoring(false);
                return;
            }
            
            const prompt = `
                Analyze the following communication snippets from an advisor to characterize their mentoring style.
                Advisor's Messages:
                ${advisorMessages}
                
                Characterize their style (e.g., 'Supportive & Encouraging', 'Directive & Task-Oriented'). Provide a summary, list 2 strengths, and 1 suggestion for improvement. Respond ONLY in JSON.
            `;
             const schema = {
                type: Type.OBJECT,
                properties: {
                    style: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestionsForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["style", "summary", "strengths", "suggestionsForImprovement"]
            };
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
            setMentoringAnalysis(JSON.parse(response.text));
        } catch (e) {
            addToast({ type: 'error', message: t('couldNotAnalyzeMentoring') });
        } finally {
            setIsAnalyzingMentoring(false);
        }
    };
    

    const renderContent = () => {
        if (!userData) {
            return (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                    {t('userDataNotFound')}
                </Typography>
            );
        }

        switch (user.role) {
            case 'Student':
                const student = userData as Student;
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <CollapsibleSection title={t('personalInformation')} icon={<UserCircleIcon />} defaultOpen>
                            <Box>
                                <InfoRow label={t('studentId')} value={student.studentId} />
                                <Divider />
                                <InfoRow label={t('fullName')} value={`${student.name} ${student.surname}`} />
                                <Divider />
                                <InfoRow label={t('major')} value={student.major} />
                                <Divider />
                                <EditableField label={t('email')} value={student.email} type="email" onSave={(value) => handleUpdateStudentField('email', value)} error={studentErrors.email} />
                                <Divider />
                                <EditableField label={t('telephone')} value={student.tel} type="tel" onSave={(value) => handleUpdateStudentField('tel', value)} error={studentErrors.tel} />
                            </Box>
                        </CollapsibleSection>
                        <CollapsibleSection title={t('security')} icon={<KeyIcon />} defaultOpen={isPasswordChangeForced}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    type="password"
                                    label={t('currentPassword')}
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    size="small"
                                />
                                <TextField
                                    fullWidth
                                    type="password"
                                    label={t('newPassword')}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    size="small"
                                />
                                <TextField
                                    fullWidth
                                    type="password"
                                    label={t('confirmNewPassword')}
                                    value={confirmNewPassword}
                                    onChange={e => setConfirmNewPassword(e.target.value)}
                                    size="small"
                                    error={!!passwordError}
                                    helperText={passwordError}
                                />
                                <Button onClick={handlePasswordChange} variant="contained" fullWidth>
                                    {t('updatePasswordBtn')}
                                </Button>
                            </Box>
                        </CollapsibleSection>
                        <CollapsibleAiSection title={t('aiSkillsAnalysis')} icon={<ClipboardDocumentListIcon color="primary" />} onAnalyze={analyzeSkills} isLoading={isAnalyzingSkills} analysisPerformed={!!skillsAnalysis} canAnalyze={!!studentProjectGroup}>
                            {skillsAnalysis && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Typography variant="body2" fontStyle="italic" color="text.secondary">
                                        {skillsAnalysis.summary}
                                    </Typography>
                                    <List dense>
                                        {skillsAnalysis.skills.map(s => (
                                            <ListItem key={s.skill} sx={{ bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
                                                <ListItemText
                                                    primary={<Typography variant="body2" fontWeight="medium">{s.skill}:</Typography>}
                                                    secondary={s.justification}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}
                        </CollapsibleAiSection>
                        <CollapsibleAiSection title={t('aiCareerPathSuggestions')} icon={<AcademicCapIcon color="primary" />} onAnalyze={suggestCareers} isLoading={isSuggestingCareers} analysisPerformed={!!careerPaths} canAnalyze={!!skillsAnalysis}>
                            {careerPaths && (
                                <List dense>
                                    {careerPaths.map(p => (
                                        <ListItem key={p.path} sx={{ bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
                                            <ListItemText
                                                primary={<Typography variant="body2" fontWeight="medium">{p.path}:</Typography>}
                                                secondary={p.reasoning}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </CollapsibleAiSection>
                    </Box>
                );
            case 'Advisor':
            case 'DepartmentAdmin':
                const advisor = userData as Advisor;
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <CollapsibleSection title={t('advisorInformation')} icon={<UserCircleIcon />} defaultOpen>
                            <Box>
                                <InfoRow label={t('advisorId')} value={advisor.id} />
                                <Divider />
                                <EditableField label={t('fullName')} value={advisor.name} onSave={handleUpdateAdvisorName} error={advisorNameError} />
                                <Divider />
                                <InfoRow label={t('supervisingQuota')} value={String(advisor.quota)} />
                                <Divider />
                                <InfoRow label={t('mainCommitteeQuota')} value={String(advisor.mainCommitteeQuota)} />
                                <Divider />
                                <InfoRow label={t('secondCommitteeQuota')} value={String(advisor.secondCommitteeQuota)} />
                                <Divider />
                                <InfoRow label={t('thirdCommitteeQuota')} value={String(advisor.thirdCommitteeQuota)} />
                            </Box>
                        </CollapsibleSection>
                        <CollapsibleSection title={t('security')} icon={<KeyIcon />} defaultOpen={isPasswordChangeForced}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    type="password"
                                    label={t('currentPassword')}
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    size="small"
                                />
                                <TextField
                                    fullWidth
                                    type="password"
                                    label={t('newPassword')}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    size="small"
                                />
                                <TextField
                                    fullWidth
                                    type="password"
                                    label={t('confirmNewPassword')}
                                    value={confirmNewPassword}
                                    onChange={e => setConfirmNewPassword(e.target.value)}
                                    size="small"
                                    error={!!passwordError}
                                    helperText={passwordError}
                                />
                                <Button onClick={handlePasswordChange} variant="contained" fullWidth>
                                    {t('updatePasswordBtn')}
                                </Button>
                            </Box>
                        </CollapsibleSection>
                        <CollapsibleAiSection title={t('aiMentoringStyleAnalysis')} icon={<HeartIcon color="primary" />} onAnalyze={handleAnalyzeMentoring} isLoading={isAnalyzingMentoring} analysisPerformed={!!mentoringAnalysis} canAnalyze={true}>
                            {mentoringAnalysis && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight="medium" component="span">
                                            {t('identifiedStyle')}:{' '}
                                        </Typography>
                                        <Chip label={mentoringAnalysis.style} color="primary" size="small" />
                                    </Box>
                                    <Typography variant="body2" fontStyle="italic" color="text.secondary">
                                        {mentoringAnalysis.summary}
                                    </Typography>
                                    <Box>
                                        <Typography variant="body2" fontWeight="medium" gutterBottom>
                                            {t('strengths')}:
                                        </Typography>
                                        <List dense>
                                            {mentoringAnalysis.strengths.map((s, i) => (
                                                <ListItem key={i} sx={{ py: 0 }}>
                                                    <ListItemText primary={s} primaryTypographyProps={{ variant: 'body2' }} />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight="medium" gutterBottom>
                                            {t('suggestions')}:
                                        </Typography>
                                        <List dense>
                                            {mentoringAnalysis.suggestionsForImprovement.map((s, i) => (
                                                <ListItem key={i} sx={{ py: 0 }}>
                                                    <ListItemText primary={s} primaryTypographyProps={{ variant: 'body2' }} />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                </Box>
                            )}
                        </CollapsibleAiSection>
                    </Box>
                );
            case 'Admin':
                return (
                    <Box>
                        <InfoRow label={t('userId')} value={user.id} />
                        <Divider />
                        <InfoRow label={t('fullName')} value={user.name} />
                        <Divider />
                        <InfoRow label={t('role')} value={user.role} />
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onClose={isPasswordChangeForced ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                    <UserCircleIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                        {t('smartProfile')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {user.name} ({user.role})
                    </Typography>
                </Box>
                {!isPasswordChangeForced && (
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                )}
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 3 }}>
                {isPasswordChangeForced && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {t('updatePasswordSectionPrompt')}
                    </Alert>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {renderContent()}
                    {user.role !== 'Admin' && (
                        <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
                            {t('aiDisclaimer')}
                        </Typography>
                    )}
                </Box>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    disabled={isPasswordChangeForced}
                    fullWidth
                >
                    {t('closeBtn')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProfileModal;