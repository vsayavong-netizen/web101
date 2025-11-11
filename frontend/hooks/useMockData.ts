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
import { apiClient } from '../utils/apiClient';

const api = {
  // GET all data for a year
  getAllDataForYear: async (year: string) => {
    try {
        // Try to get data from Backend API
        const [projectsRes, studentsRes, advisorsRes, majorsRes, classroomsRes] = await Promise.allSettled([
            apiClient.getProjects({ academic_year: year }),
            apiClient.getStudents({ academic_year: year }),
            apiClient.getAdvisors({ academic_year: year }),
            apiClient.getMajors({ academic_year: year }),
            apiClient.getClassrooms({ academic_year: year }),
        ]);

        const data: any = {};
        
        if (projectsRes.status === 'fulfilled' && projectsRes.value.data) {
            data.projectGroups = projectsRes.value.data;
            localStorage.setItem(`projectGroups_${year}`, JSON.stringify(data.projectGroups));
        }
        
        if (studentsRes.status === 'fulfilled' && studentsRes.value.data) {
            data.students = studentsRes.value.data;
            localStorage.setItem(`students_${year}`, JSON.stringify(data.students));
        }
        
        if (advisorsRes.status === 'fulfilled' && advisorsRes.value.data) {
            data.advisors = advisorsRes.value.data;
            localStorage.setItem(`advisors_${year}`, JSON.stringify(data.advisors));
        }
        
        if (majorsRes.status === 'fulfilled' && majorsRes.value.data) {
            data.majors = majorsRes.value.data;
            localStorage.setItem(`majors_${year}`, JSON.stringify(data.majors));
        }
        
        if (classroomsRes.status === 'fulfilled' && classroomsRes.value.data) {
            data.classrooms = classroomsRes.value.data;
            localStorage.setItem(`classrooms_${year}`, JSON.stringify(data.classrooms));
        }

        // Load settings from Backend API
        const loadFromStorage = (key: string) => {
            const stored = localStorage.getItem(`${key}_${year}`);
            return stored ? JSON.parse(stored) : undefined;
        };

        // Map frontend keys to backend setting types
        const settingTypeMap: Record<string, 'milestone_templates' | 'announcements' | 'defense_settings' | 'scoring_settings'> = {
            'milestoneTemplates': 'milestone_templates',
            'announcements': 'announcements',
            'defenseSettings': 'defense_settings',
            'scoringSettings': 'scoring_settings'
        };

        // Try to load settings from Backend API
        const [milestoneTemplatesRes, announcementsRes, defenseSettingsRes, scoringSettingsRes] = await Promise.allSettled([
            apiClient.getAppSetting('milestone_templates', year),
            apiClient.getAppSetting('announcements', year),
            apiClient.getAppSetting('defense_settings', year),
            apiClient.getAppSetting('scoring_settings', year),
        ]);

        // Process milestone templates
        if (milestoneTemplatesRes.status === 'fulfilled' && milestoneTemplatesRes.value.status >= 200 && milestoneTemplatesRes.value.status < 300) {
            const value = milestoneTemplatesRes.value.data?.value;
            if (value !== null && value !== undefined) {
                data.milestoneTemplates = value;
                localStorage.setItem(`milestoneTemplates_${year}`, JSON.stringify(value));
            } else {
                data.milestoneTemplates = loadFromStorage('milestoneTemplates') || initialMilestoneTemplates;
            }
        } else {
            data.milestoneTemplates = loadFromStorage('milestoneTemplates') || initialMilestoneTemplates;
        }

        // Process announcements
        if (announcementsRes.status === 'fulfilled' && announcementsRes.value.status >= 200 && announcementsRes.value.status < 300) {
            const value = announcementsRes.value.data?.value;
            if (value !== null && value !== undefined) {
                data.announcements = value;
                localStorage.setItem(`announcements_${year}`, JSON.stringify(value));
            } else {
                data.announcements = loadFromStorage('announcements') || initialAnnouncements;
            }
        } else {
            data.announcements = loadFromStorage('announcements') || initialAnnouncements;
        }

        // Process defense settings
        if (defenseSettingsRes.status === 'fulfilled' && defenseSettingsRes.value.status >= 200 && defenseSettingsRes.value.status < 300) {
            const value = defenseSettingsRes.value.data?.value;
            if (value !== null && value !== undefined) {
                data.defenseSettings = value;
                localStorage.setItem(`defenseSettings_${year}`, JSON.stringify(value));
            } else {
                data.defenseSettings = loadFromStorage('defenseSettings');
            }
        } else {
            data.defenseSettings = loadFromStorage('defenseSettings');
        }

        // Process scoring settings
        if (scoringSettingsRes.status === 'fulfilled' && scoringSettingsRes.value.status >= 200 && scoringSettingsRes.value.status < 300) {
            const value = scoringSettingsRes.value.data?.value;
            if (value !== null && value !== undefined) {
                data.scoringSettings = value;
                localStorage.setItem(`scoringSettings_${year}`, JSON.stringify(value));
            } else {
                data.scoringSettings = loadFromStorage('scoringSettings');
            }
        } else {
            data.scoringSettings = loadFromStorage('scoringSettings');
        }

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
            classrooms: loadFromStorage('classrooms'), milestoneTemplates: loadFromStorage('milestoneTemplates') || initialMilestoneTemplates,
            announcements: loadFromStorage('announcements') || initialAnnouncements, defenseSettings: loadFromStorage('defenseSettings'),
            scoringSettings: loadFromStorage('scoringSettings'),
        };
    }
  },

  // Generic PUT to update a whole collection
  updateCollection: async <T extends { [key: string]: any }>(year: string, key: string, items: T[]): Promise<T[]> => {
    try {
        // Use appropriate API method based on key
        if (key === 'projectGroups') {
            // Update each project individually
            await Promise.allSettled(items.map((item: any) => 
                apiClient.updateProject(item.project?.projectId || item.id, item)
            ));
        } else if (key === 'students') {
            await Promise.allSettled(items.map((item: any) => 
                apiClient.updateStudent(item.studentId || item.id, item)
            ));
        } else if (key === 'advisors') {
            await Promise.allSettled(items.map((item: any) => 
                apiClient.updateAdvisor(item.id, item)
            ));
        } else if (key === 'majors') {
            await Promise.allSettled(items.map((item: any) => 
                apiClient.updateMajor(item.id, item)
            ));
        } else if (key === 'classrooms') {
            await Promise.allSettled(items.map((item: any) => 
                apiClient.updateClassroom(item.id, item)
            ));
        }
        
        localStorage.setItem(`${key}_${year}`, JSON.stringify(items));
        return items;
    } catch (error) {
        console.warn(`Backend update failed for ${key}, falling back to localStorage.`, error);
        localStorage.setItem(`${key}_${year}`, JSON.stringify(items));
        return items;
    }
  },
  
  // Generic PATCH to bulk update fields
  bulkUpdateCollection: async <T extends { [key: string]: any }>(year: string, key: string, ids: string[], updates: Partial<T>): Promise<T[]> => {
    try {
        // Use appropriate API method based on key
        if (key === 'students') {
            await Promise.allSettled(ids.map(id => 
                apiClient.updateStudent(id, updates)
            ));
        } else if (key === 'advisors') {
            await Promise.allSettled(ids.map(id => 
                apiClient.updateAdvisor(id, updates)
            ));
        } else if (key === 'majors') {
            await Promise.allSettled(ids.map(id => 
                apiClient.updateMajor(id, updates)
            ));
        } else if (key === 'classrooms') {
            await Promise.allSettled(ids.map(id => 
                apiClient.updateClassroom(id, updates)
            ));
        }
        
        // Update localStorage
        const stored = localStorage.getItem(`${key}_${year}`);
        const collection: T[] = stored ? JSON.parse(stored) : [];
        const idKey = key === 'students' ? 'studentId' : 'id';
        const updatedCollection = collection.map(item => ids.includes(item[idKey]) ? { ...item, ...updates } : item);
        localStorage.setItem(`${key}_${year}`, JSON.stringify(updatedCollection));
        return updatedCollection;
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
        let newItem: any;
        // Use appropriate API method based on key
        if (key === 'students') {
            const res = await apiClient.createStudent(item);
            newItem = res.data;
        } else if (key === 'advisors') {
            const res = await apiClient.createAdvisor(item);
            newItem = res.data;
        } else if (key === 'majors') {
            const res = await apiClient.createMajor(item);
            newItem = res.data;
        } else if (key === 'classrooms') {
            const res = await apiClient.createClassroom(item);
            newItem = res.data;
        } else {
            newItem = item;
        }
        
        const stored = localStorage.getItem(`${key}_${year}`);
        const collection = stored ? JSON.parse(stored) : [];
        const newCollection = [...collection, newItem];
        localStorage.setItem(`${key}_${year}`, JSON.stringify(newCollection));
        return newCollection;
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
        // Use appropriate API method based on key
        if (key === 'students') {
            await apiClient.deleteStudent(id);
        } else if (key === 'advisors') {
            await apiClient.deleteAdvisor(id);
        } else if (key === 'majors') {
            await apiClient.deleteMajor(id);
        } else if (key === 'classrooms') {
            await apiClient.deleteClassroom(id);
        }
        
        const stored = localStorage.getItem(`${key}_${year}`);
        const collection: T[] = stored ? JSON.parse(stored) : [];
        const idKey = key === 'students' ? 'studentId' : 'id';
        const newCollection = collection.filter(item => item[idKey] !== id);
        localStorage.setItem(`${key}_${year}`, JSON.stringify(newCollection));
        return newCollection;
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
        // Use appropriate API method based on key
        await Promise.allSettled(ids.map(id => {
            if (key === 'students') {
                return apiClient.deleteStudent(id);
            } else if (key === 'advisors') {
                return apiClient.deleteAdvisor(id);
            } else if (key === 'majors') {
                return apiClient.deleteMajor(id);
            } else if (key === 'classrooms') {
                return apiClient.deleteClassroom(id);
            }
        }));
        
        const stored = localStorage.getItem(`${key}_${year}`);
        const collection: T[] = stored ? JSON.parse(stored) : [];
        const idKey = key === 'students' ? 'studentId' : 'id';
        const newCollection = collection.filter(item => !ids.includes(item[idKey]));
        localStorage.setItem(`${key}_${year}`, JSON.stringify(newCollection));
        return newCollection;
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
    // Map frontend keys to backend setting types
    const settingTypeMap: Record<string, 'milestone_templates' | 'announcements' | 'defense_settings' | 'scoring_settings'> = {
        'milestoneTemplates': 'milestone_templates',
        'announcements': 'announcements',
        'defenseSettings': 'defense_settings',
        'scoringSettings': 'scoring_settings'
    };

    const settingType = settingTypeMap[key];
    
    if (settingType) {
        // Try to update via Backend API
        try {
            const response = await apiClient.updateAppSetting(settingType, settings, year);
            if (response.status >= 200 && response.status < 300) {
                // Update successful, also cache in localStorage as backup
                localStorage.setItem(`${key}_${year}`, JSON.stringify(settings));
                return settings;
            } else {
                throw new Error(`Backend API returned status ${response.status}`);
            }
        } catch (error) {
            console.warn(`Backend settings update failed for ${key}, falling back to localStorage.`, error);
            // Fallback to localStorage
            localStorage.setItem(`${key}_${year}`, JSON.stringify(settings));
            return settings;
        }
    } else {
        // Unknown setting type, use localStorage only
        console.warn(`Unknown setting type: ${key}, using localStorage only.`);
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
                let token = localStorage.getItem('auth_token');
                const refreshToken = localStorage.getItem('refresh_token');
                
                // Helper function to refresh token if needed
                const tryRefreshToken = async (): Promise<string | null> => {
                    if (!refreshToken) return null;
                    try {
                        // Use apiClient for token refresh
                        const refreshResponse = await apiClient.request('/api/auth/token/refresh/', {
                            method: 'POST',
                            body: JSON.stringify({ refresh: refreshToken }),
                        });
                        if (refreshResponse.status === 200 && refreshResponse.data) {
                            const newToken = refreshResponse.data.access || refreshResponse.data.token;
                            if (newToken) {
                                apiClient.setToken(newToken);
                                return newToken;
                            }
                        } else {
                            // Refresh token is invalid, clear it
                            apiClient.clearToken();
                        }
                    } catch (error) {
                        console.warn('Failed to refresh token:', error);
                        apiClient.clearToken();
                    }
                    return null;
                };

                // If no access token but have refresh token, try to refresh first
                if (!token && refreshToken) {
                    token = await tryRefreshToken();
                }

                // Only make API calls if user is authenticated
                // If not authenticated, skip API calls and use localStorage fallback
                const isAuthenticated = !!token;
                
                // Load data from real backend API using apiClient (only if authenticated)
                const [projectsRes, studentsRes, advisorsRes, majorsRes, classroomsRes] = await Promise.allSettled(
                    isAuthenticated ? [
                        apiClient.getProjects({ academic_year: currentAcademicYear }),
                        apiClient.getStudents({ academic_year: currentAcademicYear }),
                        apiClient.getAdvisors({ academic_year: currentAcademicYear }),
                        apiClient.getMajors({ academic_year: currentAcademicYear }),
                        apiClient.getClassrooms({ academic_year: currentAcademicYear }),
                    ] : [
                        // If not authenticated, create rejected promises that will be handled gracefully
                        Promise.resolve({ status: 401, data: null, error: 'Unauthorized' } as any),
                        Promise.resolve({ status: 401, data: null, error: 'Unauthorized' } as any),
                        Promise.resolve({ status: 401, data: null, error: 'Unauthorized' } as any),
                        Promise.resolve({ status: 401, data: null, error: 'Unauthorized' } as any),
                        Promise.resolve({ status: 401, data: null, error: 'Unauthorized' } as any),
                    ]
                );

                // Helper function to process response (now handles ApiResponse from apiClient)
                const processResponse = <T,>(
                    result: PromiseSettledResult<any>,
                    errorMessage: string,
                    transformFn?: (data: any) => T[]
                ): T[] | null => {
                    if (result.status === 'fulfilled') {
                        const apiResponse = result.value;
                        if (apiResponse && apiResponse.status >= 200 && apiResponse.status < 300) {
                            const data = apiResponse.data;
                            if (transformFn) {
                                return transformFn(data);
                            }
                            return Array.isArray(data) ? data : (data.results || data.data || []);
                        } else if (apiResponse?.status === 401) {
                            // Don't log 401 errors as warnings - they're expected when user is not authenticated
                            // Only log if we have a token (meaning it might be expired)
                            if (token) {
                                console.debug(`${errorMessage}: Authentication required (401) - token may be expired`);
                            }
                            return null;
                        } else {
                            const status = apiResponse?.status || 'Unknown';
                            if (status !== 401) {
                                console.warn(`${errorMessage}: HTTP ${status}`);
                            }
                            return null;
                        }
                    } else {
                        // Only log if it's not a network error that might be related to auth
                        const reason = String(result.reason || '');
                        if (!reason.includes('401') && !reason.includes('Unauthorized')) {
                            console.warn(`${errorMessage}: ${result.reason}`);
                        }
                        return null;
                    }
                };

                // Process projects
                const projectsData = processResponse(
                    projectsRes,
                    'Failed to load projects from backend',
                    (data: any) => {
                        const transformedProjects = Array.isArray(data) ? data : (data.results || data.data || []);
                        return transformedProjects.map((p: any) => ({
                            project: p,
                            students: p.students || []
                        }));
                    }
                );
                if (projectsData) {
                    setProjectGroups(projectsData);
                } else {
                    // Only log if we have a token (meaning it's an unexpected failure)
                    if (token) {
                        console.debug('Failed to load projects from backend, using empty array');
                    }
                    setProjectGroups([]);
                }

                // Process students
                const studentsData = processResponse(
                    studentsRes,
                    'Failed to load students from backend',
                    (data: any) => {
                        const rawStudents = Array.isArray(data) ? data : (data.results || data.data || []);
                        return rawStudents.map((s: any, index: number) => {
                            const studentId = s.student_id || s.studentId || s.id?.toString() || '';
                            const backendId = s.id?.toString() || '';
                            // Use backend id as primary id, fallback to studentId-index for uniqueness
                            const uniqueId = backendId || `${studentId}-${index}` || `S${Date.now()}-${index}`;
                            
                            return {
                                id: uniqueId,
                                studentId: studentId,
                                name: s.user?.first_name || s.name || s.first_name || '',
                                surname: s.user?.last_name || s.surname || s.last_name || '',
                                major: s.major_name || s.major?.name || s.major || '',
                                classroom: s.classroom_name || s.classroom?.name || s.classroom || '',
                                gender: s.gender || 'Male',
                                tel: s.tel || s.phone || s.user?.phone || '',
                                email: s.user?.email || s.email || '',
                                status: s.status || 'Pending',
                                isAiAssistantEnabled: s.isAiAssistantEnabled !== undefined ? s.isAiAssistantEnabled : true,
                            };
                        }).filter((s: any) => s.studentId);
                    }
                );
                if (studentsData) {
                    setStudents(studentsData);
                } else {
                    // Only log if we have a token (meaning it's an unexpected failure)
                    if (token) {
                        console.debug('Failed to load students from backend, using empty array');
                    }
                    setStudents([]);
                }

                // Process advisors
                const advisorsData = processResponse(
                    advisorsRes,
                    'Failed to load advisors from backend',
                    (data: any) => {
                        const rawAdvisors = Array.isArray(data) ? data : (data.results || data.data || []);
                        return rawAdvisors.map((a: any) => ({
                            id: a.id?.toString() || a.advisor_id || '',
                            name: a.user?.full_name || (a.user?.first_name && a.user?.last_name ? `${a.user.first_name} ${a.user.last_name}` : '') || a.name || '',
                            quota: a.quota || 10,
                            mainCommitteeQuota: a.main_committee_quota || a.mainCommitteeQuota || 5,
                            secondCommitteeQuota: a.second_committee_quota || a.secondCommitteeQuota || 5,
                            thirdCommitteeQuota: a.third_committee_quota || a.thirdCommitteeQuota || 5,
                            specializedMajorIds: a.specializedMajorIds || (a.specializations?.map((s: any) => {
                                if (s.major && typeof s.major === 'object') return s.major.id || s.major;
                                if (typeof s.major === 'string') {
                                    const major = initialMajors.find(m => m.name === s.major);
                                    return major?.id;
                                }
                                return s.id;
                            }).filter((id: any) => id) || []),
                            isDepartmentAdmin: a.is_department_admin || a.isDepartmentAdmin || false,
                            password: a.password || 'password123',
                            isAiAssistantEnabled: a.isAiAssistantEnabled !== undefined ? a.isAiAssistantEnabled : true,
                        })).filter((a: any) => a.id && a.name);
                    }
                );
                if (advisorsData) {
                    setAdvisors(advisorsData);
                } else {
                    // Only log if we have a token (meaning it's an unexpected failure)
                    if (token) {
                        console.debug('Failed to load advisors from backend, using empty array');
                    }
                    setAdvisors([]);
                }

                // Process majors
                const majorsData = processResponse(majorsRes, 'Failed to load majors from backend');
                if (majorsData) {
                    setMajors(majorsData);
                } else {
                    // Only log if we have a token (meaning it's an unexpected failure)
                    if (token) {
                        console.debug('Failed to load majors from backend, using initial majors');
                    }
                    setMajors(initialMajors);
                }

                // Process classrooms
                const classroomsData = processResponse(
                    classroomsRes, 
                    'Failed to load classrooms from backend',
                    (data: any) => {
                        const rawClassrooms = Array.isArray(data) ? data : (data.results || data.data || []);
                        const loadedMajors = majors.length > 0 ? majors : initialMajors;
                        return rawClassrooms.map((c: any) => {
                            // Find major by backend ID or name
                            const majorId = c.major;
                            const majorName = c.major_name || c.majorName || '';
                            const frontendMajor = loadedMajors.find((m: Major) => 
                                m.id === majorId?.toString() || 
                                m.name === majorName ||
                                (typeof majorId === 'number' && m.id === majorId.toString())
                            );
                            
                            return {
                                id: c.id?.toString() || `C${Date.now()}`,
                                name: c.name || '',
                                majorId: frontendMajor?.id || majorId?.toString() || '',
                                majorName: frontendMajor?.name || majorName || '',
                            };
                        });
                    }
                );
                if (classroomsData) {
                    setClassrooms(classroomsData);
                } else {
                    // Only log if we have a token (meaning it's an unexpected failure)
                    if (token) {
                        console.debug('Failed to load classrooms from backend, using initial classrooms');
                    }
                    setClassrooms(initialClassrooms);
                }

                // Set defaults for other data
                setMilestoneTemplates(initialMilestoneTemplates);
                setAnnouncements([]);
                setDefenseSettings({ startDefenseDate: '', timeSlots: '09:00-10:00,10:15-11:15,13:00-14:00,14:15-15:15', rooms: [], stationaryAdvisors: {}, timezone: 'Asia/Bangkok' });
                setScoringSettings({ mainAdvisorWeight: 60, committeeWeight: 40, gradeBoundaries: [], advisorRubrics: [], committeeRubrics: [] });
            } catch (error) {
                console.error("Failed to load data from backend:", error);
                addToast({ type: 'error', message: 'ไม่สามารถโหลดข้อมูลจากเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ' });
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

            // Use apiClient to create project
            const response = await apiClient.createProject(backendPayload);

            if (response.status >= 200 && response.status < 300) {
                const createdProject = response.data;
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
    }, [advisors, addNotification, addProjectLogEntry, t, currentAcademicYear, addToast]);

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

    const addStudent = useCallback(async (student: Student) => {
        try {
            // Try to use backend API first
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Helper function to generate secure password that passes validation
            const generateSecurePassword = (): string => {
                // Generate password with: uppercase, lowercase, numbers, and special chars
                // Use more characters to avoid common patterns
                const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude similar chars (I, O)
                const lowercase = 'abcdefghijkmnpqrstuvwxyz'; // Exclude similar chars (l, o)
                const numbers = '23456789'; // Exclude 0, 1
                const special = '!@#$%&*';
                
                // Generate password with length 8-15 characters
                let password = '';
                
                // Ensure at least one of each type
                password += uppercase[Math.floor(Math.random() * uppercase.length)];
                password += lowercase[Math.floor(Math.random() * lowercase.length)];
                password += numbers[Math.floor(Math.random() * numbers.length)];
                password += special[Math.floor(Math.random() * special.length)];
                
                // Add more random characters to reach target length (8-15 chars)
                const allChars = uppercase + lowercase + numbers + special;
                const targetLength = 8 + Math.floor(Math.random() * 8); // 8-15 chars
                
                for (let i = password.length; i < targetLength; i++) {
                    password += allChars[Math.floor(Math.random() * allChars.length)];
                }
                
                // Shuffle password using Fisher-Yates algorithm for better randomness
                const passwordArray = password.split('');
                for (let i = passwordArray.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
                }
                
                return passwordArray.join('');
            };

            // First, check if student ID already exists
            const studentId = student.studentId?.trim().toUpperCase();
            if (!studentId) {
                throw new Error('Student ID is required');
            }

            // Check for duplicate student ID in existing students
            const existingStudent = students.find(s => 
                s.studentId?.trim().toUpperCase() === studentId
            );
            if (existingStudent) {
                throw new Error(`Student ID ${studentId} already exists`);
            }

            // Check for duplicate student ID in backend
            try {
                // Use apiClient to check if student ID exists
                const checkResponse = await apiClient.getStudents({ academic_year: currentAcademicYear });
                if (checkResponse.status >= 200 && checkResponse.status < 300) {
                    const checkData = checkResponse.data;
                    const studentsList = Array.isArray(checkData) ? checkData : (checkData.results || checkData.data || []);
                    const existingStudent = studentsList.find((s: any) => 
                        (s.student_id || s.studentId || '').toLowerCase() === studentId.toLowerCase()
                    );
                    if (existingStudent) {
                        throw new Error(`Student ID ${studentId} already exists in the system`);
                    }
                }
            } catch (checkError) {
                // If check fails, continue anyway (backend will validate)
                console.warn('Could not check student ID in backend:', checkError);
            }

            // First, create user account
            let userId: number;
            try {
                // Generate unique username from student ID
                let username = studentId.toLowerCase().replace(/\//g, '_').replace(/\s+/g, '_').replace(/-/g, '_');
                // Ensure username is unique by checking and appending suffix if needed
                let usernameAttempts = 0;
                const originalUsername = username;
                while (usernameAttempts < 5) {
                    try {
                        // Check if username exists (we'll handle this in the registration attempt)
                        username = usernameAttempts > 0 ? `${originalUsername}_${usernameAttempts}` : originalUsername;
                        usernameAttempts++;
                        break; // Proceed to registration
                    } catch {
                        // Continue to next attempt
                    }
                }

                // Generate unique email to avoid conflicts
                // Check if email already exists and generate unique one
                let email = student.email?.toLowerCase().trim();
                if (!email) {
                    // Generate unique email with timestamp and random suffix
                    const timestamp = Date.now();
                    const randomSuffix = Math.random().toString(36).substring(2, 9);
                    email = `${username}_${timestamp}_${randomSuffix}@university.edu`;
                }
                
                // Skip email uniqueness check - backend will validate during registration
                // If email already exists, backend will return an error and we'll handle it
                
                // Use secure password generator - ensure it's strong enough
                let password = student.password;
                if (!password) {
                    password = generateSecurePassword();
                }
                
                // Double-check password strength and regenerate if needed
                const hasUpper = /[A-Z]/.test(password);
                const hasLower = /[a-z]/.test(password);
                const hasNumber = /[0-9]/.test(password);
                const hasSpecial = /[!@#$%&*]/.test(password);
                const isLongEnough = password.length >= 8 && password.length <= 15;
                
                // Regenerate if not strong enough (for student accounts, we need basic requirements)
                if (!hasUpper || !hasLower || !hasNumber || !isLongEnough) {
                    password = generateSecurePassword();
                }
                
                // Convert academic year format if needed
                const academicYear = currentAcademicYear.includes('-') 
                    ? currentAcademicYear 
                    : `${currentAcademicYear}-${parseInt(currentAcademicYear) + 1}`;
                
                // Create new user with retry logic for email conflicts
                let createUserResponse;
                let registrationAttempts = 0;
                let registrationSuccess = false;
                
                while (registrationAttempts < 3 && !registrationSuccess) {
                    try {
                        // Use apiClient to register user
                        try {
                            createUserResponse = await apiClient.register({
                                username: registrationAttempts > 0 ? `${username}_${registrationAttempts}` : username,
                                email: registrationAttempts > 0 ? `${email.split('@')[0]}_${registrationAttempts}@university.edu` : email,
                                password,
                                password_confirm: password,
                                first_name: student.name || '',
                                last_name: student.surname || '',
                                role: 'Student', // Must be capital S
                                current_academic_year: academicYear,
                            });
                            
                            if (createUserResponse.status >= 200 && createUserResponse.status < 300) {
                                registrationSuccess = true;
                                break;
                            }
                            
                            // Parse error response
                            const errorData = createUserResponse.error || createUserResponse.data || { message: 'Unknown error' };
                        } catch (parseError) {
                            errorData = { message: 'Failed to parse error response' };
                        }
                        
                        // Check if it's an email/username conflict
                        if (errorData.errors) {
                            const hasEmailError = errorData.errors.email && errorData.errors.email.some((e: string) => e.includes('already exists'));
                            const hasUsernameError = errorData.errors.username && errorData.errors.username.some((e: string) => e.includes('already exists'));
                            
                            if (hasEmailError || hasUsernameError) {
                                registrationAttempts++;
                                // Generate new email/username for retry
                                const timestamp = Date.now();
                                const randomSuffix = Math.random().toString(36).substring(2, 9);
                                email = `${username}_${timestamp}_${randomSuffix}@university.edu`;
                                username = `${username}_${timestamp}`;
                                continue;
                            }
                        }
                        
                        // If not a conflict error, throw immediately
                        throw new Error(JSON.stringify(errorData));
                    } catch (fetchError: any) {
                        if (registrationAttempts >= 2) {
                            // Last attempt failed
                            let errorMessage = 'Failed to create user account.';
                            try {
                                const errorData = JSON.parse(fetchError.message);
                                if (errorData.errors) {
                                    const errorMessages: string[] = [];
                                    Object.keys(errorData.errors).forEach((key: string) => {
                                        const fieldErrors = errorData.errors[key];
                                        if (Array.isArray(fieldErrors)) {
                                            errorMessages.push(`${key}: ${fieldErrors.join(', ')}`);
                                        } else {
                                            errorMessages.push(`${key}: ${fieldErrors}`);
                                        }
                                    });
                                    errorMessage = errorMessages.join('; ');
                                } else if (errorData.message) {
                                    errorMessage = errorData.message;
                                } else if (errorData.detail) {
                                    errorMessage = errorData.detail;
                                }
                            } catch {
                                errorMessage = fetchError.message || 'Failed to create user account';
                            }
                            throw new Error(errorMessage);
                        }
                        registrationAttempts++;
                    }
                }
                
                if (!registrationSuccess || !createUserResponse || !createUserResponse.ok) {
                    throw new Error('Failed to create user account after multiple attempts');
                }
                
                const newUser = createUserResponse.data;
                userId = newUser.user?.id || newUser.id;
            } catch (userError: any) {
                // Extract error message properly
                let errorMessage = 'Failed to create user account';
                try {
                    if (typeof userError.message === 'string') {
                        // Try to parse if it's a JSON string
                        try {
                            const parsed = JSON.parse(userError.message);
                            if (parsed.errors) {
                                const errorMessages: string[] = [];
                                Object.keys(parsed.errors).forEach((key: string) => {
                                    const fieldErrors = parsed.errors[key];
                                    if (Array.isArray(fieldErrors)) {
                                        errorMessages.push(`${key}: ${fieldErrors.join(', ')}`);
                                    } else {
                                        errorMessages.push(`${key}: ${fieldErrors}`);
                                    }
                                });
                                errorMessage = errorMessages.join('; ');
                            } else if (parsed.message) {
                                errorMessage = parsed.message;
                            } else {
                                errorMessage = userError.message;
                            }
                        } catch {
                            // Not JSON, use as is
                            errorMessage = userError.message;
                        }
                    } else {
                        errorMessage = userError.message || errorMessage;
                    }
                } catch {
                    errorMessage = 'Failed to create user account';
                }
                
                console.warn('Failed to create user, falling back to localStorage:', errorMessage);
                
                // Show notification to user about the error
                addToast({
                    type: 'warning',
                    message: `User account creation failed: ${errorMessage}. Student saved to local storage only.`
                });
                
                // Fallback to localStorage
                const newId = `S${students.length + 1}`;
                const stored = localStorage.getItem(`students_${currentAcademicYear}`);
                const collection = stored ? JSON.parse(stored) : [];
                const newCollection = [...collection, { ...student, id: newId, isAiAssistantEnabled: true }];
                localStorage.setItem(`students_${currentAcademicYear}`, JSON.stringify(newCollection));
                setStudents(newCollection);
                return newCollection;
            }

            // Find major and classroom IDs from backend
            let majorBackendId: number;
            let classroomBackendId: number;
            
            try {
                // Get major ID using apiClient
                const majorsResponse = await apiClient.getMajors({ academic_year: currentAcademicYear });
                if (majorsResponse.status >= 200 && majorsResponse.status < 300) {
                    const majorsData = majorsResponse.data;
                    const majorsList = Array.isArray(majorsData) ? majorsData : (majorsData.results || majorsData.data || []);
                    const major = majors.find(m => m.name === student.major);
                    const backendMajor = majorsList.find((m: any) => 
                        m.name === major?.name || m.abbreviation === major?.abbreviation
                    );
                    if (backendMajor) {
                        majorBackendId = backendMajor.id;
                    } else {
                        throw new Error('Major not found in backend');
                    }
                } else {
                    throw new Error('Failed to fetch majors');
                }

                // Get classroom ID using apiClient
                const classroomsResponse = await apiClient.getClassrooms({ academic_year: currentAcademicYear });
                if (classroomsResponse.status >= 200 && classroomsResponse.status < 300) {
                    const classroomsData = classroomsResponse.data;
                    const classroomsList = Array.isArray(classroomsData) ? classroomsData : (classroomsData.results || classroomsData.data || []);
                    const classroom = classrooms.find(c => c.name === student.classroom);
                    const backendClassroom = classroomsList.find((c: any) => 
                        c.name === classroom?.name
                    );
                    if (backendClassroom) {
                        classroomBackendId = backendClassroom.id;
                    } else {
                        throw new Error('Classroom not found in backend');
                    }
                } else {
                    throw new Error('Failed to fetch classrooms');
                }
            } catch (lookupError) {
                console.warn('Failed to get major/classroom IDs, falling back to localStorage:', lookupError);
                // Fallback to localStorage
                const newId = `S${students.length + 1}`;
                const stored = localStorage.getItem(`students_${currentAcademicYear}`);
                const collection = stored ? JSON.parse(stored) : [];
                const newCollection = [...collection, { ...student, id: newId, isAiAssistantEnabled: true }];
                localStorage.setItem(`students_${currentAcademicYear}`, JSON.stringify(newCollection));
                setStudents(newCollection);
                return newCollection;
            }

            // Convert academic year format if needed
            const academicYear = currentAcademicYear.includes('-') 
                ? currentAcademicYear 
                : `${currentAcademicYear}-${parseInt(currentAcademicYear) + 1}`;

            // Create student with backend API
            // Use normalized student ID (uppercase)
            const studentPayload = {
                user_id: userId,
                student_id: studentId, // Use normalized student ID from earlier check
                major: majorBackendId,
                classroom: classroomBackendId,
                academic_year: academicYear,
            };

            // Use apiClient to create student
            const response = await apiClient.createStudent(studentPayload);

            if (response.status < 200 || response.status >= 300) {
                const errorData = response.error || response.data || {};
                
                // Extract error messages from response
                let errorMessage = 'Failed to create student record.';
                if (errorData.errors) {
                    const errorMessages: string[] = [];
                    Object.keys(errorData.errors).forEach(key => {
                        const fieldErrors = errorData.errors[key];
                        if (Array.isArray(fieldErrors)) {
                            errorMessages.push(`${key}: ${fieldErrors.join(', ')}`);
                        } else {
                            errorMessages.push(`${key}: ${fieldErrors}`);
                        }
                    });
                    errorMessage = errorMessages.join('; ');
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.student_id) {
                    // Handle student_id validation error
                    if (Array.isArray(errorData.student_id)) {
                        errorMessage = `Student ID: ${errorData.student_id.join(', ')}`;
                    } else {
                        errorMessage = `Student ID: ${errorData.student_id}`;
                    }
                }
                
                throw new Error(errorMessage);
            }

            if (response.status >= 200 && response.status < 300) {
                const createdStudent = response.data;
                // Reload students list using apiClient
                const studentsResponse = await apiClient.getStudents({ academic_year: currentAcademicYear });
                if (studentsResponse.status >= 200 && studentsResponse.status < 300) {
                    const studentsData = studentsResponse.data;
                    const rawStudents = Array.isArray(studentsData) ? studentsData : (studentsData.results || studentsData.data || []);
                    // Transform backend format to frontend format with unique ids
                    const studentsList = rawStudents.map((s: any, index: number) => {
                        const studentId = s.student_id || s.studentId || s.id?.toString() || '';
                        const backendId = s.id?.toString() || '';
                        const uniqueId = backendId || `${studentId}-${index}` || `S${Date.now()}-${index}`;
                        
                        return {
                            id: uniqueId,
                            studentId: studentId,
                            name: s.user?.first_name || s.name || s.first_name || '',
                            surname: s.user?.last_name || s.surname || s.last_name || '',
                            major: s.major_name || s.major?.name || s.major || '',
                            classroom: s.classroom_name || s.classroom?.name || s.classroom || '',
                            gender: s.gender || 'Male',
                            tel: s.tel || s.phone || s.user?.phone || '',
                            email: s.user?.email || s.email || '',
                            status: s.status || 'Pending',
                            isAiAssistantEnabled: s.isAiAssistantEnabled !== undefined ? s.isAiAssistantEnabled : true,
                        };
                    }).filter((s: any) => s.studentId);
                    setStudents(studentsList);
                    return studentsList;
                }
                // If reload fails, transform created student and return
                const studentId = createdStudent.student_id || createdStudent.studentId || createdStudent.id?.toString() || student.studentId || '';
                const backendId = createdStudent.id?.toString() || '';
                const uniqueId = backendId || `${studentId}-${Date.now()}` || `S${Date.now()}`;
                const transformedStudent = {
                    id: uniqueId,
                    studentId: studentId,
                    name: createdStudent.user?.first_name || createdStudent.name || createdStudent.first_name || student.name || '',
                    surname: createdStudent.user?.last_name || createdStudent.surname || createdStudent.last_name || student.surname || '',
                    major: createdStudent.major_name || createdStudent.major?.name || createdStudent.major || student.major || '',
                    classroom: createdStudent.classroom_name || createdStudent.classroom?.name || createdStudent.classroom || student.classroom || '',
                    gender: createdStudent.gender || student.gender || 'Male',
                    tel: createdStudent.tel || createdStudent.phone || createdStudent.user?.phone || student.tel || '',
                    email: createdStudent.user?.email || createdStudent.email || student.email || '',
                    status: createdStudent.status || student.status || 'Pending',
                    isAiAssistantEnabled: createdStudent.isAiAssistantEnabled !== undefined ? createdStudent.isAiAssistantEnabled : true,
                };
                const newList = [...students, transformedStudent];
                setStudents(newList);
                return newList;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || errorData.message || `Failed to create student: ${response.status}`);
            }
        } catch (error) {
            console.warn('Backend API failed, falling back to localStorage:', error);
            // Fallback to localStorage - use unique id
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(2, 6);
            const newId = student.studentId ? `${student.studentId}-${timestamp}-${randomSuffix}` : `S${timestamp}-${randomSuffix}`;
            const stored = localStorage.getItem(`students_${currentAcademicYear}`);
            const collection = stored ? JSON.parse(stored) : [];
            const newCollection = [...collection, { ...student, id: newId, isAiAssistantEnabled: true }];
            localStorage.setItem(`students_${currentAcademicYear}`, JSON.stringify(newCollection));
            setStudents(newCollection);
            return newCollection;
        }
    }, [students, majors, classrooms, currentAcademicYear, setStudents]);
    const updateStudent = useCallback(async (student: Student) => {
        try {
            // Try to use backend API first
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Find student ID from backend (need to find by student_id)
            let studentBackendId: number | null = null;
            try {
                // Use apiClient to get student ID
                const studentsResponse = await apiClient.getStudents({ academic_year: currentAcademicYear });
                if (studentsResponse.status >= 200 && studentsResponse.status < 300) {
                    const studentsData = studentsResponse.data;
                    const studentsList = Array.isArray(studentsData) ? studentsData : (studentsData.results || studentsData.data || []);
                    const backendStudent = studentsList.find((s: any) => 
                        s.student_id === student.studentId || (s.id && s.id.toString() === student.id)
                    );
                    if (backendStudent) {
                        studentBackendId = backendStudent.id;
                    }
                }
            } catch (error) {
                console.warn('Failed to get student ID from backend, falling back to localStorage:', error);
            }

            if (studentBackendId !== null) {
                // Find major and classroom IDs from backend using apiClient
                let majorBackendId: number | undefined;
                let classroomBackendId: number | undefined;
                
                try {
                    // Get major ID using apiClient
                    const majorsResponse = await apiClient.getMajors({ academic_year: currentAcademicYear });
                    if (majorsResponse.status >= 200 && majorsResponse.status < 300) {
                        const majorsData = majorsResponse.data;
                        const majorsList = Array.isArray(majorsData) ? majorsData : (majorsData.results || majorsData.data || []);
                        const major = majors.find(m => m.name === student.major);
                        const backendMajor = majorsList.find((m: any) => 
                            m.name === major?.name || m.abbreviation === major?.abbreviation
                        );
                        if (backendMajor) {
                            majorBackendId = backendMajor.id;
                        }
                    }

                    // Get classroom ID using apiClient
                    const classroomsResponse = await apiClient.getClassrooms({ academic_year: currentAcademicYear });
                    if (classroomsResponse.status >= 200 && classroomsResponse.status < 300) {
                        const classroomsData = classroomsResponse.data;
                        const classroomsList = Array.isArray(classroomsData) ? classroomsData : (classroomsData.results || classroomsData.data || []);
                        const classroom = classrooms.find(c => c.name === student.classroom);
                        const backendClassroom = classroomsList.find((c: any) => 
                            c.name === classroom?.name
                        );
                        if (backendClassroom) {
                            classroomBackendId = backendClassroom.id;
                        }
                    }
                } catch (lookupError) {
                    console.warn('Failed to get major/classroom IDs:', lookupError);
                }

                // Convert academic year format if needed
                const academicYear = currentAcademicYear.includes('-') 
                    ? currentAcademicYear 
                    : `${currentAcademicYear}-${parseInt(currentAcademicYear) + 1}`;

                const studentPayload: any = {
                    student_id: student.studentId,
                    academic_year: academicYear,
                };
                if (majorBackendId !== undefined) studentPayload.major = majorBackendId;
                if (classroomBackendId !== undefined) studentPayload.classroom = classroomBackendId;

                // Use apiClient to update student
                const response = await apiClient.updateStudent(studentBackendId, studentPayload);

                if (response.status >= 200 && response.status < 300) {
                    // Reload students list using apiClient
                    const studentsResponse = await apiClient.getStudents({ academic_year: currentAcademicYear });
                    if (studentsResponse.status >= 200 && studentsResponse.status < 300) {
                        const studentsData = studentsResponse.data;
                        const rawStudents = Array.isArray(studentsData) ? studentsData : (studentsData.results || studentsData.data || []);
                        // Transform backend format to frontend format with unique ids
                        const studentsList = rawStudents.map((s: any, index: number) => {
                            const studentId = s.student_id || s.studentId || s.id?.toString() || '';
                            const backendId = s.id?.toString() || '';
                            const uniqueId = backendId || `${studentId}-${index}` || `S${Date.now()}-${index}`;
                            
                            return {
                                id: uniqueId,
                                studentId: studentId,
                                name: s.user?.first_name || s.name || s.first_name || '',
                                surname: s.user?.last_name || s.surname || s.last_name || '',
                                major: s.major_name || s.major?.name || s.major || '',
                                classroom: s.classroom_name || s.classroom?.name || s.classroom || '',
                                gender: s.gender || 'Male',
                                tel: s.tel || s.phone || s.user?.phone || '',
                                email: s.user?.email || s.email || '',
                                status: s.status || 'Pending',
                                isAiAssistantEnabled: s.isAiAssistantEnabled !== undefined ? s.isAiAssistantEnabled : true,
                            };
                        }).filter((s: any) => s.studentId);
                        setStudents(studentsList);
                        return studentsList;
                    }
                }
            }

            // Fallback to localStorage
            const updatedStudents = students.map(s => s.studentId === student.studentId ? student : s);
            localStorage.setItem(`students_${currentAcademicYear}`, JSON.stringify(updatedStudents));
            setStudents(updatedStudents);
            return updatedStudents;
        } catch (error) {
            console.error('Failed to update student.', error);
            addToast({ type: 'error', message: 'Failed to update student.' });
        }
    }, [students, majors, classrooms, currentAcademicYear, setStudents, addToast]);

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
    const bulkDeleteStudents = useCallback(async (studentIds: string[]) => {
        try {
            // Try to use backend API first
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Backend expects student_ids (student_id values) not IDs
            // Get student_id values from students list
            const studentIdValues = students
                .filter(s => studentIds.includes(s.id) || studentIds.includes(s.studentId || ''))
                .map(s => s.studentId || s.id);

            // Use apiClient to bulk delete students (delete individually)
            try {
                await Promise.allSettled(
                    studentIdValues.map(id => apiClient.deleteStudent(id))
                );
            } catch (error) {
                console.warn('Bulk delete failed, some students may not be deleted:', error);
            }

            // Reload students list using apiClient
            const studentsResponse = await apiClient.getStudents({ academic_year: currentAcademicYear });
            if (studentsResponse.status >= 200 && studentsResponse.status < 300) {
                const studentsData = studentsResponse.data;
                const studentsList = Array.isArray(studentsData) ? studentsData : (studentsData.results || studentsData.data || []);
                setStudents(studentsList);
                return studentsList;
            }

            // Fallback to localStorage
            const updatedStudents = students.filter(s => !studentIds.includes(s.id) && !studentIds.includes(s.studentId || ''));
            localStorage.setItem(`students_${currentAcademicYear}`, JSON.stringify(updatedStudents));
            setStudents(updatedStudents);
            return updatedStudents;
        } catch (error) {
            console.warn('Backend API failed, falling back to localStorage:', error);
            // Fallback to localStorage
            const updatedStudents = students.filter(s => !studentIds.includes(s.id) && !studentIds.includes(s.studentId || ''));
            localStorage.setItem(`students_${currentAcademicYear}`, JSON.stringify(updatedStudents));
            setStudents(updatedStudents);
            return updatedStudents;
        }
    }, [students, currentAcademicYear, setStudents]);

    const addAdvisor = useCallback(async (advisor: Omit<Advisor, 'id'>) => {
        try {
            // Try to use backend API first
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Convert frontend format to backend format
            const nameParts = advisor.name?.split(' ') || [];
            const firstName = nameParts[0] || advisor.name || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            const username = advisor.name?.toLowerCase().replace(/\s+/g, '.') || `advisor${Date.now()}`;
            const email = `${username}@university.edu`;

            // First, create or get user
            let userId: number;
            try {
                // Try to create user using apiClient
                // Note: Backend may not have user search endpoint, so we'll try to register directly
                try {
                    const createUserResponse = await apiClient.register({
                        username,
                        email,
                        first_name: firstName,
                        last_name: lastName,
                        password: advisor.password || 'password123',
                        role: 'Advisor',
                        academic_year: currentAcademicYear,
                    });
                    if (createUserResponse.status >= 200 && createUserResponse.status < 300) {
                        const newUser = createUserResponse.data;
                        userId = newUser.user?.id || newUser.id;
                    } else {
                        throw new Error(createUserResponse.error || createUserResponse.message || 'Failed to create user');
                    }
                } catch (registerError: any) {
                    // If username/email already exists, try to extract user ID from error or use a different approach
                    throw new Error(registerError.message || 'Failed to create user');
                }
            } catch (userError) {
                console.warn('Failed to create/get user, falling back to localStorage:', userError);
                // Fallback to localStorage
            const newId = `A${advisors.length + 1}`;
                const stored = localStorage.getItem(`advisors_${currentAcademicYear}`);
                const collection = stored ? JSON.parse(stored) : [];
                const newCollection = [...collection, { ...advisor, id: newId, isAiAssistantEnabled: true }];
                localStorage.setItem(`advisors_${currentAcademicYear}`, JSON.stringify(newCollection));
                setAdvisors(newCollection);
                return newCollection;
            }

            // Convert specializedMajorIds to major names
            const specializationMajors = (advisor.specializedMajorIds || []).map(id => {
                const major = majors.find(m => m.id === id);
                return major?.name || '';
            }).filter(name => name);

            // Create advisor with backend API
            const advisorPayload = {
                user_id: userId,
                quota: advisor.quota || 5,
                main_committee_quota: advisor.mainCommitteeQuota || 5,
                second_committee_quota: advisor.secondCommitteeQuota || 5,
                third_committee_quota: advisor.thirdCommitteeQuota || 5,
                is_department_admin: advisor.isDepartmentAdmin || false,
                specialization_majors: specializationMajors,
            };

            // Use apiClient to create advisor
            const response = await apiClient.createAdvisor(advisorPayload);

            if (response.status >= 200 && response.status < 300) {
                const createdAdvisor = response.data;
                // Reload advisors list using apiClient
                const advisorsResponse = await apiClient.getAdvisors({ academic_year: currentAcademicYear });
                if (advisorsResponse.status >= 200 && advisorsResponse.status < 300) {
                    const advisorsData = advisorsResponse.data;
                    const advisorsList = Array.isArray(advisorsData) ? advisorsData : (advisorsData.results || advisorsData.data || []);
                    setAdvisors(advisorsList);
                    return advisorsList;
                }
                // If reload fails, return the created advisor in array format
                const newList = [...advisors, createdAdvisor];
                setAdvisors(newList);
                return newList;
            } else {
                const errorData = response.error || response.data || {};
                throw new Error(errorData.detail || errorData.message || `Failed to create advisor: ${response.status}`);
            }
        } catch (error) {
            console.warn('Backend API failed, falling back to localStorage:', error);
            // Fallback to localStorage
            const newId = `A${advisors.length + 1}`;
            const stored = localStorage.getItem(`advisors_${currentAcademicYear}`);
            const collection = stored ? JSON.parse(stored) : [];
            const newCollection = [...collection, { ...advisor, id: newId, isAiAssistantEnabled: true }];
            localStorage.setItem(`advisors_${currentAcademicYear}`, JSON.stringify(newCollection));
            setAdvisors(newCollection);
            return newCollection;
        }
    }, [majors, advisors, currentAcademicYear, addToast, setAdvisors]);
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
    
    const addMajor = useCallback(async (major: Omit<Major, 'id'>) => {
        try {
            // Try to use backend API first
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Convert frontend format to backend format
            const majorPayload = {
                name: major.name,
                abbreviation: major.abbreviation,
                description: (major as any).description || '',
                degree_level: 'Bachelor', // Default degree level
                is_active: true,
            };

            // Use apiClient to create major
            const response = await apiClient.createMajor(majorPayload);

            if (response.status >= 200 && response.status < 300) {
                const createdMajor = response.data;
                // Reload majors list using apiClient
                const majorsResponse = await apiClient.getMajors({ academic_year: currentAcademicYear });
                if (majorsResponse.status >= 200 && majorsResponse.status < 300) {
                    const majorsData = majorsResponse.data;
                    const majorsList = Array.isArray(majorsData) ? majorsData : (majorsData.results || majorsData.data || []);
                    setMajors(majorsList);
                    return majorsList;
                }
                // If reload fails, return the created major in array format
                const newList = [...majors, createdMajor];
                setMajors(newList);
                return newList;
            } else {
                const errorData = response.error || response.data || {};
                throw new Error(errorData.detail || errorData.message || `Failed to create major: ${response.status}`);
            }
        } catch (error) {
            console.warn('Backend API failed, falling back to localStorage:', error);
            // Fallback to localStorage
            const newId = `M${majors.length + 1}`;
            const stored = localStorage.getItem(`majors_${currentAcademicYear}`);
            const collection = stored ? JSON.parse(stored) : [];
            const newCollection = [...collection, { ...major, id: newId }];
            localStorage.setItem(`majors_${currentAcademicYear}`, JSON.stringify(newCollection));
            setMajors(newCollection);
            return newCollection;
        }
    }, [majors, currentAcademicYear, setMajors]);
    const updateMajor = createApiCallback((major: Major) => api.updateCollection(currentAcademicYear, 'majors', majors.map(m => m.id === major.id ? major : m)), setMajors, 'Failed to update major.');
    const deleteMajor = createApiCallback((id: string) => api.deleteCollectionItem(currentAcademicYear, 'majors', id), setMajors, 'Failed to delete major.');
    
    const addClassroom = useCallback(async (classroom: Omit<Classroom, 'id'>) => {
        try {
            // Try to use backend API first
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Find major by ID to get the major object ID
            const major = majors.find(m => m.id === classroom.majorId);
            if (!major) {
                throw new Error('Major not found');
            }

            // Convert frontend format to backend format
            // Backend expects major ID (integer) not majorId (string)
            // We need to get the actual major ID from backend
            let majorBackendId: number;
            try {
                // Try to find major in backend using apiClient
                const majorsResponse = await apiClient.getMajors({ academic_year: currentAcademicYear });
                if (majorsResponse.status >= 200 && majorsResponse.status < 300) {
                    const majorsData = majorsResponse.data;
                    const majorsList = Array.isArray(majorsData) ? majorsData : (majorsData.results || majorsData.data || []);
                    const backendMajor = majorsList.find((m: any) => 
                        m.name === major.name || m.abbreviation === major.abbreviation
                    );
                    if (backendMajor) {
                        majorBackendId = backendMajor.id;
                    } else {
                        throw new Error('Major not found in backend');
                    }
                } else {
                    throw new Error('Failed to fetch majors');
                }
            } catch (majorError) {
                console.warn('Failed to get major ID from backend, falling back to localStorage:', majorError);
                // Fallback to localStorage
                const newId = `C${classrooms.length + 1}`;
                const stored = localStorage.getItem(`classrooms_${currentAcademicYear}`);
                const collection = stored ? JSON.parse(stored) : [];
                const newCollection = [...collection, { ...classroom, id: newId }];
                localStorage.setItem(`classrooms_${currentAcademicYear}`, JSON.stringify(newCollection));
                setClassrooms(newCollection);
                return newCollection;
            }

            // Convert academic year format if needed (e.g., "2024" -> "2024-2025")
            const academicYear = currentAcademicYear.includes('-') 
                ? currentAcademicYear 
                : `${currentAcademicYear}-${parseInt(currentAcademicYear) + 1}`;

            const classroomPayload = {
                name: classroom.name,
                major: majorBackendId,
                academic_year: academicYear,
                semester: '1', // Default semester
                capacity: 30, // Default capacity
                is_active: true,
            };

            // Use apiClient to create classroom
            const response = await apiClient.createClassroom(classroomPayload);

            if (response.status >= 200 && response.status < 300) {
                const createdClassroom = response.data;
                // Reload classrooms list using apiClient
                const classroomsResponse = await apiClient.getClassrooms({ academic_year: currentAcademicYear });
                if (classroomsResponse.status >= 200 && classroomsResponse.status < 300) {
                    const classroomsData = classroomsResponse.data;
                    const rawClassrooms = Array.isArray(classroomsData) ? classroomsData : (classroomsData.results || classroomsData.data || []);
                    // Transform backend format to frontend format
                    const classroomsList = rawClassrooms.map((c: any) => {
                        const majorId = c.major;
                        const majorName = c.major_name || c.majorName || '';
                        const frontendMajor = majors.find((m: Major) => 
                            m.id === majorId?.toString() || 
                            m.name === majorName ||
                            (typeof majorId === 'number' && m.id === majorId.toString())
                        );
                        
                        return {
                            id: c.id?.toString() || `C${Date.now()}`,
                            name: c.name || '',
                            majorId: frontendMajor?.id || majorId?.toString() || '',
                            majorName: frontendMajor?.name || majorName || '',
                        };
                    });
                    setClassrooms(classroomsList);
                    return classroomsList;
                }
                // If reload fails, transform created classroom and return
                const majorId = createdClassroom.major;
                const majorName = createdClassroom.major_name || createdClassroom.majorName || '';
                const frontendMajor = majors.find((m: Major) => 
                    m.id === majorId?.toString() || 
                    m.name === majorName ||
                    (typeof majorId === 'number' && m.id === majorId.toString())
                );
                const transformedClassroom = {
                    id: createdClassroom.id?.toString() || `C${Date.now()}`,
                    name: createdClassroom.name || '',
                    majorId: frontendMajor?.id || majorId?.toString() || '',
                    majorName: frontendMajor?.name || majorName || '',
                };
                const newList = [...classrooms, transformedClassroom];
                setClassrooms(newList);
                return newList;
            } else {
                const errorData = response.error || response.data || {};
                throw new Error(errorData.detail || errorData.message || `Failed to create classroom: ${response.status}`);
            }
        } catch (error) {
            console.warn('Backend API failed, falling back to localStorage:', error);
            // Fallback to localStorage
            const newId = `C${classrooms.length + 1}`;
            const stored = localStorage.getItem(`classrooms_${currentAcademicYear}`);
            const collection = stored ? JSON.parse(stored) : [];
            const newCollection = [...collection, { ...classroom, id: newId }];
            localStorage.setItem(`classrooms_${currentAcademicYear}`, JSON.stringify(newCollection));
            setClassrooms(newCollection);
            return newCollection;
        }
    }, [classrooms, majors, currentAcademicYear, setClassrooms]);
    const updateClassroom = useCallback(async (classroom: Classroom) => {
        try {
            // Try to use backend API first
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Find major by ID to get the major object ID
            const major = majors.find(m => m.id === classroom.majorId);
            if (!major) {
                throw new Error('Major not found');
            }

            // Get major ID from backend using apiClient
            let majorBackendId: number;
            try {
                const majorsResponse = await apiClient.getMajors({ academic_year: currentAcademicYear });
                if (majorsResponse.status >= 200 && majorsResponse.status < 300) {
                    const majorsData = majorsResponse.data;
                    const majorsList = Array.isArray(majorsData) ? majorsData : (majorsData.results || majorsData.data || []);
                    const backendMajor = majorsList.find((m: any) => 
                        m.name === major.name || m.abbreviation === major.abbreviation
                    );
                    if (backendMajor) {
                        majorBackendId = backendMajor.id;
                    } else {
                        throw new Error('Major not found in backend');
                    }
                } else {
                    throw new Error('Failed to fetch majors');
                }
            } catch (majorError) {
                console.warn('Failed to get major ID from backend, falling back to localStorage:', majorError);
                // Fallback to localStorage
                const updatedClassrooms = classrooms.map(c => c.id === classroom.id ? classroom : c);
                localStorage.setItem(`classrooms_${currentAcademicYear}`, JSON.stringify(updatedClassrooms));
                setClassrooms(updatedClassrooms);
                return updatedClassrooms;
            }

            // Convert academic year format if needed
            const academicYear = currentAcademicYear.includes('-') 
                ? currentAcademicYear 
                : `${currentAcademicYear}-${parseInt(currentAcademicYear) + 1}`;

            // Get classroom ID from backend using apiClient
            let classroomBackendId: number;
            try {
                const classroomsResponse = await apiClient.getClassrooms({ academic_year: currentAcademicYear });
                if (classroomsResponse.status >= 200 && classroomsResponse.status < 300) {
                    const classroomsData = classroomsResponse.data;
                    const classroomsList = Array.isArray(classroomsData) ? classroomsData : (classroomsData.results || classroomsData.data || []);
                    const backendClassroom = classroomsList.find((c: any) => 
                        c.name === classroom.name || (c.id && c.id.toString() === classroom.id)
                    );
                    if (backendClassroom) {
                        classroomBackendId = backendClassroom.id;
                    } else {
                        throw new Error('Classroom not found in backend');
                    }
                } else {
                    throw new Error('Failed to fetch classrooms');
                }
            } catch (classroomError) {
                console.warn('Failed to get classroom ID from backend, falling back to localStorage:', classroomError);
                // Fallback to localStorage
                const updatedClassrooms = classrooms.map(c => c.id === classroom.id ? classroom : c);
                localStorage.setItem(`classrooms_${currentAcademicYear}`, JSON.stringify(updatedClassrooms));
                setClassrooms(updatedClassrooms);
                return updatedClassrooms;
            }

            const classroomPayload = {
                name: classroom.name,
                major: majorBackendId,
                academic_year: academicYear,
                semester: '1', // Default semester
                capacity: 30, // Default capacity
                is_active: true,
            };

            // Use apiClient to update classroom
            const response = await apiClient.updateClassroom(classroomBackendId, classroomPayload);

            if (response.status >= 200 && response.status < 300) {
                const updatedClassroom = response.data;
                // Reload classrooms list using apiClient
                const classroomsResponse = await apiClient.getClassrooms({ academic_year: currentAcademicYear });
                if (classroomsResponse.status >= 200 && classroomsResponse.status < 300) {
                    const classroomsData = classroomsResponse.data;
                    const rawClassrooms = Array.isArray(classroomsData) ? classroomsData : (classroomsData.results || classroomsData.data || []);
                    // Transform backend format to frontend format
                    const classroomsList = rawClassrooms.map((c: any) => {
                        const majorId = c.major;
                        const majorName = c.major_name || c.majorName || '';
                        const frontendMajor = majors.find((m: Major) => 
                            m.id === majorId?.toString() || 
                            m.name === majorName ||
                            (typeof majorId === 'number' && m.id === majorId.toString())
                        );
                        
                        return {
                            id: c.id?.toString() || `C${Date.now()}`,
                            name: c.name || '',
                            majorId: frontendMajor?.id || majorId?.toString() || '',
                            majorName: frontendMajor?.name || majorName || '',
                        };
                    });
                    setClassrooms(classroomsList);
                    return classroomsList;
                }
                // If reload fails, transform updated classroom and update local state
                const majorId = updatedClassroom.major;
                const majorName = updatedClassroom.major_name || updatedClassroom.majorName || '';
                const frontendMajor = majors.find((m: Major) => 
                    m.id === majorId?.toString() || 
                    m.name === majorName ||
                    (typeof majorId === 'number' && m.id === majorId.toString())
                );
                const transformedClassroom = {
                    id: updatedClassroom.id?.toString() || classroom.id,
                    name: updatedClassroom.name || classroom.name,
                    majorId: frontendMajor?.id || majorId?.toString() || classroom.majorId,
                    majorName: frontendMajor?.name || majorName || classroom.majorName,
                };
                const updatedClassrooms = classrooms.map(c => c.id === classroom.id ? transformedClassroom : c);
                setClassrooms(updatedClassrooms);
                return updatedClassrooms;
            } else {
                const errorData = response.error || response.data || {};
                throw new Error(errorData.detail || errorData.message || `Failed to update classroom: ${response.status}`);
            }
        } catch (error) {
            console.warn('Backend API failed, falling back to localStorage:', error);
            // Fallback to localStorage
            const updatedClassrooms = classrooms.map(c => c.id === classroom.id ? classroom : c);
            localStorage.setItem(`classrooms_${currentAcademicYear}`, JSON.stringify(updatedClassrooms));
            setClassrooms(updatedClassrooms);
            return updatedClassrooms;
        }
    }, [classrooms, majors, currentAcademicYear, setClassrooms]);

    const deleteClassroom = useCallback(async (id: string) => {
        try {
            // Try to use backend API first
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Get classroom ID from backend using apiClient
            let classroomBackendId: number | null = null;
            try {
                const classroomsResponse = await apiClient.getClassrooms({ academic_year: currentAcademicYear });
                if (classroomsResponse.status >= 200 && classroomsResponse.status < 300) {
                    const classroomsData = classroomsResponse.data;
                    const classroomsList = Array.isArray(classroomsData) ? classroomsData : (classroomsData.results || classroomsData.data || []);
                    const classroomToDelete = classrooms.find(c => c.id === id);
                    if (classroomToDelete) {
                        const backendClassroom = classroomsList.find((c: any) => 
                            c.name === classroomToDelete.name || (c.id && c.id.toString() === id)
                        );
                        if (backendClassroom) {
                            classroomBackendId = backendClassroom.id;
                        }
                    }
                }
            } catch (error) {
                console.warn('Failed to get classroom ID from backend, falling back to localStorage:', error);
            }

            if (classroomBackendId !== null) {
                // Use apiClient to delete classroom
                const response = await apiClient.deleteClassroom(classroomBackendId);

                if (response.status >= 200 && response.status < 300) {
                    // Reload classrooms list using apiClient
                    const classroomsResponse = await apiClient.getClassrooms({ academic_year: currentAcademicYear });
                    if (classroomsResponse.status >= 200 && classroomsResponse.status < 300) {
                        const classroomsData = classroomsResponse.data;
                        const rawClassrooms = Array.isArray(classroomsData) ? classroomsData : (classroomsData.results || classroomsData.data || []);
                        // Transform backend format to frontend format
                        const classroomsList = rawClassrooms.map((c: any) => {
                            const majorId = c.major;
                            const majorName = c.major_name || c.majorName || '';
                            const frontendMajor = majors.find((m: Major) => 
                                m.id === majorId?.toString() || 
                                m.name === majorName ||
                                (typeof majorId === 'number' && m.id === majorId.toString())
                            );
                            
                            return {
                                id: c.id?.toString() || `C${Date.now()}`,
                                name: c.name || '',
                                majorId: frontendMajor?.id || majorId?.toString() || '',
                                majorName: frontendMajor?.name || majorName || '',
                            };
                        });
                        setClassrooms(classroomsList);
                        return classroomsList;
                    }
                }
            }

            // Fallback to localStorage
            const updatedClassrooms = classrooms.filter(c => c.id !== id);
            localStorage.setItem(`classrooms_${currentAcademicYear}`, JSON.stringify(updatedClassrooms));
            setClassrooms(updatedClassrooms);
            return updatedClassrooms;
        } catch (error) {
            console.warn('Backend API failed, falling back to localStorage:', error);
            // Fallback to localStorage
            const updatedClassrooms = classrooms.filter(c => c.id !== id);
            localStorage.setItem(`classrooms_${currentAcademicYear}`, JSON.stringify(updatedClassrooms));
            setClassrooms(updatedClassrooms);
            return updatedClassrooms;
        }
    }, [classrooms, majors, currentAcademicYear, setClassrooms]);
    
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