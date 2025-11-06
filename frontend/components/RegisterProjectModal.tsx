import React, { useState, useEffect, useMemo } from 'react';
import { Advisor, Project, Student, ProjectGroup, ProjectStatus, User, SimilarityInfo, Major } from '../types';
import { useToast } from '../hooks/useToast';
import { XMarkIcon, SparklesIcon } from './icons';
import { GoogleGenAI, Type } from "@google/genai";
import { useTranslations } from '../hooks/useTranslations';

interface RegisterProjectModalProps {
  onClose: () => void;
  onAddProject: (project: Project, students: Student[], actor: User) => void;
  onUpdateProject: (group: ProjectGroup, actor: User) => void;
  advisors: Advisor[];
  advisorProjectCounts: Record<string, number>;
  allProjects: ProjectGroup[];
  allStudents: Student[];
  majors: Major[];
  user: User;
  projectToEdit?: ProjectGroup | null;
  currentAcademicYear: string;
  suggestedTopic: { lao: string; eng: string } | null;
  onSuggestionUsed: () => void;
}

type FormErrors = { [key: string]: string; };

const InputField: React.FC<{ id: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string; className?: string; disabled?: boolean; }> = ({ id, error, className, ...props}) => (
  <div className={className}>
    <input id={id} className={`input-style ${error ? 'border-red-500' : 'focus:border-blue-500'}`} {...props} />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export const RegisterProjectModal: React.FC<RegisterProjectModalProps> = (props) => {
  const { onClose, onAddProject, onUpdateProject, advisors, advisorProjectCounts, allProjects, allStudents, majors, user, projectToEdit, currentAcademicYear, suggestedTopic, onSuggestionUsed } = props;
  const isEditMode = !!projectToEdit;
  const isStudentMode = user.role === 'Student';
  const addToast = useToast();
  const t = useTranslations();

  const [topicLao, setTopicLao] = useState('');
  const [topicEng, setTopicEng] = useState('');
  const [initialTopicLao, setInitialTopicLao] = useState('');
  const [initialTopicEng, setInitialTopicEng] = useState('');
  const [advisorName, setAdvisorName] = useState('');
  const [student1Id, setStudent1Id] = useState<string | null>(null);
  const [student2Id, setStudent2Id] = useState<string | null>(null);
  const [hasSecondStudent, setHasSecondStudent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranslatingEng, setIsTranslatingEng] = useState(false);
  const [isTranslatingLao, setIsTranslatingLao] = useState(false);
  
  const availableStudents = useMemo(() => {
    const assignedStudentIds = new Set(allProjects.filter(p => p.project.projectId !== projectToEdit?.project.projectId).flatMap(p => p.students.map(s => s.studentId)));
    return allStudents.filter(s => !assignedStudentIds.has(s.studentId));
  }, [allStudents, allProjects, projectToEdit]);
  
  const student1 = useMemo(() => student1Id ? allStudents.find(s => s.studentId === student1Id) : null, [student1Id, allStudents]);
  
  const availableAdvisors = useMemo(() => {
    if (!student1 || !student1.major) return advisors || [];
    if (!majors || majors.length === 0) return advisors || [];
    const studentMajorId = majors.find(m => m && m.name === student1.major)?.id;
    if (!studentMajorId) return advisors || [];
    
    return (advisors || []).filter(adv => 
        adv && Array.isArray(adv.specializedMajorIds) && adv.specializedMajorIds.includes(studentMajorId)
    );
  }, [student1, advisors, majors]);

  useEffect(() => {
    if (isStudentMode) {
      // Find student by user ID or username
      const currentStudent = allStudents.find(s => {
        if (!s || !s.studentId) return false;
        if (s.id === user.id || s.studentId === user.id || s.studentId === user.username) return true;
        if (user.username && s.studentId) {
          const normalizedStudentId = s.studentId.toLowerCase().replace(/[\/_]/g, '');
          const normalizedUsername = user.username.toLowerCase().replace(/[\/_]/g, '');
          return normalizedStudentId === normalizedUsername;
        }
        return false;
      });
      if (currentStudent && currentStudent.studentId) {
        setStudent1Id(currentStudent.studentId);
      }
    }
    if (isEditMode && projectToEdit) {
      setTopicLao(projectToEdit.project.topicLao);
      setTopicEng(projectToEdit.project.topicEng);
      setInitialTopicLao(projectToEdit.project.topicLao);
      setInitialTopicEng(projectToEdit.project.topicEng);
      setAdvisorName(projectToEdit.project.advisorName);
      setStudent1Id(projectToEdit.students[0]?.studentId || null);
      if (projectToEdit.students.length > 1) {
        setHasSecondStudent(true);
        setStudent2Id(projectToEdit.students[1]?.studentId || null);
      }
    } else if (suggestedTopic) {
        setTopicLao(suggestedTopic.lao);
        setTopicEng(suggestedTopic.eng);
        addToast({ type: 'info', message: t('aiTopicFilled') });
        onSuggestionUsed();
    }
  }, [isEditMode, projectToEdit, isStudentMode, user.id, suggestedTopic, addToast, onSuggestionUsed, t]);

  const validate = async (): Promise<{ isValid: boolean, similarityInfo: SimilarityInfo | null }> => {
    const newErrors: FormErrors = {};
    let similarityInfo: SimilarityInfo | null = null;
    if (!topicLao.trim()) newErrors.topicLao = t('laoTopicRequired');
    if (!topicEng.trim()) newErrors.topicEng = t('engTopicRequired');
    if (!advisorName) newErrors.advisorName = t('advisorRequired');
    if (!student1Id) newErrors.student1 = t('student1Required');
    if (hasSecondStudent && !student2Id) newErrors.student2 = t('student2Required');
    if (student1Id && student2Id && student1Id === student2Id) newErrors.student2 = t('studentsCannotBeSame');

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return { isValid: false, similarityInfo: null };
    }

    if (process.env.API_KEY && (topicEng.trim().toLowerCase() !== initialTopicEng.trim().toLowerCase())) {
        setIsSubmitting(true);
        addToast({type: 'info', message: t('checkingForSimilarity')});
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const existingProjects = allProjects.filter(p => p.project.projectId !== projectToEdit?.project.projectId).map(p => ({ id: p.project.projectId, topic: p.project.topicEng }));
            const prompt = `Analyze proposed topic for similarity against existing topics. Proposed: "${topicEng}". Existing: ${JSON.stringify(existingProjects)}. Respond ONLY with JSON with "similarProjectId", "similarityPercentage", "reason".`;
            const schema = { type: Type.OBJECT, properties: { similarProjectId: { type: Type.STRING }, similarityPercentage: { type: Type.NUMBER }, reason: { type: Type.STRING }}, required: ["similarProjectId", "similarityPercentage", "reason"]};
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
            const result: SimilarityInfo = JSON.parse(response.text);
            similarityInfo = result;

            if (result.similarityPercentage > 70) {
                newErrors.topicEng = t('topicTooSimilar').replace('{similarity}', String(result.similarityPercentage.toFixed(0))).replace('{projectId}', result.similarProjectId);
                addToast({type: 'error', message: newErrors.topicEng});
            }
        } catch (error) {
            console.error("Similarity Check Error:", error);
            addToast({type: 'error', message: t('similarityCheckError')});
        } finally {
            setIsSubmitting(false);
        }
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, similarityInfo };
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, similarityInfo } = await validate();
    if (!isValid) return;

    setIsSubmitting(true);
    const studentsInGroup: Student[] = [];
    const s1 = allStudents.find(s => s.studentId === student1Id);
    if (s1) studentsInGroup.push(s1);
    if (hasSecondStudent && student2Id) {
        const s2 = allStudents.find(s => s.studentId === student2Id);
        if (s2) studentsInGroup.push(s2);
    }
    
    if (isEditMode && projectToEdit) {
        const updatedGroup: ProjectGroup = {
            ...projectToEdit,
            project: { ...projectToEdit.project, topicLao, topicEng, advisorName, similarityInfo },
            students: studentsInGroup
        };
        onUpdateProject(updatedGroup, user);
        addToast({ type: 'success', message: t('projectUpdatedSuccess') });
    } else {
        const yearSuffix = currentAcademicYear.slice(-2);
        const projectNumber = allProjects.length + 1;
        const newProject: Project = {
            projectId: `P${yearSuffix}${String(projectNumber).padStart(3, '0')}`,
            topicLao, topicEng, advisorName,
            comment: 'Initial submission',
            status: ProjectStatus.Pending,
            history: [],
            milestones: [],
            similarityInfo,
            finalSubmissions: { preDefenseFile: null, postDefenseFile: null },
            mainCommitteeId: null, secondCommitteeId: null, thirdCommitteeId: null,
            defenseDate: null, defenseTime: null, defenseRoom: null, finalGrade: null,
            mainAdvisorScore: null, mainCommitteeScore: null, secondCommitteeScore: null, thirdCommitteeScore: null,
            log: [], detailedScores: null,
        };
        onAddProject(newProject, studentsInGroup, user);
        addToast({ type: 'success', message: t('projectRegisteredSuccess') });
    }
    
    setIsSubmitting(false);
    onClose();
  };
  
  const handleTranslate = async (targetLang: 'en' | 'lo') => {
    const sourceText = targetLang === 'en' ? topicLao : topicEng;
    if (!sourceText || !process.env.API_KEY) return;
    
    const setter = targetLang === 'en' ? setIsTranslatingEng : setIsTranslatingLao;
    setter(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Translate the following text to ${targetLang === 'en' ? 'English' : 'Lao'}. Respond with only the translated text. Text: "${sourceText}"`;
      const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });

      if (targetLang === 'en') {
        setTopicEng(response.text.trim());
        addToast({ type: 'success', message: t('engTopicSuggested') });
      } else {
        setTopicLao(response.text.trim());
        addToast({ type: 'success', message: t('laoTopicSuggested') });
      }
    } catch (error) {
      console.error("Translation failed:", error);
      addToast({ type: 'error', message: 'Failed to translate topic.' });
    } finally {
      setter(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <style>{`.input-style { transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out; width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; } .dark .input-style { background-color: #334155; border-color: #475569; color: #f8fafc; } .input-style:disabled { background-color: #e2e8f0; cursor: not-allowed; } .dark .input-style:disabled { background-color: #475569; }`}</style>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-slate-700">
          <h2 className="text-2xl font-bold">{isEditMode ? t('editProject') : t('registerProject')}</h2>
          <button onClick={onClose}><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} noValidate className="flex-grow overflow-y-auto pr-2 space-y-4">
          <div className="relative">
             <label htmlFor="topicLao" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('topicLao')}</label>
             <input type="text" id="topicLao" value={topicLao} onChange={e => setTopicLao(e.target.value)} className={`input-style mt-1 ${errors.topicLao ? 'border-red-500' : ''}`} placeholder={t('laoTopicPlaceholder')} />
             {errors.topicLao && <p className="text-red-500 text-xs mt-1">{errors.topicLao}</p>}
             <button type="button" onClick={() => handleTranslate('lo')} disabled={isTranslatingLao || !topicEng} className="absolute top-7 right-2 p-1.5 text-purple-600 hover:bg-purple-100 rounded-full disabled:opacity-50">
                {isTranslatingLao ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div> : <SparklesIcon className="w-4 h-4"/>}
            </button>
          </div>
           <div className="relative">
             <label htmlFor="topicEng" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('topicEng')}</label>
             <input type="text" id="topicEng" value={topicEng} onChange={e => setTopicEng(e.target.value)} className={`input-style mt-1 ${errors.topicEng ? 'border-red-500' : ''}`} placeholder={t('engTopicPlaceholder')} />
             {errors.topicEng && <p className="text-red-500 text-xs mt-1">{errors.topicEng}</p>}
              <button type="button" onClick={() => handleTranslate('en')} disabled={isTranslatingEng || !topicLao} className="absolute top-7 right-2 p-1.5 text-purple-600 hover:bg-purple-100 rounded-full disabled:opacity-50">
                {isTranslatingEng ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div> : <SparklesIcon className="w-4 h-4"/>}
            </button>
          </div>
          <div>
            <label htmlFor="student1" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('student1')}</label>
            <select id="student1" value={student1Id || ''} onChange={e => setStudent1Id(e.target.value)} disabled={isStudentMode} className={`input-style mt-1 ${errors.student1 ? 'border-red-500' : ''}`}>
              <option value="" disabled>{t('selectStudent1')}</option>
              {availableStudents.map(s => <option key={s.studentId} value={s.studentId}>{s.name} {s.surname} ({s.studentId})</option>)}
            </select>
            {errors.student1 && <p className="text-red-500 text-xs mt-1">{errors.student1}</p>}
          </div>
          <div>
            <div className="flex items-center"><input type="checkbox" id="hasSecondStudent" checked={hasSecondStudent} onChange={e => setHasSecondStudent(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><label htmlFor="hasSecondStudent" className="ml-2 text-sm text-slate-700 dark:text-slate-200">{t('addSecondStudent')}</label></div>
            {hasSecondStudent && (
              <div className="mt-2">
                <label htmlFor="student2" className="sr-only">{t('student2')}</label>
                <select id="student2" value={student2Id || ''} onChange={e => setStudent2Id(e.target.value)} className={`input-style ${errors.student2 ? 'border-red-500' : ''}`}>
                  <option value="" disabled>{t('selectStudent2')}</option>
                  {availableStudents.filter(s => s.studentId !== student1Id).map(s => <option key={s.studentId} value={s.studentId}>{s.name} {s.surname} ({s.studentId})</option>)}
                </select>
                 {errors.student2 && <p className="text-red-500 text-xs mt-1">{errors.student2}</p>}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="advisor" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('selectAdvisor')}</label>
            <select id="advisor" value={advisorName} onChange={e => setAdvisorName(e.target.value)} className={`input-style mt-1 ${errors.advisorName ? 'border-red-500' : ''}`} disabled={!student1}>
              <option value="" disabled>{availableAdvisors.length > 0 ? t('selectAnAdvisor') : t('noAvailableAdvisors')}</option>
              {availableAdvisors.map(adv => { 
                if (!adv || !adv.name) return null;
                const count = advisorProjectCounts[adv.name] || 0; 
                const isFull = count >= (adv.quota || 0); 
                return <option key={adv.id || adv.name} value={adv.name} disabled={isFull}>{adv.name} ({count}/{adv.quota || 0}) {isFull && `- ${t('full')}`}</option> 
              })}
            </select>
             {errors.advisorName && <p className="text-red-500 text-xs mt-1">{errors.advisorName}</p>}
          </div>
          <div className="flex justify-end space-x-4 pt-6 border-t dark:border-slate-700 mt-6"><button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 font-bold py-2 px-4 rounded-lg">{t('cancel')}</button><button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400">{isSubmitting ? t('submitting') : t('submit')}</button></div>
        </form>
      </div>
    </div>
  );
};