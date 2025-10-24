export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Monk = 'Monk',
}

export enum ProjectStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export enum MilestoneStatus {
  Pending = 'Pending',
  Submitted = 'Submitted',
  Approved = 'Approved',
  RequiresRevision = 'Requires Revision',
}

export enum FinalSubmissionStatus {
  Submitted = 'Submitted',
  Approved = 'Approved',
  RequiresRevision = 'Requires Revision',
}

export interface FileUploadPayload {
  name: string;
  type: string;
  size: number;
  dataUrl: string; // base64 encoded file
}

export interface SubmittedFile {
  fileId: string;
  name: string;
  type: string;
  size: number;
}

export interface FinalSubmissionFile extends SubmittedFile {
  submittedAt: string; // ISO 8601 format
  status: FinalSubmissionStatus;
  feedback?: string | null;
  approvedAt?: string | null;
}

export interface FinalSubmissions {
  preDefenseFile: FinalSubmissionFile | null;
  postDefenseFile: FinalSubmissionFile | null;
}

export interface Milestone {
  id: string;
  name: string;
  status: MilestoneStatus;
  dueDate: string; // ISO 8601 format
  submittedDate: string | null;
  feedback: string | null;
  submittedFile: SubmittedFile | null;
}

export interface MilestoneTask {
  id: string;
  name: string;
  durationDays: number;
}

export interface MilestoneTemplate {
  id: string;
  name: string;
  description: string;
  tasks: MilestoneTask[];
}

export type Role = 'Admin' | 'Advisor' | 'Student' | 'DepartmentAdmin';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface Student {
  studentId: string;
  gender: Gender;
  name: string;
  surname: string;
  major: string;
  classroom: string;
  tel: string;
  email: string;
  status: 'Pending' | 'Approved';
  password?: string;
  mustChangePassword?: boolean;
  isAiAssistantEnabled?: boolean;
}

export interface Advisor {
  id:string;
  name: string;
  quota: number;
  mainCommitteeQuota: number;
  secondCommitteeQuota: number;
  thirdCommitteeQuota: number;
  specializedMajorIds: string[];
  isDepartmentAdmin?: boolean;
  password?: string;
  mustChangePassword?: boolean;
  isAiAssistantEnabled?: boolean;
}

export interface StatusHistoryItem {
  status: ProjectStatus;
  timestamp: string; // ISO 8601 format
  actorName: string;
  comment: string;
}

export interface SimilarityInfo {
  similarProjectId: string;
  similarityPercentage: number;
  reason: string;
}

export interface LogEntry {
  id: string; // uuid
  type: 'message' | 'event';
  authorId: string;
  authorName: string;
  authorRole: Role;
  timestamp: string; // ISO 8601 format
  message: string;
  file?: SubmittedFile | null;
}

export interface Project {
  projectId: string;
  topicLao: string;
  topicEng: string;
  advisorName: string;
  comment: string;
  status: ProjectStatus;
  history: StatusHistoryItem[];
  milestones?: Milestone[];
  similarityInfo?: SimilarityInfo | null;
  finalSubmissions?: FinalSubmissions;
  mainCommitteeId: string | null;
  secondCommitteeId: string | null;
  thirdCommitteeId: string | null;
  defenseDate: string | null;
  defenseTime: string | null;
  defenseRoom: string | null;
  finalGrade: string | null;
  mainAdvisorScore: number | null;
  mainCommitteeScore: number | null;
  secondCommitteeScore: number | null;
  thirdCommitteeScore: number | null;
  log?: LogEntry[];
  detailedScores: Record<string, Record<string, number>> | null;
}

export interface ProjectGroup {
  project: Project;
  students: Student[];
}

export interface Major {
  id: string;
  name: string;
  abbreviation: string;
}

export type NotificationType = 'Submission' | 'Approval' | 'Feedback' | 'Mention' | 'Message' | 'System';

export interface NotificationAction {
  label: string;
  action: string; 
}

export interface Notification {
  id: string;
  timestamp: string; // ISO 8601 format
  title?: string; // A brief, clear title for the notification.
  message: string;
  read: boolean;
  userIds: string[]; // IDs of users this notification is for
  projectId: string; // To link to the relevant project
  type: NotificationType;
  actions?: NotificationAction[];
}

export interface Classroom {
  id: string;
  name: string;
  majorId: string;
  majorName: string;
}

export type AnnouncementAudience = 'All' | 'Students' | 'Advisors';

export interface Announcement {
  id: string;
  title: string;
  content: string; // Markdown content
  audience: AnnouncementAudience;
  authorName: string;
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

export interface DefenseRoom {
  id: string;
  name: string;
  majorIds: string[]; // List of major IDs allowed in this room. Empty means all are allowed.
}

export interface DefenseSettings {
  startDefenseDate: string; // YYYY-MM-DD
  timeSlots: string; // Comma-separated "HH:mm-HH:mm"
  rooms: DefenseRoom[];
  stationaryAdvisors: Record<string, string | null>; // roomId -> advisorId
  timezone: string; // IANA timezone name e.g., 'Asia/Bangkok'
}

export interface GradeBoundary {
    grade: string;
    minScore: number;
}

export interface ScoringRubricItem {
  id: string;
  name: string;
  maxScore: number;
}

export interface ScoringSettings {
  mainAdvisorWeight: number; // e.g., 60
  committeeWeight: number; // e.g., 40
  gradeBoundaries: GradeBoundary[];
  advisorRubrics: ScoringRubricItem[];
  committeeRubrics: ScoringRubricItem[];
}

export interface GeneralSettings {
  // isAiAssistantEnabled is now managed per-user
}

export type ProjectHealth = 'On Track' | 'Needs Attention' | 'At Risk' | 'N/A';

export interface ProjectHealthStatus {
  health: ProjectHealth;
  summary: string;
  analysis: string;
  lastAnalyzed: string; // ISO timestamp
}

export interface SystemHealthIssue {
  type: 'Stale Project' | 'Overloaded Advisor' | 'Workload Imbalance' | 'Students without Projects' | 'Projects without Milestones';
  description: string;
  recommendation: string;
  relatedProjectIds?: string[];
  relatedAdvisorNames?: string[];
  relatedStudentIds?: string[];
}

export interface SystemSecurityIssue {
  type: 'Weak Password' | 'Suspicious Activity' | 'Inappropriate Content';
  description: string;
  recommendation: string;
  relatedUserIds?: string[];
  relatedProjectIds?: string[];
}

export interface MilestoneReviewItem {
  projectGroupId: string;
  milestoneName: string;
  studentNames: string;
}

export type MilestoneUpdatePayload = {
    status?: MilestoneStatus;
    feedback?: string | null;
    submittedFile?: FileUploadPayload;
    dueDate?: string;
};

export interface PlagiarismMatch {
  source: string;
  similarity: number;
  matchedSnippet: string;
}

export interface PlagiarismResult {
  overallSimilarityScore: number;
  potentialMatches: PlagiarismMatch[];
}

export interface GrammarCheckResult {
  summary: string;
  correctedText: string;
}

export interface CommunicationAnalysisResult {
  summary: string;
  actionItems: string[];
  sentiment: 'Positive' | 'Neutral' | 'Needs Attention';
  sentimentTrend: 'Improving' | 'Declining' | 'Stable' | 'Mixed';
  responseTime: 'Prompt' | 'Average' | 'Delayed';
  feedbackClarity: 'Clear and Actionable' | 'Mostly Clear' | 'Needs Improvement';
  studentEngagement: 'High' | 'Moderate' | 'Low';
  potentialIssues: string[];
}

export interface AdvisorSuggestion {
    advisorName: string;
    matchScore: number;
    reasoning: string;
    specializedMajors: string;
    currentWorkload: string;
}

export interface StudentSkills {
  skill: string;
  justification: string;
}

export interface StudentSkillsAnalysis {
  summary: string;
  skills: StudentSkills[];
}

export interface CareerPathSuggestion {
  path: string;
  reasoning: string;
}

export interface AdvisorMentoringAnalysis {
  style: string;
  summary: string;
  strengths: string[];
  suggestionsForImprovement: string[];
}