import React, { useState, useMemo, useCallback } from 'react';
import { ProjectGroup, FinalSubmissionFile, FinalSubmissionStatus } from '../types';
import { ArrowDownTrayIcon, MagnifyingGlassIcon, InboxStackIcon } from './icons';
import { useToast } from '../hooks/useToast';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import JSZip from 'jszip';
import { useTranslations } from '../hooks/useTranslations';

interface SubmissionsManagementProps {
    projectGroups: ProjectGroup[];
}

interface SubmissionRow {
  projectId: string;
  studentNames: string;
  advisorName: string;
  submissionType: 'Pre-Defense' | 'Post-Defense';
  file: FinalSubmissionFile;
}

type SubmissionSortKey = 'projectId' | 'studentNames' | 'submittedAt' | 'status' | 'advisorName';

// Helper functions
const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getFileDataUrl = (fileId: string): string => {
    try {
        return localStorage.getItem(`file_${fileId}`) || '';
    } catch (error) {
        console.error('Error reading file from localStorage:', error);
        return '';
    }
};

const getStatusStyles = (status: FinalSubmissionStatus) => {
    switch (status) {
        case FinalSubmissionStatus.Approved:
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case FinalSubmissionStatus.Submitted:
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case FinalSubmissionStatus.RequiresRevision:
            return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
        default:
            return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
};


const SubmissionsManagement: React.FC<SubmissionsManagementProps> = ({ projectGroups }) => {
    // States for Pre-Defense Table
    const [preSearchQuery, setPreSearchQuery] = useState('');
    const [preSortConfig, setPreSortConfig] = useState<SortConfig<SubmissionSortKey> | null>({ key: 'submittedAt', direction: 'descending' });
    const [isZippingPre, setIsZippingPre] = useState(false);

    // States for Post-Defense Table
    const [postSearchQuery, setPostSearchQuery] = useState('');
    const [postSortConfig, setPostSortConfig] = useState<SortConfig<SubmissionSortKey> | null>({ key: 'submittedAt', direction: 'descending' });
    const [isZippingPost, setIsZippingPost] = useState(false);
    
    const addToast = useToast();
    const t = useTranslations();

    // Split data into two lists
    const { preDefenseRows, postDefenseRows } = useMemo<{ preDefenseRows: SubmissionRow[], postDefenseRows: SubmissionRow[] }>(() => {
        const preRows: SubmissionRow[] = [];
        const postRows: SubmissionRow[] = [];
        projectGroups.forEach(pg => {
            const studentNames = pg.students.map(s => `${s.name} ${s.surname}`).join(', ');
            if (pg.project.finalSubmissions?.preDefenseFile) {
                preRows.push({
                    projectId: pg.project.projectId,
                    studentNames,
                    advisorName: pg.project.advisorName,
                    submissionType: 'Pre-Defense',
                    file: pg.project.finalSubmissions.preDefenseFile
                });
            }
            if (pg.project.finalSubmissions?.postDefenseFile) {
                postRows.push({
                    projectId: pg.project.projectId,
                    studentNames,
                    advisorName: pg.project.advisorName,
                    submissionType: 'Post-Defense',
                    file: pg.project.finalSubmissions.postDefenseFile
                });
            }
        });
        return { preDefenseRows: preRows, postDefenseRows: postRows };
    }, [projectGroups]);
    
    // Sort functions for each table
    const requestPreSort = (key: SubmissionSortKey) => {
        let direction: SortDirection = 'ascending';
        if (preSortConfig && preSortConfig.key === key && preSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setPreSortConfig({ key, direction });
    };
    const requestPostSort = (key: SubmissionSortKey) => {
        let direction: SortDirection = 'ascending';
        if (postSortConfig && postSortConfig.key === key && postSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setPostSortConfig({ key, direction });
    };

    // Generic sorting and filtering logic
    const applySortAndFilter = (
        rows: SubmissionRow[], 
        query: string, 
        config: SortConfig<SubmissionSortKey> | null
    ): SubmissionRow[] => {
        let filtered = [...rows];
        if (query) {
            const lowercasedQuery = query.toLowerCase();
            filtered = filtered.filter(row =>
                row.projectId.toLowerCase().includes(lowercasedQuery) ||
                row.studentNames.toLowerCase().includes(lowercasedQuery) ||
                row.advisorName.toLowerCase().includes(lowercasedQuery) ||
                row.file.name.toLowerCase().includes(lowercasedQuery)
            );
        }
        if (config !== null) {
            filtered.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;

                if (config.key === 'submittedAt') {
                    aValue = new Date(a.file.submittedAt).getTime();
                    bValue = new Date(b.file.submittedAt).getTime();
                } else if (config.key === 'status') {
                    aValue = a.file.status;
                    bValue = b.file.status;
                } else {
                    aValue = a[config.key as keyof Omit<SubmissionRow, 'file'>];
                    bValue = b[config.key as keyof Omit<SubmissionRow, 'file'>];
                }
                
                if (aValue < bValue) return config.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return config.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    };

    const sortedAndFilteredPreDefense = useMemo(() => applySortAndFilter(preDefenseRows, preSearchQuery, preSortConfig), [preDefenseRows, preSearchQuery, preSortConfig]);
    const sortedAndFilteredPostDefense = useMemo(() => applySortAndFilter(postDefenseRows, postSearchQuery, postSortConfig), [postDefenseRows, postSearchQuery, postSortConfig]);

    const handleDownload = (row: SubmissionRow) => {
        const dataUrl = getFileDataUrl(row.file.fileId);
        if (dataUrl) {
            const safeStudentNames = row.studentNames.replace(/, /g, ' and ').replace(/\s+/g, '_');
            
            const nameParts = row.file.name.split('.');
            const extension = nameParts.length > 1 ? nameParts.pop() : 'file';

            const submissionType = row.submissionType.replace(/\s+/g, '_');

            const newFileName = `${row.projectId}_${safeStudentNames}_${submissionType}.${extension}`;

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

    const handleBulkDownload = useCallback(async (type: 'pre' | 'post') => {
        const submissionsToZip = type === 'pre' ? sortedAndFilteredPreDefense : sortedAndFilteredPostDefense;
        const zipStateSetter = type === 'pre' ? setIsZippingPre : setIsZippingPost;
        const zipFileName = type === 'pre' ? 'Pre_Defense_Submissions' : 'Post_Defense_Submissions';
        
        if (submissionsToZip.length === 0) {
            addToast({ type: 'info', message: t('noFilesToDownload') });
            return;
        }

        zipStateSetter(true);
        addToast({ type: 'info', message: t('preparingDownload') });
    
        const zip = new JSZip();
    
        for (const row of submissionsToZip) {
            const dataUrl = getFileDataUrl(row.file.fileId);
            if (dataUrl) {
                const base64Data = dataUrl.split(',')[1];
                if(base64Data) {
                    const safeStudentNames = row.studentNames
                        .replace(/, /g, ' and ')
                        .replace(/\s+/g, ' ')
                        .trim();

                    const nameParts = row.file.name.split('.');
                    const extension = nameParts.length > 1 ? nameParts.pop() : 'file';

                    const baseName = `${row.projectId} ${safeStudentNames} ${row.submissionType}`;
                    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9 ._-]/g, '').replace(/\s/g, '_');
                    
                    const newFileName = `${sanitizedBaseName}.${extension}`;

                    zip.file(newFileName, base64Data, { base64: true });
                }
            }
        }

        try {
            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = `${zipFileName}_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            addToast({ type: 'success', message: t('zipSuccess') });
        } catch (error) {
            console.error("Error creating zip file:", error);
            addToast({ type: 'error', message: t('zipFailed') });
        } finally {
            zipStateSetter(false);
        }
    }, [sortedAndFilteredPreDefense, sortedAndFilteredPostDefense, addToast, t]);

    return (
        <div className="space-y-8">
            {/* Pre-Defense Section */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div className="flex items-center">
                       <InboxStackIcon className="w-8 h-8 text-blue-600 mr-3"/>
                       <div>
                         <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('preDefenseTitle')}</h2>
                         <p className="text-slate-500 dark:text-slate-400 mt-1">{t('preDefenseDescription')}</p>
                       </div>
                    </div>
                    <button onClick={() => handleBulkDownload('pre')} disabled={isZippingPre} className="mt-4 sm:mt-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed">
                        {isZippingPre ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>{t('zipping')}</>) : (<><ArrowDownTrayIcon className="w-5 h-5 mr-2" />{t('downloadAll').replace('${count}', String(sortedAndFilteredPreDefense.length))}</>)}
                    </button>
                </div>
                 <div className="mb-4">
                     <div className="relative w-full sm:w-1/2 lg:w-1/3">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" /></div>
                        <input type="text" className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600 dark:placeholder:text-gray-400" placeholder={t('searchSubmissionsPlaceholder')} value={preSearchQuery} onChange={(e) => setPreSearchQuery(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                            <tr>
                                <SortableHeader sortKey="projectId" title={t('projectId')} sortConfig={preSortConfig} requestSort={requestPreSort} />
                                <SortableHeader sortKey="studentNames" title={t('students')} sortConfig={preSortConfig} requestSort={requestPreSort} />
                                <th scope="col" className="px-6 py-3">{t('fileName')}</th>
                                <SortableHeader sortKey="submittedAt" title={t('submitted')} sortConfig={preSortConfig} requestSort={requestPreSort} />
                                <SortableHeader sortKey="status" title={t('status')} sortConfig={preSortConfig} requestSort={requestPreSort} />
                                <SortableHeader sortKey="advisorName" title={t('advisor')} sortConfig={preSortConfig} requestSort={requestPreSort} />
                                <th scope="col" className="px-6 py-3 text-right">{t('download')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredPreDefense.map(row => (
                                <tr key={`${row.projectId}-pre`} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{row.projectId}</td>
                                    <td className="px-6 py-4">{row.studentNames}</td>
                                    <td className="px-6 py-4 truncate max-w-xs" title={row.file.name}>{row.file.name} <span className="text-slate-400 text-xs">({formatBytes(row.file.size)})</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(row.file.submittedAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles(row.file.status)}`}>{row.file.status}</span></td>
                                    <td className="px-6 py-4">{row.advisorName}</td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => handleDownload(row)} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ArrowDownTrayIcon className="w-5 h-5" /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedAndFilteredPreDefense.length === 0 && (<div className="text-center py-10 text-slate-500 dark:text-slate-400">{preSearchQuery ? `${t('noProjectsForQuery').replace('${query}', preSearchQuery)}` : t('noPreDefenseFiles')}</div>)}
                </div>
            </div>

            {/* Post-Defense Section */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div className="flex items-center">
                        <InboxStackIcon className="w-8 h-8 text-blue-600 mr-3"/>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('postDefenseTitle')}</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">{t('postDefenseDescription')}</p>
                        </div>
                    </div>
                    <button onClick={() => handleBulkDownload('post')} disabled={isZippingPost} className="mt-4 sm:mt-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed">
                        {isZippingPost ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>{t('zipping')}</>) : (<><ArrowDownTrayIcon className="w-5 h-5 mr-2" />{t('downloadAll').replace('${count}', String(sortedAndFilteredPostDefense.length))}</>)}
                    </button>
                </div>
                <div className="mb-4">
                    <div className="relative w-full sm:w-1/2 lg:w-1/3">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" /></div>
                        <input type="text" className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600 dark:placeholder:text-gray-400" placeholder={t('searchSubmissionsPlaceholder')} value={postSearchQuery} onChange={(e) => setPostSearchQuery(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                            <tr>
                                <SortableHeader sortKey="projectId" title={t('projectId')} sortConfig={postSortConfig} requestSort={requestPostSort} />
                                <SortableHeader sortKey="studentNames" title={t('students')} sortConfig={postSortConfig} requestSort={requestPostSort} />
                                <th scope="col" className="px-6 py-3">{t('fileName')}</th>
                                <SortableHeader sortKey="submittedAt" title={t('submitted')} sortConfig={postSortConfig} requestSort={requestPostSort} />
                                <SortableHeader sortKey="status" title={t('status')} sortConfig={postSortConfig} requestSort={requestPostSort} />
                                <SortableHeader sortKey="advisorName" title={t('advisor')} sortConfig={postSortConfig} requestSort={requestPostSort} />
                                <th scope="col" className="px-6 py-3 text-right">{t('download')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredPostDefense.map(row => (
                                <tr key={`${row.projectId}-post`} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{row.projectId}</td>
                                    <td className="px-6 py-4">{row.studentNames}</td>
                                    <td className="px-6 py-4 truncate max-w-xs" title={row.file.name}>{row.file.name} <span className="text-slate-400 text-xs">({formatBytes(row.file.size)})</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(row.file.submittedAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles(row.file.status)}`}>{row.file.status}</span></td>
                                    <td className="px-6 py-4">{row.advisorName}</td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => handleDownload(row)} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ArrowDownTrayIcon className="w-5 h-5" /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedAndFilteredPostDefense.length === 0 && (<div className="text-center py-10 text-slate-500 dark:text-slate-400">{postSearchQuery ? `${t('noProjectsForQuery').replace('${query}', postSearchQuery)}` : t('noPostDefenseFiles')}</div>)}
                </div>
            </div>
        </div>
    );
};

export default SubmissionsManagement;
