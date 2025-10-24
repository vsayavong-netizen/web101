
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import './src/styles/global.css';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import WelcomePage from './components/WelcomePage';
import { ToastProvider } from './context/ToastContext';
import { useToast } from './hooks/useToast';
import ToastContainer from './components/ToastContainer';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { User, Notification, Role, Student, Advisor, SystemSecurityIssue } from './types';
import { useMockData, initialProjectGroups, initialStudents, initialAdvisors, initialMajors, initialClassrooms, initialMilestoneTemplates, initialAnnouncements } from './hooks/useMockData';
import { v4 as uuidv4 } from 'uuid';
import { useTranslations } from './hooks/useTranslations';
import { GoogleGenAI, Type } from "@google/genai";

const AppContent: React.FC = () => {
  const [user, setUser] = useState<(User & Partial<Student & Advisor>) | null>(null);
  const [effectiveRole, setEffectiveRole] = useState<Role | null>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [isYearReady, setIsYearReady] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPasswordChangeForced, setIsPasswordChangeForced] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  const addToast = useToast();
  const t = useTranslations();

  useEffect(() => {
    const storedYears = localStorage.getItem('academicYears');
    if (storedYears) {
      const years = JSON.parse(storedYears);
      setAvailableYears(years);
      setCurrentAcademicYear(years[years.length - 1]); // Default to the latest year
    } else {
      // First-time setup for the very first academic year
      const INITIAL_YEAR = '2024';
      localStorage.setItem('academicYears', JSON.stringify([INITIAL_YEAR]));
      localStorage.setItem(`projectGroups_${INITIAL_YEAR}`, JSON.stringify(initialProjectGroups));
      localStorage.setItem(`students_${INITIAL_YEAR}`, JSON.stringify(initialStudents));
      localStorage.setItem(`advisors_${INITIAL_YEAR}`, JSON.stringify(initialAdvisors));
      localStorage.setItem(`majors_${INITIAL_YEAR}`, JSON.stringify(initialMajors));
      localStorage.setItem(`classrooms_${INITIAL_YEAR}`, JSON.stringify(initialClassrooms));
      localStorage.setItem(`milestoneTemplates_${INITIAL_YEAR}`, JSON.stringify(initialMilestoneTemplates));
      localStorage.setItem(`announcements_${INITIAL_YEAR}`, JSON.stringify(initialAnnouncements));
      localStorage.setItem(`notifications_${INITIAL_YEAR}`, '[]');
      // Default settings are now handled by useMockData's loadFromStorage
      setAvailableYears([INITIAL_YEAR]);
      setCurrentAcademicYear(INITIAL_YEAR);
    }
    setIsYearReady(true);
  }, []);
  
  useEffect(() => {
    if (currentAcademicYear) {
        const stored = localStorage.getItem(`notifications_${currentAcademicYear}`);
        setNotifications(stored ? JSON.parse(stored) : []);
    } else {
        setNotifications([]);
    }
  }, [currentAcademicYear]);

  useEffect(() => {
    if (currentAcademicYear) {
        localStorage.setItem(`notifications_${currentAcademicYear}`, JSON.stringify(notifications));
    }
  }, [notifications, currentAcademicYear]);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notificationData,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markNotificationsAsRead = useCallback((userId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        (n.userIds.includes(userId) && !n.read) ? { ...n, read: true } : n
      )
    );
  }, []);
  
  const markSingleNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
        prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
        )
    );
  }, []);

  const mockDataHookResult = useMockData(currentAcademicYear, addNotification, addToast);

  const handleLogin = useCallback((loggedInUser: User & Partial<Student & Advisor>) => {
    setUser(loggedInUser);
    setEffectiveRole(loggedInUser.role);
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

  const handleStartNewYear = useCallback(() => {
    if (!currentAcademicYear) return;
    
    const nextYear = String(parseInt(currentAcademicYear, 10) + 1);

    const currentAdvisors = JSON.stringify(mockDataHookResult.advisors);
    const currentMajors = JSON.stringify(mockDataHookResult.majors);
    const currentClassrooms = JSON.stringify(mockDataHookResult.classrooms);
    const currentTemplates = JSON.stringify(mockDataHookResult.milestoneTemplates);

    localStorage.setItem(`advisors_${nextYear}`, currentAdvisors);
    localStorage.setItem(`majors_${nextYear}`, currentMajors);
    localStorage.setItem(`classrooms_${nextYear}`, currentClassrooms);
    localStorage.setItem(`milestoneTemplates_${nextYear}`, currentTemplates);
    localStorage.setItem(`projectGroups_${nextYear}`, '[]'); 
    localStorage.setItem(`students_${nextYear}`, '[]');      
    localStorage.setItem(`announcements_${nextYear}`, '[]'); 
    localStorage.setItem(`notifications_${nextYear}`, '[]'); 

    const newYearList = [...availableYears, nextYear];
    localStorage.setItem('academicYears', JSON.stringify(newYearList));
    setAvailableYears(newYearList);
    setCurrentAcademicYear(nextYear);
    addToast({type: 'success', message: t('newYearStarted').replace('${year}', nextYear)})

  }, [currentAcademicYear, availableYears, mockDataHookResult.advisors, mockDataHookResult.majors, mockDataHookResult.classrooms, mockDataHookResult.milestoneTemplates, addToast, t]);
  
  const { loading, projectGroups, students, advisors, ...restOfMockData } = mockDataHookResult;
  const { bulkUpdateStudents, bulkUpdateAdvisors } = restOfMockData;

  const runAutomatedSecurityAudit = useCallback(async () => {
    if (!process.env.API_KEY || !user || (effectiveRole !== 'Admin' && effectiveRole !== 'DepartmentAdmin')) {
      return;
    }
    
    const AUDIT_INTERVAL = 1 * 60 * 60 * 1000; // 1 hour for demo purposes
    const lastAuditStorageKey = `lastAutomatedSecurityAudit_${currentAcademicYear}`;
    const lastAuditTimestamp = localStorage.getItem(lastAuditStorageKey);
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
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
          onYearChange={setCurrentAcademicYear}
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
