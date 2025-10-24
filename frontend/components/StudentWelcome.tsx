import React, { useState, useMemo } from 'react';
import { PlusIcon, BuildingLibraryIcon, AcademicCapIcon, QuestionMarkCircleIcon, SparklesIcon } from './icons';
import { Advisor, ProjectGroup, Announcement, User, ProjectStatus, Major, Gender } from '../types';
import { getAdvisorColor } from '../utils/colorUtils';
import AnnouncementsFeed from './AnnouncementsFeed';
import ProjectTable from './ProjectTable';
import ProjectFilters from './ProjectFilters';
import { SortConfig } from './SortableHeader';
import { useTranslations } from '../hooks/useTranslations';

type SortKey = 'studentId' | 'projectId' | 'advisorName';

interface StudentWelcomeProps {
    onRegisterClick: () => void;
    onOpenSuggester: () => void;
    advisors: Advisor[];
    advisorProjectCounts: Record<string, number>;
    allProjects: ProjectGroup[];
    announcements: Announcement[];
    user: User;
    onStartTour: () => void;
    onSelectProject: (projectGroup: ProjectGroup) => void;
    majors: Major[];
}

const AdvisorWorkload: React.FC<{ advisor: Advisor; count: number }> = ({ advisor, count }) => {
    const t = useTranslations();
    const percentage = advisor.quota > 0 ? (count / advisor.quota) * 100 : 0;
    const color = getAdvisorColor(advisor.name);
    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-baseline">
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                  <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: color }}></span>
                  {advisor.name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{count} / {advisor.quota} {t('projects')}</p>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                <div 
                    className="h-2 rounded-full" 
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                ></div>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium text-center rounded-t-lg transition-colors border-b-2
      ${active
        ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
        : 'text-slate-500 border-transparent hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600'
      }`
    }
  >
    {children}
  </button>
);


export const StudentWelcome: React.FC<StudentWelcomeProps> = ({ onRegisterClick, onOpenSuggester, advisors, advisorProjectCounts, allProjects, announcements, user, onStartTour, onSelectProject, majors }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [advisorFilter, setAdvisorFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<SortConfig<SortKey> | null>({ key: 'projectId', direction: 'ascending' });
  const [genderFilter, setGenderFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [similarityFilter, setSimilarityFilter] = useState(false);
  const t = useTranslations();

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const filteredProjects = useMemo(() => {
    if (!searchQuery && majorFilter === 'all' && statusFilter === 'all' && genderFilter === 'all' && scheduleFilter === 'all' && !similarityFilter) {
      return allProjects;
    }
    
    const lowercasedQuery = searchQuery.toLowerCase();

    return allProjects.filter(group => {
      const matchesSearch = searchQuery === '' ||
        group.project.projectId.toLowerCase().includes(lowercasedQuery) ||
        group.project.topicLao.toLowerCase().includes(lowercasedQuery) ||
        group.project.topicEng.toLowerCase().includes(lowercasedQuery) ||
        group.students.some(s => 
          s.studentId.toLowerCase().includes(lowercasedQuery) ||
          `${s.name} ${s.surname}`.toLowerCase().includes(lowercasedQuery)
        );

      const matchesGender = genderFilter === 'all' || group.students.some(s => s.gender === genderFilter);
      const matchesMajor = majorFilter === 'all' || group.students.some(s => s.major === majorFilter);
      const matchesStatus = statusFilter === 'all' || group.project.status === statusFilter;
      
      const isScheduled = !!(group.project.defenseDate && group.project.defenseTime && group.project.defenseRoom);
      const matchesSchedule = scheduleFilter === 'all' || (scheduleFilter === 'scheduled' ? isScheduled : !isScheduled);
        
      const matchesSimilarity = !similarityFilter || (similarityFilter && !!group.project.similarityInfo);
        
      return matchesSearch && matchesGender && matchesMajor && matchesStatus && matchesSchedule && matchesSimilarity;
    });
  }, [allProjects, searchQuery, genderFilter, majorFilter, statusFilter, scheduleFilter, similarityFilter]);

  const sortedProjects = useMemo(() => {
    if (!sortConfig) return filteredProjects;
    
    const sorted = [...filteredProjects].sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.key) {
        case 'studentId':
          aValue = a.students[0]?.studentId || '';
          bValue = b.students[0]?.studentId || '';
          break;
        case 'projectId':
          aValue = a.project.projectId;
          bValue = b.project.projectId;
          break;
        case 'advisorName':
          aValue = a.project.advisorName;
          bValue = b.project.advisorName;
          break;
        default:
          return 0;
      }
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [filteredProjects, sortConfig]);

  return (
    <div className="space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex -mb-px space-x-4">
                <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>{t('dashboard')}</TabButton>
                <TabButton active={activeTab === 'projects'} onClick={() => setActiveTab('projects')}>{t('browseAllProjects')}</TabButton>
            </div>
        </div>

        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
                <div id="welcome-panel" className="relative lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg text-center py-16 px-6">
                  <button onClick={onStartTour} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" title="Replay introduction tour">
                    <QuestionMarkCircleIcon className="w-6 h-6" />
                  </button>
                  <BuildingLibraryIcon className="mx-auto h-16 w-16 text-blue-500" />
                  <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">{t('welcomeToPortal')}</h2>
                  <p className="mt-2 text-md text-slate-600 dark:text-slate-400">
                    {t('notAssignedToProject')}
                  </p>
                  <p className="mt-1 text-md text-slate-600 dark:text-slate-400">
                    {t('canRegisterProject')}
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      id="ai-topic-suggester-btn-welcome"
                      type="button"
                      onClick={onOpenSuggester}
                      className="inline-flex items-center rounded-md bg-purple-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-purple-700 transition-transform transform hover:scale-105"
                    >
                      <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                      {t('aiTopicSuggestion')}
                    </button>
                    <button
                      id="register-project-btn-welcome"
                      type="button"
                      onClick={onRegisterClick}
                      className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 transition-transform transform hover:scale-105"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      {t('registerYourProject')}
                    </button>
                  </div>
                </div>
                <div className="lg:col-span-1 space-y-8">
                     <AnnouncementsFeed announcements={announcements} user={user} />
                     <div id="advisor-workload-panel" className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-full p-3">
                                <AcademicCapIcon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                 <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">{t('allAdvisors')}</p>
                                 <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                    {advisors.map(adv => (
                                        <AdvisorWorkload key={adv.id} advisor={adv} count={advisorProjectCounts[adv.name] || 0} />
                                    ))}
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {activeTab === 'projects' && (
            <div className="space-y-6 animate-fade-in">
                <ProjectFilters
                    user={user}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    advisorFilter={advisorFilter}
                    setAdvisorFilter={setAdvisorFilter}
                    advisors={[]}
                    majors={majors}
                    genderFilter={genderFilter}
                    setGenderFilter={setGenderFilter}
                    majorFilter={majorFilter}
                    setMajorFilter={setMajorFilter}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    scheduleFilter={scheduleFilter}
                    setScheduleFilter={setScheduleFilter}
                    similarityFilter={similarityFilter}
                    setSimilarityFilter={setSimilarityFilter}
                />
                <ProjectTable
                    user={user}
                    projectGroups={sortedProjects}
                    onSelectProject={onSelectProject}
                    onRegisterClick={onRegisterClick}
                    sortConfig={sortConfig}
                    requestSort={requestSort}
                    onUpdateStatus={(projectId: string, status: ProjectStatus) => {}}
                />
            </div>
        )}
    </div>
  );
};