import React, { useState, useEffect } from 'react';
import { User, Student, Advisor, ProjectGroup, StudentSkillsAnalysis, CareerPathSuggestion, AdvisorMentoringAnalysis } from '../types';
import { XMarkIcon, UserCircleIcon, PencilIcon, CheckIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon, ClipboardDocumentListIcon, AcademicCapIcon, HeartIcon, KeyIcon } from './icons';
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
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className="mt-1 text-sm text-slate-900 dark:text-white sm:col-span-2 sm:mt-0">{value}</dd>
    </div>
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
        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="mt-1 sm:col-span-2 sm:mt-0">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input
                            type={type}
                            value={currentValue}
                            onChange={(e) => setCurrentValue(e.target.value)}
                            className={`block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600 ${error ? 'ring-red-500' : ''}`}
                        />
                        <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full"><CheckIcon className="w-5 h-5"/></button>
                        <button onClick={() => { setIsEditing(false); setCurrentValue(value); }} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><XMarkIcon className="w-5 h-5"/></button>
                    </div>
                ) : (
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-900 dark:text-white">{value}</span>
                        <button onClick={() => setIsEditing(true)} className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><PencilIcon className="w-4 h-4"/></button>
                    </div>
                )}
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </dd>
        </div>
    );
};

const CollapsibleSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg"
            >
                <div className="flex items-center gap-2">
                    {icon}
                    <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300">{title}</h4>
                </div>
                {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
            </button>
            {isOpen && <div className="p-4">{children}</div>}
        </div>
    );
};


const CollapsibleAiSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; onAnalyze: () => void; isLoading: boolean; analysisPerformed: boolean; canAnalyze: boolean; }> = ({ title, icon, children, onAnalyze, isLoading, analysisPerformed, canAnalyze }) => {
    const t = useTranslations();
    return (
        <CollapsibleSection title={title} icon={icon}>
            <div className="p-0">
                {!analysisPerformed && canAnalyze && (
                    <button onClick={onAnalyze} disabled={isLoading} className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400">
                        {isLoading ? (<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>) : <SparklesIcon className="w-5 h-5" />}
                        <span className="ml-2">{isLoading ? t('analyzing') : t('analyzeWithAI')}</span>
                    </button>
                )}
                {!canAnalyze && !analysisPerformed && (
                    <p className="text-sm text-center text-slate-500 dark:text-slate-400">{t('notEnoughData')}</p>
                )}
                {isLoading && !analysisPerformed && (
                    <div className="flex justify-center items-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}
                {analysisPerformed && children}
            </div>
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
            return <div className="text-center text-slate-500 dark:text-slate-400">{t('userDataNotFound')}</div>;
        }

        switch (user.role) {
            case 'Student':
                const student = userData as Student;
                return (
                    <div className="space-y-4">
                        <CollapsibleSection title={t('personalInformation')} icon={<UserCircleIcon className="w-5 h-5"/>} defaultOpen>
                            <dl className="divide-y divide-slate-200 dark:divide-slate-700">
                                <InfoRow label={t('studentId')} value={student.studentId} />
                                <InfoRow label={t('fullName')} value={`${student.name} ${student.surname}`} />
                                <InfoRow label={t('major')} value={student.major} />
                                <EditableField label={t('email')} value={student.email} type="email" onSave={(value) => handleUpdateStudentField('email', value)} error={studentErrors.email} />
                                <EditableField label={t('telephone')} value={student.tel} type="tel" onSave={(value) => handleUpdateStudentField('tel', value)} error={studentErrors.tel} />
                            </dl>
                        </CollapsibleSection>
                        <CollapsibleSection title={t('security')} icon={<KeyIcon className="w-5 h-5"/>} defaultOpen={isPasswordChangeForced}>
                             <div className="space-y-3">
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('currentPassword')}</label><input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input-style mt-1" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('newPassword')}</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-style mt-1" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('confirmNewPassword')}</label><input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="input-style mt-1" /></div>
                                {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
                                <button onClick={handlePasswordChange} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">{t('updatePasswordBtn')}</button>
                             </div>
                        </CollapsibleSection>
                        <CollapsibleAiSection title={t('aiSkillsAnalysis')} icon={<ClipboardDocumentListIcon className="w-5 h-5 text-blue-600"/>} onAnalyze={analyzeSkills} isLoading={isAnalyzingSkills} analysisPerformed={!!skillsAnalysis} canAnalyze={!!studentProjectGroup}>
                            {skillsAnalysis && (
                                <div className="space-y-3 text-sm">
                                    <p className="italic text-slate-600 dark:text-slate-400">{skillsAnalysis.summary}</p>
                                    <ul className="space-y-2">
                                        {skillsAnalysis.skills.map(s => <li key={s.skill} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md"><strong className="font-semibold text-slate-800 dark:text-slate-100">{s.skill}:</strong> {s.justification}</li>)}
                                    </ul>
                                </div>
                            )}
                        </CollapsibleAiSection>
                        <CollapsibleAiSection title={t('aiCareerPathSuggestions')} icon={<AcademicCapIcon className="w-5 h-5 text-blue-600"/>} onAnalyze={suggestCareers} isLoading={isSuggestingCareers} analysisPerformed={!!careerPaths} canAnalyze={!!skillsAnalysis}>
                             {careerPaths && (
                                <ul className="space-y-2 text-sm">
                                    {careerPaths.map(p => <li key={p.path} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md"><strong className="font-semibold text-slate-800 dark:text-slate-100">{p.path}:</strong> {p.reasoning}</li>)}
                                </ul>
                            )}
                        </CollapsibleAiSection>
                    </div>
                );
            case 'Advisor':
            case 'DepartmentAdmin':
                const advisor = userData as Advisor;
                return (
                     <div className="space-y-4">
                        <CollapsibleSection title={t('advisorInformation')} icon={<UserCircleIcon className="w-5 h-5"/>} defaultOpen>
                            <dl className="divide-y divide-slate-200 dark:border-slate-700">
                                <InfoRow label={t('advisorId')} value={advisor.id} />
                                <EditableField label={t('fullName')} value={advisor.name} onSave={handleUpdateAdvisorName} error={advisorNameError} />
                                <InfoRow label={t('supervisingQuota')} value={String(advisor.quota)} />
                                <InfoRow label={t('mainCommitteeQuota')} value={String(advisor.mainCommitteeQuota)} />
                                <InfoRow label={t('secondCommitteeQuota')} value={String(advisor.secondCommitteeQuota)} />
                                <InfoRow label={t('thirdCommitteeQuota')} value={String(advisor.thirdCommitteeQuota)} />
                            </dl>
                        </CollapsibleSection>
                         <CollapsibleSection title={t('security')} icon={<KeyIcon className="w-5 h-5"/>} defaultOpen={isPasswordChangeForced}>
                             <div className="space-y-3">
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('currentPassword')}</label><input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input-style mt-1" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('newPassword')}</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-style mt-1" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('confirmNewPassword')}</label><input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="input-style mt-1" /></div>
                                {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
                                <button onClick={handlePasswordChange} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">{t('updatePasswordBtn')}</button>
                             </div>
                        </CollapsibleSection>
                         <CollapsibleAiSection title={t('aiMentoringStyleAnalysis')} icon={<HeartIcon className="w-5 h-5 text-blue-600"/>} onAnalyze={handleAnalyzeMentoring} isLoading={isAnalyzingMentoring} analysisPerformed={!!mentoringAnalysis} canAnalyze={true}>
                           {mentoringAnalysis && (
                                <div className="space-y-3 text-sm">
                                    <p><strong className="font-semibold text-slate-800 dark:text-slate-100">{t('identifiedStyle')}:</strong> <span className="font-bold text-blue-600 dark:text-blue-400">{mentoringAnalysis.style}</span></p>
                                    <p className="italic text-slate-600 dark:text-slate-400">{mentoringAnalysis.summary}</p>
                                    <div>
                                        <h5 className="font-semibold">{t('strengths')}:</h5>
                                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
                                            {mentoringAnalysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold">{t('suggestions')}:</h5>
                                         <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
                                            {mentoringAnalysis.suggestionsForImprovement.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </CollapsibleAiSection>
                     </div>
                );
            case 'Admin':
                return (
                     <dl className="divide-y divide-slate-200 dark:divide-slate-700">
                        <InfoRow label={t('userId')} value={user.id} />
                        <InfoRow label={t('fullName')} value={user.name} />
                        <InfoRow label={t('role')} value={user.role} />
                    </dl>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
             <style>{`.input-style { transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out; width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; } .dark .input-style { background-color: #334155; border-color: #475569; color: #f8fafc; }`}</style>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 rounded-full p-3 mr-4">
                           <UserCircleIcon className="w-6 h-6"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('smartProfile')}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{user.name} ({user.role})</p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={isPasswordChangeForced} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {isPasswordChangeForced && (
                    <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-md text-sm font-semibold text-center">
                        {t('updatePasswordSectionPrompt')}
                    </div>
                )}
                
                <div className="mt-4 flex-grow overflow-y-auto pr-2">
                    {renderContent()}
                     {user.role !== 'Admin' && <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-6">{t('aiDisclaimer')}</p>}
                </div>

                <div className="mt-6 flex justify-end flex-shrink-0">
                     <button
                        type="button"
                        className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 dark:bg-slate-600 dark:text-white dark:border-slate-500 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onClose}
                        disabled={isPasswordChangeForced}
                    >
                        {t('closeBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;