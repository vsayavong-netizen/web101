import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Stack, Grid, Tabs, Tab, Divider, Chip, IconButton, TextField, FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemText, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  ArrowBack as ArrowLeftIcon, Edit as PencilSquareIcon, Delete as TrashIcon,
  Check as CheckIcon, Close as XCircleIcon, Send as PaperAirplaneIcon,
  Schedule as ClockIcon, Upload as DocumentArrowUpIcon, CheckCircle as CheckCircleSolidIcon,
  Refresh as ArrowPathIcon, SwapHoriz as ArrowsRightLeftIcon, Link as LinkIcon,
  AutoAwesome as SparklesIcon, Warning as ExclamationTriangleIcon,
  AttachFile as PaperClipIcon, Close as XMarkIcon, Menu as Bars3Icon,
  Assignment as ClipboardDocumentListIcon, BarChart as ChartBarIcon,
  Inbox as InboxStackIcon, ArrowUpward as ArrowUpIcon, ArrowDownward as ArrowDownIcon,
  UnfoldMore as ChevronUpDownIcon, Chat as ChatBubbleBottomCenterTextIcon,
  Search as MagnifyingGlassIcon, ExpandMore as ChevronUpIcon, ExpandLess as ChevronDownIcon
} from '@mui/icons-material';
import { ProjectGroup, User, ProjectStatus, Milestone, MilestoneStatus, Advisor, Announcement, FileUploadPayload, FinalSubmissionStatus, FinalSubmissionFile, ScoringSettings, Major, LogEntry, Role, MilestoneUpdatePayload, PlagiarismResult, PlagiarismMatch, CommunicationAnalysisResult, GrammarCheckResult } from '../types';
import StatusTimeline from './StatusTimeline';
import { getAdvisorColor } from '../utils/colorUtils';
import { useToast } from '../hooks/useToast';
import MilestoneFeedbackModal from './MilestoneFeedbackModal';
import AdminTransferModal from './AdminTransferModal';
import { GoogleGenAI, Type } from "@google/genai";
import StatusBadge from './StatusBadge';
import AnnouncementsFeed from './AnnouncementsFeed';
import ProjectScoring from './ProjectScoring';
import PlagiarismResultModal from './PlagiarismResultModal';
import CommunicationLog from './CommunicationLog';
import { useTranslations } from '../hooks/useTranslations';
import CommunicationAnalysisModal from './CommunicationAnalysisModal';
import AiWritingAssistantModal from './AiWritingAssistantModal';

interface ProjectDetailViewProps {
  projectGroup: ProjectGroup;
  user: User;
  effectiveRole: Role;
  onBack?: () => void;
  onEdit: (group: ProjectGroup) => void;
  onDelete: (group: ProjectGroup) => void;
  onUpdateStatus: (projectId: string, status: ProjectStatus) => void;
  onUpdateMilestone: (projectId: string, milestoneId: string, user: User, data: MilestoneUpdatePayload) => void;
  onUpdateFinalSubmissions: (projectId: string, type: 'preDefenseFile' | 'postDefenseFile', user: User, file: FileUploadPayload) => void;
  onReviewFinalSubmission: (projectId: string, type: 'preDefenseFile' | 'postDefenseFile', user: User, status: FinalSubmissionStatus.Approved | FinalSubmissionStatus.RequiresRevision, feedback: string) => void,
  onReorderMilestones?: (projectId: string, draggedId: string, targetId: string | null) => void;
  transferProject?: (projectId: string, newAdvisorName: string, actor: User, comment: string) => void;
  addProjectLogEntry: (projectId: string, entry: Omit<LogEntry, 'id' | 'timestamp' | 'file'>, filePayload?: FileUploadPayload | null) => void;
  onAnalyzeCommunication: (projectGroup: ProjectGroup) => void;
  onGrammarCheck: (file: { fileId: string; name: string }) => void;
  advisors?: Advisor[];
  advisorProjectCounts?: Record<string, number>;
  announcements?: Announcement[];
  scoringSettings?: ScoringSettings;
  updateDetailedScore?: (projectId: string, evaluatorId: string, scores: Record<string, number>) => void;
  onOpenAssistant?: () => void;
  majors?: Major[];
  allProjectGroups: ProjectGroup[];
}

type TabKey = 'overview' | 'milestones' | 'submissions' | 'scoring' | 'log' | 'history';

const getStatusStyles = (status: MilestoneStatus, dueDate: string, t: (key: any) => string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const isOverdue = new Date(dueDate) < today && status !== MilestoneStatus.Approved && status !== MilestoneStatus.Submitted;

    if (isOverdue) return { icon: <ExclamationTriangleIcon sx={{ fontSize: 20, color: 'error.main' }} />, bgColor: 'error.light', textColor: 'error.main', label: t('overdue') };
    switch (status) {
        case MilestoneStatus.Approved: return { icon: <CheckCircleSolidIcon sx={{ fontSize: 20, color: 'success.main' }} />, bgColor: 'success.light', textColor: 'success.main', label: t('approved') };
        case MilestoneStatus.Submitted: return { icon: <DocumentArrowUpIcon sx={{ fontSize: 20, color: 'info.main' }} />, bgColor: 'info.light', textColor: 'info.main', label: t('submitted') };
        case MilestoneStatus.RequiresRevision: return { icon: <ArrowPathIcon sx={{ fontSize: 20, color: 'warning.main' }} />, bgColor: 'warning.light', textColor: 'warning.main', label: t('requiresRevision') };
        default: return { icon: <ClockIcon sx={{ fontSize: 20, color: 'text.secondary' }} />, bgColor: 'action.hover', textColor: 'text.primary', label: t('pending') };
    }
};

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    return (
        <Accordion defaultExpanded={defaultOpen}>
            <AccordionSummary expandIcon={<ChevronUpIcon />}>
                <Typography variant="subtitle2" fontWeight="semibold">
                    {title}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                {children}
            </AccordionDetails>
        </Accordion>
    );
};

const ProjectDetailView: React.FC<ProjectDetailViewProps> = (props) => {
  const { projectGroup, user, effectiveRole, onBack, onEdit, onDelete, onUpdateStatus, onUpdateMilestone, onUpdateFinalSubmissions, onReviewFinalSubmission, onReorderMilestones, transferProject, addProjectLogEntry, onAnalyzeCommunication, onGrammarCheck, advisors, advisorProjectCounts, announcements, scoringSettings, updateDetailedScore, onOpenAssistant, majors, allProjectGroups } = props;
  const { project, students } = projectGroup;
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState<PlagiarismResult | null>(null);
  const [isPlagiarismModalOpen, setIsPlagiarismModalOpen] = useState(false);
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
  const addToast = useToast();
  const t = useTranslations();
  const isStudent = effectiveRole === 'Student';
  const isOwner = isStudent && students.some(s => s.studentId === user.id);
  const isAdvisor = user.role === 'Advisor' && user.name === project.advisorName;
  const isAdmin = effectiveRole === 'Admin' || effectiveRole === 'DepartmentAdmin';
  const tabs: { key: TabKey, label: string, icon: React.FC<any> }[] = [
    { key: 'overview', label: t('overview'), icon: ClipboardDocumentListIcon }, { key: 'milestones', label: t('milestones'), icon: ChartBarIcon }, { key: 'submissions', label: t('finalSubmissions'), icon: InboxStackIcon }, { key: 'scoring', label: t('scoringNav'), icon: PencilSquareIcon }, { key: 'log', label: t('communicationLog'), icon: ChatBubbleBottomCenterTextIcon }, { key: 'history', label: t('statusHistory'), icon: ClockIcon },
  ];
  const visibleTabs = useMemo(() => tabs.filter(tab => !(tab.key === 'log' && isStudent && !isOwner)), [isStudent, isOwner, tabs, t]);
  const handleUpdateMilestone = (milestoneId: string, data: MilestoneUpdatePayload) => onUpdateMilestone(project.projectId, milestoneId, user, data);
  const handleUpdateFinalSubmissions = (type: 'preDefenseFile' | 'postDefenseFile', file: FileUploadPayload) => onUpdateFinalSubmissions(project.projectId, type, user, file);
  const handleReviewFinalSubmission = (type: 'preDefenseFile' | 'postDefenseFile', status: FinalSubmissionStatus.Approved | FinalSubmissionStatus.RequiresRevision, feedback: string) => onReviewFinalSubmission(project.projectId, type, user, status, feedback);
  const handleTransferConfirm = (newAdvisorName: string, reason: string) => {
    if (transferProject) {
        transferProject(project.projectId, newAdvisorName, user, reason);
        setIsTransferModalOpen(false);
        addToast({ type: 'success', message: t('projectTransferredSuccessfully').replace('{advisorName}', newAdvisorName) });
    }
  };
  
  const handleReorderMilestones = (draggedId: string, targetId: string | null) => {
    if (onReorderMilestones) {
        onReorderMilestones(project.projectId, draggedId, targetId);
    }
  };
  
  const FileUpload: React.FC<{ onFileUpload: (file: FileUploadPayload) => void; currentFile: { fileId: string; name: string; type: string; size: number } | null; label: string; fileId: string; onGrammarCheck?: (file: { fileId: string; name: string; }) => void }> = ({ onFileUpload, currentFile, label, fileId, onGrammarCheck }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const addToast = useToast();
    const t = useTranslations();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
             if (file.size > 2 * 1024 * 1024) { addToast({ type: 'error', message: t('fileSizeLimitError') }); return; }
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                if(dataUrl) onFileUpload({ name: file.name, type: file.type, size: file.size, dataUrl });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const downloadFile = (file: {fileId: string, name: string}) => {
        const dataUrl = localStorage.getItem(`file_${file.fileId}`);
        if(dataUrl){
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else { addToast({type: 'error', message: t('fileNotFoundError')}) }
    };

    return (
        <Box>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} id={fileId} />
            {currentFile ? (
                <Paper elevation={1} sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="body2" fontWeight="medium">
                            {currentFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {(currentFile.size / 1024).toFixed(2)} KB
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Button size="small" onClick={() => downloadFile(currentFile)}>
                            {t('download')}
                        </Button>
                        {isOwner && onGrammarCheck && currentFile.type.startsWith('text/') && (
                            <Button
                                size="small"
                                startIcon={<SparklesIcon sx={{ fontSize: 16 }} />}
                                onClick={() => onGrammarCheck(currentFile)}
                                sx={{ color: 'secondary.main' }}
                            >
                                {t('analyzeDocument')}
                            </Button>
                        )}
                        <Button size="small" onClick={() => fileInputRef.current?.click()}>
                            {t('replace')}
                        </Button>
                    </Stack>
                </Paper>
            ) : (
                <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outlined"
                    fullWidth
                    sx={{
                        mt: 1,
                        borderStyle: 'dashed',
                        textTransform: 'none'
                    }}
                >
                    {label}
                </Button>
            )}
        </Box>
    );
};

  const MilestoneList: React.FC<{ milestones: Milestone[]; user: User; onUpdateMilestone: (milestoneId: string, data: MilestoneUpdatePayload) => void; onReorderMilestones?: (draggedId: string, targetId: string | null) => void; onPlagiarismCheck: (milestone: Milestone) => void; onGrammarCheck: (file: { fileId: string; name: string }) => void; }> = ({ milestones, user, onUpdateMilestone, onReorderMilestones, onPlagiarismCheck, onGrammarCheck }) => {
    const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; milestoneId: string; milestoneName: string; action: 'approve' | 'revise' }>({ isOpen: false, milestoneId: '', milestoneName: '', action: 'approve' });
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const t = useTranslations();
    const isStudent = user.role === 'Student';
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => { setDraggedId(id); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string | null) => {
        e.preventDefault();
        if (draggedId && draggedId !== targetId && onReorderMilestones) onReorderMilestones(draggedId, targetId);
        setDraggedId(null);
    };

    if (!milestones || milestones.length === 0) return <Typography variant="body2" color="text.secondary">{t('noMilestonesYet')}</Typography>;
    
    return (
        <Stack spacing={2}>
             {milestones.map(milestone => {
                const { icon, bgColor, textColor, label } = getStatusStyles(milestone.status, milestone.dueDate, t);
                const isPrivilegedUser = user.role === 'Admin' || user.role === 'Advisor' || user.role === 'DepartmentAdmin';
                
                const handleStudentFileUpload = (file: FileUploadPayload) => {
                    const isNewSubmission = milestone.status === MilestoneStatus.Pending || milestone.status === MilestoneStatus.RequiresRevision;
                    onUpdateMilestone(milestone.id, {
                        status: isNewSubmission ? MilestoneStatus.Submitted : undefined,
                        submittedFile: file,
                    });
                };
                
                const canStudentUpload = isOwner && (milestone.status === MilestoneStatus.Pending || milestone.status === MilestoneStatus.RequiresRevision || milestone.status === MilestoneStatus.Submitted);

                return (
                 <Paper
                    key={milestone.id}
                    draggable={!isStudent && !!onReorderMilestones}
                    onDragStart={(e) => onReorderMilestones && handleDragStart(e, milestone.id)}
                    onDragOver={onReorderMilestones ? handleDragOver : undefined}
                    onDrop={(e) => onReorderMilestones && handleDrop(e, milestone.id)}
                    elevation={2}
                    sx={{
                        p: 2,
                        bgcolor: bgColor,
                        opacity: draggedId === milestone.id ? 0.5 : 1
                    }}
                 >
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" color={textColor}>
                                {milestone.name}
                            </Typography>
                            {isPrivilegedUser ? (
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                    <Typography variant="caption" fontWeight="medium" color={textColor}>
                                        {t('due')}
                                    </Typography>
                                    <TextField
                                        type="date"
                                        id={`due-date-${milestone.id}`}
                                        value={milestone.dueDate.split('T')[0]}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const newDate = new Date(e.target.value);
                                                const utcDate = new Date(Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()));
                                                onUpdateMilestone(milestone.id, { dueDate: utcDate.toISOString() });
                                            }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                bgcolor: 'transparent',
                                                borderColor: 'currentColor',
                                                opacity: 0.3
                                            }
                                        }}
                                    />
                                </Stack>
                            ) : (
                                <Typography variant="caption" fontWeight="medium" color={textColor} sx={{ mt: 0.5, display: 'block' }}>
                                    {t('due')} {new Date(milestone.dueDate).toLocaleDateString()}
                                </Typography>
                            )}
                        </Box>
                        <Chip
                            icon={icon}
                            label={label}
                            size="small"
                            sx={{
                                bgcolor: bgColor,
                                color: textColor,
                                fontWeight: 600
                            }}
                        />
                    </Stack>
                    {milestone.feedback && (
                        <Box
                            component="blockquote"
                            sx={{
                                mt: 1,
                                pl: 1.5,
                                borderLeft: 2,
                                borderColor: 'currentColor',
                                opacity: 0.8
                            }}
                        >
                            <Typography variant="caption" component="strong">{t('feedback')}:</Typography>
                            <Typography variant="caption" sx={{ ml: 0.5 }}>{milestone.feedback}</Typography>
                        </Box>
                    )}
                    
                    {canStudentUpload && (
                        <FileUpload 
                            onFileUpload={handleStudentFileUpload} 
                            currentFile={milestone.submittedFile} 
                            label={t('uploadSubmissionFile')} 
                            fileId={`file-upload-${milestone.id}`} 
                            onGrammarCheck={onGrammarCheck}
                        />
                    )}

                    {!isStudent && milestone.status === MilestoneStatus.Submitted && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider', opacity: 0.5 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                                <FileUpload
                                    onFileUpload={(file) => onUpdateMilestone(milestone.id, { submittedFile: file, status: MilestoneStatus.Submitted })}
                                    currentFile={milestone.submittedFile}
                                    label={t('uploadNewVersion')}
                                    fileId={`file-upload-${milestone.id}`}
                                />
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        onClick={() => setFeedbackModal({ isOpen: true, milestoneId: milestone.id, milestoneName: milestone.name, action: 'approve' })}
                                        size="small"
                                        variant="contained"
                                        color="success"
                                    >
                                        {t('approve')}
                                    </Button>
                                    <Button
                                        onClick={() => setFeedbackModal({ isOpen: true, milestoneId: milestone.id, milestoneName: milestone.name, action: 'revise' })}
                                        size="small"
                                        variant="contained"
                                        color="warning"
                                    >
                                        {t('requestRevision')}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Box>
                    )}
                    
                    {isPrivilegedUser && milestone.submittedFile && (
                        <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider', opacity: 0.2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => onPlagiarismCheck(milestone)}
                                size="small"
                                startIcon={<MagnifyingGlassIcon sx={{ fontSize: 16 }} />}
                                sx={{ color: 'secondary.main', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                                {t('checkPlagiarismWithAI')}
                            </Button>
                        </Box>
                    )}
                 </Paper>
                );
             })}
            <Box onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, null)} sx={{ height: 8 }} />
            {feedbackModal.isOpen && (
                <MilestoneFeedbackModal
                    isOpen={feedbackModal.isOpen}
                    onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                    onConfirm={(feedback) => {
                        const newStatus = feedbackModal.action === 'approve' ? MilestoneStatus.Approved : MilestoneStatus.RequiresRevision;
                        onUpdateMilestone(feedbackModal.milestoneId, { status: newStatus, feedback });
                        setFeedbackModal({ ...feedbackModal, isOpen: false });
                    }}
                    action={feedbackModal.action}
                    milestoneName={feedbackModal.milestoneName}
                    projectGroup={projectGroup}
                />
            )}
        </Stack>
    );
};

  const FinalSubmissions: React.FC<{ submissions: ProjectGroup['project']['finalSubmissions']; user: User; onUpdate: (type: 'preDefenseFile' | 'postDefenseFile', file: FileUploadPayload) => void; onReview: (type: 'preDefenseFile' | 'postDefenseFile', status: FinalSubmissionStatus.Approved | FinalSubmissionStatus.RequiresRevision, feedback: string) => void; onGrammarCheck: (file: { fileId: string; name: string }) => void; }> = ({ submissions, user, onUpdate, onReview, onGrammarCheck }) => {
    const isStudent = user.role === 'Student';
    const t = useTranslations();
    const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; type: 'preDefenseFile' | 'postDefenseFile'; file: FinalSubmissionFile; } | null>(null);
    const SubmissionSection: React.FC<{ title: string; file: FinalSubmissionFile | null; type: 'preDefenseFile' | 'postDefenseFile'; }> = ({ title, file, type }) => (
        <Box>
            <Typography variant="subtitle2" fontWeight="semibold" sx={{ mb: 1 }}>
                {title}
            </Typography>
            {file ? (
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                    <Typography variant="body2">
                        {t('status')}: <Typography component="span" fontWeight="medium">{file.status}</Typography>
                    </Typography>
                    <Typography variant="body2">
                        {t('submitted')}: {new Date(file.submittedAt).toLocaleString()}
                    </Typography>
                    {file.feedback && (
                        <Typography variant="body2">
                            {t('feedback')}: {file.feedback}
                        </Typography>
                    )}
                </Stack>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {t('notYetSubmitted')}
                </Typography>
            )}
            {isOwner && (!file || file.status === FinalSubmissionStatus.RequiresRevision) && (
                <FileUpload
                    onFileUpload={(uploadedFile) => onUpdate(type, uploadedFile)}
                    currentFile={file}
                    label={file ? t('uploadNewVersion') : t('uploadFile')}
                    fileId={`final-upload-${type}`}
                    onGrammarCheck={onGrammarCheck}
                />
            )}
            {!isStudent && file?.status === FinalSubmissionStatus.Submitted && (
                <Box sx={{ mt: 1 }}>
                    <Button
                        onClick={() => setReviewModal({ isOpen: true, type, file })}
                        size="small"
                        variant="contained"
                        color="primary"
                    >
                        {t('review')}
                    </Button>
                </Box>
            )}
        </Box>
    );
    return (
        <Stack spacing={3}>
            <SubmissionSection title={t('preDefenseFiles')} file={submissions?.preDefenseFile || null} type="preDefenseFile" />
            <SubmissionSection title={t('postDefenseFiles')} file={submissions?.postDefenseFile || null} type="postDefenseFile" />
            {reviewModal?.isOpen && (
                <MilestoneFeedbackModal
                    isOpen
                    onClose={() => setReviewModal(null)}
                    onConfirm={(feedback) => {
                        const status = feedback.toLowerCase().includes('approve') ? FinalSubmissionStatus.Approved : FinalSubmissionStatus.RequiresRevision;
                        onReview(reviewModal.type, status, feedback);
                        setReviewModal(null);
                    }}
                    action={'approve'}
                    milestoneName={reviewModal.type === 'preDefenseFile' ? t('preDefensePresentation') : t('finalReport')}
                    projectGroup={projectGroup}
                />
            )}
        </Stack>
    );
};
  
  const handlePlagiarismCheck = async (milestone: Milestone) => {
    if (!milestone.submittedFile) {
        addToast({ type: 'info', message: t('noFileToCheck') });
        return;
    }
    if (!process.env.API_KEY) {
        addToast({ type: 'error', message: t('aiFeatureNotConfigured') });
        return;
    }

    setIsCheckingPlagiarism(true);
    setIsPlagiarismModalOpen(true);
    setPlagiarismResult(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const allOtherProjects = allProjectGroups
            .filter(p => p.project.projectId !== project.projectId)
            .map(p => `- ${p.project.projectId}: ${p.project.topicEng}`)
            .join('\n');
        
        const prompt = `
            You are an AI assistant performing a plagiarism and high-level similarity check.
            Analyze the following submission against a list of other projects in the system.
            The check is based on the project topic and the submitted document's name, not its full content.

            Project being checked:
            - ID: ${project.projectId}
            - Topic: "${project.topicEng}"
            - Milestone: "${milestone.name}"
            - Submitted File Name: "${milestone.submittedFile.name}"

            List of other projects in the system:
            ${allOtherProjects}

            Task:
            1. Calculate an "overallSimilarityScore" (0-100) based on how semantically similar the topic and file name are to other projects. A high score indicates potential overlap.
            2. Identify up to 3 "potentialMatches" from the list. For each match, provide the source (Project ID), similarity percentage, and a matchedSnippet (a brief reason for the similarity, e.g., "Similar keywords in topic 'Digital Marketing'").
            
            Respond ONLY with a JSON object matching the specified schema.
        `;

        const schema = {
            type: Type.OBJECT,
            properties: {
                overallSimilarityScore: { type: Type.NUMBER },
                potentialMatches: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            source: { type: Type.STRING },
                            similarity: { type: Type.NUMBER },
                            matchedSnippet: { type: Type.STRING }
                        },
                        required: ["source", "similarity", "matchedSnippet"]
                    }
                }
            },
            required: ["overallSimilarityScore", "potentialMatches"]
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema },
        });

        setPlagiarismResult(JSON.parse(response.text));

    } catch (error) {
        console.error("AI Plagiarism Check failed:", error);
        addToast({ type: 'error', message: t('plagiarismCheckFailedToast') });
        setIsPlagiarismModalOpen(false);
    } finally {
        setIsCheckingPlagiarism(false);
    }
};

  return (
    <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
            {onBack && (
                <Button
                    onClick={onBack}
                    startIcon={<ArrowLeftIcon />}
                    variant="contained"
                    color="primary"
                >
                    {t('backToList')}
                </Button>
            )}
            <Stack direction="row" spacing={1} flexWrap="wrap">
                {isAdmin && (
                    <Button
                        onClick={() => setIsTransferModalOpen(true)}
                        startIcon={<ArrowsRightLeftIcon />}
                        variant="contained"
                        sx={{ bgcolor: 'orange.500', '&:hover': { bgcolor: 'orange.600' } }}
                    >
                        {t('transfer')}
                    </Button>
                )}
                {(isOwner || isAdmin) && project.status === ProjectStatus.Rejected && (
                    <Button
                        onClick={() => onEdit(projectGroup)}
                        startIcon={<PencilSquareIcon />}
                        variant="contained"
                        color="primary"
                    >
                        {t('editAndResubmit')}
                    </Button>
                )}
                {isAdmin && project.status === ProjectStatus.Rejected && (
                    <Button
                        onClick={() => onUpdateStatus(project.projectId, ProjectStatus.Approved)}
                        startIcon={<CheckIcon />}
                        variant="contained"
                        color="success"
                    >
                        {t('approve')}
                    </Button>
                )}
                {isAdmin && (
                    <Button
                        onClick={() => onDelete(projectGroup)}
                        startIcon={<TrashIcon />}
                        variant="contained"
                        color="error"
                    >
                        {t('delete')}
                    </Button>
                )}
                {onOpenAssistant && (
                    <Button
                        onClick={onOpenAssistant}
                        startIcon={<SparklesIcon />}
                        variant="contained"
                        color="secondary"
                    >
                        {t('aiAssistant')}
                    </Button>
                )}
            </Stack>
        </Stack>
        <Paper elevation={3} sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'flex-start' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" fontWeight="semibold" color="primary.main">
                        {project.projectId}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
                        {project.topicEng}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {project.topicLao}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                        <Typography variant="body2" fontWeight="semibold" color="text.secondary">
                            {t('advisor')}:
                        </Typography>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                            <Box
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: getAdvisorColor(project.advisorName)
                                }}
                            />
                            <Typography variant="body2">{project.advisorName}</Typography>
                        </Stack>
                    </Stack>
                </Box>
                <Box sx={{ flexShrink: 0 }}>
                    <StatusBadge project={project} user={user} onUpdateStatus={onUpdateStatus} />
                </Box>
            </Stack>
        </Paper>
        <Grid container spacing={3} alignItems="flex-start">
            <Grid size={{ xs: 12, lg: 8 }}>
                <Paper elevation={3}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => setActiveTab(newValue)}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        {visibleTabs.map(tab => (
                            <Tab
                                key={tab.key}
                                value={tab.key}
                                icon={<tab.icon />}
                                label={tab.label}
                                iconPosition="start"
                            />
                        ))}
                    </Tabs>
                    <Divider />
                    <Box sx={{ p: 3 }}>
                        {activeTab === 'overview' && (
                            <Stack spacing={2}>
                                <CollapsibleSection title={t('groupMembers')}>
                                    <List>
                                        {students.map(s => (
                                            <ListItem key={s.studentId} divider>
                                                <ListItemText
                                                    primary={`${s.name} ${s.surname}`}
                                                    secondary={`${s.studentId} • ${s.major}`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </CollapsibleSection>
                                <CollapsibleSection title={t('defenseScheduleCommittee')}>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 4 }}>
                                            <Typography variant="caption" fontWeight="medium" color="text.secondary">
                                                {t('defenseDate')}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 8 }}>
                                            <Typography variant="body2">
                                                {project.defenseDate || t('notScheduled')}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 4 }}>
                                            <Typography variant="caption" fontWeight="medium" color="text.secondary">
                                                {t('defenseTime')}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 8 }}>
                                            <Typography variant="body2">
                                                {project.defenseTime || t('na')}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 4 }}>
                                            <Typography variant="caption" fontWeight="medium" color="text.secondary">
                                                {t('defenseRoom')}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 8 }}>
                                            <Typography variant="body2">
                                                {project.defenseRoom || t('na')}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 4 }}>
                                            <Typography variant="caption" fontWeight="medium" color="text.secondary">
                                                {t('mainCommittee')}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 8 }}>
                                            <Typography variant="body2">
                                                {advisors?.find(a => a.id === project.mainCommitteeId)?.name || t('notAssigned')}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 4 }}>
                                            <Typography variant="caption" fontWeight="medium" color="text.secondary">
                                                {t('secondCommittee')}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 8 }}>
                                            <Typography variant="body2">
                                                {advisors?.find(a => a.id === project.secondCommitteeId)?.name || t('notAssigned')}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 4 }}>
                                            <Typography variant="caption" fontWeight="medium" color="text.secondary">
                                                {t('thirdCommittee')}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 8 }}>
                                            <Typography variant="body2">
                                                {advisors?.find(a => a.id === project.thirdCommitteeId)?.name || t('notAssigned')}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CollapsibleSection>
                            </Stack>
                        )}
                        {activeTab === 'milestones' && (
                            <MilestoneList
                                milestones={project.milestones || []}
                                user={user}
                                onUpdateMilestone={handleUpdateMilestone}
                                onReorderMilestones={isAdmin ? handleReorderMilestones : undefined}
                                onPlagiarismCheck={handlePlagiarismCheck}
                                onGrammarCheck={onGrammarCheck}
                            />
                        )}
                        {activeTab === 'submissions' && (
                            <FinalSubmissions
                                submissions={project.finalSubmissions}
                                user={user}
                                onUpdate={handleUpdateFinalSubmissions}
                                onReview={handleReviewFinalSubmission}
                                onGrammarCheck={onGrammarCheck}
                            />
                        )}
                        {activeTab === 'scoring' && scoringSettings && updateDetailedScore && advisors && (
                            <ProjectScoring
                                projectGroup={projectGroup}
                                user={user}
                                scoringSettings={scoringSettings}
                                advisors={advisors}
                                updateDetailedScore={updateDetailedScore}
                            />
                        )}
                        {activeTab === 'history' && <StatusTimeline history={project.history} />}
                        {activeTab === 'log' && (
                            <CommunicationLog
                                projectGroup={projectGroup}
                                user={user}
                                advisors={advisors || []}
                                onAddEntry={addProjectLogEntry}
                                onAnalyze={() => onAnalyzeCommunication(projectGroup)}
                            />
                        )}
                    </Box>
                </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
                {announcements && <AnnouncementsFeed announcements={announcements} user={user} />}
            </Grid>
        </Grid>
        {isTransferModalOpen && advisors && advisorProjectCounts && transferProject && majors && (
            <AdminTransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                onConfirm={handleTransferConfirm}
                projectGroup={projectGroup}
                advisors={advisors}
                advisorProjectCounts={advisorProjectCounts}
                majors={majors}
            />
        )}
        {isPlagiarismModalOpen && (
            <PlagiarismResultModal
                isOpen={isPlagiarismModalOpen}
                onClose={() => setIsPlagiarismModalOpen(false)}
                result={plagiarismResult}
            />
        )}
    </Stack>
  );
};

export default ProjectDetailView;