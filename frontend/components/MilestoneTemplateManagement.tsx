import React, { useState, useMemo } from 'react';
import { MilestoneTemplate } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, ClipboardDocumentCheckIcon, MagnifyingGlassIcon } from './icons';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';
import MilestoneTemplateModal from './MilestoneTemplateModal';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import { useTranslations } from '../hooks/useTranslations';

type TemplateSortKey = 'id' | 'name' | 'taskCount';

interface MilestoneTemplateManagementProps {
    templates: MilestoneTemplate[];
    addTemplate: (template: Omit<MilestoneTemplate, 'id'>) => void;
    updateTemplate: (template: MilestoneTemplate) => void;
    deleteTemplate: (templateId: string) => void;
}

const MilestoneTemplateManagement: React.FC<MilestoneTemplateManagementProps> = ({ templates, addTemplate, updateTemplate, deleteTemplate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<MilestoneTemplate | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<MilestoneTemplate | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig<TemplateSortKey> | null>({ key: 'id', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');
    const addToast = useToast();
    const t = useTranslations();

    const requestSort = (key: TemplateSortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredTemplates = useMemo(() => {
        let filteredTemplates = [...templates];

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filteredTemplates = filteredTemplates.filter(template =>
                template.id.toLowerCase().includes(lowercasedQuery) ||
                template.name.toLowerCase().includes(lowercasedQuery) ||
                template.description.toLowerCase().includes(lowercasedQuery)
            );
        }

        if (sortConfig !== null) {
            filteredTemplates.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;

                if (sortConfig.key === 'taskCount') {
                    aValue = a.tasks.length;
                    bValue = b.tasks.length;
                } else {
                    aValue = a[sortConfig.key as 'id' | 'name'];
                    bValue = b[sortConfig.key as 'id' | 'name'];
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filteredTemplates;
    }, [templates, sortConfig, searchQuery]);

    const handleAddClick = () => {
        setEditingTemplate(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (template: MilestoneTemplate) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };
    
    const handleDeleteRequest = (template: MilestoneTemplate) => {
        setTemplateToDelete(template);
    };

    const confirmDelete = () => {
        if (templateToDelete) {
            deleteTemplate(templateToDelete.id);
            addToast({ type: 'success', message: t('templateDeletedSuccess') });
            setTemplateToDelete(null);
        }
    };
    
    const handleSaveTemplate = (templateData: MilestoneTemplate | Omit<MilestoneTemplate, 'id'>) => {
        if ('id' in templateData) {
            updateTemplate(templateData as MilestoneTemplate);
            addToast({ type: 'success', message: t('templateUpdatedSuccess') });
        } else {
            addTemplate(templateData as Omit<MilestoneTemplate, 'id'>);
            addToast({ type: 'success', message: t('templateAddedSuccess') });
        }
        setIsModalOpen(false);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div className="flex items-center">
                   <ClipboardDocumentCheckIcon className="w-8 h-8 text-blue-600 mr-3"/>
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('manageMilestoneTemplates')}</h2>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">{t('manageMilestoneTemplatesDescription')}</p>
                   </div>
                </div>
                <button
                    onClick={handleAddClick}
                    className="mt-4 sm:mt-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('addTemplate')}
                </button>
            </div>

            <div className="mb-4">
                 <div className="relative w-full sm:w-1/2 lg:w-1/3">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600 dark:placeholder:text-gray-400"
                        placeholder={t('searchByTemplate')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                        <tr>
                            <SortableHeader sortKey="id" title="ID" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="name" title={t('templateName')} sortConfig={sortConfig} requestSort={requestSort} />
                            <th scope="col" className="px-6 py-3">{t('description')}</th>
                            <SortableHeader sortKey="taskCount" title={t('tasks')} sortConfig={sortConfig} requestSort={requestSort} />
                            <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredTemplates.map(template => (
                            <tr key={template.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{template.id}</td>
                                <td className="px-6 py-4">{template.name}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-sm truncate">{template.description}</td>
                                <td className="px-6 py-4">{template.tasks.length}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleEditClick(template)} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDeleteRequest(template)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {sortedAndFilteredTemplates.length === 0 && (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                        {searchQuery ? `No templates found for "${searchQuery}".` : `No templates found. Click "${t('addTemplate')}" to begin.`}
                    </div>
                )}
            </div>
            
            {isModalOpen && (
                <MilestoneTemplateModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveTemplate} 
                    templateToEdit={editingTemplate}
                    allTemplates={templates}
                />
            )}
            
            {templateToDelete && (
                <ConfirmationModal 
                    isOpen={!!templateToDelete}
                    onClose={() => setTemplateToDelete(null)}
                    onConfirm={confirmDelete}
                    title={t('deleteTemplateTitle')}
                    message={t('deleteTemplateMessage').replace('${templateName}', templateToDelete.name)}
                />
            )}
        </div>
    );
};

export default MilestoneTemplateManagement;
