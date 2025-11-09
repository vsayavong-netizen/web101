import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Select, MenuItem, FormControl,
  InputLabel, FormHelperText, Checkbox, FormControlLabel,
  IconButton, Box, Typography, CircularProgress, Divider
} from '@mui/material';
import { Close as CloseIcon, AutoAwesome as AutoAwesomeIcon } from '@mui/icons-material';
import { Advisor, Project, Student, ProjectGroup, ProjectStatus, User, SimilarityInfo, Major } from '../types';
import { useToast } from '../hooks/useToast';
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
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Typography component="span" variant="subtitle1" fontWeight="bold">
          {isEditMode ? t('editProject') : t('registerProject')}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              label={t('topicLao')}
              id="topicLao"
              value={topicLao}
              onChange={e => setTopicLao(e.target.value)}
              placeholder={t('laoTopicPlaceholder')}
              error={!!errors.topicLao}
              helperText={errors.topicLao}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => handleTranslate('lo')}
                    disabled={isTranslatingLao || !topicEng}
                    size="small"
                    sx={{ color: 'secondary.main' }}
                  >
                    {isTranslatingLao ? (
                      <CircularProgress size={16} color="secondary" />
                    ) : (
                      <AutoAwesomeIcon fontSize="small" />
                    )}
                  </IconButton>
                )
              }}
            />
          </Box>
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              label={t('topicEng')}
              id="topicEng"
              value={topicEng}
              onChange={e => setTopicEng(e.target.value)}
              placeholder={t('engTopicPlaceholder')}
              error={!!errors.topicEng}
              helperText={errors.topicEng}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => handleTranslate('en')}
                    disabled={isTranslatingEng || !topicLao}
                    size="small"
                    sx={{ color: 'secondary.main' }}
                  >
                    {isTranslatingEng ? (
                      <CircularProgress size={16} color="secondary" />
                    ) : (
                      <AutoAwesomeIcon fontSize="small" />
                    )}
                  </IconButton>
                )
              }}
            />
          </Box>
          <FormControl fullWidth error={!!errors.student1}>
            <InputLabel>{t('student1')}</InputLabel>
            <Select
              id="student1"
              value={student1Id || ''}
              onChange={e => setStudent1Id(e.target.value)}
              disabled={isStudentMode}
              label={t('student1')}
            >
              <MenuItem value="" disabled>{t('selectStudent1')}</MenuItem>
              {availableStudents.map(s => (
                <MenuItem key={s.studentId} value={s.studentId}>
                  {s.name} {s.surname} ({s.studentId})
                </MenuItem>
              ))}
            </Select>
            {errors.student1 && <FormHelperText>{errors.student1}</FormHelperText>}
          </FormControl>
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={hasSecondStudent}
                  onChange={e => setHasSecondStudent(e.target.checked)}
                />
              }
              label={t('addSecondStudent')}
            />
            {hasSecondStudent && (
              <FormControl fullWidth error={!!errors.student2} sx={{ mt: 2 }}>
                <InputLabel>{t('student2')}</InputLabel>
                <Select
                  id="student2"
                  value={student2Id || ''}
                  onChange={e => setStudent2Id(e.target.value)}
                  label={t('student2')}
                >
                  <MenuItem value="" disabled>{t('selectStudent2')}</MenuItem>
                  {availableStudents.filter(s => s.studentId !== student1Id).map(s => (
                    <MenuItem key={s.studentId} value={s.studentId}>
                      {s.name} {s.surname} ({s.studentId})
                    </MenuItem>
                  ))}
                </Select>
                {errors.student2 && <FormHelperText>{errors.student2}</FormHelperText>}
              </FormControl>
            )}
          </Box>
          <FormControl fullWidth error={!!errors.advisorName} disabled={!student1}>
            <InputLabel>{t('selectAdvisor')}</InputLabel>
            <Select
              id="advisor"
              value={advisorName}
              onChange={e => setAdvisorName(e.target.value)}
              label={t('selectAdvisor')}
            >
              <MenuItem value="" disabled>
                {availableAdvisors.length > 0 ? t('selectAnAdvisor') : t('noAvailableAdvisors')}
              </MenuItem>
              {availableAdvisors.map(adv => {
                if (!adv || !adv.name) return null;
                const count = advisorProjectCounts[adv.name] || 0;
                const isFull = count >= (adv.quota || 0);
                return (
                  <MenuItem key={adv.id || adv.name} value={adv.name} disabled={isFull}>
                    {adv.name} ({count}/{adv.quota || 0}) {isFull && `- ${t('full')}`}
                  </MenuItem>
                );
              })}
            </Select>
            {errors.advisorName && <FormHelperText>{errors.advisorName}</FormHelperText>}
          </FormControl>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};