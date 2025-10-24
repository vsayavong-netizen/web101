import React, { useState, useMemo, useCallback } from 'react';
import { Advisor, ProjectGroup, Major, ProjectStatus, User } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, KeyIcon, MagnifyingGlassIcon } from './icons';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';
import AdvisorModal from './AdvisorModal';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import { useTranslations } from '../hooks/useTranslations';

type AdvisorSortKey = 'id' | 'name' | 'specializedMajors';

interface DepartmentAdminManagementProps {
    user: User;
    advisors: Advisor[];
    projectGroups: ProjectGroup[];
    majors: Major[];
    addAdvisor: (advisor: Omit<Advisor, 'id'>) => void;
    updateAdvisor: (advisor: Advisor) => void;
}

const DepartmentAdminManagement: React.FC<DepartmentAdminManagementProps> = ({ user, advisors, projectGroups, majors, addAdvisor, updateAdvisor }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
    const [advisorToDemote, setAdvisorToDemote] = useState<Advisor | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig<AdvisorSortKey> | null>({ key: 'id', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');
    const addToast = useToast();
    const t = useTranslations();

    const deptAdmins = useMemo(() => advisors.filter(a => a.isDepartmentAdmin), [advisors]);

    const requestSort = (key: AdvisorSortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getMajorNames = useCallback((majorIds: string[]): string => {
        if (!majorIds || majorIds.length === 0) return 'All Majors';
        return majorIds.map(id => majors.find(m => m.id === id)?.abbreviation || '?').join(', ');
    }, [majors]);

    const sortedAndFilteredAdvisors = useMemo(() => {
        let filteredAdvisors = [...deptAdmins];
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filteredAdvisors = filteredAdvisors.filter(advisor =>
                advisor.id.toLowerCase().includes(lowercasedQuery) ||
                advisor.name.toLowerCase().includes(lowercasedQuery)
            );
        }
        if (sortConfig !== null) {
            filteredAdvisors.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;
                switch (sortConfig.key) {
                    case 'specializedMajors': aValue = getMajorNames(a.specializedMajorIds); bValue = getMajorNames(b.specializedMajorIds); break;
                    default: aValue = a[sortConfig.key as 'id' | 'name']; bValue = b[sortConfig.key as 'id' | 'name'];
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filteredAdvisors;
    }, [deptAdmins, sortConfig, searchQuery, getMajorNames]);

    const handleAddClick = () => {
        setEditingAdvisor(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (advisor: Advisor) => {
        setEditingAdvisor(advisor);
        setIsModalOpen(true);
    };

    const handleDemoteRequest = (advisor: Advisor) => {
        setAdvisorToDemote(advisor);
    };
    
    const confirmDemote = () => {
        if (advisorToDemote) {
            updateAdvisor({ ...advisorToDemote, isDepartmentAdmin: false });
            addToast({ type: 'success', message: t('demotedSuccess').replace('${name}', advisorToDemote.name) });
            setAdvisorToDemote(null);
        }
    };
    
    const handleSaveAdvisor = (advisorData: Advisor | Omit<Advisor, 'id'>) => {
        const dataWithAdminFlag = { ...advisorData, isDepartmentAdmin: true };
        if ('id' in dataWithAdminFlag) {
            updateAdvisor(dataWithAdminFlag as Advisor);
            addToast({ type: 'success', message: t('deptAdminUpdatedSuccess') });
        } else {
            addAdvisor(dataWithAdminFlag as Omit<Advisor, 'id'>);
            addToast({ type: 'success', message: t('deptAdminAddedSuccess') });
        }
        setIsModalOpen(false);
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div className="flex items-center">
                   <KeyIcon className="w-8 h-8 text-blue-600 mr-3"/>
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('manageDeptAdmins')}</h2>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">{t('manageDeptAdminsDescription')}</p>
                   </div>
                </div>
                <button
                    onClick={handleAddClick}
                    className="mt-4 sm:mt-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('addDeptAdmin')}
                </button>
            </div>
            <div className="mb-4">
                 <div className="relative w-full sm:w-1/2 lg:w-1/3">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" /></div>
                    <input type="text" className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600 dark:placeholder:text-gray-400" placeholder={t('searchByDeptAdmin')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                        <tr>
                            <SortableHeader sortKey="id" title={t('studentId')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="name" title={t('fullName')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="specializedMajors" title={t('managedMajors')} sortConfig={sortConfig} requestSort={requestSort} />
                            <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredAdvisors.map(adv => {
                            return (
                                <tr key={adv.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{adv.id}</td>
                                    <td className="px-6 py-4">{adv.name}</td>
                                    <td className="px-6 py-4">{getMajorNames(adv.specializedMajorIds)}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEditClick(adv)} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><PencilIcon className="w-5 h-5" /></button>
                                        <button 
                                            onClick={() => handleDemoteRequest(adv)}
                                            disabled={adv.id === user.id}
                                            title={adv.id === user.id ? t('cannotDemoteSelf') : t('demoteToAdvisor')}
                                            className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {sortedAndFilteredAdvisors.length === 0 && (<div className="text-center py-10 text-slate-500 dark:text-slate-400">{searchQuery ? `No department admins found for "${searchQuery}".` : 'No department admins found. Promote an advisor to create one.'}</div>)}
            </div>
            {isModalOpen && (<AdvisorModal user={user} onClose={() => setIsModalOpen(false)} onSave={handleSaveAdvisor} advisorToEdit={editingAdvisor} allAdvisors={advisors} majors={majors} />)}
            {advisorToDemote && (<ConfirmationModal 
                isOpen={!!advisorToDemote} 
                onClose={() => setAdvisorToDemote(null)} 
                onConfirm={confirmDemote} 
                title={t('demoteDeptAdminTitle')} 
                message={t('demoteDeptAdminMessage').replace('${name}', advisorToDemote.name)}
                confirmText={t('confirmDemotion')}
                confirmButtonClass="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
            />)}
        </div>
    );
};

export default DepartmentAdminManagement;