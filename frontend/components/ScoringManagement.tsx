import React, { useState, useMemo, useCallback } from 'react';
import { ProjectGroup, ScoringSettings, Advisor } from '../types';
import SortableHeader, { SortConfig, SortDirection } from './SortableHeader';
import { MagnifyingGlassIcon, PencilSquareIcon, TableCellsIcon } from './icons';
import { ExcelUtils } from '../utils/excelUtils';
import { useToast } from '../hooks/useToast';
import { useTranslations } from '../hooks/useTranslations';

interface ScoringManagementProps {
    projectGroups: ProjectGroup[];
    advisors: Advisor[];
    scoringSettings: ScoringSettings;
    onSelectProject: (projectGroup: ProjectGroup) => void;
}

type SortKey = 'projectId' | 'studentNames' | 'advisorName' | 'finalScore' | 'finalGrade';

const ScoringManagement: React.FC<ScoringManagementProps> = ({ projectGroups, scoringSettings, onSelectProject, advisors }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig<SortKey> | null>({ key: 'projectId', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');
    const addToast = useToast();
    const t = useTranslations();
    
    const scoreableProjects = useMemo(() => {
        return projectGroups.filter(pg => 
            pg.project.defenseDate &&
            pg.project.mainCommitteeId &&
            pg.project.secondCommitteeId &&
            pg.project.thirdCommitteeId
        );
    }, [projectGroups]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const calculateFinalScore = useCallback((project: ProjectGroup['project']) => {
        const { mainAdvisorScore, mainCommitteeScore, secondCommitteeScore, thirdCommitteeScore } = project;
        if (mainAdvisorScore === null || mainCommitteeScore === null || secondCommitteeScore === null || thirdCommitteeScore === null) return null;

        const avgCommitteeScore = (mainCommitteeScore + secondCommitteeScore + thirdCommitteeScore) / 3;
        const finalScore = mainAdvisorScore + avgCommitteeScore;
        
        return finalScore;
    }, []);

    const getFinalGrade = useCallback((score: number | null): string => {
        if (score === null) return t('incomplete');
        const foundGrade = scoringSettings.gradeBoundaries.find(boundary => score >= boundary.minScore);
        return foundGrade ? foundGrade.grade : 'F';
    }, [scoringSettings.gradeBoundaries, t]);

    const projectsWithScores = useMemo(() => {
        return scoreableProjects.map(pg => {
            const finalScore = calculateFinalScore(pg.project);
            return {
                ...pg,
                finalScore,
                finalGrade: getFinalGrade(finalScore),
                studentNames: pg.students.map(s => `${s.name} ${s.surname}`).join(', '),
                committeeAvgScore: (pg.project.mainCommitteeScore !== null && pg.project.secondCommitteeScore !== null && pg.project.thirdCommitteeScore !== null)
                    ? ((pg.project.mainCommitteeScore + pg.project.secondCommitteeScore + pg.project.thirdCommitteeScore) / 3)
                    : null
            };
        });
    }, [scoreableProjects, calculateFinalScore, getFinalGrade]);


    const sortedAndFilteredProjects = useMemo(() => {
        let filtered = [...projectsWithScores];
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(pg =>
                pg.project.projectId.toLowerCase().includes(lowercasedQuery) ||
                pg.project.topicEng.toLowerCase().includes(lowercasedQuery) ||
                pg.studentNames.toLowerCase().includes(lowercasedQuery) ||
                pg.project.advisorName.toLowerCase().includes(lowercasedQuery)
            );
        }
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue: string | number | null;
                let bValue: string | number | null;
                switch(sortConfig.key) {
                    case 'finalScore':
                        aValue = a.finalScore === null ? -1 : a.finalScore;
                        bValue = b.finalScore === null ? -1 : b.finalScore;
                        break;
                    case 'finalGrade':
                        aValue = a.finalGrade;
                        bValue = b.finalGrade;
                        break;
                    case 'studentNames':
                        aValue = a.studentNames;
                        bValue = b.studentNames;
                        break;
                    default:
                        aValue = a.project[sortConfig.key as keyof typeof a.project] as string | number;
                        bValue = b.project[sortConfig.key as keyof typeof b.project] as string | number;
                }
                
                if (aValue === null || aValue === 'Incomplete') return 1;
                if (bValue === null || bValue === 'Incomplete') return -1;
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [projectsWithScores, searchQuery, sortConfig]);

    const handleExportExcel = useCallback(() => {
        const dataToExport = sortedAndFilteredProjects.map(pg => ({
            'Project ID': pg.project.projectId,
            'Students': pg.studentNames,
            'Advisor': pg.project.advisorName,
            'Advisor Score': pg.project.mainAdvisorScore?.toFixed(2) ?? 'N/A',
            'Committee Avg.': pg.committeeAvgScore?.toFixed(2) ?? 'N/A',
            'Final Score': pg.finalScore?.toFixed(2) ?? 'N/A',
            'Final Grade': pg.finalGrade,
        }));
    
        if (dataToExport.length === 0) {
            addToast({ type: 'info', message: t('noDataToExport') });
            return;
        }
    
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Scoring');
    
        worksheet['!cols'] = [{ wch: 15 }, { wch: 40 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    
        XLSX.writeFile(workbook, 'scoring_report.xlsx');
        addToast({ type: 'success', message: t('exportScoringSuccess') });
    }, [sortedAndFilteredProjects, addToast, t]);
    
    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div className="flex items-center">
                   <PencilSquareIcon className="w-8 h-8 text-blue-600 mr-3"/>
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('manageScoringTitle')}</h2>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">{t('manageScoringDescription')}</p>
                   </div>
                </div>
                <button
                    onClick={handleExportExcel}
                    className="mt-4 sm:mt-0 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    <TableCellsIcon className="w-5 h-5 mr-2" />
                    {t('exportScoringReport')}
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
                        placeholder={t('searchByIdTopicStudent')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                        <tr>
                            <SortableHeader sortKey="projectId" title={t('projectId')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="studentNames" title={t('students')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="advisorName" title={t('advisor')} sortConfig={sortConfig} requestSort={requestSort} />
                            <th scope="col" className="px-6 py-3">{t('advisorScore')}</th>
                            <th scope="col" className="px-6 py-3">{t('committeeAvg')}</th>
                            <SortableHeader sortKey="finalScore" title={t('finalScore')} sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="finalGrade" title={t('finalGrade')} sortConfig={sortConfig} requestSort={requestSort} />
                            <th scope="col" className="px-6 py-3">{t('details')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {sortedAndFilteredProjects.map(pg => (
                            <tr key={pg.project.projectId} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700">
                                <td className="px-6 py-4 font-medium">{pg.project.projectId}</td>
                                <td className="px-6 py-4">{pg.studentNames}</td>
                                <td className="px-6 py-4">{pg.project.advisorName}</td>
                                <td className="px-6 py-4">{pg.project.mainAdvisorScore?.toFixed(2) ?? t('na')}</td>
                                <td className="px-6 py-4">{pg.committeeAvgScore?.toFixed(2) ?? t('na')}</td>
                                <td className="px-6 py-4 font-semibold">{pg.finalScore?.toFixed(2) ?? t('na')}</td>
                                <td className="px-6 py-4 font-bold">{pg.finalGrade}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => onSelectProject(pg)} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">{t('view')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sortedAndFilteredProjects.length === 0 && (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                        {searchQuery ? t('noProjectsForQuery').replace('${query}', searchQuery) : t('noScoreableProjects')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScoringManagement;