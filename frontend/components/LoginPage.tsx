import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Tabs, 
  Tab, 
  Alert,
  InputAdornment,
  IconButton,
  Link
} from '@mui/material';
import { 
  School as BuildingLibraryIcon, 
  VpnKey as KeyIcon, 
  Person as UserIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { User, Advisor, Student, Major, Classroom } from '../types';
import StudentRegistrationModal from './StudentRegistrationModal';
import { useTranslations } from '../hooks/useTranslations';
import { useAuth } from '../hooks/useApiIntegration';

interface LoginPageProps {
  onLogin: (user: User & Partial<Student & Advisor>) => void;
  advisors: Advisor[];
  students: Student[];
  addStudent: (student: Student) => void;
  majors: Major[];
  classrooms: Classroom[];
  onBackToWelcome?: () => void;
}



const LoginPage: React.FC<LoginPageProps> = ({ onLogin, advisors, students, addStudent, majors, classrooms, onBackToWelcome }) => {
  const [mode, setMode] = useState<'staff' | 'student'>('staff');
  const [staffName, setStaffName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const t = useTranslations();
  const { login } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const username = (mode === 'staff' ? staffName : studentId).trim();
      const trimmedPassword = password.trim();
      
      // Validate input
      if (!username || !trimmedPassword) {
        setError(t('pleaseEnterBothFields'));
        return;
      }
      
      // Attempt login
      const result = await login(username, trimmedPassword);
      
      // Handle response structure: result.data contains { user, access, refresh }
      const userData = result?.data?.user || result?.user;
      
      if (userData) {
        // Ensure user has a role, default to 'Student' if missing
        const userWithRole = {
          ...userData,
          role: userData.role || 'Student'
        };
        onLogin(userWithRole);
      } else {
        setError(t('loginFailed'));
      }
    } catch (err: any) {
      // Handle specific error messages
      let errorMessage = t('loginFailed');
      
      if (err.status === 401) {
        errorMessage = t('invalidCredentials');
      } else if (err.status === 400) {
        errorMessage = t('invalidInput');
      } else if (err.status === 500) {
        errorMessage = t('serverError');
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Login error:', err);
    }
  };

  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: (theme) => theme.palette.mode === 'dark' 
          ? 'linear-gradient(to bottom right, #1e293b, #0f172a)'
          : 'linear-gradient(to bottom right, #f1f5f9, #e2e8f0)',
        p: 2
      }}>
        <Container maxWidth="xs">
          <Paper elevation={24} sx={{ p: 4, borderRadius: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              {onBackToWelcome && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                  <Button
                    onClick={onBackToWelcome}
                    startIcon={<ArrowBackIcon />}
                    sx={{ textTransform: 'none' }}
                  >
                    กลับไปหน้าแรก
                  </Button>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <BuildingLibraryIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              </Box>
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                {t('finalProjectManagement')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('signInToContinue')}
              </Typography>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3, mb: 3 }}>
              <Tabs 
                value={mode} 
                onChange={(_, newValue) => { 
                  setMode(newValue); 
                  setError(''); 
                  setPassword(''); 
                }}
                variant="fullWidth"
              >
                <Tab label={t('staff')} value="staff" />
                <Tab label={t('student')} value="student" />
              </Tabs>
            </Box>

            <Box component="form" onSubmit={handleSignIn} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {mode === 'staff' ? (
                <TextField
                  id="staffName"
                  name="staffName"
                  type="text"
                  fullWidth
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder={t('staffNamePlaceholder')}
                  error={!!error}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <UserIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              ) : (
                <TextField
                  id="studentId"
                  name="studentId"
                  type="text"
                  fullWidth
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder={t('studentIdPlaceholder')}
                  error={!!error}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <UserIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <TextField
                id="password"
                name="password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
                error={!!error}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              
              {error && <Alert severity="error">{error}</Alert>}
              
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ py: 1.5 }}
              >
                {t('signIn')}
              </Button>
            </Box>

            {mode === 'student' && (
              <Box sx={{ textAlign: 'center', pt: 3, borderTop: 1, borderColor: 'divider', mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('newStudent')}{' '}
                  <Link 
                    component="button"
                    type="button"
                    onClick={() => setIsRegistrationOpen(true)}
                    sx={{ fontWeight: 'medium', cursor: 'pointer' }}
                  >
                    {t('registerHere')}
                  </Link>
                </Typography>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
      {isRegistrationOpen && (
        <StudentRegistrationModal
          onClose={() => setIsRegistrationOpen(false)}
          onRegister={addStudent}
          allStudents={students}
          majors={majors}
          classrooms={classrooms}
        />
      )}
    </>
  );
};

export default LoginPage;