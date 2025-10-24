import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PlusIcon, ArrowRightOnRectangleIcon, BuildingLibraryIcon, ArrowDownTrayIcon, SunIcon, MoonIcon, AcademicCapIcon, UserGroupIcon, BookOpenIcon, BuildingOfficeIcon, CalendarPlusIcon, BellIcon, TableCellsIcon, ClipboardDocumentCheckIcon, ChartBarIcon, ChartPieIcon, MegaphoneIcon, InboxStackIcon, UserCircleIcon, UserIcon as ProfileIcon, ClipboardDocumentListIcon, DocumentCheckIcon, PencilSquareIcon, Cog6ToothIcon, CalendarDaysIcon, DocumentChartBarIcon, KeyIcon, SparklesIcon, CheckIcon } from './icons';
import { useTheme } from '../hooks/useTheme';
import { User, Notification, Role, Student, Advisor } from '../types';
import NotificationPanel from './NotificationPanel';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslations } from '../hooks/useTranslations';

type ActiveView = 'dashboard' | 'projects' | 'students' | 'advisors' | 'majors' | 'classrooms' | 'milestoneTemplates' | 'submissions' | 'timeline' | 'analytics' | 'announcements' | 'committees' | 'scoring' | 'finalGrades' | 'settings' | 'calendar' | 'reporting' | 'deptAdmins' | 'aiTools' | 'notifications';

interface HeaderProps {
  onRegisterClick: () => void;
  onLogout: () => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
  user: User & Partial<Student & Advisor>;
  effectiveRole: Role;
  onSwitchRole: (newRole: Role) => void;
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  currentAcademicYear: string;
  availableYears: string[];
  onYearChange: (year: string) => void;
  onStartNewYear: () => void;
  notifications: Notification[];
  projectsToReviewCount?: number;
  isReviewFilterActive?: boolean;
  onToggleReviewFilter?: () => void;
  onOpenProfile: () => void;
  onSelectNotification: (notification: Notification) => void;
  onMarkNotificationsAsRead: () => void;
}

const NavButton: React.FC<{
  currentView: ActiveView;
  activeView: ActiveView;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}> = ({ currentView, activeView, onClick, children, icon }) => {
  const isActive = activeView === currentView;
  return (
     <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        {icon}
        <span>{children}</span>
      </button>
  )
}

interface RoleSwitchButtonProps {
    role: Role;
    label: string;
    icon: React.ReactNode;
    activeRole: Role;
    onSwitch: () => void;
}

const RoleSwitchButton: React.FC<RoleSwitchButtonProps> = ({ role, label, icon, activeRole, onSwitch }) => {
    const isActive = role === activeRole;
    return (
        <button
            onClick={onSwitch}
            className={`w-full text-left flex items-center justify-between gap-2 px-4 py-2 text-sm ${
                isActive 
                    ? 'font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
            role="menuitem"
        >
            <div className="flex items-center gap-2">
                {icon}
                {label}
            </div>
            {isActive && <CheckIcon className="w-4 h-4" />}
        </button>
    );
};


const Header: React.FC<HeaderProps> = (props) => {
  const { 
    onRegisterClick, onLogout, onExportCsv, onExportExcel, user, effectiveRole, onSwitchRole, activeView, onNavigate, 
    currentAcademicYear, availableYears, onYearChange, onStartNewYear,
    notifications,
    projectsToReviewCount, isReviewFilterActive, onToggleReviewFilter, onOpenProfile,
    onSelectNotification, onMarkNotificationsAsRead
  } = props;
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const t = useTranslations();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
        setIsNotificationPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const isFullAdminView = effectiveRole === 'Admin' || effectiveRole === 'DepartmentAdmin';
  const showProjectActions = isFullAdminView && activeView === 'projects';

  return (
    <header className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-300 dark:border-slate-700">
        <div className="flex items-center">
          <BuildingLibraryIcon className="w-10 h-10 text-blue-600 mr-3" />
          <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('finalProjectDashboard')}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {t('academicYear')} <span className="font-semibold">{currentAcademicYear}</span>
              </p>
          </div>
        </div>
        <div className="flex items-center mt-4 sm:mt-0 space-x-2 flex-wrap gap-2">
           {user.role === 'Admin' && (
             <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-md p-1.5 space-x-2">
                <label htmlFor="academic-year" className="text-sm font-medium text-slate-600 dark:text-slate-300 pl-2">{t('ay')}</label>
                <select 
                    id="academic-year"
                    value={currentAcademicYear} 
                    onChange={e => onYearChange(e.target.value)}
                    className="rounded-md border-0 bg-transparent py-1 pl-2 pr-7 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                >
                    {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
                <button
                    onClick={onStartNewYear}
                    className="flex items-center justify-center bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold p-2 rounded-md transition-colors"
                    title={t('startNewYear')}
                >
                    <CalendarPlusIcon className="w-5 h-5"/>
                </button>
             </div>
           )}
           {effectiveRole === 'Advisor' && onToggleReviewFilter && (
                <button
                    id="needs-review-btn"
                    onClick={onToggleReviewFilter}
                    className={`relative flex items-center justify-center font-bold py-2 px-4 rounded-lg shadow-md transition-colors ${
                        isReviewFilterActive 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white'
                    }`}
                >
                    <InboxStackIcon className="w-5 h-5 mr-2" />
                    {t('needsReview')}
                    {projectsToReviewCount && projectsToReviewCount > 0 && (
                        <span className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-white ring-2 ring-slate-100 dark:ring-slate-900 ${isReviewFilterActive ? 'bg-blue-800' : 'bg-red-500'}`}>
                            {projectsToReviewCount}
                        </span>
                    )}
                </button>
           )}
           {showProjectActions && (
             <>
              <button
                onClick={onRegisterClick}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                {t('registerProject')}
              </button>
              <button
                onClick={onExportCsv}
                className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                {t('exportCsv')}
              </button>
               <button
                onClick={onExportExcel}
                className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
              >
                <TableCellsIcon className="w-5 h-5 mr-2" />
                {t('exportExcel')}
              </button>
             </>
           )}
          <div className="relative" ref={notificationPanelRef}>
              <button
                onClick={() => setIsNotificationPanelOpen(p => !p)}
                className="relative flex items-center justify-center bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold p-2.5 rounded-lg shadow-md transition-transform transform hover:scale-105"
                aria-label={t('viewNotifications').replace('${unreadCount}', String(unreadCount))}
              >
                  <BellIcon className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white ring-2 ring-slate-100 dark:ring-slate-900">
                      {unreadCount}
                    </span>
                  )}
              </button>
              {isNotificationPanelOpen && (
                   <NotificationPanel
                       notifications={notifications}
                       onMarkAllRead={() => { onMarkNotificationsAsRead(); }}
                       onSelectNotification={(n) => { onSelectNotification(n); setIsNotificationPanelOpen(false); }}
                       onViewAll={() => { onNavigate('notifications'); setIsNotificationPanelOpen(false); }}
                   />
               )}
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold p-2.5 rounded-lg shadow-md transition-transform transform hover:scale-105"
            aria-label={theme === 'light' ? t('switchToDarkMode') : t('switchToLightMode')}
          >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setLanguage(language === 'en' ? 'lo' : 'en')}
            className="flex items-center justify-center bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold w-10 h-10 rounded-lg shadow-md transition-transform transform hover:scale-105"
            aria-label={language === 'en' ? t('switchToLao') : t('switchToEnglish')}
          >
              <span className="font-semibold text-sm">{language === 'en' ? 'ພາສາລາວ' : 'EN'}</span>
          </button>
           <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(p => !p)}
                className="flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-md p-2 transition-transform transform hover:scale-105"
                aria-haspopup="true"
                aria-expanded={isUserMenuOpen}
              >
                <UserCircleIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline font-semibold text-slate-700 dark:text-slate-200 mx-2">{user.name}</span>
              </button>
              {isUserMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 dark:ring-slate-700 z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('signedInAs')}</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name} ({user.role})</p>
                      </div>
                      {user.role === 'DepartmentAdmin' && (
                        <div className="py-1 border-b border-slate-200 dark:border-slate-700">
                            <p className="px-4 pt-1 pb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">{t('switchView')}</p>
                            <RoleSwitchButton
                                role="DepartmentAdmin"
                                label={t('deptAdmin')}
                                icon={<KeyIcon className="w-4 h-4" />}
                                activeRole={effectiveRole}
                                onSwitch={() => { onSwitchRole('DepartmentAdmin'); setIsUserMenuOpen(false); }}
                            />
                             <RoleSwitchButton
                                role="Advisor"
                                label={t('advisor')}
                                icon={<AcademicCapIcon className="w-4 h-4" />}
                                activeRole={effectiveRole}
                                onSwitch={() => { onSwitchRole('Advisor'); setIsUserMenuOpen(false); }}
                            />
                        </div>
                      )}
                       <button
                        onClick={() => { onOpenProfile(); setIsUserMenuOpen(false); }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        role="menuitem"
                      >
                        <ProfileIcon className="w-4 h-4" />
                        {t('myProfile')}
                      </button>
                      <button
                        onClick={onLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        role="menuitem"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        {t('logout')}
                      </button>
                    </div>
                  </div>
              )}
            </div>
        </div>
      </div>
      <nav className="flex items-center bg-slate-200/60 dark:bg-slate-800/60 p-1.5 rounded-lg space-x-1 flex-wrap">
          {effectiveRole !== 'Student' && <NavButton currentView="dashboard" activeView={activeView} onClick={() => onNavigate('dashboard')} icon={<BuildingLibraryIcon className="w-5 h-5" />}>{t('dashboard')}</NavButton>}
          {effectiveRole === 'Student' && <NavButton currentView="projects" activeView={activeView} onClick={() => onNavigate('projects')} icon={<BuildingLibraryIcon className="w-5 h-5" />}>{t('myProject')}</NavButton>}
          
          {isFullAdminView && (
             <NavButton currentView="projects" activeView={activeView} onClick={() => onNavigate('projects')} icon={<TableCellsIcon className="w-5 h-5" />}>{t('projects')}</NavButton>
          )}

          <NavButton currentView="calendar" activeView={activeView} onClick={() => onNavigate('calendar')} icon={<CalendarDaysIcon className="w-5 h-5" />}>{t('calendar')}</NavButton>

          {isFullAdminView && (
            <>
                <NavButton currentView="students" activeView={activeView} onClick={() => onNavigate('students')} icon={<UserGroupIcon className="w-5 h-5" />}>{t('students')}</NavButton>
                <NavButton currentView="advisors" activeView={activeView} onClick={() => onNavigate('advisors')} icon={<AcademicCapIcon className="w-5 h-5" />}>{t('advisors')}</NavButton>
                {user.role === 'Admin' && <NavButton currentView="deptAdmins" activeView={activeView} onClick={() => onNavigate('deptAdmins')} icon={<KeyIcon className="w-5 h-5" />}>{t('deptAdmins')}</NavButton>}
                <NavButton currentView="majors" activeView={activeView} onClick={() => onNavigate('majors')} icon={<BookOpenIcon className="w-5 h-5" />}>{t('majors')}</NavButton>
                <NavButton currentView="classrooms" activeView={activeView} onClick={() => onNavigate('classrooms')} icon={<BuildingOfficeIcon className="w-5 h-5" />}>{t('classrooms')}</NavButton>
                <NavButton currentView="committees" activeView={activeView} onClick={() => onNavigate('committees')} icon={<ClipboardDocumentListIcon className="w-5 h-5" />}>{t('committees')}</NavButton>
                <NavButton currentView="scoring" activeView={activeView} onClick={() => onNavigate('scoring')} icon={<PencilSquareIcon className="w-5 h-5" />}>{t('scoringNav')}</NavButton>
                <NavButton currentView="finalGrades" activeView={activeView} onClick={() => onNavigate('finalGrades')} icon={<DocumentCheckIcon className="w-5 h-5" />}>{t('finalGrades')}</NavButton>
                <NavButton currentView="milestoneTemplates" activeView={activeView} onClick={() => onNavigate('milestoneTemplates')} icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />}>{t('templates')}</NavButton>
                <NavButton currentView="submissions" activeView={activeView} onClick={() => onNavigate('submissions')} icon={<InboxStackIcon className="w-5 h-5" />}>{t('submissions')}</NavButton>
                <NavButton currentView="timeline" activeView={activeView} onClick={() => onNavigate('timeline')} icon={<ChartBarIcon className="w-5 h-5" />}>{t('timeline')}</NavButton>
                <NavButton currentView="analytics" activeView={activeView} onClick={() => onNavigate('analytics')} icon={<ChartPieIcon className="w-5 h-5" />}>{t('analytics')}</NavButton>
                <NavButton currentView="announcements" activeView={activeView} onClick={() => onNavigate('announcements')} icon={<MegaphoneIcon className="w-5 h-5" />}>{t('announcements')}</NavButton>
                <NavButton currentView="reporting" activeView={activeView} onClick={() => onNavigate('reporting')} icon={<DocumentChartBarIcon className="w-5 h-5" />}>{t('reporting')}</NavButton>
                <NavButton currentView="aiTools" activeView={activeView} onClick={() => onNavigate('aiTools')} icon={<SparklesIcon className="w-5 h-5" />}>{t('aiTools')}</NavButton>
            </>
          )}
           {user.role === 'Admin' && (
            <>
              <NavButton currentView="settings" activeView={activeView} onClick={() => onNavigate('settings')} icon={<Cog6ToothIcon className="w-5 h-5" />}>{t('settings')}</NavButton>
            </>
          )}
      </nav>
    </header>
  );
};

export default Header;
