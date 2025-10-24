import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ProjectGroup, Advisor, Student, Major, ProjectStatus, Classroom, Gender } from '../types';
import { DocumentChartBarIcon, TableCellsIcon, MagnifyingGlassIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon } from './icons';
import SortableHeader, { SortConfig } from './SortableHeader';
import { ExcelUtils } from '../utils/excelUtils';
import { useToast } from '../hooks/useToast';
import { GoogleGenAI, Type } from "@google/genai";
import { useTranslations } from '../hooks/useTranslations';
import ColumnSelector from './ColumnSelector';
import Pagination from './Pagination';

interface ReportingPageProps {
    projectGroups: ProjectGroup[];
    advisors: Advisor[];
    students: Student[];
    majors: Major[];
    classrooms: Classroom[];
    committeeCounts: Record<string, { main: number; second: number; third: number }>;
}

const ITEMS_PER_PAGE = 20;

const DEFAULT_PROJECT_COLS = ['projectId', 'topicEng', 'status', 'advisorName', 'studentId', 'studentName', 'majorName'];
const DEFAULT_STUDENT_COLS = ['studentId', 'studentName', 'gender', 'majorName', 'classroom', 'email', 'status'];


export const ReportingPage: React.FC<ReportingPageProps> = ({ projectGroups, advisors, students, majors, classrooms, committeeCounts }) => {
    const [reportType, setReportType] = useState<'project' | 'student'>('project');
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_PROJECT_COLS);
    const [generatedData, setGeneratedData] = useState<any[] | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig<string> | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    const addToast = useToast();
    const t = useTranslations();
    
    const ALL_COLUMNS = useMemo(() => [
        { key: 'projectId', label: t('projectId'), types: ['project'] },
        { key: 'topicEng', label: t('topicEng'), types: ['project'] },
        { key: 'topicLao', label: t('topicLao'), types: ['project'] },
        { key: 'status', label: t('projectStatus'), types: ['project', 'student'] },
        { key: 'advisorName', label: t('advisor'), types: ['project'] },
        { key: 'studentId', label: t('studentId'), types: ['project', 'student'] },
        { key: 'studentName', label: t('studentName'), types: ['project', 'student'] },
        { key: 'gender', label: t('gender'), types: ['project', 'student'] },
        { key: 'majorName', label: t('major'), types: ['project', 'student'] },
        { key: 'classroom', label: t('classroom'), types: ['project', 'student'] },
        { key: 'tel', label: t('telephone'), types: ['student'] },
        { key: 'email', label: t('email'), types: ['student'] },
        { key: 'defenseDate', label: t('defenseDate'), types: ['project'] },
        { key: 'finalGrade', label: t('finalGrade'), types: ['project'] },
    ], [t]);


    useEffect(() => {
        setFilters({});
        setGeneratedData(null);
        setSortConfig(null);
        setCurrentPage(1);
        setAiSummary(null);
        setSelectedColumns(reportType === 'project' ? DEFAULT_PROJECT_COLS : DEFAULT_STUDENT_COLS);
    }, [reportType]);
    
    const availableColumns = useMemo(() => ALL_COLUMNS.filter(c => c.types.includes(reportType)), [reportType, ALL_COLUMNS]);
    
    const flattenedProjectData = useMemo(() => {
        const advisorMap = new Map(advisors.map(a => [a.id, a.name]));
        return projectGroups.flatMap(pg => 
            pg.students.map(s => ({
                ...s,
                ...pg.project,
                studentName: `${s.name} ${s.surname}`,
                majorName: s.major,
                mainCommittee: advisorMap.get(pg.project.mainCommitteeId || '') || 'N/A',
                secondCommittee: advisorMap.get(pg.project.secondCommitteeId || '') || 'N/A',
                thirdCommittee: advisorMap.get(pg.project.thirdCommitteeId || '') || 'N/A',
            }))
        );
    }, [projectGroups, advisors]);

    const handleGenerateReport = () => {
        let data: any[] = reportType === 'project' ? flattenedProjectData : students;
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'all') {
                data = data.filter(item => item[key] === value);
            }
        });
        
        setGeneratedData(data);
        setCurrentPage(1);
        setSortConfig(null);
        setAiSummary(null);
        addToast({type: 'success', message: t('reportGeneratedSuccess').replace('{count}', String(data.length))});
    };
    
    const sortedData = useMemo(() => {
        if (!generatedData) return [];
        let sortableItems = [...generatedData];
        if (sortConfig) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key] ?? '';
                const bValue = b[sortConfig.key] ?? '';
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [generatedData, sortConfig]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedData, currentPage]);
    
    const handleExport = useCallback(() => {
        if (!generatedData) {
            addToast({ type: 'info', message: t('generateReportFirst') });
            return;
        }
        
        const dataToExport = sortedData.map(row => {
            const selectedRow: Record<string, any> = {};
            selectedColumns.forEach(key => {
                selectedRow[ALL_COLUMNS.find(c => c.key === key)?.label || key] = row[key] ?? '';
            });
            return selectedRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        XLSX.writeFile(workbook, `${reportType}_report_${new Date().toISOString().slice(0,10)}.xlsx`);
    }, [generatedData, sortedData, selectedColumns, reportType, addToast, t, ALL_COLUMNS]);
    
    const handleAiSummary = async () => {
        if (!generatedData || generatedData.length === 0) {
            addToast({type: 'info', message: t('generateReportWithDataFirst')});
            return;
        }
        if (!process.env.API_KEY) {
            addToast({type: 'error', message: t('aiFeatureNotConfigured')});
            return;
        }
        setIsGeneratingSummary(true);
        setAiSummary('');
        
        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            const dataSample = generatedData.slice(0, 50).map(row => {
                const sampleRow: Record<string, any> = {};
                selectedColumns.forEach(key => sampleRow[key] = row[key]);
                return sampleRow;
            });
            const prompt = `
              You are a data analyst for a university. Analyze the following sample of a report and provide a brief summary.
              The full report contains ${generatedData.length} entries. This is a sample of ${dataSample.length} entries.
              Report Data: ${JSON.stringify(dataSample, null, 2)}
              
              Based on this data, provide:
              1. A one-sentence high-level summary.
              2. Two or three bullet points highlighting key trends or interesting data points (e.g., "High number of pending projects in the BM major," or "Most students are from the IBM-4A classroom.").
              3. One actionable recommendation based on your findings.
              
              Format your response using Markdown.
            `;
            const response = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: prompt});
            setAiSummary(response.text);

        } catch(e) {
            console.error(e);
            addToast({type: 'error', message: t('aiSummaryFailed')});
            setAiSummary(null);
        } finally {
            setIsGeneratingSummary(false);
        }
    };
    
    const renderFilters = () => {
        switch(reportType) {
            case 'project':
                return <>
                    <select onChange={e => setFilters(f => ({...f, majorName: e.target.value}))} className="select-style"><option value="all">{t('allMajors')}</option>{majors.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select>
                    <select onChange={e => setFilters(f => ({...f, advisorName: e.target.value}))} className="select-style"><option value="all">{t('allAdvisors')}</option>{advisors.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}</select>
                    <select onChange={e => setFilters(f => ({...f, status: e.target.value}))} className="select-style"><option value="all">{t('allStatuses')}</option>{Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}</select>
                </>;
            case 'student':
                return <>
                    <select onChange={e => setFilters(f => ({...f, major: e.target.value}))} className="select-style"><option value="all">{t('allMajors')}</option>{majors.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select>
                    <select onChange={e => setFilters(f => ({...f, classroom: e.target.value}))} className="select-style"><option value="all">{t('classrooms')}</option>{classrooms.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
                    <select onChange={e => setFilters(f => ({...f, gender: e.target.value}))} className="select-style"><option value="all">{t('allGenders')}</option>{Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}</select>
                </>;
            default: return null;
        }
    };

    const requestSort = (columnKey: string) => {
        setSortConfig(prev => ({
            key: columnKey,
            direction: prev?.key === columnKey && prev.direction === 'ascending' ? 'descending' : 'ascending',
        }));
    };
    
    return (
        <div className="space-y-6">
            <style>{`.select-style { appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem; display: block; width: 100%; border-radius: 0.375rem; border-width: 0; padding-top: 0.5rem; padding-bottom: 0.5rem; padding-left: 0.75rem; color: #111827; ring: 1px solid #d1d5db; --tw-ring-inset: inset; } .dark .select-style { background-color: #374151; color: #fff; ring-color: #4b5563; } .label-style { display: block; font-size: 0.875rem; line-height: 1.25rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem; } .dark .label-style { color: #d1d5db; } .btn-primary { background-color: #2563eb; color: #fff; font-weight: 700; padding: 0.5rem 1rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; } .btn-primary:hover { background-color: #1d4ed8; } .btn-primary:disabled { background-color: #9ca3af; cursor: not-allowed; } .btn-secondary { background-color: #4b5563; color: #fff; font-weight: 700; padding: 0.5rem 1rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; } .btn-secondary:hover { background-color: #374151; } .btn-secondary:disabled { background-color: #9ca3af; cursor: not-allowed; } .btn-special { background-color: #7c3aed; color: #fff; font-weight: 700; padding: 0.5rem 1rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; } .btn-special:hover { background-color: #6d28d9; } .btn-special:disabled { background-color: #9ca3af; cursor: not-allowed; }`}</style>
            <div className="flex items-center">
               <DocumentChartBarIcon className="w-8 h-8 text-blue-600 mr-3"/>
               <div>
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('reportingInsights')}</h2>
                 <p className="text-slate-500 dark:text-slate-400 mt-1">{t('reportingDescription')}</p>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div><label className="label-style">{t('reportType')}</label><select value={reportType} onChange={e => setReportType(e.target.value as any)} className="select-style"><option value="project">{t('projectReport')}</option><option value="student">{t('studentReport')}</option></select></div>
                    {renderFilters()}
                    <div className="md:col-span-2 lg:col-span-4"><label className="label-style">{t('columns')}</label><ColumnSelector allColumns={availableColumns} selectedColumns={selectedColumns} setSelectedColumns={setSelectedColumns} /></div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={handleGenerateReport} className="btn-primary w-full sm:w-auto">{t('generateReport')}</button>
                    <button onClick={handleExport} disabled={!generatedData} className="btn-secondary w-full sm:w-auto"><TableCellsIcon className="w-5 h-5 mr-2"/>{t('exportToExcel')}</button>
                    <button onClick={handleAiSummary} disabled={!generatedData || isGeneratingSummary} className="btn-special w-full sm:w-auto"><SparklesIcon className="w-5 h-5 mr-2"/>{t('aiSummary')}</button>
                </div>
            </div>

            {aiSummary && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2"><SparklesIcon className="w-5 h-5"/>{t('aiSummary')}</h3>
                    <div className="prose prose-sm max-w-none text-purple-700 dark:text-purple-300 mt-2" dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br />') }}/>
                </div>
            )}
            
            {generatedData && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                             <thead className="bg-slate-100 dark:bg-slate-700"><tr>{selectedColumns.map(colKey => (
<React.Fragment key={colKey}>
    <SortableHeader 
        sortKey={colKey} 
        title={ALL_COLUMNS.find(c => c.key === colKey)?.label || colKey} 
        sortConfig={sortConfig} 
        requestSort={requestSort} 
        className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider" 
    />
</React.Fragment>
))}</tr></thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {paginatedData.map((row, index) => <tr key={index}>{selectedColumns.map(key => <td key={key} className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">{row[key] ?? ''}</td>)}</tr>)}
                            </tbody>
                        </table>
                    </div>
                    {generatedData.length === 0 && <p className="text-center py-8 text-slate-500 dark:text-slate-400">{t('noDataForFilters')}</p>}
                    <Pagination currentPage={currentPage} totalPages={Math.ceil(sortedData.length / ITEMS_PER_PAGE)} totalItems={sortedData.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
                </div>
            )}
        </div>
    );
};
