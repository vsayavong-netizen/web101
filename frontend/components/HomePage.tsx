import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { Box, Fab, CircularProgress } from '@mui/material';
import { AutoAwesome as SparklesIconMui } from '@mui/icons-material';
import Header from './Header';
import ProjectTableEnhanced from './ProjectTableEnhanced';
import ProjectFilters from './ProjectFilters';
import ConfirmationModal from './ConfirmationModal';
import ProjectDetailView from './ProjectDetailView';
import { StudentWelcome } from './StudentWelcome';

// Lazy load heavy components for code splitting
const RegisterProjectModal = lazy(() => import('./RegisterProjectModal').then(module => ({ default: module.RegisterProjectModal })));
const StudentManagement = lazy(() => import('./StudentManagement'));
const AdvisorManagement = lazy(() => import('./AdvisorManagement'));
const DepartmentAdminManagement = lazy(() => import('./DepartmentAdminManagement'));
const MajorManagement = lazy(() => import('./MajorManagement'));
const ClassroomManagement = lazy(() => import('./ClassroomManagement'));
const AdvisorActionModal = lazy(() => import('./AdvisorActionModal'));
const MilestoneTemplateManagement = lazy(() => import('./MilestoneTemplateManagement'));
const ProjectTimeline = lazy(() => import('./ProjectTimeline'));
const AnalyticsDashboardEnhanced = lazy(() => import('./AnalyticsDashboardEnhanced'));
const AnnouncementsManagement = lazy(() => import('./AnnouncementsManagement'));
const ProfileModal = lazy(() => import('./ProfileModal'));
const SubmissionsManagement = lazy(() => import('./SubmissionsManagement'));
const CommitteeManagement = lazy(() => import('./CommitteeManagement'));
const ScoringManagement = lazy(() => import('./ScoringManagement'));
const FinalProjectManagement = lazy(() => import('./FinalProjectManagement').then(module => ({ default: module.FinalProjectManagement })));
const SettingsPage = lazy(() => import('./SettingsPage').then(module => ({ default: module.SettingsPage })));
const CalendarView = lazy(() => import('./CalendarView'));
const ReportingPage = lazy(() => import('./ReportingPage').then(module => ({ default: module.ReportingPage })));
const AiToolsPage = lazy(() => import('./AiToolsPage'));
const AdminDashboard = lazy(() => import('./AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const StudentDashboard = lazy(() => import('./StudentDashboard').then(module => ({ default: module.StudentDashboard })));
const AdvisorDashboard = lazy(() => import('./AdvisorDashboard').then(module => ({ default: module.AdvisorDashboard })));
const NotificationsPage = lazy(() => import('./NotificationsPage'));
const TopicSuggesterModal = lazy(() => import('./TopicSuggesterModal'));
const AiChatWidget = lazy(() => import('./AiChatWidget'));
const CommunicationAnalysisModal = lazy(() => import('./CommunicationAnalysisModal'));
const AiWritingAssistantModal = lazy(() => import('./AiWritingAssistantModal'));
const BulkMessageModal = lazy(() => import('./BulkMessageModal'));
import { useToast } from '../hooks/useToast';
import { ProjectGroup, Advisor, Student, User, ProjectStatus, Major, Classroom, Project, Milestone, MilestoneStatus, Notification, MilestoneTemplate, Announcement, FileUploadPayload, FinalSubmissionStatus, DefenseSettings, ScoringSettings, LogEntry, ProjectHealthStatus, MilestoneUpdatePayload, SystemHealthIssue, Role, SystemSecurityIssue, MilestoneReviewItem, CommunicationAnalysisResult, GeneralSettings, GrammarCheckResult } from '../types';
import { ExcelUtils } from '../utils/excelUtils';
import { useTour } from '../hooks/useTour';
import { getStudentWelcomeTour, getAdvisorDashboardTour } from '../config/tourSteps';
import TourGuide from './TourGuide';
import { GoogleGenAI, Type } from "@google/genai";
import { formatTimeAgo } from '../utils/timeUtils';
import { useTranslations } from '../hooks/useTranslations';
import BulkActionsBar from './BulkActionsBar';
import { SparklesIcon } from './icons';
// Pagination is now handled by DataGrid internally
// Note: TopicSuggesterModal, AiChatWidget, CommunicationAnalysisModal, AiWritingAssistantModal, BulkMessageModal are lazy loaded above

type SortDirection = 'ascending' | 'descending';
type SortKey = 'studentId' | 'projectId' | 'advisorName';
type ActiveView = 'dashboard' | 'projects' | 'students' | 'advisors' | 'deptAdmins' | 'majors' | 'classrooms' | 'milestoneTemplates' | 'submissions' | 'timeline' | 'analytics' | 'announcements' | 'committees' | 'scoring' | 'finalGrades' | 'settings' | 'calendar' | 'reporting' | 'aiTools' | 'notifications';

type AdvisorAction = {
  project: ProjectGroup;
  action: 'approve' | 'reject';
}

const ITEMS_PER_PAGE = 20;

interface HomePageProps {
  onLogout: () => void;
  user: User & Partial<Student & Advisor>;
  effectiveRole: Role;
  onSwitchRole: (newRole: Role) => void;
  projectGroups: ProjectGroup[];
  advisors: Advisor[];
  students: Student[];
  majors: Major[];
  classrooms: Classroom[];
  milestoneTemplates: MilestoneTemplate[];
  announcements: Announcement[];
  defenseSettings: DefenseSettings;
  scoringSettings: ScoringSettings;
  addProject: (project: Project, students: Student[], actor: User) => void;
  updateProject: (group: ProjectGroup, actor: User) => void;
  deleteProject: (id: string) => void;
  advisorProjectCounts: Record<string, number>;
  committeeCounts: Record<string, { main: number; second: number; third: number }>;
  updateProjectStatus: (id: string, status: ProjectStatus, actor: User, details: { comment?: string, templateId?: string }) => void;
  updateMilestone: (projectId: string, milestoneId: string, actor: User, data: MilestoneUpdatePayload) => void;
  updateFinalSubmissions: (projectId: string, type: 'preDefenseFile' | 'postDefenseFile', actor: User, file: FileUploadPayload) => void;
  reviewFinalSubmission: (projectId: string, type: 'preDefenseFile' | 'postDefenseFile', actor: User, status: FinalSubmissionStatus.Approved | FinalSubmissionStatus.RequiresRevision, feedback: string) => void,
  reorderMilestones: (projectId: string, draggedId: string, targetId: string | null) => void;
  transferProject: (projectId: string, newAdvisorName: string, actor: User, comment: string) => void;
  addProjectLogEntry: (projectId: string, entry: Omit<LogEntry, 'id' | 'timestamp' | 'file'>, filePayload?: FileUploadPayload | null) => void;
  bulkAddProjectLogEntries: (projectIds: string[], entry: Omit<LogEntry, 'id' | 'timestamp' | 'file'>) => void,
  updateProjectCommittee: (projectId: string, actor: User, committeeType: 'main' | 'second' | 'third', advisorId: string | null) => void;
  updateProjectDefenseSchedule: (projectId: string, actor: User, schedule: { date: string | null; time: string | null; room: string | null }) => void;
  updateDefenseSettings: (settings: DefenseSettings) => void;
  updateScoringSettings: (settings: ScoringSettings) => void;
  updateDetailedScore: (projectId: string, evaluatorId: string, scores: Record<string, number>) => void;
  updateProjectGrade: (projectId: string, finalGrade: string | null) => void;
  autoScheduleDefenses: (settings: DefenseSettings) => { committeesAssigned: number; defensesScheduled: number; };
  clearAllSchedulesAndCommittees: () => void;
  bulkUpdateSchedules: (updates: { projectId: string; date: string | null; time: string | null; room: string | null }[]) => void;
  addAdvisor: (advisor: Omit<Advisor, 'id'>) => void;
  updateAdvisor: (advisor: Advisor) => void;
  deleteAdvisor: (id: string) => void;
  deleteAdvisors: (ids: string[]) => void;
  bulkAddOrUpdateAdvisors: (advisors: (Omit<Advisor, 'id'> | Advisor)[]) => void;
  bulkUpdateAdvisors: (advisorIds: string[], updates: Partial<Omit<Advisor, 'id' | 'name'>>) => void;
  addStudent: (student: Student) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  bulkAddOrUpdateStudents: (students: Student[]) => void,
  bulkUpdateStudents: (studentIds: string[], updates: Partial<Student>) => void;
  bulkDeleteStudents: (studentIds: string[]) => void;
  addMajor: (major: Omit<Major, 'id'>) => void;
  updateMajor: (major: Major) => void;
  deleteMajor: (id: string) => void;
  addClassroom: (classroom: Omit<Classroom, 'id'>) => void;
  updateClassroom: (classroom: Classroom) => void;
  deleteClassroom: (id: string) => void;
  addMilestoneTemplate: (template: Omit<MilestoneTemplate, 'id'>) => void;
  updateMilestoneTemplate: (template: MilestoneTemplate) => void;
  deleteMilestoneTemplate: (templateId: string) => void;
  addAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAnnouncement: (announcement: Announcement) => void;
  deleteAnnouncement: (announcementId: string) => void;
  currentAcademicYear: string;
  availableYears: string[];
  onYearChange: (year: string) => void;
  onStartNewYear: () => void;
  notifications: Notification[];
  onMarkNotificationsAsRead: (userId: string) => void;
  onMarkSingleNotificationAsRead: (notificationId: string) => void;
  isPasswordChangeForced?: boolean;
  onPasswordChanged?: () => void;
}

const HomePage: React.FC<HomePageProps> = (props) => {
  const { 
    onLogout, user, effectiveRole, onSwitchRole, projectGroups: allProjectGroups, advisors: allAdvisors, students: allStudents, 
    majors: allMajors, classrooms: allClassrooms, milestoneTemplates, announcements, defenseSettings, 
    scoringSettings, addProject, updateProject, deleteProject, advisorProjectCounts: allAdvisorProjectCounts, 
    committeeCounts: allCommitteeCounts, updateProjectStatus, updateMilestone, updateFinalSubmissions, 
    reviewFinalSubmission, reorderMilestones, transferProject, addProjectLogEntry, bulkAddProjectLogEntries,
    updateProjectCommittee, updateProjectDefenseSchedule, updateDefenseSettings, updateScoringSettings,
    updateDetailedScore, updateProjectGrade, autoScheduleDefenses, bulkUpdateSchedules,
    clearAllSchedulesAndCommittees,
    addAdvisor, updateAdvisor, deleteAdvisor, deleteAdvisors, bulkAddOrUpdateAdvisors, bulkUpdateAdvisors,
    addStudent, updateStudent, deleteStudent, bulkAddOrUpdateStudents, bulkUpdateStudents, bulkDeleteStudents,
    addMajor, updateMajor, deleteMajor,
    addClassroom, updateClassroom, deleteClassroom,
    addMilestoneTemplate, updateMilestoneTemplate, deleteMilestoneTemplate,
    addAnnouncement, updateAnnouncement, deleteAnnouncement,
    currentAcademicYear, availableYears, onYearChange, onStartNewYear,
    notifications,
    onMarkNotificationsAsRead, onMarkSingleNotificationAsRead,
    isPasswordChangeForced, onPasswordChanged,
  } = props;
    
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectGroup | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [advisorFilter, setAdvisorFilter] = useState('all');
  const [projectToDelete, setProjectToDelete] = useState<ProjectGroup | null>(null);
  const [projectToAction, setProjectToAction] = useState<AdvisorAction | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isNewYearModalOpen, setIsNewYearModalOpen] = useState(false);
  const [isReviewFilterActive, setIsReviewFilterActive] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSuggesterOpen, setIsSuggesterOpen] = useState(false);
  const [suggestedTopic, setSuggestedTopic] = useState<{ lao: string; eng: string } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [projectHealth, setProjectHealth] = useState<Record<string, ProjectHealthStatus>>({});
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState(false);
  const [systemHealthIssues, setSystemHealthIssues] = useState<SystemHealthIssue[] | null>(null);
  const [isAnalyzingSystemHealth, setIsAnalyzingSystemHealth] = useState(false);
  const [studentPageFilter, setStudentPageFilter] = useState<string | undefined>();
  const [securityIssues, setSecurityIssues] = useState<SystemSecurityIssue[] | null>(null);
  const [isAnalyzingSecurity, setIsAnalyzingSecurity] = useState(false);
  const [genderFilter, setGenderFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [similarityFilter, setSimilarityFilter] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState(new Set<string>());
  const [isBulkMessageModalOpen, setIsBulkMessageModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CommunicationAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWritingAssistantOpen, setIsWritingAssistantOpen] = useState(false);
  const [writingAssistantFile, setWritingAssistantFile] = useState<{ fileId: string; name: string } | null>(null);
  const [grammarResult, setGrammarResult] = useState<GrammarCheckResult | null>(null);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [originalText, setOriginalText] = useState('');

  const addToast = useToast();
  const t = useTranslations();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'projectId', direction: 'ascending' });
  
  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const userNotifications = useMemo(() => {
    if (!user || !notifications) {
      return [];
    }
    return notifications.filter(n => n.userIds.includes(user.id));
  }, [notifications, user.id]);

  const isAiAssistantEnabledForUser = useMemo(() => {
      if (effectiveRole === 'Admin' || effectiveRole === 'DepartmentAdmin') return true;
      if (effectiveRole === 'Student' || effectiveRole === 'Advisor') {
          return (user as Student & Advisor).isAiAssistantEnabled ?? true;
      }
      return false;
  }, [user, effectiveRole]);

  const isDeptAdminView = effectiveRole === 'DepartmentAdmin';
  const { projectGroups, advisors, students, majors, classrooms, advisorProjectCounts, committeeCounts } = useMemo(() => {
    if (isDeptAdminView) {
      const deptAdminUser = user as User & Partial<Advisor>;
      const managedMajorIds = new Set(deptAdminUser.specializedMajorIds || []);
      const managedMajors = allMajors.filter(m => managedMajorIds.has(m.id));
      const managedMajorNames = new Set(managedMajors.map(m => m.name));

      const scopedStudents = allStudents.filter(s => managedMajorNames.has(s.major));
      const scopedAdvisors = allAdvisors.filter(adv => adv.specializedMajorIds.some(id => managedMajorIds.has(id)));
      const scopedProjectGroups = allProjectGroups.filter(pg => pg.students.length > 0 && managedMajorNames.has(pg.students[0].major));
      const scopedClassrooms = allClassrooms.filter(c => managedMajorIds.has(c.majorId));
      
      const scopedAdvisorCounts = scopedProjectGroups.reduce((acc, group) => {
        if(group.project.status === ProjectStatus.Approved || group.project.status === ProjectStatus.Pending) {
           acc[group.project.advisorName] = (acc[group.project.advisorName] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const scopedCommitteeCounts: Record<string, { main: number; second: number; third: number }> = {};
        scopedAdvisors.forEach(adv => {
            scopedCommitteeCounts[adv.id] = { main: 0, second: 0, third: 0 };
        });
        scopedProjectGroups.forEach(pg => {
            if (pg.project.mainCommitteeId && scopedCommitteeCounts[pg.project.mainCommitteeId]) scopedCommitteeCounts[pg.project.mainCommitteeId].main++;
            if (pg.project.secondCommitteeId && scopedCommitteeCounts[pg.project.secondCommitteeId]) scopedCommitteeCounts[pg.project.secondCommitteeId].second++;
            if (pg.project.thirdCommitteeId && scopedCommitteeCounts[pg.project.thirdCommitteeId]) scopedCommitteeCounts[pg.project.thirdCommitteeId].third++;
        });

      return {
          projectGroups: scopedProjectGroups,
          advisors: scopedAdvisors,
          students: scopedStudents,
          majors: managedMajors,
          classrooms: scopedClassrooms,
          advisorProjectCounts: scopedAdvisorCounts,
          committeeCounts: scopedCommitteeCounts,
      };
    }
    return {
        projectGroups: allProjectGroups,
        advisors: allAdvisors,
        students: allStudents,
        majors: allMajors,
        classrooms: allClassrooms,
        advisorProjectCounts: allAdvisorProjectCounts,
        committeeCounts: allCommitteeCounts,
    };
  }, [user, isDeptAdminView, allProjectGroups, allAdvisors, allStudents, allMajors, allClassrooms, allAdvisorProjectCounts, allCommitteeCounts]);


  const studentProjectGroup = useMemo(() => {
    if (effectiveRole !== 'Student') return null;
    return projectGroups.find(pg => pg.students.some(s => s.studentId === user.id));
  }, [projectGroups, user, effectiveRole]);
  
  const projectsRequiringReviewIds = useMemo(() => {
    if (effectiveRole !== 'Advisor') return new Set<string>();
    
    const reviewIds = new Set<string>();
    projectGroups.forEach(pg => {
        if (pg.project.advisorName === user.name) {
             if (pg.project.status === ProjectStatus.Pending) {
                reviewIds.add(pg.project.projectId);
            } else if (pg.project.milestones?.some(m => m.status === MilestoneStatus.Submitted)) {
                reviewIds.add(pg.project.projectId);
            }
        }
    });
    return reviewIds;
  }, [effectiveRole, projectGroups, user.name]);

  const tourProps = useTour(
    effectiveRole === 'Student' && !studentProjectGroup ? 'student-welcome-tour' :
    effectiveRole === 'Advisor' && !selectedProject ? 'advisor-dashboard-tour' : null
  );

  const tourSteps = useMemo(() => {
      if (effectiveRole === 'Student' && !studentProjectGroup) return getStudentWelcomeTour(t);
      if (effectiveRole === 'Advisor' && !selectedProject) return getAdvisorDashboardTour(t);
      return [];
  }, [effectiveRole, studentProjectGroup, selectedProject, t]);


  const currentUserData = useMemo(() => {
    if (user.role === 'Student') {
        return students.find(s => s.studentId === user.id);
    }
    if (user.role === 'Advisor' || user.role === 'DepartmentAdmin') {
        return advisors.find(a => a.id === user.id);
    }
    return null;
  }, [user, students, advisors]);
  
  useEffect(() => {
    if (isPasswordChangeForced) {
        setIsProfileModalOpen(true);
    }
  }, [isPasswordChangeForced]);

  useEffect(() => {
    setSelectedProject(currentSelectedProject => {
        if (!currentSelectedProject) return null;
        const freshData = projectGroups.find(p => p.project.projectId === currentSelectedProject.project.projectId);
        if (!freshData) return null;
        if (JSON.stringify(freshData) !== JSON.stringify(currentSelectedProject)) return freshData;
        return currentSelectedProject;
    });
  }, [projectGroups]);
  
  useEffect(() => {
    setSelectedProject(null);
    setSearchQuery('');
    setAdvisorFilter('all');
    setActiveView('dashboard');
    setProjectHealth({});
    setSelectedProjectIds(new Set());
    setCurrentPage(1);
  }, [currentAcademicYear]);

  useEffect(() => {
    setActiveView('dashboard');
    setSelectedProject(null);
  }, [effectiveRole, user.role]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedProjectIds(new Set());
  }, [searchQuery, advisorFilter, genderFilter, majorFilter, statusFilter, scheduleFilter, similarityFilter]);

  const handleRegisterClick = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleOpenSuggester = () => setIsSuggesterOpen(true);

  const handleSelectSuggestedTopic = (topic: { lao: string; eng: string }) => {
    setSuggestedTopic(topic);
    setIsSuggesterOpen(false);
    setIsModalOpen(true);
  };

  const handleEditClick = (projectGroup: ProjectGroup) => {
    setEditingProject(projectGroup);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (projectGroup: ProjectGroup) => setProjectToDelete(projectGroup);
  
  const handleSelectProject = useCallback((projectGroup: ProjectGroup) => {
    setActiveView('projects');
    setSelectedProject(projectGroup);
  }, []);

  const handleUpdateStatus = useCallback((projectId: string, status: ProjectStatus) => {
    const groupToAction = projectGroups.find(pg => pg.project.projectId === projectId);
    if (!groupToAction) return;
    setProjectToAction({ project: groupToAction, action: status === 'Approved' ? 'approve' : 'reject' });
  }, [projectGroups]);
  
  const handleConfirmAdvisorAction = (details: { comment: string; transferTo?: string, templateId?: string }) => {
    if (!projectToAction) return;
    const { project, action } = projectToAction;
    if (action === 'reject' && details.transferTo) {
        transferProject(project.project.projectId, details.transferTo, user, details.comment);
        addToast({ type: 'info', message: t('projectTransferred').replace('${advisorName}', details.transferTo) });
    } else {
        const status = action === 'approve' ? ProjectStatus.Approved : ProjectStatus.Rejected;
        updateProjectStatus(project.project.projectId, status, user, { comment: details.comment.trim() ? details.comment : undefined, templateId: details.templateId });
        addToast({ type: action === 'approve' ? 'success' : 'info', message: action === 'approve' ? t('projectApproved') : t('projectRejected') });
    }
    setProjectToAction(null);
  };
  
  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.project.projectId);
      setProjectToDelete(null);
      setSelectedProject(null);
      addToast({ type: 'success', message: t('projectDeleted') });
    }
  };

  const cancelDelete = () => setProjectToDelete(null);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (editingProject && selectedProject) {
        const editedGroup = projectGroups.find(p => p.project.projectId === editingProject.project.projectId);
        if(editedGroup) setSelectedProject(editedGroup);
    }
    setEditingProject(null);
  }

  const handleConfirmNewYear = () => {
    onStartNewYear();
    setIsNewYearModalOpen(false);
  }
  
  const handleToggleReviewFilter = useCallback(() => {
    setSelectedProject(null);
    setIsReviewFilterActive(prev => !prev);
  }, []);

  const handleAnalyzeAllProjectsHealth = useCallback(async () => {
    if (!process.env.API_KEY || effectiveRole !== 'Advisor') return;
    setIsAnalyzingHealth(true);
    addToast({ type: 'info', message: t('aiHealthAnalysisStarted') });
    const advisorProjects = projectGroups.filter(pg => pg.project.advisorName === user.name);
    const newHealthData: Record<string, ProjectHealthStatus> = {};
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const schema = {
        type: Type.OBJECT,
        properties: {
            health: { type: Type.STRING, enum: ['On Track', 'Needs Attention', 'At Risk'] },
            summary: { type: Type.STRING },
            analysis: { type: Type.STRING }
        },
        required: ['health', 'summary', 'analysis']
    };
    for (const pg of advisorProjects) {
        try {
            const today = new Date(); today.setHours(0,0,0,0);
            const milestoneSummary = pg.project.milestones?.map(m => {
                const dueDate = new Date(m.dueDate);
                const overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
                return `- ${m.name}: status is ${m.status}, due ${m.dueDate}${overdueDays > 0 ? `, OVERDUE by ${overdueDays} days` : ''}.`;
            }).join('\n');
            const logSummary = (pg.project.log || []).slice(-5).map(l => `${formatTimeAgo(l.timestamp, t)}: ${l.authorName} (${l.authorRole}) - ${l.message}`).join('\n');
            const prompt = `Analyze the health of this university thesis project. Project: "${pg.project.topicEng}", Status: ${pg.project.status}, Milestone Summary:\n${milestoneSummary || 'No milestones.'}\nRecent Communication (last 5 entries):\n${logSummary || 'No recent communication.'}\nBased on the data, determine the project's health ('On Track', 'Needs Attention', 'or 'At Risk'). Provide a one-sentence summary and a brief analysis explaining your reasoning. Respond ONLY with a JSON object matching the schema.`;
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
            newHealthData[pg.project.projectId] = { ...JSON.parse(response.text), lastAnalyzed: new Date().toISOString() };
        } catch (error) {
            console.error(`AI health analysis failed for project ${pg.project.projectId}:`, error);
            newHealthData[pg.project.projectId] = { health: 'N/A', summary: t('analysisFailed'), analysis: '', lastAnalyzed: new Date().toISOString() };
        }
    }
    setProjectHealth(prev => ({ ...prev, ...newHealthData }));
    addToast({ type: 'success', message: t('aiHealthAnalysisComplete') });
    setIsAnalyzingHealth(false);
  }, [projectGroups, user, effectiveRole, addToast, t]);

  const handleAnalyzeSystemHealth = useCallback(async () => {
    if (!process.env.API_KEY || (effectiveRole !== 'Admin' && effectiveRole !== 'DepartmentAdmin')) return;
    setIsAnalyzingSystemHealth(true);
    addToast({ type: 'info', message: t('aiSystemHealthAnalysisStarted') });
    setSystemHealthIssues(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const advisorWorkload = allAdvisors.map(adv => ({ name: adv.name, supervising: `${allAdvisorProjectCounts[adv.name] || 0}/${adv.quota}`, mainCommittee: `${allCommitteeCounts[adv.id]?.main || 0}/${adv.mainCommitteeQuota}`, secondCommittee: `${allCommitteeCounts[adv.id]?.second || 0}/${adv.secondCommitteeQuota}`, thirdCommittee: `${allCommitteeCounts[adv.id]?.third || 0}/${adv.thirdCommitteeQuota}` }));
        const projectDataForAnalysis = allProjectGroups.map(pg => ({ id: pg.project.projectId, status: pg.project.status, advisor: pg.project.advisorName, hasMilestones: (pg.project.milestones || []).length > 0, lastActivity: pg.project.log?.[pg.project.log.length - 1]?.timestamp || pg.project.history[0]?.timestamp }));
        
        const assignedStudentIds = new Set(allProjectGroups.flatMap(pg => pg.students.map(s => s.studentId)));
        const unassignedStudents = allStudents.filter(s => s.status === 'Approved' && !assignedStudentIds.has(s.studentId)).map(s => ({ id: s.studentId, name: `${s.name} ${s.surname}`, major: s.major }));

        const prompt = `You are an AI system administrator analyzing the health of a thesis project management system. Analyze the provided JSON data for potential systemic issues. Today's date is ${new Date().toISOString().split('T')[0]}. Data:
- Advisors: ${JSON.stringify(advisorWorkload)}
- Projects: ${JSON.stringify(projectDataForAnalysis)}
- Unassigned Approved Students: ${JSON.stringify(unassignedStudents)}

Identify the following types of issues: 
1. 'Stale Project': Any 'Approved' project with no log activity for over 30 days from today.
2. 'Overloaded Advisor': Any advisor whose 'supervising' count exceeds their quota.
3. 'Workload Imbalance': Significant discrepancies in workload (supervising or committee duties) between advisors.
4. 'Students without Projects': Identify any students from the 'Unassigned Approved Students' list.
5. 'Projects without Milestones': Any 'Approved' project where 'hasMilestones' is false.

Respond ONLY with a JSON object containing a key "issues", which is an array of objects. Each issue object must have these keys: "type": string, "description": string, "recommendation": string, and optional arrays "relatedProjectIds", "relatedAdvisorNames", or "relatedStudentIds".`;
        
        const schema = { type: Type.OBJECT, properties: { issues: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['Stale Project', 'Overloaded Advisor', 'Workload Imbalance', 'Students without Projects', 'Projects without Milestones'] }, description: { type: Type.STRING }, recommendation: { type: Type.STRING }, relatedProjectIds: { type: Type.ARRAY, items: { type: Type.STRING } }, relatedAdvisorNames: { type: Type.ARRAY, items: { type: Type.STRING } }, relatedStudentIds: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['type', 'description', 'recommendation'] } } }, required: ['issues'] };
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
        const result = JSON.parse(response.text);
        setSystemHealthIssues(result.issues);
        addToast({ type: result.issues.length > 0 ? 'info' : 'success', message: result.issues.length > 0 ? t('foundSystemHealthIssues').replace('${count}', String(result.issues.length)) : t('noSystemHealthIssues') });
    } catch (error) {
        console.error("AI System Health Analysis failed:", error);
        addToast({ type: 'error', message: t('systemHealthAnalysisFailed') });
    } finally {
        setIsAnalyzingSystemHealth(false);
    }
  }, [allProjectGroups, allAdvisors, allStudents, allAdvisorProjectCounts, allCommitteeCounts, effectiveRole, addToast, t]);

  const handleAnalyzeSecurityAudit = useCallback(async () => {
    if (!process.env.API_KEY || (effectiveRole !== 'Admin' && effectiveRole !== 'DepartmentAdmin')) return;
    setIsAnalyzingSecurity(true);
    addToast({ type: 'info', message: t('aiSecurityAuditStarted') });
    setSecurityIssues(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const usersWithDefaultPassword = [...allStudents, ...allAdvisors]
            .filter(u => u.password === 'password123' || u.mustChangePassword)
            .map(u => ({ id: (u as Student).studentId || (u as Advisor).id, name: u.name }));

        const communicationSample = allProjectGroups
            .flatMap(pg => pg.project.log || [])
            .slice(-30)
            .map(log => ({ 
                projectId: allProjectGroups.find(pg => pg.project.log?.includes(log))?.project.projectId,
                authorId: log.authorId,
                authorName: log.authorName,
                message: log.message
            }));

        const prompt = `
            You are an AI security auditor for a university's project management system. Analyze the provided data for potential security issues.

            Data:
            - Users with default password risk: ${JSON.stringify(usersWithDefaultPassword)}
            - Recent communication sample: ${JSON.stringify(communicationSample)}

            Identify the following issue types:
            1. 'Weak Password': Any user in the 'Users with default password risk' list. The default password is known to be weak.
            2. 'Suspicious Activity': Look for patterns like repeated, nonsensical messages from the same user which could indicate spam.
            3. 'Inappropriate Content': Scan messages for unprofessional, offensive, or harassing language. Be conservative and flag only clear violations of academic conduct.

            Respond ONLY with a JSON object. The JSON object should have a key "issues", which is an array of objects. Each issue object must have these keys:
            - "type": string ('Weak Password', 'Suspicious Activity', 'Inappropriate Content')
            - "description": string (A clear, concise description of the issue.)
            - "recommendation": string (A brief, actionable recommendation.)
            - "relatedUserIds": (optional) array of strings
            - "relatedProjectIds": (optional) array of strings
        `;

        const schema = {
            type: Type.OBJECT,
            properties: {
                issues: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['Weak Password', 'Suspicious Activity', 'Inappropriate Content'] },
                            description: { type: Type.STRING },
                            recommendation: { type: Type.STRING },
                            relatedUserIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                            relatedProjectIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['type', 'description', 'recommendation']
                    }
                }
            },
            required: ['issues']
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        const result = JSON.parse(response.text);
        setSecurityIssues(result.issues);
        addToast({ type: result.issues.length > 0 ? 'info' : 'success', message: result.issues.length > 0 ? t('foundSecurityIssues').replace('${count}', String(result.issues.length)) : t('noSecurityIssues') });
    } catch (error) {
        console.error("AI Security Audit failed:", error);
        addToast({ type: 'error', message: t('securityAuditFailed') });
    } finally {
        setIsAnalyzingSecurity(false);
    }
  }, [allProjectGroups, allAdvisors, allStudents, effectiveRole, addToast, t]);

  const handleAnalyzeCommunication = useCallback(async (projectGroup: ProjectGroup) => {
    if (!process.env.API_KEY || !isAiAssistantEnabledForUser) {
        addToast({ type: 'error', message: t('aiFeatureNotConfigured') });
        return;
    }

    setIsAnalysisModalOpen(true);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const log = (projectGroup.project.log || []).filter(l => l.type === 'message').slice(-30);
        
        if (log.length < 5) {
            addToast({ type: 'info', message: t('notEnoughData') });
            throw new Error('Not enough data');
        }

        const prompt = `
            Act as an expert academic project manager. Analyze the following communication log from a student project.
            The project topic is "${projectGroup.project.topicEng}".
            The advisor is ${projectGroup.project.advisorName}.
            The students are ${projectGroup.students.map(s => s.name).join(', ')}.

            Log (last ${log.length} messages):
            ${JSON.stringify(log.map(l => ({ author: l.authorName, role: l.authorRole, message: l.message })))}

            Provide a comprehensive analysis ONLY in a JSON object format with the following keys:
            - "summary": A 2-3 sentence executive summary of the communication.
            - "actionItems": An array of strings identifying key tasks or decisions that need to be addressed.
            - "sentiment": A string ('Positive', 'Neutral', 'Needs Attention').
            - "sentimentTrend": A string ('Improving', 'Declining', 'Stable', 'Mixed').
            - "responseTime": A string analyzing the general response speed ('Prompt', 'Average', 'Delayed').
            - "feedbackClarity": A string analyzing the advisor's feedback ('Clear and Actionable', 'Mostly Clear', 'Needs Improvement').
            - "studentEngagement": A string analyzing student participation ('High', 'Moderate', 'Low').
            - "potentialIssues": An array of strings identifying any potential risks or conflicts (e.g., "Student A seems disengaged", "Advisor feedback was not addressed").
        `;
        
        const schema = { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, actionItems: { type: Type.ARRAY, items: { type: Type.STRING } }, sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Needs Attention'] }, sentimentTrend: { type: Type.STRING, enum: ['Improving', 'Declining', 'Stable', 'Mixed'] }, responseTime: { type: Type.STRING, enum: ['Prompt', 'Average', 'Delayed'] }, feedbackClarity: { type: Type.STRING, enum: ['Clear and Actionable', 'Mostly Clear', 'Needs Improvement'] }, studentEngagement: { type: Type.STRING, enum: ['High', 'Moderate', 'Low'] }, potentialIssues: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["summary", "actionItems", "sentiment", "sentimentTrend", "responseTime", "feedbackClarity", "studentEngagement", "potentialIssues"] };
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });

        setAnalysisResult(JSON.parse(response.text));
    } catch (error: any) {
        if (error.message !== 'Not enough data') {
            addToast({ type: 'error', message: t('couldNotGenerateAnalysis') });
        }
        setIsAnalysisModalOpen(false);
    } finally {
        setIsAnalyzing(false);
    }
  }, [isAiAssistantEnabledForUser, addToast, t]);

  const handleGrammarCheck = async (file: { fileId: string, name: string }) => {
    if (!process.env.API_KEY || !isAiAssistantEnabledForUser) {
        addToast({ type: 'error', message: t('aiFeatureNotConfigured') });
        return;
    }

    setIsWritingAssistantOpen(true);
    setIsCheckingGrammar(true);
    setGrammarResult(null);
    setWritingAssistantFile(file);
    setOriginalText('');

    try {
        // Try to get file from Backend API first
        const { getFile } = await import('../utils/fileStorage');
        let fileData: string | null = null;
        
        try {
            fileData = await getFile(file.fileId);
        } catch (apiError) {
            console.warn('Backend file fetch failed, trying localStorage:', apiError);
            fileData = localStorage.getItem(`file_${file.fileId}`);
        }
        
        if (!fileData) {
            addToast({ type: 'error', message: t('fileNotFound') });
            throw new Error('File not found');
        }

        // Handle URL or data URL
        let blob: Blob;
        if (fileData.startsWith('http')) {
            const response = await fetch(fileData);
            blob = await response.blob();
        } else if (fileData.startsWith('data:')) {
            const response = await fetch(fileData);
            blob = await response.blob();
        } else {
            // Assume it's a data URL
            const response = await fetch(fileData);
            blob = await response.blob();
        }
        
        const textFileTypes = ['text/plain', 'text/markdown', 'text/csv'];
        if (!blob.type.startsWith('text/') && !textFileTypes.includes(blob.type)) {
            addToast({ type: 'error', message: t('couldNotReadUnsupportedFile') });
            throw new Error('Unsupported file type');
        }

        const text = await blob.text();
        setOriginalText(text);

        if (!text.trim()) {
            addToast({ type: 'info', message: t('fileIsEmpty') });
            setGrammarResult({ summary: t('fileIsEmpty'), correctedText: ''});
            setIsCheckingGrammar(false);
            return;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            Act as an academic writing tutor. Analyze the following text for grammar, style, clarity, and academic tone.
            Provide a "summary" of the improvements and a "correctedText" with all corrections applied.
            Text:
            ---
            ${text}
            ---
            Respond ONLY with a JSON object matching the specified schema.
        `;

        const schema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "A summary of the improvements made." },
                correctedText: { type: Type.STRING, description: "The full text with corrections applied." }
            },
            required: ["summary", "correctedText"]
        };

        const aiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema },
        });

        const parsedResult = JSON.parse(aiResponse.text);

        if (parsedResult.correctedText.trim() === text.trim()) {
            parsedResult.summary = t('noChangesSuggested');
        }
        
        setGrammarResult(parsedResult);

    } catch (error: any) {
        console.error("Grammar check failed:", error);
        if (error.message !== 'File is empty' && error.message !== 'Unsupported file type' && error.message !== 'File not found') {
          addToast({ type: 'error', message: t('couldNotGenerateAnalysis') });
        }
        setGrammarResult(null);
    } finally {
        setIsCheckingGrammar(false);
    }
  };


  const selectedProjectsForBulkMessage = useMemo(() => {
    return Array.from(selectedProjectIds).map(id => projectGroups.find(pg => pg.project.projectId === id)).filter(Boolean) as ProjectGroup[];
  }, [selectedProjectIds, projectGroups]);
  
  const handleBulkMessageSend = (message: string) => {
    const entry: Omit<LogEntry, 'id' | 'timestamp' | 'file'> = {
        type: 'message',
        authorId: user.id,
        authorName: user.name,
        authorRole: effectiveRole,
        message: message,
    };
    bulkAddProjectLogEntries(Array.from(selectedProjectIds), entry);
    addToast({ type: 'success', message: t('bulkMessageSuccess') });
    setIsBulkMessageModalOpen(false);
    setSelectedProjectIds(new Set());
  };
  
  const sortedAndFilteredProjects = useMemo(() => {
      let projectsToDisplay = isReviewFilterActive ? 
          projectGroups.filter(pg => projectsRequiringReviewIds.has(pg.project.projectId)) : 
          projectGroups;

      if (searchQuery) {
          const lowercasedQuery = searchQuery.toLowerCase();
          projectsToDisplay = projectsToDisplay.filter(group =>
              group.project.projectId.toLowerCase().includes(lowercasedQuery) ||
              group.project.topicLao.toLowerCase().includes(lowercasedQuery) ||
              group.project.topicEng.toLowerCase().includes(lowercasedQuery) ||
              group.students.some(s => 
                  s.studentId.toLowerCase().includes(lowercasedQuery) ||
                  `${s.name} ${s.surname}`.toLowerCase().includes(lowercasedQuery)
              )
          );
      }
      
      if (advisorFilter !== 'all' && effectiveRole !== 'Advisor') {
          projectsToDisplay = projectsToDisplay.filter(group => group.project.advisorName === advisorFilter);
      }
      if (genderFilter !== 'all') projectsToDisplay = projectsToDisplay.filter(g => g.students.some(s => s.gender === genderFilter));
      if (majorFilter !== 'all') projectsToDisplay = projectsToDisplay.filter(g => g.students.some(s => s.major === majorFilter));
      if (statusFilter !== 'all') projectsToDisplay = projectsToDisplay.filter(g => g.project.status === statusFilter);
      const isScheduled = (pg: ProjectGroup) => !!(pg.project.defenseDate && pg.project.defenseTime && pg.project.defenseRoom);
      if (scheduleFilter !== 'all') projectsToDisplay = projectsToDisplay.filter(pg => scheduleFilter === 'scheduled' ? isScheduled(pg) : !isScheduled(pg));
      if (similarityFilter) projectsToDisplay = projectsToDisplay.filter(pg => !!pg.project.similarityInfo);

      // Sorting is now handled by DataGrid internally
      return projectsToDisplay;
  }, [projectGroups, searchQuery, advisorFilter, effectiveRole, isReviewFilterActive, projectsRequiringReviewIds, genderFilter, majorFilter, statusFilter, scheduleFilter, similarityFilter]);

  // Pagination is now handled by DataGrid internally

  const handleSelectProjectRow = (projectId: string) => {
    setSelectedProjectIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(projectId)) {
            newSet.delete(projectId);
        } else {
            newSet.add(projectId);
        }
        return newSet;
    });
  };

  const handleSelectAllProjects = () => {
    if (selectedProjectIds.size === sortedAndFilteredProjects.length) {
        setSelectedProjectIds(new Set());
    } else {
        setSelectedProjectIds(new Set(sortedAndFilteredProjects.map(p => p.project.projectId)));
    }
  };

  const renderCurrentView = () => {
    switch(activeView) {
      case 'dashboard':
        if (effectiveRole === 'Student') return studentProjectGroup ? <StudentDashboard user={user} projectGroup={studentProjectGroup} allProjectGroups={projectGroups} studentData={currentUserData as Student} announcements={announcements} onViewProject={() => setActiveView('projects')} notifications={userNotifications} onSelectNotification={(n) => { onMarkSingleNotificationAsRead(n.id); if(n.projectId) { const pg = projectGroups.find(p=>p.project.projectId === n.projectId); if(pg) handleSelectProject(pg); } }}/> : <StudentWelcome onRegisterClick={handleRegisterClick} onOpenSuggester={handleOpenSuggester} advisors={advisors} advisorProjectCounts={advisorProjectCounts} allProjects={projectGroups} announcements={announcements} user={user} onStartTour={tourProps.startTour} onSelectProject={handleSelectProject} majors={majors} />;
        if (effectiveRole === 'Advisor') return <AdvisorDashboard user={user} projectGroups={projectGroups} students={students} advisors={advisors} committeeCounts={committeeCounts} announcements={announcements} notifications={userNotifications} onSelectNotification={(n) => { onMarkSingleNotificationAsRead(n.id); if(n.projectId) { const pg = projectGroups.find(p=>p.project.projectId === n.projectId); if(pg) handleSelectProject(pg); } }} onSelectProject={handleSelectProject} onUpdateStatus={updateProjectStatus} updateDetailedScore={updateDetailedScore} addToast={addToast} scoringSettings={scoringSettings} onOpenAiAssistant={() => setIsChatOpen(true)} majors={majors} onNavigate={setActiveView} />;
        if (effectiveRole === 'Admin' || effectiveRole === 'DepartmentAdmin') return <AdminDashboard user={user as User & Partial<Advisor>} projectGroups={projectGroups} advisors={advisors} students={students} majors={majors} announcements={announcements} notifications={userNotifications} advisorProjectCounts={advisorProjectCounts} onViewProjects={(filter) => { if (filter === 'pending') setStatusFilter('Pending'); setActiveView('projects'); }} onSelectNotification={(n) => { onMarkSingleNotificationAsRead(n.id); if(n.projectId) { const pg = projectGroups.find(p=>p.project.projectId === n.projectId); if(pg) handleSelectProject(pg); } }} onNavigate={setActiveView} onSelectProject={handleSelectProject} onManageAdvisorProjects={(name) => { setAdvisorFilter(name); setActiveView('projects');}} onApproveStudent={updateStudent} addToast={addToast} defenseSettings={defenseSettings} scoringSettings={scoringSettings} milestoneTemplates={milestoneTemplates} classrooms={classrooms} />;
        return null;
      case 'projects':
        if (selectedProject) {
            return <ProjectDetailView 
              projectGroup={selectedProject} 
              user={user} 
              effectiveRole={effectiveRole}
              onBack={() => setSelectedProject(null)} 
              onEdit={handleEditClick}
              onDelete={handleDeleteRequest}
              onUpdateStatus={handleUpdateStatus}
              onUpdateMilestone={updateMilestone}
              onUpdateFinalSubmissions={updateFinalSubmissions}
              onReviewFinalSubmission={reviewFinalSubmission}
              onReorderMilestones={reorderMilestones}
              transferProject={transferProject}
              addProjectLogEntry={addProjectLogEntry}
              onAnalyzeCommunication={handleAnalyzeCommunication}
              onGrammarCheck={handleGrammarCheck}
              advisors={advisors}
              advisorProjectCounts={advisorProjectCounts}
              announcements={announcements}
              scoringSettings={scoringSettings}
              updateDetailedScore={updateDetailedScore}
              onOpenAssistant={() => setIsChatOpen(true)}
              majors={majors}
              allProjectGroups={allProjectGroups}
            />;
        }
        if (effectiveRole === 'Student' && studentProjectGroup) {
             return <ProjectDetailView 
              projectGroup={studentProjectGroup} 
              user={user} 
              effectiveRole={effectiveRole}
              onEdit={handleEditClick}
              onDelete={handleDeleteRequest}
              onUpdateStatus={handleUpdateStatus}
              onUpdateMilestone={updateMilestone}
              onUpdateFinalSubmissions={updateFinalSubmissions}
              onReviewFinalSubmission={reviewFinalSubmission}
              addProjectLogEntry={addProjectLogEntry}
              onAnalyzeCommunication={handleAnalyzeCommunication}
              onGrammarCheck={handleGrammarCheck}
              announcements={announcements}
              onOpenAssistant={() => setIsChatOpen(true)}
              allProjectGroups={allProjectGroups}
            />;
        }
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ProjectFilters 
              user={user}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              advisorFilter={advisorFilter}
              setAdvisorFilter={setAdvisorFilter}
              advisors={advisors}
              majors={majors}
              genderFilter={genderFilter}
              setGenderFilter={setGenderFilter}
              majorFilter={majorFilter}
              setMajorFilter={setMajorFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              scheduleFilter={scheduleFilter}
              setScheduleFilter={setScheduleFilter}
              similarityFilter={similarityFilter}
              setSimilarityFilter={setSimilarityFilter}
            />
            <ProjectTableEnhanced 
              user={user}
              effectiveRole={effectiveRole}
              projectGroups={sortedAndFilteredProjects} 
              onSelectProject={handleSelectProject}
              onRegisterClick={handleRegisterClick}
              onUpdateStatus={handleUpdateStatus}
              scoringSettings={scoringSettings}
              updateDetailedScore={updateDetailedScore}
              addToast={addToast}
              projectHealth={projectHealth}
              onOpenAiAssistant={() => setIsChatOpen(true)}
              selectedIds={selectedProjectIds}
              onSelect={handleSelectProjectRow}
              onSelectAll={handleSelectAllProjects}
              loading={false}
            />
            {/* Pagination is now handled by DataGrid internally */}
          </Box>
        );
      case 'students':
        return <Suspense fallback={<ComponentLoader />}><StudentManagement user={user} students={students} projectGroups={projectGroups} majors={majors} classrooms={classrooms} addStudent={addStudent} updateStudent={updateStudent} deleteStudent={deleteStudent} bulkAddOrUpdateStudents={bulkAddOrUpdateStudents} bulkUpdateStudents={bulkUpdateStudents} bulkDeleteStudents={bulkDeleteStudents} initialFilter={studentPageFilter} onFilterConsumed={() => setStudentPageFilter(undefined)} /></Suspense>;
      case 'advisors':
        return <Suspense fallback={<ComponentLoader />}><AdvisorManagement user={user} advisors={advisors} projectGroups={projectGroups} majors={majors} advisorProjectCounts={advisorProjectCounts} committeeCounts={committeeCounts} addAdvisor={addAdvisor} updateAdvisor={updateAdvisor} deleteAdvisor={deleteAdvisor} deleteAdvisors={deleteAdvisors} bulkAddOrUpdateAdvisors={bulkAddOrUpdateAdvisors} bulkUpdateAdvisors={bulkUpdateAdvisors} /></Suspense>;
      case 'deptAdmins':
        return <Suspense fallback={<ComponentLoader />}><DepartmentAdminManagement user={user} advisors={advisors} projectGroups={projectGroups} majors={majors} addAdvisor={addAdvisor} updateAdvisor={updateAdvisor} /></Suspense>;
      case 'majors':
        return <Suspense fallback={<ComponentLoader />}><MajorManagement majors={majors} students={students} classrooms={classrooms} projectGroups={projectGroups} addMajor={addMajor} updateMajor={updateMajor} deleteMajor={deleteMajor} /></Suspense>;
      case 'classrooms':
        return <Suspense fallback={<ComponentLoader />}><ClassroomManagement user={user} classrooms={classrooms} students={students} majors={majors} projectGroups={projectGroups} addClassroom={addClassroom} updateClassroom={updateClassroom} deleteClassroom={deleteClassroom} /></Suspense>;
      case 'milestoneTemplates':
        return <Suspense fallback={<ComponentLoader />}><MilestoneTemplateManagement templates={milestoneTemplates} addTemplate={addMilestoneTemplate} updateTemplate={updateMilestoneTemplate} deleteTemplate={deleteMilestoneTemplate} /></Suspense>;
      case 'submissions':
        return <Suspense fallback={<ComponentLoader />}><SubmissionsManagement projectGroups={projectGroups} /></Suspense>;
      case 'timeline':
        return <Suspense fallback={<ComponentLoader />}><ProjectTimeline projectGroups={projectGroups} /></Suspense>;
      case 'analytics':
        return <Suspense fallback={<ComponentLoader />}><AnalyticsDashboardEnhanced projectGroups={projectGroups} advisors={advisors} advisorProjectCounts={advisorProjectCounts} loading={false} /></Suspense>;
      case 'announcements':
        return <Suspense fallback={<ComponentLoader />}><AnnouncementsManagement announcements={announcements} user={user} addAnnouncement={addAnnouncement} updateAnnouncement={updateAnnouncement} deleteAnnouncement={deleteAnnouncement} /></Suspense>;
      case 'committees':
        return <Suspense fallback={<ComponentLoader />}><CommitteeManagement projectGroups={projectGroups} advisors={advisors} majors={majors} user={user} committeeCounts={committeeCounts} updateProjectCommittee={updateProjectCommittee} updateProjectDefenseSchedule={updateProjectDefenseSchedule} onSelectProject={handleSelectProject} defenseSettings={defenseSettings} bulkUpdateSchedules={bulkUpdateSchedules} autoScheduleDefenses={autoScheduleDefenses} clearAllSchedulesAndCommittees={clearAllSchedulesAndCommittees} onNavigate={setActiveView}/></Suspense>;
      case 'scoring':
        return <Suspense fallback={<ComponentLoader />}><ScoringManagement projectGroups={projectGroups} scoringSettings={scoringSettings} onSelectProject={handleSelectProject} advisors={advisors} /></Suspense>;
      case 'finalGrades':
        return <Suspense fallback={<ComponentLoader />}><FinalProjectManagement projectGroups={projectGroups} advisors={advisors} updateProjectGrade={updateProjectGrade} /></Suspense>;
      case 'settings':
        return <Suspense fallback={<ComponentLoader />}><SettingsPage defenseSettings={defenseSettings} majors={majors} advisors={advisors} updateDefenseSettings={updateDefenseSettings} autoScheduleDefenses={autoScheduleDefenses} scoringSettings={scoringSettings} updateScoringSettings={updateScoringSettings} /></Suspense>;
      case 'calendar':
        return <Suspense fallback={<ComponentLoader />}><CalendarView projectGroups={projectGroups} user={user} advisors={advisors} onSelectProject={handleSelectProject} /></Suspense>;
       case 'reporting':
        return <Suspense fallback={<ComponentLoader />}><ReportingPage projectGroups={projectGroups} advisors={advisors} students={students} majors={majors} classrooms={classrooms} committeeCounts={committeeCounts} /></Suspense>;
      case 'aiTools':
        return <Suspense fallback={<ComponentLoader />}><AiToolsPage user={user} projectGroups={projectGroups} advisors={advisors} students={students} majors={majors} advisorProjectCounts={advisorProjectCounts} systemHealthIssues={systemHealthIssues} isAnalyzingSystemHealth={isAnalyzingSystemHealth} onRunSystemHealthAnalysis={handleAnalyzeSystemHealth} securityIssues={securityIssues} isAnalyzingSecurity={isAnalyzingSecurity} onRunSecurityAudit={handleAnalyzeSecurityAudit} /></Suspense>;
       case 'notifications':
        return <Suspense fallback={<ComponentLoader />}><NotificationsPage notifications={userNotifications} onSelectNotification={(n) => { onMarkSingleNotificationAsRead(n.id); if(n.projectId) { const pg = projectGroups.find(p=>p.project.projectId === n.projectId); if(pg) handleSelectProject(pg); } else { setActiveView('dashboard'); } }} onMarkAllRead={() => onMarkNotificationsAsRead(user.id)} /></Suspense>;
      default:
        return <Box>{t('pageNotFound')}</Box>;
    }
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, lg: 4 }, maxWidth: '1280px', mx: 'auto' }}>
      <Header
        user={user}
        effectiveRole={effectiveRole}
        onSwitchRole={onSwitchRole}
        onRegisterClick={handleRegisterClick}
        onLogout={onLogout}
        onExportCsv={() => {}}
        onExportExcel={() => {}}
        activeView={activeView}
        onNavigate={(view) => { setActiveView(view); setSelectedProject(null); }}
        currentAcademicYear={currentAcademicYear}
        availableYears={availableYears}
        onYearChange={onYearChange}
        onStartNewYear={() => setIsNewYearModalOpen(true)}
        notifications={userNotifications}
        projectsToReviewCount={projectsRequiringReviewIds.size}
        isReviewFilterActive={isReviewFilterActive}
        onToggleReviewFilter={handleToggleReviewFilter}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSelectNotification={(n) => { onMarkSingleNotificationAsRead(n.id); if(n.projectId) { const pg = projectGroups.find(p=>p.project.projectId === n.projectId); if(pg) handleSelectProject(pg); } else {setActiveView('dashboard');} }}
        onMarkNotificationsAsRead={() => onMarkNotificationsAsRead(user.id)}
      />
      <Box component="main" sx={{ mt: 3 }}>
        {renderCurrentView()}
      </Box>
      {isModalOpen && <Suspense fallback={<ComponentLoader />}><RegisterProjectModal onClose={handleCloseModal} onAddProject={addProject} onUpdateProject={updateProject} advisors={advisors} advisorProjectCounts={advisorProjectCounts} allProjects={projectGroups} allStudents={students} majors={majors} user={user} projectToEdit={editingProject} currentAcademicYear={currentAcademicYear} suggestedTopic={suggestedTopic} onSuggestionUsed={() => setSuggestedTopic(null)} /></Suspense>}
      {projectToDelete && <ConfirmationModal isOpen={!!projectToDelete} onClose={cancelDelete} onConfirm={confirmDelete} title={t('deleteProjectTitle')} message={t('deleteProjectConfirmation').replace('${topic}', projectToDelete.project.topicEng)} />}
      {projectToAction && <Suspense fallback={<ComponentLoader />}><AdvisorActionModal isOpen={!!projectToAction} onClose={() => setProjectToAction(null)} onConfirm={handleConfirmAdvisorAction} projectGroup={projectToAction.project} action={projectToAction.action} advisors={advisors} advisorProjectCounts={advisorProjectCounts} currentAdvisorName={user.name} milestoneTemplates={milestoneTemplates} majors={majors} /></Suspense>}
      {isNewYearModalOpen && <ConfirmationModal isOpen={isNewYearModalOpen} onClose={() => setIsNewYearModalOpen(false)} onConfirm={handleConfirmNewYear} title={t('confirmStartNewYear')} message={t('newYearConfirmation').replace('${year}', String(parseInt(currentAcademicYear, 10) + 1))} confirmButtonColor="primary" confirmText={t('startNewYear')} />}
      {isProfileModalOpen && <Suspense fallback={<ComponentLoader />}><ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={user} userData={currentUserData} onUpdateStudent={updateStudent} onUpdateAdvisor={updateAdvisor} allAdvisors={advisors} studentProjectGroup={studentProjectGroup} allProjectGroups={projectGroups} isPasswordChangeForced={!!isPasswordChangeForced} onPasswordChanged={onPasswordChanged}/></Suspense>}
      <TourGuide {...tourProps} tourSteps={tourSteps} />
      {isSuggesterOpen && currentUserData && <Suspense fallback={<ComponentLoader />}><TopicSuggesterModal onClose={() => setIsSuggesterOpen(false)} onSelectTopic={handleSelectSuggestedTopic} student={currentUserData as Student} majors={majors} /></Suspense>}
      {isAiAssistantEnabledForUser && isChatOpen && <Suspense fallback={<ComponentLoader />}><AiChatWidget user={user} onClose={() => setIsChatOpen(false)} studentProjectGroup={studentProjectGroup} allProjects={projectGroups} allAdvisors={advisors} allStudents={students} /></Suspense>}
      {isAiAssistantEnabledForUser && !isChatOpen && activeView !== 'dashboard' && (
          <Fab 
            onClick={() => setIsChatOpen(true)} 
            color="secondary"
            aria-label="Open AI Assistant"
            sx={{ 
              position: 'fixed', 
              bottom: { xs: 24, sm: 32 }, 
              right: { xs: 24, sm: 32 }, 
              zIndex: 40,
              bgcolor: '#9333ea',
              '&:hover': {
                bgcolor: '#7e22ce',
                transform: 'scale(1.1)'
              },
              transition: 'transform 0.2s'
            }}
          >
            <SparklesIconMui />
          </Fab>
      )}
      {selectedProjectIds.size > 0 && <BulkActionsBar selectedCount={selectedProjectIds.size} onClear={() => setSelectedProjectIds(new Set())} onSendMessage={() => setIsBulkMessageModalOpen(true)} />}
      {isBulkMessageModalOpen && <Suspense fallback={<ComponentLoader />}><BulkMessageModal isOpen={isBulkMessageModalOpen} onClose={() => setIsBulkMessageModalOpen(false)} onSend={handleBulkMessageSend} selectedProjects={selectedProjectsForBulkMessage} user={user} /></Suspense>}
      {isAnalysisModalOpen && <Suspense fallback={<ComponentLoader />}><CommunicationAnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} result={analysisResult} isLoading={isAnalyzing} /></Suspense>}
      {isWritingAssistantOpen && <Suspense fallback={<ComponentLoader />}><AiWritingAssistantModal isOpen={isWritingAssistantOpen} onClose={() => setIsWritingAssistantOpen(false)} isLoading={isCheckingGrammar} result={grammarResult} fileName={writingAssistantFile?.name || ''} originalText={originalText} /></Suspense>}
    </Box>
  );
};

export default HomePage;