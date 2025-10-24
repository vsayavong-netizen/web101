import React, { useState, useEffect } from 'react';
import { MilestoneTemplate, MilestoneTask } from '../types';
import { XMarkIcon, PlusIcon, TrashIcon } from './icons';
import { v4 as uuidv4 } from 'uuid';
import { useTranslations } from '../hooks/useTranslations';

interface MilestoneTemplateModalProps {
  onClose: () => void;
  onSave: (template: MilestoneTemplate | Omit<MilestoneTemplate, 'id'>) => void;
  templateToEdit: MilestoneTemplate | null;
  allTemplates: MilestoneTemplate[];
}

const MilestoneTemplateModal: React.FC<MilestoneTemplateModalProps> = ({ onClose, onSave, templateToEdit, allTemplates }) => {
  const isEditMode = !!templateToEdit;
  const t = useTranslations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState<MilestoneTask[]>([]);
  const [errors, setErrors] = useState<Record<string, any>>({});

  useEffect(() => {
    if (templateToEdit) {
      setName(templateToEdit.name);
      setDescription(templateToEdit.description);
      setTasks([...templateToEdit.tasks]);
    } else {
        // Start with one default task
        setTasks([{ id: uuidv4(), name: '', durationDays: 30 }]);
    }
  }, [templateToEdit]);

  const validate = () => {
    const newErrors: Record<string, any> = { tasks: {} };
    if (!name.trim()) {
      newErrors.name = t('templateNameRequired');
    } else {
        const isDuplicate = allTemplates.some(
            t => t.name.toLowerCase() === name.trim().toLowerCase() && t.id !== templateToEdit?.id
        );
        if (isDuplicate) {
            newErrors.name = t('templateNameExists');
        }
    }
    if (!description.trim()) newErrors.description = t('descriptionRequired');
    if (tasks.length === 0) newErrors.tasksError = t('atLeastOneTask');
    
    tasks.forEach((task, index) => {
        if (!task.name.trim()) {
            newErrors.tasks[index] = { ...newErrors.tasks[index], name: t('taskNameRequired') };
        }
        if (task.durationDays <= 0) {
            newErrors.tasks[index] = { ...newErrors.tasks[index], duration: t('daysPositiveError') };
        }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 1 && Object.keys(newErrors.tasks).length === 0 && !newErrors.tasksError;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const templateData = { name, description, tasks };
    const finalData = isEditMode ? { ...templateToEdit, ...templateData } : templateData;
    onSave(finalData);
  };

  const handleTaskChange = (index: number, field: keyof MilestoneTask, value: string | number) => {
    const newTasks = [...tasks];
    (newTasks[index] as any)[field] = value;
    setTasks(newTasks);
  };
  
  const handleAddTask = () => {
    setTasks([...tasks, { id: uuidv4(), name: '', durationDays: 30 }]);
  };
  
  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <style>{`.input-style { transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out; width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; } .dark .input-style { background-color: #334155; border-color: #475569; color: #f8fafc; }`}</style>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-slate-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{isEditMode ? t('editTemplate') : t('addTemplate')}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate className="flex-grow overflow-y-auto pr-2">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('templateName')}</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className={`input-style mt-1 ${errors.name ? 'border-red-500' : ''}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('description')}</label>
              <textarea id="description" rows={2} value={description} onChange={e => setDescription(e.target.value)} className={`input-style mt-1 ${errors.description ? 'border-red-500' : ''}`} />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
            <div className="pt-2">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{t('milestoneTasks')}</h3>
                 {errors.tasksError && <p className="text-red-500 text-xs mt-1">{errors.tasksError}</p>}
                <div className="mt-2 space-y-3">
                    {tasks.map((task, index) => (
                        <div key={task.id} className="grid grid-cols-12 gap-2 items-start p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                           <div className="col-span-8">
                                <label htmlFor={`task-name-${index}`} className="sr-only">{t('taskName')}</label>
                                <input type="text" id={`task-name-${index}`} placeholder="e.g., Chapter 1: Introduction" value={task.name} onChange={e => handleTaskChange(index, 'name', e.target.value)} className={`input-style ${errors.tasks?.[index]?.name ? 'border-red-500' : ''}`} />
                                {errors.tasks?.[index]?.name && <p className="text-red-500 text-xs mt-1">{errors.tasks[index].name}</p>}
                           </div>
                           <div className="col-span-3">
                                <label htmlFor={`task-days-${index}`} className="sr-only">{t('durationInDays')}</label>
                                <div className="relative">
                                    <input type="number" id={`task-days-${index}`} value={task.durationDays} onChange={e => handleTaskChange(index, 'durationDays', parseInt(e.target.value, 10) || 0)} min="1" className={`input-style pr-12 ${errors.tasks?.[index]?.duration ? 'border-red-500' : ''}`} />
                                    <span className="absolute inset-y-0 right-3 flex items-center text-sm text-slate-500 dark:text-slate-400">{t('days')}</span>
                                </div>
                                {errors.tasks?.[index]?.duration && <p className="text-red-500 text-xs mt-1">{errors.tasks[index].duration}</p>}
                           </div>
                           <div className="col-span-1 flex items-center pt-2">
                               <button type="button" onClick={() => handleRemoveTask(index)} className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400" aria-label={t('removeTask')}>
                                   <TrashIcon className="w-5 h-5"/>
                               </button>
                           </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={handleAddTask} className="mt-4 flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    <PlusIcon className="w-4 h-4 mr-1"/> {t('addTask')}
                </button>
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-6 border-t dark:border-slate-700 mt-6 flex-shrink-0">
            <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white font-bold py-2 px-4 rounded-lg">{t('cancel')}</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t('saveTemplate')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MilestoneTemplateModal;