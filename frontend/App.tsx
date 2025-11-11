
import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import './src/styles/global.css';

// Lazy load main pages for code splitting
const HomePage = lazy(() => import('./components/HomePage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const WelcomePage = lazy(() => import('./components/WelcomePage'));
import { ToastProvider } from './context/ToastContext';
import { useToast } from './hooks/useToast';
import ToastContainer from './components/ToastContainer';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { User, Notification, Role, Student, Advisor, SystemSecurityIssue } from './types';
import { useMockData, initialProjectGroups, initialStudents, initialAdvisors, initialMajors, initialClassrooms, initialMilestoneTemplates, initialAnnouncements } from './hooks/useMockData';
import { v4 as uuidv4 } from 'uuid';
import { useTranslations } from './hooks/useTranslations';
import { useAcademicYear } from './hooks/useAcademicYear';
import { useNotifications } from './hooks/useNotifications';
import { GoogleGenAI, Type } from "@google/genai";

const AppContent: React.FC = () => {
  const [user, setUser] = useState<(User & Partial<Student & Advisor>) | null>(null);
  const [effectiveRole, setEffectiveRole] = useState<Role | null>(null);
  const [isPasswordChangeForced, setIsPasswordChangeForced] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  const addToast = useToast();
  const t = useTranslations();
  
  // Use Academic Year hook (connects to backend API)
  const {
    currentAcademicYear,
    availableYears,
    loading: academicYearLoading,
    changeAcademicYear,
    startNewYear,
  } = useAcademicYear();
  
  const isYearReady = !academicYearLoading && currentAcademicYear !== '';
  
  // Use Notifications hook (connects to backend API, replaces localStorage)
  const {
    notifications,
    addNotification,
    markNotificationsAsRead,
    markSingleNotificationAsRead,
  } = useNotifications(user?.id, currentAcademicYear);

  const mockDataHookResult = useMockData(currentAcademicYear, addNotification, addToast);

  const handleLogin = useCallback((loggedInUser: User & Partial<Student & Advisor>) => {
    setUser(loggedInUser);
    // Ensure role is set, default to 'Student' if missing
    const userRole = loggedInUser.role || 'Student';
    setEffectiveRole(userRole);
    setShowWelcome(false);
    if (loggedInUser.mustChangePassword) {
        addToast({ type: 'info', message: t('updatePasswordPrompt') });
        setIsPasswordChangeForced(true);
    }
  }, [addToast, t]);

  const handleShowLogin = useCallback(() => {
    setShowWelcome(false);
  }, []);
  
  const handleLogout = useCallback(() => {
    setUser(null);
    setEffectiveRole(null);
    setIsPasswordChangeForced(false);
    setShowWelcome(true);
  }, []);

  // Redirect to login when auth expired (global handler consumed by apiClient)
  useEffect(() => {
    (window as any).onAuthExpired = () => {
      setUser(null);
      setEffectiveRole(null);
      setIsPasswordChangeForced(false);
      addToast({ type: 'warning', message: t('sessionExpired') });
    };
    return () => { delete (window as any).onAuthExpired; };
  }, [addToast, t]);

  const handleSwitchRole = useCallback((newRole: Role) => {
    if (user?.role === 'DepartmentAdmin' && (newRole === 'Advisor' || newRole === 'DepartmentAdmin')) {
        setEffectiveRole(newRole);
        addToast({ type: 'info', message: t('switchedToView').replace('${role}', newRole) });
    }
  }, [user, addToast, t]);

  const handleStartNewYear = useCallback(async () => {
    if (!currentAcademicYear) return;
    
    // Use API to create next academic year
    await startNewYear();
    
    // Note: The hook will handle updating currentAcademicYear and availableYears
    // We still need to initialize localStorage data for the new year (for backward compatibility)
    // This will be handled by useMockData hook when it loads data for the new year
  }, [currentAcademicYear, startNewYear]);
  
  const { loading, projectGroups, students, advisors, ...restOfMockData } = mockDataHookResult;
  const { bulkUpdateStudents, bulkUpdateAdvisors } = restOfMockData;

  const runAutomatedSecurityAudit = useCallback(async () => {
    if (!process.env.API_KEY || !user || (effectiveRole !== 'Admin' && effectiveRole !== 'DepartmentAdmin')) {
      return;
    }
    
    const AUDIT_INTERVAL = 1 * 60 * 60 * 1000; // 1 hour for demo purposes
    
    // Define storage key outside try-catch for proper scoping
    const lastAuditStorageKey = `lastAutomatedSecurityAudit_${currentAcademicYear}`;
    
    // Try to get last audit timestamp from Backend API
    let lastAuditTimestamp: string | null = null;
    try {
      const { apiClient } = await import('./utils/apiClient');
      const response = await apiClient.getSecurityAuditTimestamp(currentAcademicYear);
      if (response.data && response.data.timestamp) {
        lastAuditTimestamp = response.data.timestamp;
      }
    } catch (error) {
      console.warn('Failed to get security audit timestamp from API, trying localStorage:', error);
      // Fallback to localStorage
      lastAuditTimestamp = localStorage.getItem(lastAuditStorageKey);
    }
    
    if (lastAuditTimestamp && (Date.now() - parseInt(lastAuditTimestamp, 10) < AUDIT_INTERVAL)) {
      return;
    }

    addToast({ type: 'info', message: t('automatedSecurityScanRunning') });
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const usersWithDefaultPassword = [...students, ...advisors]
          .filter(u => u.password === 'password123' || u.mustChangePassword)
          .map(u => ({ id: (u as Student).studentId || (u as Advisor).id, name: u.name }));

      const communicationSample = projectGroups
          .flatMap(pg => pg.project.log || [])
          .slice(-30)
          .map(log => ({ 
              projectId: projectGroups.find(pg => pg.project.log?.includes(log))?.project.projectId,
              authorId: log.authorId,
              authorName: log.authorName,
              message: log.message
          }));

      const prompt = `
          You are an AI security auditor for a university's project management system. Analyze the provided data for potential security issues.

          Data:
          - Users with default password risk: ${JSON.stringify(usersWithDefaultPassword)}
          - Recent communication sample: ${JSON.stringify(communicationSample)}

          Identify the following issue types:
          1. 'Weak Password': Any user in the 'Users with default password risk' list. The default password is known to be weak.
          2. 'Suspicious Activity': Look for patterns like repeated, nonsensical messages from the same user which could indicate spam.
          3. 'Inappropriate Content': Scan messages for unprofessional, offensive, or harassing language. Be conservative and flag only clear violations of academic conduct.

          Respond ONLY with a JSON object. The JSON object should have a key "issues", which is an array of objects. Each issue object must have these keys:
          - "type": string ('Weak Password', 'Suspicious Activity', 'Inappropriate Content')
          - "description": string (A clear, concise description of the issue.)
          - "recommendation": string (A brief, actionable recommendation.)
          - "relatedUserIds": (optional) array of strings
          - "relatedProjectIds": (optional) array of strings
      `;
      const schema = {
          type: Type.OBJECT,
          properties: {
              issues: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          type: { type: Type.STRING, enum: ['Weak Password', 'Suspicious Activity', 'Inappropriate Content'] },
                          description: { type: Type.STRING },
                          recommendation: { type: Type.STRING },
                          relatedUserIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                          relatedProjectIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ['type', 'description', 'recommendation']
                  }
              }
          },
          required: ['issues']
      };

      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json", responseSchema: schema }
      });

      // FIX: Per Gemini API guidelines, access the 'text' property which contains the JSON string, then parse it.
      const result: { issues: SystemSecurityIssue[] } = JSON.parse(response.text);
      const issues = result.issues;

      localStorage.setItem(lastAuditStorageKey, Date.now().toString());

      if (issues.length === 0) {
          addToast({ type: 'success', message: t('automatedSecurityScanCompleteNoIssues') });
          return;
      }

      const adminIds = [
          'admin-user', 
          ...advisors.filter(a => a.isDepartmentAdmin).map(a => a.id)
      ];

      let weakPasswordUsers: string[] = [];
      let otherIssuesCount = 0;
      
      issues.forEach(issue => {
          if (issue.type === 'Weak Password' && issue.relatedUserIds) {
              weakPasswordUsers = weakPasswordUsers.concat(issue.relatedUserIds);
          } else {
              otherIssuesCount++;
              addNotification({
                  title: `AI Security Alert: ${issue.type}`,
                  message: issue.description,
                  userIds: adminIds,
                  projectId: issue.relatedProjectIds?.[0] || '',
                  type: 'System',
              });
          }
      });

      if (weakPasswordUsers.length > 0) {
          const uniqueUserIds = [...new Set(weakPasswordUsers)];
          const studentIdsToUpdate = uniqueUserIds.filter(id => students.some(s => s.studentId === id && !s.mustChangePassword));
          const advisorIdsToUpdate = uniqueUserIds.filter(id => advisors.some(a => a.id === id && !a.mustChangePassword));
          
          const totalToUpdate = studentIdsToUpdate.length + advisorIdsToUpdate.length;

          if (totalToUpdate > 0) {
              if (studentIdsToUpdate.length > 0) {
                  bulkUpdateStudents(studentIdsToUpdate, { mustChangePassword: true });
              }
              if (advisorIdsToUpdate.length > 0) {
                  bulkUpdateAdvisors(advisorIdsToUpdate, { mustChangePassword: true });
              }
              addNotification({
                  title: 'Automated Security Action Taken',
                  message: `Forced password change for ${totalToUpdate} user(s) due to weak passwords.`,
                  userIds: adminIds,
                  projectId: '',
                  type: 'System',
              });
          }
      }
      
      addToast({ type: 'info', message: t('automatedSecurityScanFoundIssues').replace('${count}', String(issues.length)) });

      // Update security audit timestamp in Backend API
      try {
        const { apiClient } = await import('./utils/apiClient');
        await apiClient.updateSecurityAuditTimestamp(currentAcademicYear);
      } catch (error) {
        console.warn('Failed to update security audit timestamp in API, using localStorage fallback:', error);
        // Fallback to localStorage
        const lastAuditStorageKey = `lastAutomatedSecurityAudit_${currentAcademicYear}`;
        localStorage.setItem(lastAuditStorageKey, String(Date.now()));
      }

    } catch (error) {
      console.error("Automated Security Audit failed:", error);
      addToast({ type: 'error', message: t('automatedSecurityScanFailed') });
    }
  }, [user, effectiveRole, currentAcademicYear, addToast, t, students, advisors, projectGroups, addNotification, bulkUpdateStudents, bulkUpdateAdvisors]);

  const savedAuditCallback = useRef(runAutomatedSecurityAudit);
  useEffect(() => {
    savedAuditCallback.current = runAutomatedSecurityAudit;
  }, [runAutomatedSecurityAudit]);

  useEffect(() => {
    if (!user || (effectiveRole !== 'Admin' && effectiveRole !== 'DepartmentAdmin')) {
      return;
    }

    function tick() {
      savedAuditCallback.current();
    }

    // Run once on initial load for the admin user
    tick();

    // Set an interval to check periodically if an audit should run
    const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
    const intervalId = setInterval(tick, CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [user, effectiveRole]);

  if (!isYearReady || loading) {
    return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}>
          <CircularProgress size={64} />
        </Box>
    );
  }

  // Loading component for Suspense
  const PageLoader = () => (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <CircularProgress size={64} />
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Suspense fallback={<PageLoader />}>
        {user && effectiveRole ? (
          <HomePage 
            user={user} 
            effectiveRole={effectiveRole}
            onSwitchRole={handleSwitchRole}
            onLogout={handleLogout} 
            projectGroups={projectGroups}
            students={students}
            advisors={advisors}
            majors={mockDataHookResult.majors}
            classrooms={mockDataHookResult.classrooms}
            {...restOfMockData} 
            currentAcademicYear={currentAcademicYear}
            availableYears={availableYears}
            onYearChange={changeAcademicYear}
            onStartNewYear={handleStartNewYear}
            notifications={notifications}
            onMarkNotificationsAsRead={markNotificationsAsRead}
            onMarkSingleNotificationAsRead={markSingleNotificationAsRead}
            isPasswordChangeForced={isPasswordChangeForced}
            onPasswordChanged={() => setIsPasswordChangeForced(false)}
          />
        ) : showWelcome ? (
          <WelcomePage onLogin={handleShowLogin} />
        ) : (
          <LoginPage 
            onLogin={handleLogin} 
            advisors={advisors} 
            students={students} 
            addStudent={restOfMockData.addStudent}
            majors={mockDataHookResult.majors}
            classrooms={mockDataHookResult.classrooms}
            onBackToWelcome={() => setShowWelcome(true)}
          />
        )}
      </Suspense>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AppContent />
          <ToastContainer />
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
