import { useState, useCallback, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { ProjectGroup, Student, Gender, Advisor, Project, ProjectStatus, StatusHistoryItem, User, Major, Classroom, Milestone, MilestoneStatus, Notification, MilestoneTemplate, MilestoneTask, Announcement, AnnouncementAudience, SubmittedFile, FileUploadPayload, FinalSubmissionFile, FinalSubmissionStatus, DefenseSettings, ScoringSettings, GradeBoundary, DefenseRoom, ScoringRubricItem, LogEntry, Role, NotificationType, MilestoneUpdatePayload, GeneralSettings, FinalSubmissions } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ToastMessage } from '../context/ToastContext';
import { useTranslations } from './useTranslations';

// --- Templates and Initial Data (No changes here) ---
export const initialMilestoneTemplates: MilestoneTemplate[] = [
    {
        id: 'TPL01',
        name: 'Standard 5-Chapter Final Project',
        description: 'A standard template for research-based projects with five chapters.',
        tasks: [
            { id: 'TSK01', name: 'Chapter 1: Introduction', durationDays: 30 },
            { id: 'TSK02', name: 'Chapter 2: Literature Review', durationDays: 30 },
            { id: 'TSK03', name: 'Chapter 3: Methodology', durationDays: 30 },
            { id: 'TSK04', name: 'Results & Discussion', durationDays: 30 },
            { id: 'TSK05', name: 'Chapter 5: Conclusion & Defense Prep', durationDays: 30 },
        ]
    },
    {
        id: 'TPL02',
        name: 'Software Development Project',
        description: 'A template for software engineering projects focusing on development cycles.',
        tasks: [
            { id: 'TSK01', name: 'Requirement Analysis & Design Document', durationDays: 25 },
            { id: 'TSK02', name: 'Prototype/Alpha Version Submission', durationDays: 40 },
            { id: 'TSK03', name: 'Beta Version & Testing Report', durationDays: 45 },
            { id: 'TSK04', name: 'Final Version & User Manual', durationDays: 30 },
            { id: 'TSK05', name: 'Project Defense', durationDays: 20 },
        ]
    }
];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];
const studentFirstNames = ['Thongchai', 'Soudalath', 'Ketsana', 'Bounthanh', 'Anousone', 'Vilayphone', 'Phonexay', 'Sompasong', 'Latsamy', 'Phouthone', 'Chinda', 'Vansy', 'Pany', 'Somsanouk', 'Dalavanh', 'Amphone', 'Khamla', 'Maly', 'Souksanh', 'Phasouk', 'Vilakone', 'Chansamone', 'Seng-aloun', 'Khamphou', 'Bounma', 'Vanida', 'Somchit', 'Nalee', 'Sitthixay', 'Phoumy'];
const studentSurnames = ['Vongvilay', 'Phommasone', 'Inthavong', 'Sihalath', 'Chanthavong', 'Douangphachanh', 'Siphanthong', 'Phanthavong', 'Saysanavong', 'Keobounphanh', 'Souvannavong', 'Pholsena', 'Rattanakone', 'Sipasert', 'Vorachith', 'Phomvihane', 'Thammavongsa', 'Insisiengmay', 'Chaleunsouk', 'Phengphachan'];
const projectSystemTypesLao = ['ການວິເຄາະກົນລະຍຸດ', 'ການພັດທະນາແຜນທຸລະກິດ', 'ລະບົບการຈັດການລູກຄ້າສຳພັນ', 'ແພລດຟອມการຕະຫຼາດດິຈິຕອນ', 'การສຶກສາความເປັນໄປໄດ້ຂອງໂຄງການ', 'ການວິໄຈຕະຫຼາດ'];
const projectSystemTypesEng = ['Strategic Analysis of', 'Business Plan Development for', 'CRM System for', 'Digital Marketing Platform for', 'Feasibility Study for', 'Market Research on'];
const projectDomainsLao = ['ຂະແໜງการຄິດໄລ່', 'ອຸດສາຫະກຳการບໍລິການ', 'ທຸລະກິດສົ່ງອອກ', 'ສະຕາດອັບເຕັກໂນໂລຊີ', 'ວິສາຫະກິດເພື່ອສັງຄົມ', 'ແຟຣນໄຊອາຫານ ແລະ ເຄື່ອງດື່ມ', 'ການທ່ອງທ່ຽວແບບນິເວດ'];
const projectDomainsEng = ['the Retail Sector', 'the Hospitality Industry', 'an Export Business', 'a Tech Startup', 'a Social Enterprise', 'a Food & Beverage Franchise', 'Eco-Tourism'];
const projectFocusesLao = ['ໂດຍໃຊ້ SWOT Analysis', 'ໂດຍເນັ້ນໃສ່ Social Media', 'ໂດຍໃຊ້ E-commerce', 'ຕາມ BCG Matrix', 'ໂດຍເປົ້າໝາຍໃສ່ກຸ່ມ Millennial', 'ເພື່ອการขะຫຍາຍຕົວສູ່ສາກົນ'];
const projectFocusesEng = ['using SWOT Analysis', 'with a focus on Social Media', 'leveraging E-commerce', 'based on the BCG Matrix', 'targeting Millennial Consumers', 'for International Expansion'];
const hardcodedAdvisorsData = [
  { name: 'Ms. Souphap', isDepartmentAdmin: true }, { name: 'Assoc. Prof. Phayvanh', isDepartmentAdmin: false }, { name: 'Ms. Phetsamone', isDepartmentAdmin: false }, { name: 'Ms. Bounmy', isDepartmentAdmin: false }, { name: 'Assoc. Prof. Phonesavanh', isDepartmentAdmin: false }, { name: 'Assoc. Prof. Bounmy', isDepartmentAdmin: false }, { name: 'Mr. Bounpheng', isDepartmentAdmin: false }, { name: 'Dr. Chanthone', isDepartmentAdmin: false }, { name: 'Ms. Sengdeuane', isDepartmentAdmin: false }, { name: 'Ms. Daovong', isDepartmentAdmin: false }, { name: 'Dr. Bounthavy', isDepartmentAdmin: false }, { name: 'Dr. Somphone', isDepartmentAdmin: false }, { name: 'Mr. Bounmy', isDepartmentAdmin: false }, { name: 'Prof. Phaythoune', isDepartmentAdmin: true }, { name: 'Dr. Malee', isDepartmentAdmin: false }, { name: 'Ms. Khammany', isDepartmentAdmin: false }, { name: 'Dr. Aloun', isDepartmentAdmin: false }, { name: 'Mr. Bounthavy', isDepartmentAdmin: false }, { name: 'Ms. Phayvanh', isDepartmentAdmin: false },
];
const newAdvisors: Advisor[] = hardcodedAdvisorsData.map((adv, index) => ({ id: `A${String(index + 1).padStart(2, '0')}`, name: adv.name, quota: adv.isDepartmentAdmin ? 4 : 3, mainCommitteeQuota: adv.isDepartmentAdmin ? 4 : 3, secondCommitteeQuota: adv.isDepartmentAdmin ? 4 : 3, thirdCommitteeQuota: adv.isDepartmentAdmin ? 4 : 3, specializedMajorIds: [], isDepartmentAdmin: adv.isDepartmentAdmin, password: 'password123', isAiAssistantEnabled: true, }));
export const initialMajors: Major[] = [ { id: 'M01', name: 'Business Administration (IBM)', abbreviation: 'IBM' }, { id: 'M02', name: 'Business Administration (BM)', abbreviation: 'BM' }, { id: 'M03', name: 'Business Administration (Continuing) (BMC)', abbreviation: 'BMC' }, { id: 'M04', name: 'Marketing (MK)', abbreviation: 'MK' }, ];
export const initialClassrooms: Classroom[] = [ { id: 'C01', name: 'IBM-4A', majorId: 'M01', majorName: 'Business Administration (IBM)' }, { id: 'C02', name: 'IBM-4B', majorId: 'M01', majorName: 'Business Administration (IBM)' }, { id: 'C03', name: 'BM-4A', majorId: 'M02', majorName: 'Business Administration (BM)' }, { id: 'C04', name: 'BM-4B', majorId: 'M02', majorName: 'Business Administration (BM)' }, { id: 'C05', name: 'BMC-2A', majorId: 'M03', majorName: 'Business Administration (Continuing) (BMC)' }, { id: 'C06', name: 'MK-4A', majorId: 'M04', majorName: 'Marketing (MK)' }, { id: 'C07', name: 'MK-4B', majorId: 'M04', majorName: 'Marketing (MK)' }, ];
const ibmMajorId = 'M01';
const otherMajorIds = ['M02', 'M03', 'M04'];
const souphap = newAdvisors.find(a => a.name === 'Ms. Souphap');
if (souphap) souphap.specializedMajorIds = [ibmMajorId];
const phaythoune = newAdvisors.find(a => a.name === 'Prof. Phaythoune');
if (phaythoune) phaythoune.specializedMajorIds = otherMajorIds;
const nonAdminAdvisors = newAdvisors.filter(a => !a.isDepartmentAdmin);
const ibmAdvisorsCount = 6;
nonAdminAdvisors.forEach((adv, index) => { if (index < ibmAdvisorsCount) { adv.specializedMajorIds = [ibmMajorId]; } else { adv.specializedMajorIds = otherMajorIds; } });
const ibmAdvisors = newAdvisors.filter(a => a.specializedMajorIds.includes(ibmMajorId));
const otherAdvisors = newAdvisors.filter(a => !a.specializedMajorIds.includes(ibmMajorId));
// NOTE: Mock data generation is disabled - using real data from backend API instead
// If you need mock data for testing, uncomment the functions below
/*
const generateStudents = (count: number): Student[] => { const students: Student[] = []; for (let i = 0; i < count; i++) { const classroom = randomElement(initialClassrooms); students.push({ studentId: `155N${String(1000 + i).padStart(4, '0')}/21`, gender: randomElement([Gender.Male, Gender.Female, Gender.Monk]), name: randomElement(studentFirstNames), surname: randomElement(studentSurnames), major: classroom.majorName, classroom: classroom.name, tel: `020-555-${randomInt(1000, 9999)}`, email: `student${i}@university.edu`, status: 'Approved', password: 'password123', isAiAssistantEnabled: true, }); } return students; };
const generateProjectGroups = (distribution: Record<string, number>): ProjectGroup[] => { const projectGroups: ProjectGroup[] = []; let localStudentPool = [...initialStudents]; let projectCounter = 0; const advisorCounts: Record<string, number> = {}; newAdvisors.forEach(adv => advisorCounts[adv.name] = 0); for (const [majorId, count] of Object.entries(distribution)) { const major = initialMajors.find(m => m.id === majorId)!; let majorStudents = localStudentPool.filter(s => s.major === major.name); const specializedAdvisors = majorId === 'M01' ? ibmAdvisors : otherAdvisors; for (let i = 0; i < count; i++) { if (majorStudents.length === 0) { console.warn(`Ran out of students for major ${major.name} while generating projects.`); break; } const studentsInGroup: Student[] = []; const student1 = majorStudents.pop()!; studentsInGroup.push(student1); localStudentPool = localStudentPool.filter(s => s.studentId !== student1.studentId); if (Math.random() < 0.4 && majorStudents.length > 0) { const student2 = majorStudents.pop()!; studentsInGroup.push(student2); localStudentPool = localStudentPool.filter(s => s.studentId !== student2.studentId); } let availableSpecialized = specializedAdvisors.filter(adv => advisorCounts[adv.name] < adv.quota); let advisor: Advisor | undefined; if (availableSpecialized.length > 0) { advisor = randomElement(availableSpecialized); } else { const anyAvailable = newAdvisors.filter(adv => advisorCounts[adv.name] < adv.quota); if (anyAvailable.length > 0) { advisor = randomElement(anyAvailable); console.warn(`No specialized advisors with quota for major ${major.name}. Using any available advisor: ${advisor.name}`); } } if (!advisor) { console.error("Could not find an available advisor. Halting project generation for this major."); break; } const topicEng = `${randomElement(projectSystemTypesEng)} ${randomElement(projectDomainsEng)} ${randomElement(projectFocusesEng)}`; const topicLao = `${randomElement(projectSystemTypesLao)} ${randomElement(projectDomainsLao)} ${randomElement(projectFocusesLao)}`; const status = randomElement([ProjectStatus.Approved, ProjectStatus.Approved, ProjectStatus.Pending, ProjectStatus.Pending, ProjectStatus.Rejected]); const actorName = studentsInGroup[0].name; const project: Project = { projectId: `P24${String(projectCounter + 1).padStart(3, '0')}`, topicLao: topicLao, topicEng: topicEng, advisorName: advisor.name, comment: 'Initial submission.', status: status, history: [{ status: ProjectStatus.Pending, timestamp: '2024-07-28T10:00:00Z', actorName: actorName, comment: 'Project created and submitted.' }], milestones: [], similarityInfo: null, finalSubmissions: { preDefenseFile: null, postDefenseFile: null }, mainCommitteeId: null, secondCommitteeId: null, thirdCommitteeId: null, defenseDate: null, defenseTime: null, defenseRoom: null, finalGrade: null, mainAdvisorScore: null, mainCommitteeScore: null, secondCommitteeScore: null, thirdCommitteeScore: null, log: [], detailedScores: null, }; projectGroups.push({ project, students: studentsInGroup }); if (status !== ProjectStatus.Rejected) { advisorCounts[advisor.name]++; } projectCounter++; } } return projectGroups; };
const distribution = { 'M01': 25, 'M02': 15, 'M03': 5, 'M04': 14 };
*/

// Use empty arrays - data will be loaded from backend API
export const initialStudents: Student[] = [];
export const initialAdvisors = newAdvisors;
export const initialProjectGroups: ProjectGroup[] = [];
export const initialAnnouncements: Announcement[] = [ { id: 'ANN01', title: 'Welcome to the New Academic Year!', content: 'Welcome everyone to the **2024 academic year**. Please ensure your personal information is up-to-date and start thinking about your final project topics. Good luck!', audience: 'All', authorName: 'Admin', createdAt: '2024-08-01T09:00:00Z', updatedAt: '2024-08-01T09:00:00Z', } ];


// --- HYBRID API LAYER (Backend with localStorage Fallback) ---
// This object attempts to use a backend first, but falls back to localStorage if the backend is unavailable.
// Use proxy in development, direct URL in production
const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:8000';
// Ensure no trailing slash to prevent double slashes
const cleanAPIBaseURL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

const api = {
  // GET all data for a year
  getAllDataForYear: async (year: string) => {
    try {
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const url = cleanAPIBaseURL ? `${cleanAPIBaseURL}/api/data/${year}/` : `/api/data/${year}/`;
        const response = await fetch(url, {
            method: 'GET',
            headers,
        });
        if (!response.ok) throw new Error(`Backend not available: ${response.statusText}`);
        const data = await response.json();
        // Sync with localStorage
        Object.keys(data).forEach(key => {
            if (data[key]) localStorage.setItem(`${key}_${year}`, JSON.stringify(data[key]));
        });
        return data;
    } catch (error) {
        console.warn('Backend fetch failed, falling back to localStorage.', error);
        const loadFromStorage = (key: string) => {
            const stored = localStorage.getItem(`${key}_${year}`);
            return stored ? JSON.parse(stored) : undefined;
        };
        return {
            projectGroups: loadFromStorage('projectGroups'), students: loadFromStorage('students'),
            advisors: loadFromStorage('advisors'), majors: loadFromStorage('majors'),
            classrooms: loadFromStorage('classrooms'), milestoneTemplates: loadFromStorage('milestoneTemplates'),
            announcements: loadFromStorage('announcements'), defenseSettings: loadFromStorage('defenseSettings'),
            scoringSettings: loadFromStorage('scoringSettings'),
        };
    }
  },

  // Generic PUT to update a whole collection
  updateCollection: async <T extends { [key: string]: any }>(year: string, key: string, items: T[]): Promise<T[]> => {
    try {
        const url = API_BASE_URL ? `${API_BASE_URL}/api/${year}/${key}` : `/api/${year}/${key}`;
        const response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items) });
        if (!response.ok) throw new Error(`Failed to update collection ${key}`);
        const data = await response.json();
        localStorage.setItem(`${key}_${year}`, JSON.stringify(data));
        return data;
    } catch (error) {
        console.warn(`Backend update failed for ${key}, falling back to localStorage.`, error);
        localStorage.setItem(`${key}_${year}`, JSON.stringify(items));
        return items;
    }
  },
  
  // Generic PATCH to bulk update fields
  bulkUpdateCollection: async <T extends { [key: string]: any }>(year: string, key: string, ids: string[], updates: Partial<T>): Promise<T[]> => {
    try {
        const url = API_BASE_URL ? `${API_BASE_URL}/api/${year}/${key}` : `/api/${year}/${key}`;
        const response = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, updates }) });
        if (!response.ok) throw new Error(`Failed to bulk update collection ${key}`);
        const data = await response.json();
        localStorage.setItem(`${key}_${year}`, JSON.stringify(data));
        return data;
    } catch (error) {
        console.warn(`Backend bulk update failed for ${key}, falling back to localStorage.`, error);
        const stored = localStorage.getItem(`${key}_${year}`);
        const collection: T[] = stored ? JSON.parse(stored) : [];
        const idKey = key === 'students' ? 'studentId' : 'id';
        const updatedCollection = collection.map(item => ids.includes(item[idKey]) ? { ...item, ...updates } : item);
        localStorage.setItem(`${key}_${year}`, JSON.stringify(updatedCollection));
        return updatedCollection;
    }
  },
  
  // Generic POST to add a single item
  addCollectionItem: async <T>(year: string, key: string, item: T): Promise<T[]> => {
    try {
        const url = API_BASE_URL ? `${API_BASE_URL}/api/${year}/${key}` : `/api/${year}/${key}`;
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
        if (!response.ok) throw new Error(`Failed to add item to ${key}`);
        const data = await response.json();
        localStorage.setItem(`${key}_${year}`, JSON.stringify(data));
        return data;
    } catch(error) {
        console.warn(`Backend add failed for ${key}, falling back to localStorage.`, error);
        const stored = localStorage.getItem(`${key}_${year}`);
        const collection = stored ? JSON.parse(stored) : [];
        const newCollection = [...collection, item];
        localStorage.setItem(`${key}_${year}`, JSON.stringify(newCollection));
        return newCollection;
    }
  },

  // Generic DELETE for a single item
  deleteCollectionItem: async <T extends { [key: string]: any }>(year: string, key: string, id: string): Promise<T[]> => {
    try {
        const url = API_BASE_URL ? `${API_BASE_URL}/api/${year}/${key}/${id}` : `/api/${year}/${key}/${id}`;
        const response = await fetch(url, { method: 'DELETE' });
        if (!response.ok) throw new Error(`Failed to delete item from ${key}`);
        const data = await response.json();
        localStorage.setItem(`${key}_${year}`, JSON.stringify(data));
        return data;
    } catch (error) {
        console.warn(`Backend delete failed for ${key}, falling back to localStorage.`, error);
        const stored = localStorage.getItem(`${key}_${year}`);
        const collection: T[] = stored ? JSON.parse(stored) : [];
        const idKey = key === 'students' ? 'studentId' : 'id';
        const newCollection = collection.filter(item => item[idKey] !== id);
        localStorage.setItem(`${key}_${year}`, JSON.stringify(newCollection));
        return newCollection;
    }
  },
  
  // Generic POST for bulk deletion
  bulkDeleteCollection: async <T extends { [key: string]: any }>(year: string, key: string, ids: string[]): Promise<T[]> => {
    try {
        const url = API_BASE_URL ? `${API_BASE_URL}/api/${year}/${key}/bulk_delete` : `/api/${year}/${key}/bulk_delete`;
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
        if (!response.ok) throw new Error(`Failed to bulk delete from ${key}`);
        const data = await response.json();
        localStorage.setItem(`${key}_${year}`, JSON.stringify(data));
        return data;
    } catch(error) {
        console.warn(`Backend bulk delete failed for ${key}, falling back to localStorage.`, error);
        const stored = localStorage.getItem(`${key}_${year}`);
        const collection: T[] = stored ? JSON.parse(stored) : [];
        const idKey = key === 'students' ? 'studentId' : 'id';
        const newCollection = collection.filter(item => !ids.includes(item[idKey]));
        localStorage.setItem(`${key}_${year}`, JSON.stringify(newCollection));
        return newCollection;
    }
  },

  // POST to update a settings object
  updateSettings: async (year: string, key: string, settings: any) => {
    try {
        const url = API_BASE_URL ? `${API_BASE_URL}/api/${year}/settings/${key}` : `/api/${year}/settings/${key}`;
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
        if (!response.ok) throw new Error(`Failed to update settings for ${key}`);
        const data = await response.json();
        localStorage.setItem(`${key}_${year}`, JSON.stringify(data));
        return data;
    } catch(error) {
        console.warn(`Backend settings update failed for ${key}, falling back to localStorage.`, error);
        localStorage.setItem(`${key}_${year}`, JSON.stringify(settings));
        return settings;
    }
  },
};


export const useMockData = (currentAcademicYear: string, addNotification: (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void, addToast: (toast: Omit<ToastMessage, 'id'>) => void) => {
    const [loading, setLoading] = useState(true);
    const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [advisors, setAdvisors] = useState<Advisor[]>([]);
    const [majors, setMajors] = useState<Major[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [milestoneTemplates, setMilestoneTemplates] = useState<MilestoneTemplate[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [defenseSettings, setDefenseSettings] = useState<DefenseSettings>({ startDefenseDate: '', timeSlots: '09:00-10:00,10:15-11:15,13:00-14:00,14:15-15:15', rooms: [], stationaryAdvisors: {}, timezone: 'Asia/Bangkok' });
    const [scoringSettings, setScoringSettings] = useState<ScoringSettings>({ mainAdvisorWeight: 60, committeeWeight: 40, gradeBoundaries: [], advisorRubrics: [], committeeRubrics: [] });
    const t = useTranslations();

    // Watch for token changes to reload data after login
    const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('auth_token'));
    
    useEffect(() => {
        // Listen for storage changes (when token is set after login)
        const handleStorageChange = () => {
            const newToken = localStorage.getItem('auth_token');
            if (newToken !== authToken) {
                setAuthToken(newToken);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        // Also check periodically (for same-tab updates)
        const interval = setInterval(() => {
            const currentToken = localStorage.getItem('auth_token');
            if (currentToken !== authToken) {
                setAuthToken(currentToken);
            }
        }, 1000);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [authToken]);
    
    useEffect(() => {
        const loadData = async () => {
            if (!currentAcademicYear) return;
            setLoading(true);
            try {
                const token = localStorage.getItem('auth_token');
                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                };
                
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                // Load data from real backend API
                const [projectsRes, studentsRes, advisorsRes, majorsRes, classroomsRes] = await Promise.allSettled([
                    fetch(`${cleanAPIBaseURL}/api/projects/projects/`, { headers }),
                    fetch(`${cleanAPIBaseURL}/api/students/`, { headers }),
                    fetch(`${cleanAPIBaseURL}/api/advisors/`, { headers }),
                    fetch(`${cleanAPIBaseURL}/api/majors/`, { headers }),
                    fetch(`${cleanAPIBaseURL}/api/classrooms/`, { headers }),
                ]);

                // Process projects
                if (projectsRes.status === 'fulfilled' && projectsRes.value.ok) {
                    const projectsData = await projectsRes.value.json();
                    // Transform backend project format to frontend ProjectGroup format
                    const transformedProjects = Array.isArray(projectsData) ? projectsData : (projectsData.results || projectsData.data || []);
                    setProjectGroups(transformedProjects.map((p: any) => ({
                        project: p,
                        students: p.students || []
                    })) || []);
                } else {
                    console.warn('Failed to load projects from backend, using empty array');
                    setProjectGroups([]);
                }

                // Process students
                if (studentsRes.status === 'fulfilled' && studentsRes.value.ok) {
                    const studentsData = await studentsRes.value.json();
                    const rawStudents = Array.isArray(studentsData) ? studentsData : (studentsData.results || studentsData.data || []);
                    // Transform backend format to frontend format
                    const transformedStudents = rawStudents.map((s: any) => ({
                        studentId: s.student_id || s.studentId || s.id?.toString() || '',
                        name: s.user?.first_name || s.name || s.first_name || '',
                        surname: s.user?.last_name || s.surname || s.last_name || '',
                        major: s.major || '',
                        classroom: s.classroom || '',
                        gender: s.gender || 'Male',
                        tel: s.tel || s.phone || s.user?.phone || '',
                        email: s.user?.email || s.email || '',
                        status: s.status || 'Pending',
                        isAiAssistantEnabled: s.isAiAssistantEnabled !== undefined ? s.isAiAssistantEnabled : true,
                    })).filter((s: any) => s.studentId); // Filter out invalid students
                    setStudents(transformedStudents);
                } else {
                    console.warn('Failed to load students from backend, using empty array');
                    setStudents([]);
                }

                // Process advisors
                if (advisorsRes.status === 'fulfilled' && advisorsRes.value.ok) {
                    const advisorsData = await advisorsRes.value.json();
                    const rawAdvisors = Array.isArray(advisorsData) ? advisorsData : (advisorsData.results || advisorsData.data || []);
                    // Transform backend format to frontend format
                    const transformedAdvisors = rawAdvisors.map((a: any) => ({
                        id: a.id?.toString() || a.advisor_id || '',
                        name: a.user?.full_name || (a.user?.first_name && a.user?.last_name ? `${a.user.first_name} ${a.user.last_name}` : '') || a.name || '',
                        quota: a.quota || 10,
                        mainCommitteeQuota: a.main_committee_quota || a.mainCommitteeQuota || 5,
                        secondCommitteeQuota: a.second_committee_quota || a.secondCommitteeQuota || 5,
                        thirdCommitteeQuota: a.third_committee_quota || a.thirdCommitteeQuota || 5,
                        specializedMajorIds: a.specializedMajorIds || (a.specializations?.map((s: any) => {
                            // Try to get major ID from specializations
                            if (s.major && typeof s.major === 'object') return s.major.id || s.major;
                            if (typeof s.major === 'string') {
                                // Find major by name
                                const major = initialMajors.find(m => m.name === s.major);
                                return major?.id;
                            }
                            return s.id;
                        }).filter((id: any) => id) || []),
                        isDepartmentAdmin: a.is_department_admin || a.isDepartmentAdmin || false,
                        password: a.password || 'password123',
                        isAiAssistantEnabled: a.isAiAssistantEnabled !== undefined ? a.isAiAssistantEnabled : true,
                    })).filter((a: any) => a.id && a.name); // Filter out invalid advisors
                    setAdvisors(transformedAdvisors);
                } else {
                    console.warn('Failed to load advisors from backend, using empty array');
                    setAdvisors([]);
                }

                // Process majors
                if (majorsRes.status === 'fulfilled' && majorsRes.value.ok) {
                    const majorsData = await majorsRes.value.json();
                    setMajors(Array.isArray(majorsData) ? majorsData : (majorsData.results || majorsData.data || initialMajors));
                } else {
                    console.warn('Failed to load majors from backend, using initial majors');
                    setMajors(initialMajors);
                }

                // Process classrooms
                if (classroomsRes.status === 'fulfilled' && classroomsRes.value.ok) {
                    const classroomsData = await classroomsRes.value.json();
                    setClassrooms(Array.isArray(classroomsData) ? classroomsData : (classroomsData.results || classroomsData.data || initialClassrooms));
                } else {
                    console.warn('Failed to load classrooms from backend, using initial classrooms');
                    setClassrooms(initialClassrooms);
                }

                // Set defaults for other data
                setMilestoneTemplates(initialMilestoneTemplates);
                setAnnouncements([]);
                setDefenseSettings({ startDefenseDate: '', timeSlots: '09:00-10:00,10:15-11:15,13:00-14:00,14:15-15:15', rooms: [], stationaryAdvisors: {}, timezone: 'Asia/Bangkok' });
                setScoringSettings({ mainAdvisorWeight: 60, committeeWeight: 40, gradeBoundaries: [], advisorRubrics: [], committeeRubrics: [] });
            } catch (error) {
                console.error("Failed to load data from backend:", error);
                addToast({ type: 'error', message: 'Could not load data from server. Please check your connection.' });
                // Set empty arrays as fallback
                setProjectGroups([]);
                setStudents([]);
                setAdvisors([]);
                setMajors(initialMajors);
                setClassrooms(initialClassrooms);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [currentAcademicYear, addToast, authToken]);

    const advisorProjectCounts = useMemo(() => {
        return projectGroups.reduce((acc, group) => {
            if(group.project.status === ProjectStatus.Approved || group.project.status === ProjectStatus.Pending) {
                acc[group.project.advisorName] = (acc[group.project.advisorName] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [projectGroups]);

    const committeeCounts = useMemo(() => {
        const counts: Record<string, { main: number; second: number; third: number }> = {};
        advisors.forEach(adv => { counts[adv.id] = { main: 0, second: 0, third: 0 }; });
        projectGroups.forEach(pg => {
            if (pg.project.mainCommitteeId && counts[pg.project.mainCommitteeId]) counts[pg.project.mainCommitteeId].main++;
            if (pg.project.secondCommitteeId && counts[pg.project.secondCommitteeId]) counts[pg.project.secondCommitteeId].second++;
            if (pg.project.thirdCommitteeId && counts[pg.project.thirdCommitteeId]) counts[pg.project.thirdCommitteeId].third++;
        });
        return counts;
    }, [projectGroups, advisors]);
    
    const getAdvisorNameById = useCallback((id: string | null): string => {
        if (!id) return 'N/A';
        return advisors.find(a => a.id === id)?.name || 'Unknown';
    }, [advisors]);

    const genericProjectUpdater = useCallback(async (updater: (pg: ProjectGroup) => ProjectGroup) => {
        const updatedGroups = projectGroups.map(updater);
        try {
            const newGroups = await api.updateCollection(currentAcademicYear, 'projectGroups', updatedGroups);
            setProjectGroups(newGroups);
        } catch (error) {
            console.error("Failed to update project groups:", error);
            addToast({ type: 'error', message: 'Failed to save project updates.' });
        }
    }, [projectGroups, currentAcademicYear, addToast]);

    const addProjectLogEntry = useCallback(async (projectId: string, entry: Omit<LogEntry, 'id' | 'timestamp' | 'file'>, filePayload: FileUploadPayload | null = null) => {
        const mentionRegex = /@([\w\s.]+)/g;
        const mentions = [...entry.message.matchAll(mentionRegex)];
        if (mentions.length > 0) {
            const mentionedNames = mentions.map(m => m[1].trim());
            const mentionedUsers = [...advisors, ...students].filter(u => mentionedNames.includes(u.name) || mentionedNames.includes(`${(u as Student).name} ${(u as Student).surname}`));
            if (mentionedUsers.length > 0) {
                const mentionedUserIds = mentionedUsers.map(u => (u as Student).studentId || (u as Advisor).id);
                addNotification({ title: t('youWereMentioned').replace('${projectId}', projectId), message: `${entry.authorName}: "${entry.message}"`, userIds: mentionedUserIds, projectId: projectId, type: 'Mention' });
            }
        }
        
        await genericProjectUpdater(pg => {
            if (pg.project.projectId === projectId) {
                const newLog: LogEntry = { ...entry, id: uuidv4(), timestamp: new Date().toISOString(), file: null };
                if (filePayload) {
                    const fileId = uuidv4();
                    try { 
                        localStorage.setItem(`file_${fileId}`, filePayload.dataUrl); 
                        newLog.file = { fileId, name: filePayload.name, type: filePayload.type, size: filePayload.size }; 
                    } catch (e) { 
                        addToast({type: 'error', message: t('storageLimitReached')}); 
                        console.error("Local storage error:", e); 
                    }
                }
                const updatedLog = [...(pg.project.log || []), newLog];
                return { ...pg, project: { ...pg.project, log: updatedLog } };
            }
            return pg;
        });
    }, [addNotification, advisors, students, addToast, t, genericProjectUpdater]);
    
    const addProject = useCallback(async (project: Project, studentsInGroup: Student[], actor: User) => {
        const newHistoryItem: StatusHistoryItem = { status: ProjectStatus.Pending, timestamp: new Date().toISOString(), actorName: actor.name, comment: 'Project created and submitted for approval.'};
        const newProject: Project = { ...project, history: [newHistoryItem] };
        const newGroup = { project: newProject, students: studentsInGroup };

        try {
            // Try to use backend API first
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Transform frontend format to backend format
            const advisor = advisors.find(a => a.name === project.advisorName);
            const studentIds = studentsInGroup.map(s => s.studentId);
            
            const backendPayload = {
                topic_lao: project.topicLao,
                topic_eng: project.topicEng,
                advisor: advisor?.id || null,
                student_ids: studentIds,
                academic_year: currentAcademicYear,
                comment: project.comment || 'Initial submission',
            };

            const response = await fetch(`${cleanAPIBaseURL}/api/projects/projects/`, {
                method: 'POST',
                headers,
                body: JSON.stringify(backendPayload),
            });

            if (response.ok) {
                const createdProject = await response.json();
                // Transform backend response to frontend format and add to local state
                const transformedGroup: ProjectGroup = {
                    project: newProject,
                    students: studentsInGroup,
                };
                setProjectGroups(prev => [...prev, transformedGroup]);
                addProjectLogEntry(project.projectId, { type: 'event', authorId: actor.id, authorName: actor.name, authorRole: actor.role, message: 'Project registered.' });
                if (advisor) {
                    addNotification({ title: t('newProjectSubmissionTitle'), message: t('newProjectSubmissionMessage').replace('${topic}', project.topicEng), userIds: [advisor.id], projectId: project.projectId, type: 'Submission' });
                }
            } else {
                throw new Error(`Backend API returned ${response.status}`);
            }
        } catch (error) {
            // Fallback to localStorage
            console.warn('Backend API failed, falling back to localStorage:', error);
            try {
                const updatedProjectGroups = await api.addCollectionItem(currentAcademicYear, 'projectGroups', newGroup);
                setProjectGroups(updatedProjectGroups);
                addProjectLogEntry(project.projectId, { type: 'event', authorId: actor.id, authorName: actor.name, authorRole: actor.role, message: 'Project registered.' });
                const advisor = advisors.find(a => a.name === project.advisorName);
                if (advisor) {
                    addNotification({ title: t('newProjectSubmissionTitle'), message: t('newProjectSubmissionMessage').replace('${topic}', project.topicEng), userIds: [advisor.id], projectId: project.projectId, type: 'Submission' });
                }
            } catch (fallbackError) {
                addToast({ type: 'error', message: 'Failed to add project.' });
            }
        }
    }, [advisors, addNotification, addProjectLogEntry, t, currentAcademicYear, addToast, cleanAPIBaseURL]);

    const updateProject = useCallback(async (group: ProjectGroup, actor: User) => {
        const originalGroup = projectGroups.find(p => p.project.projectId === group.project.projectId);
        if (!originalGroup) return;
        let comment = 'Project details updated.';
        if (originalGroup.project.topicEng !== group.project.topicEng) comment += ' Topic changed.';
        if (originalGroup.project.advisorName !== group.project.advisorName) comment += ` Advisor changed to ${group.project.advisorName}.`;
        
        const newHistoryItem: StatusHistoryItem = { status: group.project.status, timestamp: new Date().toISOString(), actorName: actor.name, comment: comment };
        const updatedHistory = [...group.project.history, newHistoryItem];
        const updatedProject = { ...group.project, history: updatedHistory };
        
        await genericProjectUpdater(p => p.project.projectId === group.project.projectId ? { ...group, project: updatedProject } : p);
        addProjectLogEntry(group.project.projectId, { type: 'event', authorId: actor.id, authorName: actor.name, authorRole: actor.role, message: comment });
    }, [projectGroups, addProjectLogEntry, genericProjectUpdater]);

    const deleteProject = useCallback(async (id: string) => {
        try {
            const newGroups = await api.deleteCollectionItem(currentAcademicYear, 'projectGroups', id);
            setProjectGroups(newGroups);
        } catch (error) {
            console.error(`Could not delete project ${id}:`, error);
            addToast({ type: 'error', message: `Failed to delete project ${id}.` });
        }
    }, [currentAcademicYear, addToast]);

    const updateProjectStatus = useCallback(async (id: string, status: ProjectStatus, actor: User, details: { comment?: string, templateId?: string }) => {
        await genericProjectUpdater(p => {
            if (p.project.projectId === id) {
                const comment = details.comment || (status === ProjectStatus.Approved ? 'Project approved.' : 'Project rejected.');
                const newHistoryItem: StatusHistoryItem = { status, timestamp: new Date().toISOString(), actorName: actor.name, comment };
                const updatedProject: Project = { ...p.project, status, history: [...p.project.history, newHistoryItem] };
                if (status === ProjectStatus.Approved && details.templateId) {
                    const template = milestoneTemplates.find(t => t.id === details.templateId);
                    if (template) {
                        const approvalDate = new Date(); let lastDueDate = approvalDate;
                        updatedProject.milestones = template.tasks.map(task => { const dueDate = new Date(lastDueDate); dueDate.setDate(dueDate.getDate() + task.durationDays); lastDueDate = dueDate; return { id: task.id, name: task.name, status: MilestoneStatus.Pending, dueDate: dueDate.toISOString(), submittedDate: null, feedback: null, submittedFile: null } });
                    }
                }
                addProjectLogEntry(id, { type: 'event', authorId: actor.id, authorName: actor.name, authorRole: actor.role, message: `Project status changed to ${status}. ${comment}` });
                const studentUserIds = p.students.map(s => s.studentId);
                const notificationType: NotificationType = status === ProjectStatus.Approved ? 'Approval' : 'Feedback';
                addNotification({ title: t('projectStatusUpdateTitle').replace('${status}', status), message: t('projectStatusUpdateMessage').replace('${topic}', p.project.topicEng).replace('${status}', status.toLowerCase()).replace('${comment}', comment), userIds: studentUserIds, projectId: id, type: notificationType });
                return { ...p, project: updatedProject };
            }
            return p;
        });
    }, [milestoneTemplates, addNotification, addProjectLogEntry, t, genericProjectUpdater]);

    const updateMilestone = useCallback(async (projectId: string, milestoneId: string, actor: User, data: MilestoneUpdatePayload) => {
        await genericProjectUpdater(pg => {
            if (pg.project.projectId === projectId) {
                const milestones = [...(pg.project.milestones || [])];
                const milestoneIndex = milestones.findIndex(m => m.id === milestoneId);
                if (milestoneIndex === -1) return pg;
                const originalMilestone = milestones[milestoneIndex];
                const updatedMilestone = { ...originalMilestone };
                const changes: string[] = [];
                let notificationMessage = '', notificationTitle = '', notificationType: NotificationType | null = null;
                let userIds: string[] = [];

                if (data.status) { updatedMilestone.status = data.status; changes.push(`status set to ${data.status}`); if (data.status === MilestoneStatus.Submitted) { updatedMilestone.submittedDate = new Date().toISOString(); } }
                if (data.feedback !== undefined) { updatedMilestone.feedback = data.feedback; changes.push('feedback provided'); }
                if (data.submittedFile) {
                    const fileId = uuidv4();
                    try { localStorage.setItem(`file_${fileId}`, data.submittedFile.dataUrl); updatedMilestone.submittedFile = { fileId, name: data.submittedFile.name, type: data.submittedFile.type, size: data.submittedFile.size, }; changes.push('file submitted'); updatedMilestone.submittedDate = new Date().toISOString(); if(actor.role === 'Student' && (originalMilestone.status === MilestoneStatus.Pending || originalMilestone.status === MilestoneStatus.RequiresRevision)) { updatedMilestone.status = MilestoneStatus.Submitted; }
                    } catch (e) { addToast({type: 'error', message: t('storageLimitReached')}); console.error("Local storage error:", e); }
                }
                if (data.dueDate) { updatedMilestone.dueDate = data.dueDate; changes.push(`due date changed to ${new Date(data.dueDate).toLocaleDateString()}`); }
                addProjectLogEntry(projectId, { type: 'event', authorId: actor.id, authorName: actor.name, authorRole: actor.role, message: `Milestone "${originalMilestone.name}" updated by ${actor.name}: ${changes.join(', ')}.` });
                
                const advisor = advisors.find(a => a.name === pg.project.advisorName);
                if (actor.role === 'Student' && (data.submittedFile || data.status === MilestoneStatus.Submitted)) { notificationType = 'Submission'; notificationTitle = t('milestoneSubmittedTitle'); notificationMessage = t('milestoneSubmittedMessage').replace('${milestoneName}', originalMilestone.name).replace('${projectId}', projectId); if(advisor) userIds.push(advisor.id); } 
                else if (actor.role !== 'Student' && data.status) { notificationType = data.status === MilestoneStatus.Approved ? 'Approval' : 'Feedback'; notificationTitle = t('milestoneStatusUpdateTitle').replace('${status}', data.status); notificationMessage = t('milestoneStatusUpdateMessage').replace('${milestoneName}', originalMilestone.name).replace('${status}', data.status); userIds = pg.students.map(s => s.studentId); } 
                else if (actor.role !== 'Student' && data.dueDate) { notificationType = 'System'; notificationTitle = t('milestoneDueDateUpdated'); notificationMessage = t('milestoneDueDateUpdatedMessage').replace('${milestoneName}', originalMilestone.name).replace('${newDate}', new Date(data.dueDate).toLocaleDateString()); userIds = pg.students.map(s => s.studentId); }
                if (notificationType && userIds.length > 0) { addNotification({ title: notificationTitle, message: notificationMessage, userIds, projectId, type: notificationType }); }
                
                milestones[milestoneIndex] = updatedMilestone;
                return { ...pg, project: { ...pg.project, milestones } };
            }
            return pg;
        });
    }, [addNotification, addProjectLogEntry, t, advisors, addToast, genericProjectUpdater]);

    const reorderMilestones = useCallback(async (projectId: string, draggedId: string, targetId: string | null) => {
        await genericProjectUpdater(pg => {
            if (pg.project.projectId === projectId && pg.project.milestones) {
                const milestones = [...pg.project.milestones];
                const draggedIndex = milestones.findIndex(m => m.id === draggedId);
                const targetIndex = targetId ? milestones.findIndex(m => m.id === targetId) : milestones.length;
                if (draggedIndex === -1) return pg;
                const [draggedItem] = milestones.splice(draggedIndex, 1);
                milestones.splice(targetIndex, 0, draggedItem);
                return { ...pg, project: { ...pg.project, milestones }};
            }
            return pg;
        });
    }, [genericProjectUpdater]);
    
    // FIX: Removed React namespace by importing Dispatch and SetStateAction directly.
    const createApiCallback = <T, U extends any[]>(apiCall: (...args: U) => Promise<T>, setter: Dispatch<SetStateAction<T>>, errorMessage: string) => {
        return useCallback(async (...args: U) => {
            try {
                const result = await apiCall(...args);
                setter(result);
            } catch (error) {
                console.error(errorMessage, error);
                addToast({ type: 'error', message: errorMessage });
            }
        }, [addToast, errorMessage]);
    };

    const addStudent = createApiCallback(
        (student: Student) => api.addCollectionItem(currentAcademicYear, 'students', { ...student, isAiAssistantEnabled: true }),
        setStudents, 'Failed to add student.'
    );
    const updateStudent = useCallback(async (student: Student) => {
        try {
            const updatedStudents = await api.updateCollection(currentAcademicYear, 'students', students.map(s => s.studentId === student.studentId ? student : s));
            setStudents(updatedStudents);
        } catch (error) {
            console.error('Failed to update student.', error);
            addToast({ type: 'error', message: 'Failed to update student.' });
        }
    }, [students, currentAcademicYear, addToast]);

    const deleteStudent = createApiCallback(
        (id: string) => api.deleteCollectionItem(currentAcademicYear, 'students', id),
        setStudents, 'Failed to delete student.'
    );
    const bulkAddOrUpdateStudents = createApiCallback(
        (studentsToUpdate: Student[]) => {
            const studentMap = new Map(students.map(s => [s.studentId, s]));
            studentsToUpdate.forEach(s => studentMap.set(s.studentId, {...s, isAiAssistantEnabled: true}));
            const allStudents = Array.from(studentMap.values());
            return api.updateCollection(currentAcademicYear, 'students', allStudents);
        },
        setStudents, 'Failed to bulk update students.'
    );
    const bulkUpdateStudents = createApiCallback(
        (studentIds: string[], updates: Partial<Student>) => api.bulkUpdateCollection(currentAcademicYear, 'students', studentIds, updates),
        setStudents, 'Failed to bulk update students.'
    );
    const bulkDeleteStudents = createApiCallback(
        (studentIds: string[]) => api.bulkDeleteCollection(currentAcademicYear, 'students', studentIds),
        setStudents, 'Failed to bulk delete students.'
    );

    const addAdvisor = createApiCallback(
        (advisor: Omit<Advisor, 'id'>) => {
            const newId = `A${advisors.length + 1}`;
            return api.addCollectionItem(currentAcademicYear, 'advisors', { ...advisor, id: newId, isAiAssistantEnabled: true });
        },
        setAdvisors, 'Failed to add advisor.'
    );
    const updateAdvisor = useCallback(async (advisor: Advisor) => {
        try {
            const updatedAdvisors = await api.updateCollection(currentAcademicYear, 'advisors', advisors.map(a => a.id === advisor.id ? advisor : a));
            setAdvisors(updatedAdvisors);
        } catch (error) {
            console.error('Failed to update advisor.', error);
            addToast({ type: 'error', message: 'Failed to update advisor.' });
        }
    }, [advisors, currentAcademicYear, addToast]);
    const deleteAdvisor = createApiCallback(
        (id: string) => api.deleteCollectionItem(currentAcademicYear, 'advisors', id),
        setAdvisors, 'Failed to delete advisor.'
    );
    const deleteAdvisors = createApiCallback(
        (ids: string[]) => api.bulkDeleteCollection(currentAcademicYear, 'advisors', ids),
        setAdvisors, 'Failed to delete advisors.'
    );
    const bulkAddOrUpdateAdvisors = createApiCallback(
        async (advisorsToUpdate: (Omit<Advisor, 'id'> | Advisor)[]) => {
            const advisorMap = new Map(advisors.map(a => [a.id, a]));
            advisorsToUpdate.forEach(adv => { if ('id' in adv && adv.id) { advisorMap.set(adv.id, { isAiAssistantEnabled: true, ...adv }); } else { const newId = `A${advisorMap.size + 1 + Math.random()}`; advisorMap.set(newId, { ...adv, id: newId, isAiAssistantEnabled: true }); } });
            const updatedAdvisors = Array.from(advisorMap.values());
            return api.updateCollection(currentAcademicYear, 'advisors', updatedAdvisors);
        },
        setAdvisors, 'Failed to bulk update advisors.'
    );
    const bulkUpdateAdvisors = createApiCallback(
        (advisorIds: string[], updates: Partial<Omit<Advisor, 'id' | 'name'>>) => api.bulkUpdateCollection<Advisor>(currentAcademicYear, 'advisors', advisorIds, updates as Partial<Advisor>),
        setAdvisors, 'Failed to bulk update advisors.'
    );
    
    const addMajor = createApiCallback((major: Omit<Major, 'id'>) => api.addCollectionItem(currentAcademicYear, 'majors', { ...major, id: `M${majors.length + 1}` }), setMajors, 'Failed to add major.');
    const updateMajor = createApiCallback((major: Major) => api.updateCollection(currentAcademicYear, 'majors', majors.map(m => m.id === major.id ? major : m)), setMajors, 'Failed to update major.');
    const deleteMajor = createApiCallback((id: string) => api.deleteCollectionItem(currentAcademicYear, 'majors', id), setMajors, 'Failed to delete major.');
    
    const addClassroom = createApiCallback((classroom: Omit<Classroom, 'id'>) => api.addCollectionItem(currentAcademicYear, 'classrooms', { ...classroom, id: `C${classrooms.length + 1}` }), setClassrooms, 'Failed to add classroom.');
    const updateClassroom = createApiCallback((classroom: Classroom) => api.updateCollection(currentAcademicYear, 'classrooms', classrooms.map(c => c.id === classroom.id ? classroom : c)), setClassrooms, 'Failed to update classroom.');
    const deleteClassroom = createApiCallback((id: string) => api.deleteCollectionItem(currentAcademicYear, 'classrooms', id), setClassrooms, 'Failed to delete classroom.');
    
    const addMilestoneTemplate = createApiCallback((template: Omit<MilestoneTemplate, 'id'>) => api.addCollectionItem(currentAcademicYear, 'milestoneTemplates', { ...template, id: `TPL${milestoneTemplates.length + 1}` }), setMilestoneTemplates, 'Failed to add template.');
    const updateMilestoneTemplate = createApiCallback((template: MilestoneTemplate) => api.updateCollection(currentAcademicYear, 'milestoneTemplates', milestoneTemplates.map(t => t.id === template.id ? template : t)), setMilestoneTemplates, 'Failed to update template.');
    const deleteMilestoneTemplate = createApiCallback((id: string) => api.deleteCollectionItem(currentAcademicYear, 'milestoneTemplates', id), setMilestoneTemplates, 'Failed to delete template.');

    const addAnnouncement = createApiCallback((data: Omit<Announcement, 'id'|'createdAt'|'updatedAt'>) => api.addCollectionItem(currentAcademicYear, 'announcements', {...data, id: `ANN${announcements.length + 1}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()}), setAnnouncements, 'Failed to add announcement.');
    const updateAnnouncement = createApiCallback((announcement: Announcement) => api.updateCollection(currentAcademicYear, 'announcements', announcements.map(a => a.id === announcement.id ? {...announcement, updatedAt: new Date().toISOString()} : a)), setAnnouncements, 'Failed to update announcement.');
    const deleteAnnouncement = createApiCallback((id: string) => api.deleteCollectionItem(currentAcademicYear, 'announcements', id), setAnnouncements, 'Failed to delete announcement.');

    const updateDefenseSettings = createApiCallback((settings: DefenseSettings) => api.updateSettings(currentAcademicYear, 'defenseSettings', settings), setDefenseSettings, 'Failed to save defense settings.');
    const updateScoringSettings = createApiCallback((settings: ScoringSettings) => api.updateSettings(currentAcademicYear, 'scoringSettings', settings), setScoringSettings, 'Failed to save scoring settings.');

    const clearAllSchedulesAndCommittees = useCallback(async () => {
        await genericProjectUpdater(pg => ({...pg, project: {...pg.project, mainCommitteeId: null, secondCommitteeId: null, thirdCommitteeId: null, defenseDate: null, defenseTime: null, defenseRoom: null, }}));
        addToast({type: 'success', message: t('allSchedulesCleared')});
    }, [addToast, t, genericProjectUpdater]);
    const bulkUpdateSchedules = useCallback(async (updates: { projectId: string; date: string | null; time: string | null; room: string | null }[]) => {
        const updateMap = new Map(updates.map(u => [u.projectId, u]));
        await genericProjectUpdater(pg => {
            if (updateMap.has(pg.project.projectId)) {
                const update = updateMap.get(pg.project.projectId)!;
                return { ...pg, project: { ...pg.project, defenseDate: update.date, defenseTime: update.time, defenseRoom: update.room }};
            }
            return pg;
        });
    }, [genericProjectUpdater]);
    
    const updateGeneralSettings = useCallback(async (settings: GeneralSettings) => { /* Not implemented yet */ }, []);
    const transferProject = useCallback(async(projectId: string, newAdvisorName: string, actor: User, comment: string) => { await genericProjectUpdater(pg => { if (pg.project.projectId === projectId) { const oldAdvisorName = pg.project.advisorName; const newHistoryItem: StatusHistoryItem = { status: pg.project.status, timestamp: new Date().toISOString(), actorName: actor.name, comment: `Transferred from ${oldAdvisorName} to ${newAdvisorName}. Reason: ${comment}` }; const updatedProject = { ...pg.project, advisorName: newAdvisorName, history: [...pg.project.history, newHistoryItem] }; addProjectLogEntry(projectId, {type: 'event', authorId: actor.id, authorName: actor.name, authorRole: actor.role, message: newHistoryItem.comment}); const newAdvisor = advisors.find(a => a.name === newAdvisorName); if (newAdvisor) { addNotification({ title: t('projectTransferredTitle'), message: t('projectTransferredMessage').replace('${projectId}', projectId).replace('${newAdvisorName}', newAdvisorName), userIds: [newAdvisor.id, ...pg.students.map(s => s.studentId)], projectId, type: 'System' }) } return { ...pg, project: updatedProject }; } return pg; }); }, [addProjectLogEntry, addNotification, advisors, t, genericProjectUpdater]);
    const bulkAddProjectLogEntries = useCallback(async(projectIds: string[], entry: Omit<LogEntry, 'id' | 'timestamp' | 'file'>) => { const projectsToUpdate = new Set(projectIds); await genericProjectUpdater(pg => { if (projectsToUpdate.has(pg.project.projectId)) { const newLog: LogEntry = { ...entry, id: uuidv4(), timestamp: new Date().toISOString(), }; const updatedLog = [...(pg.project.log || []), newLog]; const updatedProject = { ...pg.project, log: updatedLog }; return { ...pg, project: updatedProject }; } return pg; }); }, [genericProjectUpdater]);
    const updateProjectCommittee = useCallback(async (projectId: string, actor: User, committeeType: 'main' | 'second' | 'third', advisorId: string | null) => { await genericProjectUpdater(pg => { if (pg.project.projectId === projectId) { const key = `${committeeType}CommitteeId` as const; const updatedProject = { ...pg.project, [key]: advisorId }; return { ...pg, project: updatedProject }; } return pg; }); }, [genericProjectUpdater]);
    const updateProjectDefenseSchedule = useCallback(async (projectId: string, actor: User, schedule: { date: string | null; time: string | null; room: string | null }) => { await genericProjectUpdater(pg => { if (pg.project.projectId === projectId) { const updatedProject = { ...pg.project, defenseDate: schedule.date, defenseTime: schedule.time, defenseRoom: schedule.room }; return { ...pg, project: updatedProject }; } return pg; }); }, [genericProjectUpdater]);
    const updateFinalSubmissions = useCallback(async (projectId: string, type: 'preDefenseFile' | 'postDefenseFile', actor: User, file: FileUploadPayload) => { await genericProjectUpdater(pg => { if (pg.project.projectId === projectId) { const fileId = uuidv4(); try { localStorage.setItem(`file_${fileId}`, file.dataUrl); } catch(e) { addToast({type: 'error', message: 'Storage limit reached.'}); return pg; } const newFile: FinalSubmissionFile = { fileId, name: file.name, type: file.type, size: file.size, submittedAt: new Date().toISOString(), status: FinalSubmissionStatus.Submitted, }; const updatedSubmissions: FinalSubmissions = { ...(pg.project.finalSubmissions || { preDefenseFile: null, postDefenseFile: null }), [type]: newFile }; const updatedProject = { ...pg.project, finalSubmissions: updatedSubmissions }; addProjectLogEntry(projectId, {type: 'event', authorId: actor.id, authorName: actor.name, authorRole: actor.role, message: `${type === 'preDefenseFile' ? 'Pre-defense' : 'Post-defense'} file submitted.`}, file); const advisor = advisors.find(a => a.name === pg.project.advisorName); if (advisor) { addNotification({ title: t('finalDocumentSubmittedTitle'), message: t('finalDocumentSubmittedMessage').replace('${type}', type === 'preDefenseFile' ? 'pre-defense' : 'post-defense').replace('${projectId}', projectId), userIds: [advisor.id], projectId, type: 'Submission' }); } return { ...pg, project: updatedProject }; } return pg; }); }, [addProjectLogEntry, addNotification, advisors, addToast, t, genericProjectUpdater]);
    const reviewFinalSubmission = useCallback(async (projectId: string, type: 'preDefenseFile' | 'postDefenseFile', actor: User, status: FinalSubmissionStatus.Approved | FinalSubmissionStatus.RequiresRevision, feedback: string) => { await genericProjectUpdater(pg => { if (pg.project.projectId === projectId && pg.project.finalSubmissions) { const currentFile = pg.project.finalSubmissions[type]; if (!currentFile) return pg; const updatedFile: FinalSubmissionFile = { ...currentFile, status, feedback, approvedAt: status === FinalSubmissionStatus.Approved ? new Date().toISOString() : null, }; const updatedSubmissions = { ...pg.project.finalSubmissions, [type]: updatedFile }; const updatedProject = { ...pg.project, finalSubmissions: updatedSubmissions }; addProjectLogEntry(projectId, {type: 'event', authorId: actor.id, authorName: actor.name, authorRole: actor.role, message: `Final submission (${type}) status updated to ${status}. Feedback: ${feedback}`}); addNotification({ title: t('submissionStatusUpdateTitle').replace('${status}', status), message: t('submissionStatusUpdateMessage').replace('${type}', type).replace('${status}', status), userIds: pg.students.map(s => s.studentId), projectId, type: 'Feedback', }); return { ...pg, project: updatedProject }; } return pg; }); }, [addProjectLogEntry, addNotification, t, genericProjectUpdater]);
    const updateDetailedScore = useCallback(async (projectId: string, evaluatorId: string, scores: Record<string, number>) => { await genericProjectUpdater(pg => { if (pg.project.projectId === projectId) { const updatedProject = { ...pg.project }; const advisor = advisors.find(a => a.id === evaluatorId); const isMainAdvisor = advisor?.name === pg.project.advisorName; let rubric: ScoringRubricItem[]; if (isMainAdvisor) { rubric = scoringSettings.advisorRubrics; } else { rubric = scoringSettings.committeeRubrics; } const totalScore = rubric.reduce((sum, item) => sum + (scores[item.id] || 0), 0); if (isMainAdvisor) { updatedProject.mainAdvisorScore = totalScore; } else if (evaluatorId === pg.project.mainCommitteeId) { updatedProject.mainCommitteeScore = totalScore; } else if (evaluatorId === pg.project.secondCommitteeId) { updatedProject.secondCommitteeScore = totalScore; } else if (evaluatorId === pg.project.thirdCommitteeId) { updatedProject.thirdCommitteeScore = totalScore; } updatedProject.detailedScores = { ...(updatedProject.detailedScores || {}), [evaluatorId]: scores, }; return { ...pg, project: updatedProject }; } return pg; }); }, [advisors, scoringSettings, genericProjectUpdater]);
    const updateProjectGrade = useCallback(async (projectId: string, finalGrade: string | null) => { await genericProjectUpdater(pg => { if (pg.project.projectId === projectId) { return { ...pg, project: { ...pg.project, finalGrade }}; } return pg; }); }, [genericProjectUpdater]);
    const autoScheduleDefenses = useCallback(() => { addToast({type: 'info', message: 'Auto-scheduling is not fully implemented.'}); return { committeesAssigned: 0, defensesScheduled: 0 }; }, [addToast]);

    return {
        loading,
        projectGroups, students, advisors, majors, classrooms, milestoneTemplates, announcements, defenseSettings, scoringSettings,
        advisorProjectCounts, committeeCounts, getAdvisorNameById,
        addProject, updateProject, deleteProject, updateProjectStatus, updateMilestone, reorderMilestones, transferProject, addProjectLogEntry,
        bulkAddProjectLogEntries, updateProjectCommittee, updateProjectDefenseSchedule, autoScheduleDefenses, bulkUpdateSchedules,
        clearAllSchedulesAndCommittees, updateFinalSubmissions, reviewFinalSubmission, updateDetailedScore, updateProjectGrade,
        addStudent, updateStudent, deleteStudent, bulkAddOrUpdateStudents, bulkUpdateStudents, bulkDeleteStudents,
        addAdvisor, updateAdvisor, deleteAdvisor, deleteAdvisors, bulkAddOrUpdateAdvisors, bulkUpdateAdvisors,
        addMajor, updateMajor, deleteMajor, addClassroom, updateClassroom, deleteClassroom,
        addMilestoneTemplate, updateMilestoneTemplate, deleteMilestoneTemplate,
        addAnnouncement, updateAnnouncement, deleteAnnouncement,
        updateDefenseSettings, updateScoringSettings, updateGeneralSettings,
    };
};