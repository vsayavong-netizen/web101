
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Advisor, ProjectGroup, Major, User } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, AcademicCapIcon, MagnifyingGlassIcon, DocumentArrowUpIcon, TableCellsIcon } from './icons';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';
import AdvisorModal from './AdvisorModal';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import AdvisorBulkEditModal from './AdvisorBulkEditModal';
import ImportReviewModal from './ImportReviewModal';
import { ExcelUtils } from '../utils/excelUtils';
import { useTranslations } from '../hooks/useTranslations';
import Pagination from './Pagination';
import AdvisorCard from './AdvisorCard';

type AdvisorSortKey = 'id' | 'name' | 'projectCount' | 'mainCommittee' | 'secondCommittee' | 'thirdCommittee';
const ITEMS_PER_PAGE = 15;

interface AdvisorManagementProps {
    user: User;
    advisors: Advisor[];
    projectGroups: ProjectGroup[];
    majors: Major[];
    advisorProjectCounts: Record<string, number>;
    committeeCounts: Record<string, { main: number; second: number; third: number }>;
    addAdvisor: (advisor: Omit<Advisor, 'id'>) => void;
    updateAdvisor: (advisor: Advisor) => void;
    deleteAdvisor: (advisorId: string) => void;
    deleteAdvisors: (advisorIds: string[]) => void;
    bulkAddOrUpdateAdvisors: (advisors: (Omit<Advisor, 'id'> | Advisor)[]) => void;
    bulkUpdateAdvisors: (advisorIds: string[], updates: Partial<Omit<Advisor, 'id' | 'name'>>) => void;
}

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void; }> = ({ enabled, onChange }) => (
    <button
        type="button"
        className={`${enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        role="switch"
        aria-checked={enabled}
        onClick={onChange}
    >
        <span
            aria-hidden="true"
            className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);

const AdvisorManagement: React.FC<AdvisorManagementProps> = (props) => {
    const { user, advisors, projectGroups, majors, advisorProjectCounts, committeeCounts, addAdvisor, updateAdvisor, deleteAdvisor, deleteAdvisors, bulkAddOrUpdateAdvisors, bulkUpdateAdvisors } = props;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
    const [advisorToDelete, setAdvisorToDelete] = useState<Advisor | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig<AdvisorSortKey> | null>({ key: 'id', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAdvisorIds, setSelectedAdvisorIds] = useState<Set<string>>(new Set());
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewData, setReviewData] = useState<(Advisor & { _status: 'new' | 'update' | 'error'; _error?: string })[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addToast = useToast();
    const t = useTranslations();

    const requestSort = (key: AdvisorSortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getMajorNames = useCallback((majorIds: string[]): string => {
        if (!majorIds || majorIds.length === 0) return t('all');
        return majorIds.map(id => majors.find(m => m.id === id)?.abbreviation || '?').join(', ');
    }, [majors, t]);
    
    const sortedAndFilteredAdvisors = useMemo(() => {
        let filteredAdvisors = [...advisors];
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filteredAdvisors = filteredAdvisors.filter(advisor => advisor.id.toLowerCase().includes(lowercasedQuery) || advisor.name.toLowerCase().includes(lowercasedQuery));
        }
        if (sortConfig !== null) {
            filteredAdvisors.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;
                switch (sortConfig.key) {
                    case 'projectCount': aValue = advisorProjectCounts[a.name] || 0; bValue = advisorProjectCounts[b.name] || 0; break;
                    case 'mainCommittee': aValue = committeeCounts[a.id]?.main || 0; bValue = committeeCounts[b.id]?.main || 0; break;
                    case 'secondCommittee': aValue = committeeCounts[a.id]?.second || 0; bValue = committeeCounts[b.id]?.second || 0; break;
                    case 'thirdCommittee': aValue = committeeCounts[a.id]?.third || 0; bValue = committeeCounts[b.id]?.third || 0; break;
                    default: aValue = a[sortConfig.key as 'id' | 'name']; bValue = b[sortConfig.key as 'id' | 'name'];
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filteredAdvisors;
    }, [advisors, sortConfig, searchQuery, advisorProjectCounts, committeeCounts]);
    
    const paginatedAdvisors = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedAndFilteredAdvisors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedAndFilteredAdvisors, currentPage]);

    const handleAddClick = () => { setEditingAdvisor(null); setIsModalOpen(true); };
    const handleEditClick = (advisor: Advisor) => { setEditingAdvisor(advisor); setIsModalOpen(true); };
    
    const handleDeleteRequest = (advisor: Advisor) => {
        if (projectGroups.some(pg => pg.project.advisorName === advisor.name)) {
            addToast({ type: 'error', message: t('cannotDeleteAdvisorWithProjects') });
            return;
        }
        setAdvisorToDelete(advisor);
    };
    
    const confirmDelete = () => {
        if (advisorToDelete) {
            deleteAdvisor(advisorToDelete.id);
            addToast({ type: 'success', message: t('advisorDeletedSuccess') });
            setAdvisorToDelete(null);
        }
    };

    const handleSaveAdvisor = (advisorData: Advisor | Omit<Advisor, 'id'>) => {
        if ('id' in advisorData) {
            updateAdvisor(advisorData as Advisor);
            addToast({ type: 'success', message: t('advisorUpdatedSuccess') });
        } else {
            addAdvisor(advisorData as Omit<Advisor, 'id'>);
            addToast({ type: 'success', message: t('advisorAddedSuccess') });
        }
        setIsModalOpen(false);
    };

    const handleSelect = (advisorId: string) => {
        setSelectedAdvisorIds(prev => {
            const newSet = new Set(prev);
            newSet.has(advisorId) ? newSet.delete(advisorId) : newSet.add(advisorId);
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedAdvisorIds(e.target.checked ? new Set(sortedAndFilteredAdvisors.map(a => a.id)) : new Set());
    };

    const handleBulkEdit = (updates: any) => {
        if (Object.keys(updates).length === 0) {
            addToast({ type: 'info', message: t('noChangesForBulkEdit') });
            return;
        }
        bulkUpdateAdvisors(Array.from(selectedAdvisorIds), updates);
        addToast({ type: 'success', message: t('advisorsUpdatedSuccess').replace('${count}', String(selectedAdvisorIds.size)) });
        setIsBulkEditModalOpen(false);
        setSelectedAdvisorIds(new Set());
    };

    const handleBulkDelete = () => {
        const advisorsWithProjects = Array.from(selectedAdvisorIds).filter(id => {
            const adv = advisors.find(a => a.id === id);
            return adv && projectGroups.some(pg => pg.project.advisorName === adv.name);
        });
        if (advisorsWithProjects.length > 0) {
            addToast({ type: 'error', message: t('cannotDeleteAdvisorsWithProjects').replace('${count}', String(advisorsWithProjects.length)) });
            setIsBulkDeleteModalOpen(false);
            return;
        }
        deleteAdvisors(Array.from(selectedAdvisorIds));
        addToast({ type: 'success', message: t('advisorsDeletedSuccess').replace('${count}', String(selectedAdvisorIds.size)) });
        setIsBulkDeleteModalOpen(false);
        setSelectedAdvisorIds(new Set());
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleExportExcel = useCallback(() => {
        const dataToExport = sortedAndFilteredAdvisors.map(advisor => {
            const projectCount = advisorProjectCounts[advisor.name] || 0;
            const committeeCount = committeeCounts[advisor.id] || { main: 0, second: 0, third: 0 };
            return {
                [t('id')]: advisor.id,
                [t('fullName')]: advisor.name,
                [t('projectsSupervising')]: `${projectCount} / ${advisor.quota}`,
                [t('mainCommittee')]: `${committeeCount.main} / ${advisor.mainCommitteeQuota}`,
                [t('secondCommittee')]: `${committeeCount.second} / ${advisor.secondCommitteeQuota}`,
                [t('thirdCommittee')]: `${committeeCount.third} / ${advisor.thirdCommitteeQuota}`,
                [t('specializedMajors')]: getMajorNames(advisor.specializedMajorIds),
                [t('deptAdmin')]: advisor.isDepartmentAdmin ? t('yes') : t('no'),
            };
        });
    
        if (dataToExport.length === 0) {
            addToast({ type: 'info', message: t('noDataToExport') });
            return;
        }
    
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Advisors');
    
        worksheet['!cols'] = [
            { wch: 10 }, // ID
            { wch: 25 }, // Name
            { wch: 20 }, // Supervising
            { wch: 20 }, // Main Committee
            { wch: 20 }, // 2nd Committee
            { wch: 20 }, // 3rd Committee
            { wch: 30 }, // Specialized Majors
            { wch: 15 }, // Department Admin
        ];
    
        XLSX.writeFile(workbook, 'advisors_report.xlsx');
        addToast({ type: 'success', message: t('advisorExportSuccess') });
    }, [sortedAndFilteredAdvisors, advisorProjectCounts, committeeCounts, getMajorNames, addToast, t]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                // FIX: Cast `data` to string as XLSX.read with type 'binary' expects a string, which was causing a type error.
                const workbook = XLSX.read(data as string, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<any>(worksheet);
                const existingAdvisorNames = new Set(advisors.map(a => a.name.toLowerCase()));
                const majorAbbrToIdMap = new Map(majors.map(m => [m.abbreviation.toLowerCase(), m.id]));
                const processedData = json.map(row => {
                    const name = String(row['Name'] ?? '').trim();
                    if (!name) return { ...row, _status: 'error', _error: 'Missing Name' };

                    const status = existingAdvisorNames.has(name.toLowerCase()) ? 'update' : 'new';
                    let error = '';
                    
                    const majorAbbrs = String(row['Specialized Majors'] ?? '').split(',').map(s => s.trim().toLowerCase());
                    const specializedMajorIds: string[] = [];
                    majorAbbrs.forEach((abbr) => {
                        if (majorAbbrToIdMap.has(abbr)) {
                            specializedMajorIds.push(majorAbbrToIdMap.get(abbr)!);
                        } else if (abbr) {
                            error += `Invalid Major Abbreviation: ${abbr}. `;
                        }
                    });

                    const advisorId = advisors.find(a => a.name.toLowerCase() === name.toLowerCase())?.id;
                    return { id: advisorId, name, quota: Number(row['Quota']) || 5, mainCommitteeQuota: Number(row['Main Committee Quota']) || 5, secondCommitteeQuota: Number(row['2nd Committee Quota']) || 5, thirdCommitteeQuota: Number(row['3rd Committee Quota']) || 5, specializedMajorIds, _status: error ? 'error' : status, _error: error || undefined };
                });
                setReviewData(processedData as any);
                setIsReviewModalOpen(true);
            } catch (error) {
                addToast({ type: 'error', message: t('fileParseError') });
                console.error("File parse error:", error);
            } finally { if (event.target) event.target.value = ''; }
        };
        reader.readAsBinaryString(file);
    };

    const handleConfirmImport = (validData: (Omit<Advisor, 'id'> | Advisor)[]) => {
        bulkAddOrUpdateAdvisors(validData);
        addToast({ type: 'success', message: t('advisorsImportedSuccess').replace('${count}', String(validData.length)) });
        setIsReviewModalOpen(false);
    };

    const handleToggleAiAssistant = (advisor: Advisor) => {
        updateAdvisor({
            ...advisor,
            isAiAssistantEnabled: !(advisor.isAiAssistantEnabled ?? true)
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                 <div className="flex items-center">
                   <AcademicCapIcon className="w-8 h-8 text-blue-600 mr-3"/>
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('manageAdvisors')}</h2>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">{t('advisorsDescription')}</p>
                   </div>
                </div>
                 <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls"/>
                    <button onClick={handleImportClick} className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg shadow-md"><DocumentArrowUpIcon className="w-5 h-5 mr-2" /> {t('import')}</button>
                    <button onClick={handleExportExcel} className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md">
                        <TableCellsIcon className="w-5 h-5 mr-2" /> {t('exportExcel')}
                    </button>
                    <button onClick={handleAddClick} className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md"><PlusIcon className="w-5 h-5 mr-2" /> {t('addAdvisor')}</button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
                <div className="mb-4"><div className="relative w-full sm:w-1/2 lg:w-1/3"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" /></div><input type="text" className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm dark:bg-slate-700 dark:text-white" placeholder={t('searchByAdvisor')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></div>
                {selectedAdvisorIds.size > 0 && <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg flex justify-between items-center mb-4"><span className="font-semibold text-blue-800 dark:text-blue-200">{t('bulkActionsSelected').replace('{count}', String(selectedAdvisorIds.size))}</span><div className="flex gap-2"><button onClick={() => setIsBulkEditModalOpen(true)} className="text-sm font-medium text-blue-600 dark:text-blue-300 hover:underline">{t('edit')}</button><button onClick={() => setIsBulkDeleteModalOpen(true)} className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline">{t('delete')}</button></div></div>}
                
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paginatedAdvisors.map(advisor => {
                        const projectCount = advisorProjectCounts[advisor.name] || 0;
                        return (
                            <AdvisorCard
                                key={advisor.id}
                                advisor={advisor}
                                user={user}
                                projectCount={projectCount}
                                getMajorNames={getMajorNames}
                                onEdit={() => handleEditClick(advisor)}
                                onDelete={() => handleDeleteRequest(advisor)}
                                onSelect={handleSelect}
                                isSelected={selectedAdvisorIds.has(advisor.id)}
                                onToggleAiAssistant={() => handleToggleAiAssistant(advisor)}
                            />
                        );
                    })}
                </div>

                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                            <tr>
                                <th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedAdvisorIds.size > 0 && selectedAdvisorIds.size === sortedAndFilteredAdvisors.length} className="w-4 h-4 text-blue-600" /></th>
                                <SortableHeader sortKey="id" title="ID" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader sortKey="name" title={t('fullName')} sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader sortKey="projectCount" title={t('projectsSupervising')} sortConfig={sortConfig} requestSort={requestSort} />
                                <th scope="col" className="px-6 py-3">{t('specializedMajors')}</th>
                                {user.role === 'Admin' && <th scope="col" className="px-6 py-3">{t('aiAssistant')}</th>}
                                <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedAdvisors.map(advisor => {
                                const projectCount = advisorProjectCounts[advisor.name] || 0;
                                const isSelected = selectedAdvisorIds.has(advisor.id);
                                const isOverloaded = projectCount > advisor.quota;
                                return (
                                <tr key={advisor.id} className={`border-b dark:border-slate-700 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                                    <td className="w-4 p-4"><input type="checkbox" checked={isSelected} onChange={() => handleSelect(advisor.id)} className="w-4 h-4 text-blue-600"/></td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{advisor.id}</td>
                                    <td className="px-6 py-4">{advisor.name}</td>
                                    <td className={`px-6 py-4 ${isOverloaded ? 'text-red-500 dark:text-red-400 font-bold' : ''}`}>{projectCount} / {advisor.quota}</td>
                                    <td className="px-6 py-4">{getMajorNames(advisor.specializedMajorIds)}</td>
                                    {user.role === 'Admin' && <td className="px-6 py-4"><ToggleSwitch enabled={advisor.isAiAssistantEnabled ?? true} onChange={() => handleToggleAiAssistant(advisor)} /></td>}
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEditClick(advisor)} className="p-2 text-slate-500 hover:text-blue-600"><PencilIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDeleteRequest(advisor)} className="p-2 text-slate-500 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    {sortedAndFilteredAdvisors.length === 0 && <div className="text-center py-10 text-slate-500 dark:text-slate-400">{searchQuery ? `No advisors found for "${searchQuery}".` : t('noAdvisorsData')}</div>}
                </div>
                 <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(sortedAndFilteredAdvisors.length / ITEMS_PER_PAGE)}
                    totalItems={sortedAndFilteredAdvisors.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </div>
            
            {isModalOpen && <AdvisorModal user={user} onClose={() => setIsModalOpen(false)} onSave={handleSaveAdvisor} advisorToEdit={editingAdvisor} allAdvisors={advisors} majors={majors} />}
            {advisorToDelete && <ConfirmationModal isOpen={!!advisorToDelete} onClose={() => setAdvisorToDelete(null)} onConfirm={confirmDelete} title={t('deleteAdvisorTitle')} message={t('deleteAdvisorMessage').replace('${name}', advisorToDelete.name)} />}
            {isBulkEditModalOpen && <AdvisorBulkEditModal isOpen={isBulkEditModalOpen} onClose={() => setIsBulkEditModalOpen(false)} onSave={handleBulkEdit} selectedCount={selectedAdvisorIds.size} />}
            {isBulkDeleteModalOpen && <ConfirmationModal isOpen={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)} onConfirm={handleBulkDelete} title={t('bulkDeleteAdvisorTitle').replace('${count}', String(selectedAdvisorIds.size))} message={t('bulkDeleteAdvisorMessage').replace('${count}', String(selectedAdvisorIds.size))} />}
            {isReviewModalOpen && <ImportReviewModal<Omit<Advisor, 'id'> | Advisor> isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onConfirm={handleConfirmImport} data={reviewData} columns={[{ key: '_status', header: 'Status' }, { key: 'name', header: 'Name' }, { key: 'quota', header: 'Quota' }, { key: 'specializedMajorIds', header: 'Majors' }, { key: '_error', header: 'Error' }]} dataTypeName="Advisors" />}
        </div>
    );
};

export default AdvisorManagement;
