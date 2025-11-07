import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Box, Paper, Button, IconButton, Badge, Menu, MenuItem, Select, 
  Typography, Divider, Stack,
  FormControl, Tooltip, Chip
} from '@mui/material';
import { 
  School as SchoolIcon, 
  LightMode as LightModeIcon, 
  DarkMode as DarkModeIcon, 
  Check as CheckIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { ArrowRightOnRectangleIcon, BuildingLibraryIcon, ArrowDownTrayIcon, AcademicCapIcon, UserGroupIcon, BookOpenIcon, BuildingOfficeIcon, CalendarPlusIcon, BellIcon, TableCellsIcon, ClipboardDocumentCheckIcon, ChartBarIcon, ChartPieIcon, MegaphoneIcon, InboxStackIcon, UserIcon as ProfileIcon, ClipboardDocumentListIcon, DocumentCheckIcon, PencilSquareIcon, Cog6ToothIcon, CalendarDaysIcon, DocumentChartBarIcon, KeyIcon, SparklesIcon, PlusIcon } from './icons';
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
    <Button
      onClick={onClick}
      variant={isActive ? 'contained' : 'text'}
      color={isActive ? 'primary' : 'inherit'}
      startIcon={icon}
      sx={{
        textTransform: 'none',
        fontWeight: isActive ? 600 : 400,
        minWidth: 'auto',
        px: 2,
        py: 1,
      }}
    >
      {children}
    </Button>
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
        <MenuItem
            onClick={onSwitch}
            selected={isActive}
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                fontWeight: isActive ? 600 : 400,
                bgcolor: isActive ? 'action.selected' : 'transparent',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {icon}
                {label}
            </Box>
            {isActive && <CheckIcon sx={{ width: 16, height: 16 }} />}
        </MenuItem>
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

  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
    setIsUserMenuOpen(true);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
    setIsUserMenuOpen(false);
  };

  return (
    <Box component="header" sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          pb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              {t('finalProjectDashboard')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('academicYear')} <Typography component="span" fontWeight={600}>{currentAcademicYear}</Typography>
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: { xs: 2, sm: 0 } }}>
           {user.role === 'Admin' && (
             <Paper
               elevation={2}
               sx={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: 1,
                 px: 1.5,
                 py: 1,
               }}
             >
                <Typography variant="body2" sx={{ pl: 1 }}>{t('ay')}</Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={currentAcademicYear}
                    onChange={(e) => onYearChange(e.target.value)}
                    sx={{
                      fontWeight: 600,
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                    }}
                  >
                    {availableYears.map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title={t('startNewYear')}>
                  <IconButton
                    onClick={onStartNewYear}
                    size="small"
                    sx={{ bgcolor: 'action.hover' }}
                  >
                    <CalendarPlusIcon sx={{ width: 20, height: 20 }} />
                  </IconButton>
                </Tooltip>
             </Paper>
           )}
           {effectiveRole === 'Advisor' && onToggleReviewFilter && (
                <Button
                    id="needs-review-btn"
                    onClick={onToggleReviewFilter}
                    variant={isReviewFilterActive ? 'contained' : 'outlined'}
                    color={isReviewFilterActive ? 'primary' : 'inherit'}
                    startIcon={<InboxStackIcon sx={{ width: 20, height: 20 }} />}
                    sx={{
                      fontWeight: 'bold',
                      position: 'relative',
                    }}
                >
                    {t('needsReview')}
                    {projectsToReviewCount && projectsToReviewCount > 0 && (
                        <Chip
                            label={projectsToReviewCount}
                            size="small"
                            color={isReviewFilterActive ? 'primary' : 'error'}
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              height: 20,
                              minWidth: 20,
                              fontSize: '0.75rem',
                            }}
                        />
                    )}
                </Button>
           )}
           {showProjectActions && (
             <>
              <Button
                onClick={onRegisterClick}
                variant="contained"
                color="primary"
                startIcon={<PlusIcon sx={{ width: 20, height: 20 }} />}
                sx={{ fontWeight: 'bold' }}
              >
                {t('registerProject')}
              </Button>
              <Button
                onClick={onExportCsv}
                variant="contained"
                sx={{ 
                  bgcolor: 'teal.600',
                  '&:hover': { bgcolor: 'teal.700' },
                  fontWeight: 'bold',
                }}
                startIcon={<ArrowDownTrayIcon sx={{ width: 20, height: 20 }} />}
              >
                {t('exportCsv')}
              </Button>
              <Button
                onClick={onExportExcel}
                variant="contained"
                sx={{ 
                  bgcolor: 'green.600',
                  '&:hover': { bgcolor: 'green.700' },
                  fontWeight: 'bold',
                }}
                startIcon={<TableCellsIcon sx={{ width: 20, height: 20 }} />}
              >
                {t('exportExcel')}
              </Button>
             </>
           )}
          <Box ref={notificationPanelRef} sx={{ position: 'relative' }}>
              <Tooltip title={t('viewNotifications').replace('${unreadCount}', String(unreadCount))}>
                <IconButton
                  onClick={() => setIsNotificationPanelOpen(p => !p)}
                  sx={{ 
                    bgcolor: 'action.hover',
                    fontWeight: 'bold',
                  }}
                >
                  <Badge badgeContent={unreadCount > 0 ? unreadCount : undefined} color="error">
                    <BellIcon sx={{ width: 20, height: 20 }} />
                  </Badge>
                </IconButton>
              </Tooltip>
              {isNotificationPanelOpen && (
                   <NotificationPanel
                       notifications={notifications}
                       onMarkAllRead={() => { onMarkNotificationsAsRead(); }}
                       onSelectNotification={(n) => { onSelectNotification(n); setIsNotificationPanelOpen(false); }}
                       onViewAll={() => { onNavigate('notifications'); setIsNotificationPanelOpen(false); }}
                   />
               )}
          </Box>
          <Tooltip title={theme === 'light' ? t('switchToDarkMode') : t('switchToLightMode')}>
            <IconButton
              onClick={toggleTheme}
              sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}
            >
              {theme === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={language === 'en' ? t('switchToLao') : t('switchToEnglish')}>
            <IconButton
              onClick={() => setLanguage(language === 'en' ? 'lo' : 'en')}
              sx={{ bgcolor: 'action.hover', fontWeight: 'bold', minWidth: 40, width: 40, height: 40 }}
            >
              <Typography variant="body2" fontWeight={600}>
                {language === 'en' ? 'ພາສາລາວ' : 'EN'}
              </Typography>
            </IconButton>
          </Tooltip>
          <Box ref={userMenuRef} sx={{ position: 'relative' }}>
              <Button
                onClick={handleUserMenuOpen}
                variant="outlined"
                startIcon={<AccountCircleIcon />}
                sx={{
                  bgcolor: 'background.paper',
                  '& .MuiButton-startIcon': {
                    marginRight: { xs: 0, sm: 1 },
                  },
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, fontWeight: 600 }}>
                  {user.name}
                </Box>
              </Button>
              <Menu
                anchorEl={userMenuAnchor}
                open={isUserMenuOpen}
                onClose={handleUserMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  sx: { minWidth: 224, mt: 1 }
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('signedInAs')}
                  </Typography>
                  <Typography variant="body2" fontWeight={500} noWrap>
                    {user.name} ({user.role})
                  </Typography>
                </Box>
                {user.role === 'DepartmentAdmin' && (
                  <>
                    <Divider />
                    <Box sx={{ py: 0.5 }}>
                      <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase', color: 'text.secondary' }}>
                        {t('switchView')}
                      </Typography>
                      <RoleSwitchButton
                        role="DepartmentAdmin"
                        label={t('deptAdmin')}
                        icon={<KeyIcon sx={{ width: 16, height: 16 }} />}
                        activeRole={effectiveRole}
                        onSwitch={() => { onSwitchRole('DepartmentAdmin'); handleUserMenuClose(); }}
                      />
                      <RoleSwitchButton
                        role="Advisor"
                        label={t('advisor')}
                        icon={<AcademicCapIcon sx={{ width: 16, height: 16 }} />}
                        activeRole={effectiveRole}
                        onSwitch={() => { onSwitchRole('Advisor'); handleUserMenuClose(); }}
                      />
                    </Box>
                  </>
                )}
                <Divider />
                <MenuItem
                  onClick={() => { onOpenProfile(); handleUserMenuClose(); }}
                >
                  <ProfileIcon sx={{ width: 16, height: 16, mr: 1 }} />
                  {t('myProfile')}
                </MenuItem>
                <MenuItem
                  onClick={() => { onLogout(); handleUserMenuClose(); }}
                >
                  <ArrowRightOnRectangleIcon sx={{ width: 16, height: 16, mr: 1 }} />
                  {t('logout')}
                </MenuItem>
              </Menu>
            </Box>
        </Stack>
      </Box>
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          p: 1.5,
          bgcolor: 'action.hover',
          flexWrap: 'wrap',
        }}
      >
          {effectiveRole !== 'Student' && (
            <NavButton 
              currentView="dashboard" 
              activeView={activeView} 
              onClick={() => onNavigate('dashboard')} 
              icon={<BuildingLibraryIcon sx={{ width: 20, height: 20 }} />}
            >
              {t('dashboard')}
            </NavButton>
          )}
          {effectiveRole === 'Student' && (
            <NavButton 
              currentView="projects" 
              activeView={activeView} 
              onClick={() => onNavigate('projects')} 
              icon={<BuildingLibraryIcon sx={{ width: 20, height: 20 }} />}
            >
              {t('myProject')}
            </NavButton>
          )}
          
          {isFullAdminView && (
             <NavButton 
               currentView="projects" 
               activeView={activeView} 
               onClick={() => onNavigate('projects')} 
               icon={<TableCellsIcon sx={{ width: 20, height: 20 }} />}
             >
               {t('projects')}
             </NavButton>
          )}

          <NavButton 
            currentView="calendar" 
            activeView={activeView} 
            onClick={() => onNavigate('calendar')} 
            icon={<CalendarDaysIcon sx={{ width: 20, height: 20 }} />}
          >
            {t('calendar')}
          </NavButton>

          {isFullAdminView && (
            <>
                <NavButton currentView="students" activeView={activeView} onClick={() => onNavigate('students')} icon={<UserGroupIcon sx={{ width: 20, height: 20 }} />}>{t('students')}</NavButton>
                <NavButton currentView="advisors" activeView={activeView} onClick={() => onNavigate('advisors')} icon={<AcademicCapIcon sx={{ width: 20, height: 20 }} />}>{t('advisors')}</NavButton>
                {user.role === 'Admin' && <NavButton currentView="deptAdmins" activeView={activeView} onClick={() => onNavigate('deptAdmins')} icon={<KeyIcon sx={{ width: 20, height: 20 }} />}>{t('deptAdmins')}</NavButton>}
                <NavButton currentView="majors" activeView={activeView} onClick={() => onNavigate('majors')} icon={<BookOpenIcon sx={{ width: 20, height: 20 }} />}>{t('majors')}</NavButton>
                <NavButton currentView="classrooms" activeView={activeView} onClick={() => onNavigate('classrooms')} icon={<BuildingOfficeIcon sx={{ width: 20, height: 20 }} />}>{t('classrooms')}</NavButton>
                <NavButton currentView="committees" activeView={activeView} onClick={() => onNavigate('committees')} icon={<ClipboardDocumentListIcon sx={{ width: 20, height: 20 }} />}>{t('committees')}</NavButton>
                <NavButton currentView="scoring" activeView={activeView} onClick={() => onNavigate('scoring')} icon={<PencilSquareIcon sx={{ width: 20, height: 20 }} />}>{t('scoringNav')}</NavButton>
                <NavButton currentView="finalGrades" activeView={activeView} onClick={() => onNavigate('finalGrades')} icon={<DocumentCheckIcon sx={{ width: 20, height: 20 }} />}>{t('finalGrades')}</NavButton>
                <NavButton currentView="milestoneTemplates" activeView={activeView} onClick={() => onNavigate('milestoneTemplates')} icon={<ClipboardDocumentCheckIcon sx={{ width: 20, height: 20 }} />}>{t('templates')}</NavButton>
                <NavButton currentView="submissions" activeView={activeView} onClick={() => onNavigate('submissions')} icon={<InboxStackIcon sx={{ width: 20, height: 20 }} />}>{t('submissions')}</NavButton>
                <NavButton currentView="timeline" activeView={activeView} onClick={() => onNavigate('timeline')} icon={<ChartBarIcon sx={{ width: 20, height: 20 }} />}>{t('timeline')}</NavButton>
                <NavButton currentView="analytics" activeView={activeView} onClick={() => onNavigate('analytics')} icon={<ChartPieIcon sx={{ width: 20, height: 20 }} />}>{t('analytics')}</NavButton>
                <NavButton currentView="announcements" activeView={activeView} onClick={() => onNavigate('announcements')} icon={<MegaphoneIcon sx={{ width: 20, height: 20 }} />}>{t('announcements')}</NavButton>
                <NavButton currentView="reporting" activeView={activeView} onClick={() => onNavigate('reporting')} icon={<DocumentChartBarIcon sx={{ width: 20, height: 20 }} />}>{t('reporting')}</NavButton>
                <NavButton currentView="aiTools" activeView={activeView} onClick={() => onNavigate('aiTools')} icon={<SparklesIcon sx={{ width: 20, height: 20 }} />}>{t('aiTools')}</NavButton>
            </>
          )}
           {user.role === 'Admin' && (
            <>
              <NavButton currentView="settings" activeView={activeView} onClick={() => onNavigate('settings')} icon={<Cog6ToothIcon sx={{ width: 20, height: 20 }} />}>{t('settings')}</NavButton>
            </>
          )}
      </Paper>
    </Box>
  );
};

export default Header;
