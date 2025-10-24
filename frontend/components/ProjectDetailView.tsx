import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ProjectGroup, User, ProjectStatus, Milestone, MilestoneStatus, Advisor, Announcement, FileUploadPayload, FinalSubmissionStatus, FinalSubmissionFile, ScoringSettings, Major, LogEntry, Role, MilestoneUpdatePayload, PlagiarismResult, PlagiarismMatch, CommunicationAnalysisResult, GrammarCheckResult } from '../types';
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon, CheckIcon, XCircleIcon, PaperAirplaneIcon, ClockIcon, DocumentArrowUpIcon, CheckCircleIcon as CheckCircleSolidIcon, ArrowPathIcon, ArrowsRightLeftIcon, LinkIcon, SparklesIcon, ExclamationTriangleIcon, PaperClipIcon, XMarkIcon, Bars3Icon, ClipboardDocumentListIcon, ChartBarIcon, InboxStackIcon, ArrowUpIcon, ArrowDownIcon, ChevronUpDownIcon, ChatBubbleBottomCenterTextIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon } from './icons';
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

    if (isOverdue) return { icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-700 dark:text-red-300" />, bgColor: 'bg-red-100 dark:bg-red-900/50', textColor: 'text-red-800 dark:text-red-200', label: t('overdue') };
    switch (status) {
        case MilestoneStatus.Approved: return { icon: <CheckCircleSolidIcon className="w-5 h-5 text-green-700 dark:text-green-300" />, bgColor: 'bg-green-100 dark:bg-green-900/50', textColor: 'text-green-800 dark:text-green-200', label: t('approved') };
        case MilestoneStatus.Submitted: return { icon: <DocumentArrowUpIcon className="w-5 h-5 text-blue-700 dark:text-blue-300" />, bgColor: 'bg-blue-100 dark:bg-blue-900/50', textColor: 'text-blue-800 dark:text-blue-200', label: t('submitted') };
        case MilestoneStatus.RequiresRevision: return { icon: <ArrowPathIcon className="w-5 h-5 text-orange-700 dark:text-orange-300" />, bgColor: 'bg-orange-100 dark:bg-orange-900/50', textColor: 'text-orange-800 dark:text-orange-200', label: t('requiresRevision') };
        default: return { icon: <ClockIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />, bgColor: 'bg-slate-100 dark:bg-slate-700/50', textColor: 'text-slate-800 dark:text-slate-200', label: t('pending') };
    }
};

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-900/50 rounded-t-lg">
                <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300">{title}</h4>
                {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
            </button>
            {isOpen && <div className="p-4">{children}</div>}
        </div>
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
        <div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" id={fileId} />
            {currentFile ? (
                 <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-md flex justify-between items-center">
                    <div className="text-sm"><p className="font-medium text-slate-800 dark:text-slate-200">{currentFile.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{(currentFile.size / 1024).toFixed(2)} KB</p></div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => downloadFile(currentFile)} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">{t('download')}</button>
                      {isOwner && onGrammarCheck && currentFile.type.startsWith('text/') && (
                          <button type="button" onClick={() => onGrammarCheck(currentFile)} className="text-sm font-medium text-purple-600 hover:underline dark:text-purple-400 flex items-center gap-1">
                              <SparklesIcon className="w-4 h-4" /> {t('analyzeDocument')}
                          </button>
                      )}
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">{t('replace')}</button>
                    </div>
                 </div>
            ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 w-full text-center px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-500 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400">{label}</button>
            )}
        </div>
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

    if (!milestones || milestones.length === 0) return <p className="text-slate-500 dark:text-slate-400">{t('noMilestonesYet')}</p>;
    
    return (
        <div className="space-y-4">
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
                 <div key={milestone.id} draggable={!isStudent && !!onReorderMilestones} onDragStart={(e) => onReorderMilestones && handleDragStart(e, milestone.id)} onDragOver={onReorderMilestones ? handleDragOver : undefined} onDrop={(e) => onReorderMilestones && handleDrop(e, milestone.id)} className={`p-4 rounded-lg ${bgColor} ${draggedId === milestone.id ? 'opacity-50' : ''}`}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                        <div>
                            <p className={`font-bold ${textColor}`}>{milestone.name}</p>
                            {isPrivilegedUser ? (
                                <div className={`flex items-center gap-2 mt-1 ${textColor}`}><label htmlFor={`due-date-${milestone.id}`} className="text-sm font-medium">{t('due')}</label><input type="date" id={`due-date-${milestone.id}`} value={milestone.dueDate.split('T')[0]} onChange={(e) => { if (e.target.value) { const newDate = new Date(e.target.value); const utcDate = new Date(Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())); onUpdateMilestone(milestone.id, { dueDate: utcDate.toISOString() }); } }} onClick={(e) => e.stopPropagation()} className="bg-transparent border border-current/30 rounded-md p-1 text-sm text-slate-800 dark:text-white" /></div>
                            ) : (<p className={`text-sm font-medium ${textColor}`}>{t('due')} {new Date(milestone.dueDate).toLocaleDateString()}</p>)}
                        </div>
                        <div className={`mt-2 sm:mt-0 flex items-center gap-2 text-sm font-semibold ${textColor} px-3 py-1 rounded-full ${bgColor}`}>{icon}{label}</div>
                    </div>
                    {milestone.feedback && <blockquote className="mt-2 pl-3 text-sm border-l-2 border-current opacity-80"><strong>{t('feedback')}:</strong> {milestone.feedback}</blockquote>}
                    
                    {canStudentUpload && (
                        <FileUpload 
                            onFileUpload={handleStudentFileUpload} 
                            currentFile={milestone.submittedFile} 
                            label={t('uploadSubmissionFile')} 
                            fileId={`file-upload-${milestone.id}`} 
                            onGrammarCheck={onGrammarCheck}
                        />
                    )}

                    {!isStudent && milestone.status === MilestoneStatus.Submitted && <div className="mt-3 pt-3 border-t border-current opacity-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><FileUpload onFileUpload={(file) => onUpdateMilestone(milestone.id, { submittedFile: file, status: MilestoneStatus.Submitted })} currentFile={milestone.submittedFile} label={t('uploadNewVersion')} fileId={`file-upload-${milestone.id}`} /><div className="flex gap-2 justify-end"><button onClick={() => setFeedbackModal({ isOpen: true, milestoneId: milestone.id, milestoneName: milestone.name, action: 'approve' })} className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-200 rounded-md hover:bg-green-300">{t('approve')}</button><button onClick={() => setFeedbackModal({ isOpen: true, milestoneId: milestone.id, milestoneName: milestone.name, action: 'revise' })} className="px-3 py-1 text-sm font-semibold text-orange-800 bg-orange-200 rounded-md hover:bg-orange-300">{t('requestRevision')}</button></div></div>}
                    
                    {isPrivilegedUser && milestone.submittedFile && (
                        <div className="mt-2 pt-2 border-t border-current/20 flex justify-end">
                            <button onClick={() => onPlagiarismCheck(milestone)} className="flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300">
                                <MagnifyingGlassIcon className="w-4 h-4 mr-1"/>
                                {t('checkPlagiarismWithAI')}
                            </button>
                        </div>
                    )}
                 </div>
                )
             })}
            <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, null)} className="h-2"></div>
            {feedbackModal.isOpen && <MilestoneFeedbackModal isOpen={feedbackModal.isOpen} onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })} onConfirm={(feedback) => { const newStatus = feedbackModal.action === 'approve' ? MilestoneStatus.Approved : MilestoneStatus.RequiresRevision; onUpdateMilestone(feedbackModal.milestoneId, { status: newStatus, feedback }); setFeedbackModal({ ...feedbackModal, isOpen: false }); }} action={feedbackModal.action} milestoneName={feedbackModal.milestoneName} projectGroup={projectGroup} />}
        </div>
    );
};

  const FinalSubmissions: React.FC<{ submissions: ProjectGroup['project']['finalSubmissions']; user: User; onUpdate: (type: 'preDefenseFile' | 'postDefenseFile', file: FileUploadPayload) => void; onReview: (type: 'preDefenseFile' | 'postDefenseFile', status: FinalSubmissionStatus.Approved | FinalSubmissionStatus.RequiresRevision, feedback: string) => void; onGrammarCheck: (file: { fileId: string; name: string }) => void; }> = ({ submissions, user, onUpdate, onReview, onGrammarCheck }) => {
    const isStudent = user.role === 'Student';
    const t = useTranslations();
    const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; type: 'preDefenseFile' | 'postDefenseFile'; file: FinalSubmissionFile; } | null>(null);
    const SubmissionSection: React.FC<{ title: string; file: FinalSubmissionFile | null; type: 'preDefenseFile' | 'postDefenseFile'; }> = ({ title, file, type }) => (
        <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
            {file ? <div className="mt-2 text-sm"><p>{t('status')}: <span className="font-medium">{file.status}</span></p><p>{t('submitted')}: {new Date(file.submittedAt).toLocaleString()}</p>{file.feedback && <p>{t('feedback')}: {file.feedback}</p>}</div> : <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('notYetSubmitted')}</p>}
            {isOwner && (!file || file.status === FinalSubmissionStatus.RequiresRevision) && <FileUpload onFileUpload={(uploadedFile) => onUpdate(type, uploadedFile)} currentFile={file} label={file ? t('uploadNewVersion') : t('uploadFile')} fileId={`final-upload-${type}`} onGrammarCheck={onGrammarCheck} />}
            {!isStudent && file?.status === FinalSubmissionStatus.Submitted && <div className="mt-2 flex gap-2"><button onClick={() => setReviewModal({ isOpen: true, type, file })} className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 rounded-md">{t('review')}</button></div>}
        </div>
    );
    return (
        <div className="space-y-6">
            <SubmissionSection title={t('preDefenseFiles')} file={submissions?.preDefenseFile || null} type="preDefenseFile" />
            <SubmissionSection title={t('postDefenseFiles')} file={submissions?.postDefenseFile || null} type="postDefenseFile" />
            {reviewModal?.isOpen && <MilestoneFeedbackModal isOpen onClose={() => setReviewModal(null)} onConfirm={(feedback) => { const status = feedback.toLowerCase().includes('approve') ? FinalSubmissionStatus.Approved : FinalSubmissionStatus.RequiresRevision; onReview(reviewModal.type, status, feedback); setReviewModal(null); }} action={'approve'} milestoneName={reviewModal.type === 'preDefenseFile' ? t('preDefensePresentation') : t('finalReport')} projectGroup={projectGroup}/>}
        </div>
    )
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
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
             {onBack && <button onClick={onBack} className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-md"><ArrowLeftIcon className="w-5 h-5 mr-2" />{t('backToList')}</button>}
             <div className="flex items-center gap-2">
                 {isAdmin && <button onClick={() => setIsTransferModalOpen(true)} className="flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded-md"><ArrowsRightLeftIcon className="w-5 h-5 mr-1.5" />{t('transfer')}</button>}
                 {(isOwner || isAdmin) && project.status === ProjectStatus.Rejected && <button onClick={() => onEdit(projectGroup)} className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-md"><PencilSquareIcon className="w-5 h-5 mr-1.5" />{t('editAndResubmit')}</button>}
                 {isAdmin && project.status === ProjectStatus.Rejected && (
                    <button onClick={() => onUpdateStatus(project.projectId, ProjectStatus.Approved)} className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-md">
                        <CheckIcon className="w-5 h-5 mr-1.5" />
                        {t('approve')}
                    </button>
                 )}
                 {isAdmin && <button onClick={() => onDelete(projectGroup)} className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-md"><TrashIcon className="w-5 h-5 mr-1.5" />{t('delete')}</button>}
                 {onOpenAssistant && <button onClick={onOpenAssistant} className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-md"><SparklesIcon className="w-5 h-5 mr-1.5" />{t('aiAssistant')}</button>}
             </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div className="flex-1"><p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{project.projectId}</p><h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{project.topicEng}</h2><p className="text-md text-slate-500 dark:text-slate-400">{project.topicLao}</p><div className="mt-4 flex items-center text-sm"><span className="font-semibold text-slate-700 dark:text-slate-300 mr-2">{t('advisor')}:</span><div className="flex items-center"><span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: getAdvisorColor(project.advisorName) }}></span><span>{project.advisorName}</span></div></div></div>
                <div className="flex-shrink-0"><StatusBadge project={project} user={user} onUpdateStatus={onUpdateStatus} /></div>
            </div>
        </div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
             <div className="lg:col-span-2 space-y-6">
                 <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                     <div className="border-b border-slate-200 dark:border-slate-700"><nav className="flex -mb-px space-x-4 px-4">{visibleTabs.map(tab => <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-white dark:hover:border-slate-600'}`}><tab.icon className="w-5 h-5"/>{tab.label}</button>)}</nav></div>
                     <div className="p-6">
                         {activeTab === 'overview' && (
                             <div className="space-y-4">
                                 <CollapsibleSection title={t('groupMembers')}>
                                     <ul className="divide-y divide-slate-200 dark:divide-slate-700">{students.map(s => <li key={s.studentId} className="py-2"><p className="font-semibold">{s.name} {s.surname}</p><p className="text-sm text-slate-500">{s.studentId} &bull; {s.major}</p></li>)}</ul>
                                 </CollapsibleSection>
                                 <CollapsibleSection title={t('defenseScheduleCommittee')}>
                                     <dl className="divide-y divide-slate-200 dark:divide-slate-700">
                                         <div className="py-2 grid grid-cols-3 gap-4"><dt className="text-sm font-medium text-slate-500">{t('defenseDate')}</dt><dd className="text-sm col-span-2">{project.defenseDate || t('notScheduled')}</dd></div>
                                         <div className="py-2 grid grid-cols-3 gap-4"><dt className="text-sm font-medium text-slate-500">{t('defenseTime')}</dt><dd className="text-sm col-span-2">{project.defenseTime || t('na')}</dd></div>
                                         <div className="py-2 grid grid-cols-3 gap-4"><dt className="text-sm font-medium text-slate-500">{t('defenseRoom')}</dt><dd className="text-sm col-span-2">{project.defenseRoom || t('na')}</dd></div>
                                         <div className="py-2 grid grid-cols-3 gap-4"><dt className="text-sm font-medium text-slate-500">{t('mainCommittee')}</dt><dd className="text-sm col-span-2">{advisors?.find(a => a.id === project.mainCommitteeId)?.name || t('notAssigned')}</dd></div>
                                         <div className="py-2 grid grid-cols-3 gap-4"><dt className="text-sm font-medium text-slate-500">{t('secondCommittee')}</dt><dd className="text-sm col-span-2">{advisors?.find(a => a.id === project.secondCommitteeId)?.name || t('notAssigned')}</dd></div>
                                         <div className="py-2 grid grid-cols-3 gap-4"><dt className="text-sm font-medium text-slate-500">{t('thirdCommittee')}</dt><dd className="text-sm col-span-2">{advisors?.find(a => a.id === project.thirdCommitteeId)?.name || t('notAssigned')}</dd></div>
                                     </dl>
                                 </CollapsibleSection>
                             </div>
                         )}
                         {activeTab === 'milestones' && <MilestoneList milestones={project.milestones || []} user={user} onUpdateMilestone={handleUpdateMilestone} onReorderMilestones={isAdmin ? handleReorderMilestones : undefined} onPlagiarismCheck={handlePlagiarismCheck} onGrammarCheck={onGrammarCheck} />}
                         {activeTab === 'submissions' && <FinalSubmissions submissions={project.finalSubmissions} user={user} onUpdate={handleUpdateFinalSubmissions} onReview={handleReviewFinalSubmission} onGrammarCheck={onGrammarCheck} />}
                         {activeTab === 'scoring' && scoringSettings && updateDetailedScore && advisors && <ProjectScoring projectGroup={projectGroup} user={user} scoringSettings={scoringSettings} advisors={advisors} updateDetailedScore={updateDetailedScore} />}
                         {activeTab === 'history' && <StatusTimeline history={project.history} />}
                         {activeTab === 'log' && <CommunicationLog projectGroup={projectGroup} user={user} advisors={advisors || []} onAddEntry={addProjectLogEntry} onAnalyze={() => onAnalyzeCommunication(projectGroup)} />}
                     </div>
                 </div>
             </div>
             <div className="lg:col-span-1 space-y-6">
                 {announcements && <AnnouncementsFeed announcements={announcements} user={user} />}
             </div>
         </div>
        {isTransferModalOpen && advisors && advisorProjectCounts && transferProject && majors && <AdminTransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onConfirm={handleTransferConfirm} projectGroup={projectGroup} advisors={advisors} advisorProjectCounts={advisorProjectCounts} majors={majors} />}
        {isPlagiarismModalOpen && <PlagiarismResultModal isOpen={isPlagiarismModalOpen} onClose={() => setIsPlagiarismModalOpen(false)} result={plagiarismResult} />}
    </div>
  );
};

export default ProjectDetailView;