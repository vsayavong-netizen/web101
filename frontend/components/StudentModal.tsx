import React, { useState, useMemo, useEffect } from 'react';
import { Student, Gender, Major, Classroom } from '../types';
import { XMarkIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface StudentModalProps {
  onClose: () => void;
  onSave: (student: Student | Omit<Student, 'id'>) => void;
  studentToEdit: Student | null;
  allStudents: Student[];
  majors: Major[];
  classrooms: Classroom[];
}

const StudentModal: React.FC<StudentModalProps> = ({ onClose, onSave, studentToEdit, allStudents, majors, classrooms }) => {
  const isEditMode = !!studentToEdit;
  const t = useTranslations();
  
  const [student, setStudent] = useState<Partial<Student>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (studentToEdit) {
      setStudent(studentToEdit);
    } else {
      const defaultMajorName = majors[0]?.name || '';
      const selectedMajor = majors.find(m => m.name === defaultMajorName);
      const defaultClassrooms = selectedMajor ? classrooms.filter(c => c.majorId === selectedMajor.id) : [];
      setStudent({ gender: Gender.Male, status: 'Approved', major: defaultMajorName, classroom: defaultClassrooms[0]?.name || '' });
    }
  }, [studentToEdit, majors, classrooms]);

  const filteredClassrooms = useMemo(() => {
    if (!student.major) return [];
    const selectedMajor = majors.find(m => m.name === student.major);
    return selectedMajor ? classrooms.filter(c => c.majorId === selectedMajor.id) : [];
  }, [student.major, majors, classrooms]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const studentId = student.studentId?.trim();
    if (!studentId) newErrors.studentId = t('studentIdRequired');
    else if (allStudents.some(s => s.studentId?.toLowerCase() === studentId.toLowerCase() && s.studentId !== studentToEdit?.studentId)) newErrors.studentId = t('studentIdExists');
    if (!student.name?.trim()) newErrors.name = t('nameRequired');
    if (!student.surname?.trim()) newErrors.surname = t('surnameRequired');
    if (!student.major) newErrors.major = t('majorRequired');
    if (!student.classroom) newErrors.classroom = t('classroomRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const studentData: Student = { ...student, studentId: student.studentId!.trim().toUpperCase(), name: student.name!.trim(), surname: student.surname!.trim() } as Student;
    const finalData = isEditMode ? { ...studentToEdit, ...studentData } : { ...studentData, password: 'password123', mustChangePassword: true };
    onSave(finalData as Student);
  };
  
  const handleChange = (field: keyof Student, value: string) => {
    let updatedStudent = { ...student, [field]: value };
    if (field === 'major') {
        const selectedMajor = majors.find(m => m.name === value);
        const newClassrooms = selectedMajor ? classrooms.filter(c => c.majorId === selectedMajor.id) : [];
        updatedStudent.classroom = newClassrooms[0]?.name || '';
    } 
    setStudent(updatedStudent);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <style>{`.input-style { transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out; width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; } .dark .input-style { background-color: #334155; border-color: #475569; color: #f8fafc; } .input-style:disabled { background-color: #e2e8f0; } .dark .input-style:disabled { background-color: #475569; }`}</style>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-slate-700">
          <h2 className="text-2xl font-bold">{isEditMode ? t('editStudent') : t('addStudent')}</h2>
          <button onClick={onClose}><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} noValidate className="flex-grow overflow-y-auto pr-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('studentId')}</label>
              <input type="text" id="studentId" value={student.studentId || ''} onChange={e => handleChange('studentId', e.target.value)} disabled={isEditMode} className={`input-style mt-1 ${errors.studentId ? 'border-red-500' : ''}`} />
              {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
            </div>
             <div>
              <label htmlFor="gender" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('gender')}</label>
              <select id="gender" value={student.gender} onChange={e => handleChange('gender', e.target.value)} className="input-style mt-1"><option value={Gender.Male}>{t('male')}</option><option value={Gender.Female}>{t('female')}</option><option value={Gender.Monk}>{t('monk')}</option></select>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('name')}</label>
              <input type="text" id="name" value={student.name || ''} onChange={e => handleChange('name', e.target.value)} className={`input-style mt-1 ${errors.name ? 'border-red-500' : ''}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="surname" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('surname')}</label>
              <input type="text" id="surname" value={student.surname || ''} onChange={e => handleChange('surname', e.target.value)} className={`input-style mt-1 ${errors.surname ? 'border-red-500' : ''}`} />
              {errors.surname && <p className="text-red-500 text-xs mt-1">{errors.surname}</p>}
            </div>
             <div>
              <label htmlFor="major" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('major')}</label>
              <select id="major" value={student.major || ''} onChange={e => handleChange('major', e.target.value)} className={`input-style mt-1 ${errors.major ? 'border-red-500' : ''}`}>{majors.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select>
              {errors.major && <p className="text-red-500 text-xs mt-1">{errors.major}</p>}
            </div>
            <div>
              <label htmlFor="classroom" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('classroom')}</label>
              <select id="classroom" value={student.classroom || ''} onChange={e => handleChange('classroom', e.target.value)} className={`input-style mt-1 ${errors.classroom ? 'border-red-500' : ''}`} disabled={filteredClassrooms.length === 0}>{filteredClassrooms.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
              {errors.classroom && <p className="text-red-500 text-xs mt-1">{errors.classroom}</p>}
            </div>
             <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('email')}</label>
              <input type="email" id="email" value={student.email || ''} onChange={e => handleChange('email', e.target.value)} className={`input-style mt-1 ${errors.email ? 'border-red-500' : ''}`} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="tel" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('telephone')}</label>
              <input type="tel" id="tel" value={student.tel || ''} onChange={e => handleChange('tel', e.target.value)} className={`input-style mt-1 ${errors.tel ? 'border-red-500' : ''}`} />
              {errors.tel && <p className="text-red-500 text-xs mt-1">{errors.tel}</p>}
            </div>
             <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('status')}</label>
              <select id="status" value={student.status || 'Approved'} onChange={e => handleChange('status', e.target.value)} className="input-style mt-1"><option value="Approved">{t('approved')}</option><option value="Pending">{t('pending')}</option></select>
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-6 border-t dark:border-slate-700 mt-6"><button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 font-bold py-2 px-4 rounded-lg">{t('cancel')}</button><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t('saveStudent')}</button></div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;