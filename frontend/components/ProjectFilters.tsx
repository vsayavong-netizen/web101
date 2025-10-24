import React from 'react';
import { Advisor, User, ProjectHealth, Major, Gender, ProjectStatus } from '../types';
import { MagnifyingGlassIcon, XCircleIcon, ExclamationTriangleIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface ProjectFiltersProps {
    user: User;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    advisorFilter: string;
    setAdvisorFilter: (filter: string) => void;
    advisors: Advisor[];
    healthFilter?: ProjectHealth | null;
    onClearHealthFilter?: () => void;
    majors: Major[];
    genderFilter: string;
    setGenderFilter: (filter: string) => void;
    majorFilter: string;
    setMajorFilter: (filter: string) => void;
    statusFilter: string;
    setStatusFilter: (filter: string) => void;
    scheduleFilter: string;
    setScheduleFilter: (filter: string) => void;
    similarityFilter: boolean;
    setSimilarityFilter: (value: boolean) => void;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({ user, searchQuery, setSearchQuery, advisorFilter, setAdvisorFilter, advisors, healthFilter, onClearHealthFilter, majors, genderFilter, setGenderFilter, majorFilter, setMajorFilter, statusFilter, setStatusFilter, scheduleFilter, setScheduleFilter, similarityFilter, setSimilarityFilter }) => {
    const t = useTranslations();
    const selectClass = "block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600";
    
    return (
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative sm:col-span-2 lg:col-span-4">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        name="search"
                        id="search"
                        className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600 dark:placeholder:text-gray-400"
                        placeholder={t('searchByIdTopicStudent')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                 {user.role !== 'Student' && (
                    <div className="w-full">
                        <select id="advisor" name="advisor" className={selectClass} value={advisorFilter} onChange={(e) => setAdvisorFilter(e.target.value)}>
                            <option value="all">{t('allAdvisors')}</option>
                            {advisors.map(adv => (
                                <option key={adv.id} value={adv.name}>{adv.name}</option>
                            ))}
                        </select>
                    </div>
                 )}
                 <div>
                    <select id="major" name="major" className={selectClass} value={majorFilter} onChange={(e) => setMajorFilter(e.target.value)}>
                        <option value="all">{t('allMajors')}</option>
                        {majors.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <select id="status" name="status" className={selectClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">{t('allStatuses')}</option>
                        {Object.values(ProjectStatus).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <select id="gender" name="gender" className={selectClass} value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                        <option value="all">{t('allGenders')}</option>
                        {Object.values(Gender).map(g => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <select id="schedule" name="schedule" className={selectClass} value={scheduleFilter} onChange={(e) => setScheduleFilter(e.target.value)}>
                        <option value="all">{t('allSchedules')}</option>
                        <option value="scheduled">{t('scheduled')}</option>
                        <option value="unscheduled">{t('unscheduled')}</option>
                    </select>
                </div>
                {healthFilter && onClearHealthFilter && (
                    <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm font-semibold px-3 py-1.5 rounded-full">
                        <span>{t('health')}: {healthFilter}</span>
                        <button onClick={onClearHealthFilter} className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100">
                            <XCircleIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
                 <div className="sm:col-span-2 lg:col-span-4 flex items-center pt-2">
                    <input
                        type="checkbox"
                        id="similarity-filter"
                        checked={similarityFilter}
                        onChange={(e) => setSimilarityFilter(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:focus:ring-offset-slate-800"
                    />
                    <label htmlFor="similarity-filter" className="ml-3 block text-sm font-medium text-gray-900 dark:text-gray-300 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1.5 text-amber-500"/>
                        {t('showOnlySimilar')}
                    </label>
                </div>
            </div>
        </div>
    );
};

export default ProjectFilters;