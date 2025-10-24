import React, { useState, useMemo, useCallback } from 'react';
import { ProjectGroup, Advisor, FinalSubmissionStatus } from '../types';
import { MagnifyingGlassIcon, DocumentCheckIcon, ArrowDownTrayIcon, CheckIcon, TableCellsIcon } from './icons';
import { useToast } from '../hooks/useToast';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import { ExcelUtils } from '../utils/excelUtils';
import { useTranslations } from '../hooks/useTranslations';

interface FinalProjectManagementProps {
    projectGroups: ProjectGroup[];
    advisors: Advisor[];
    updateProjectGrade: (projectId: string, finalGrade: string | null) => void;
}

type SortKey = 'projectId' | 'studentNames' | 'advisorName' | 'finalGrade';

const getFileDataUrl = (fileId: string): string => {
    try {
        return localStorage.getItem(`file_${fileId}`) || '';
    } catch (error) {
        console.error('Error reading file from localStorage:', error);
        return '';
    }
};

export const FinalProjectManagement: React.FC<FinalProjectManagementProps> = ({ projectGroups, advisors, updateProjectGrade }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig<SortKey> | null>({ key: 'projectId', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');
    const [edits, setEdits] = useState<Record<string, string>>({});
    const addToast = useToast();
    const t = useTranslations();

    const finalProjects = useMemo(() => {
        return projectGroups.filter(pg => 
            pg.project.finalSubmissions?.postDefenseFile?.status === FinalSubmissionStatus.Approved
        );
    }, [projectGroups]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredProjects = useMemo(() => {
        let filtered = [...finalProjects];
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(pg =>
                pg.project.projectId.toLowerCase().includes(lowercasedQuery) ||
                pg.project.topicEng.toLowerCase().includes(lowercasedQuery) ||
                pg.project.advisorName.toLowerCase().includes(lowercasedQuery) ||
                pg.students.some(s => `${s.name} ${s.surname}`.toLowerCase().includes(lowercasedQuery))
            );
        }
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;
                switch (sortConfig.key) {
                    case 'studentNames':
                        aValue = a.students.map(s => s.name).join(', ');
                        bValue = b.students.map(s => s.name).join(', ');
                        break;
                    case 'finalGrade':
                        aValue = a.project.finalGrade || '';
                        bValue = b.project.finalGrade || '';
                        break;
                    default:
                        aValue = a.project[sortConfig.key as 'projectId' | 'advisorName'];
                        bValue = b.project[sortConfig.key as 'projectId' | 'advisorName'];
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [finalProjects, searchQuery, sortConfig]);

    const handleGradeChange = (projectId: string, grade: string) => {
        setEdits(prev => ({ ...prev, [projectId]: grade.toUpperCase() }));
    };

    const handleSaveGrade = (projectId: string) => {
        const grade = edits[projectId];
        if (grade === undefined) return;
        updateProjectGrade(projectId, grade || null);
        addToast({ type: 'success', message: t('gradeSavedToast').replace('${projectId}', projectId) });
        setEdits(prev => {
            const newEdits = { ...prev };
            delete newEdits[projectId];
            return newEdits;
        });
    };

    const handleDownload = (pg: ProjectGroup) => {
        const file = pg.project.finalSubmissions?.postDefenseFile;
        if (!file) return;

        const dataUrl = getFileDataUrl(file.fileId);
        if (dataUrl) {
            const studentNames = pg.students.map(s => `${s.name}_${s.surname}`).join('_and_');
            const safeStudentNames = studentNames.replace(/\s+/g, '_');
            const nameParts = file.name.split('.');
            const extension = nameParts.length > 1 ? nameParts.pop() : 'file';
            const newFileName = `${pg.project.projectId}_${safeStudentNames}_Final_Report.${extension}`;
            
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = newFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            addToast({ type: 'error', message: t('couldNotRetrieveFile') });
        }
    };

    const handleExportExcel = useCallback(() => {
        const dataToExport = sortedAndFilteredProjects.map(pg => ({
            'Project ID': pg.project.projectId,
            'Topic': pg.project.topicEng,
            'Students': pg.students.map(s => `${s.name} ${s.surname} (${s.studentId})`).join(', '),
            'Advisor': pg.project.advisorName,
            'Final Grade': pg.project.finalGrade || 'Not Graded'
        }));
        
        if (dataToExport.length === 0) {
            addToast({ type: 'info', message: t('noDataToExport') });
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Final Grades');

        worksheet['!cols'] = [{ wch: 15 }, { wch: 40 }, { wch: 40 }, { wch: 25 }, { wch: 15 }];

        XLSX.writeFile(workbook, 'final_project_grades.xlsx');
        addToast({ type: 'success', message: t('exportGradesSuccessToast') });
    }, [sortedAndFilteredProjects, addToast, t]);


    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div className="flex items-center">
                   <DocumentCheckIcon className="w-8 h-8 text-blue-600 mr-3"/>
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('finalGradesReports')}</h2>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">{t('finalGradesDescription')}</p>
                   </div>
                </div>
                <button
                    onClick={handleExportExcel}
                    className="mt-4 sm:mt-0 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    <TableCellsIcon className="w-5 h-5 mr-2" />
                    {t('exportGrades')}
                </button>
            </div>
            <div className="mb-4">
                 <div className="relative w-full sm:w-1/2 lg:w-1/3">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" /></div>
                    <input type="text" className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600 dark:placeholder:text-gray-400" placeholder={t('searchByIdTopicStudent')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
            </div>
            
            {/* Mobile Card View */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedAndFilteredProjects.map(pg => (
                    <div key={pg.project.projectId} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-md p-4 space-y-3">
                        <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
                            <p className="font-bold text-slate-800 dark:text-slate-100">{pg.project.projectId}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{pg.project.topicEng}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t('advisor')}: {pg.project.advisorName}</p>
                        </div>
                        <div className="text-sm">
                            <strong>{t('students')}:</strong> {pg.students.map(s => `${s.name} ${s.surname}`).join(', ')}
                        </div>
                        <div className="text-sm">
                             <strong>{t('finalReport')}:</strong> <button onClick={() => handleDownload(pg)} className="inline-flex items-center text-blue-600 hover:underline dark:text-blue-400">{t('download')} <ArrowDownTrayIcon className="w-4 h-4 ml-1"/></button>
                        </div>
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('finalGrades')}</label>
                             <div className="flex items-center gap-2 mt-1">
                                <input type="text" value={edits[pg.project.projectId] ?? pg.project.finalGrade ?? ''} onChange={e => handleGradeChange(pg.project.projectId, e.target.value)} className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"/>
                                {edits[pg.project.projectId] !== undefined && (
                                    <button onClick={() => handleSaveGrade(pg.project.projectId)} className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                                        <CheckIcon className="w-5 h-5"/>
                                    </button>
                                )}
                             </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                        <tr>
                            <SortableHeader sortKey="projectId" title={t('projectId')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="studentNames" title={t('students')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="advisorName" title={t('advisor')} sortConfig={sortConfig} requestSort={requestSort} />
                            <th scope="col" className="px-6 py-3">{t('finalReport')}</th>
                            <SortableHeader sortKey="finalGrade" title={t('finalGrades')} sortConfig={sortConfig} requestSort={requestSort} />
                            <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {sortedAndFilteredProjects.map(pg => (
                            <tr key={pg.project.projectId} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{pg.project.projectId}</td>
                                <td className="px-6 py-4">{pg.students.map(s => `${s.name} ${s.surname}`).join(', ')}</td>
                                <td className="px-6 py-4">{pg.project.advisorName}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => handleDownload(pg)} className="inline-flex items-center text-blue-600 hover:underline dark:text-blue-400">
                                        <ArrowDownTrayIcon className="w-4 h-4 mr-1"/>
                                        {t('download')}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <input type="text" value={edits[pg.project.projectId] ?? pg.project.finalGrade ?? ''} onChange={e => handleGradeChange(pg.project.projectId, e.target.value)} className="block w-24 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"/>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {edits[pg.project.projectId] !== undefined && (
                                        <button onClick={() => handleSaveGrade(pg.project.projectId)} className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg" aria-label={t('saveChanges')}>
                                            <CheckIcon className="w-5 h-5"/>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {sortedAndFilteredProjects.length === 0 && (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                        {searchQuery ? `${t('noProjectsForQuery').replace('${query}', searchQuery)}` : t('noProjectsToDisplay')}
                    </div>
                )}
            </div>
        </div>
    );
};
