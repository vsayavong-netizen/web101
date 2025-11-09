
import React, { useState, useMemo } from 'react';
import {
    Box, Paper, Typography, Button, Tabs, Tab, Grid, LinearProgress,
    IconButton, Stack, Divider
} from '@mui/material';
import { PlusIcon, BuildingLibraryIcon, AcademicCapIcon, QuestionMarkCircleIcon, SparklesIcon } from './icons';
import { Advisor, ProjectGroup, Announcement, User, ProjectStatus, Major, Gender } from '../types';
import { getAdvisorColor } from '../utils/colorUtils';
import AnnouncementsFeed from './AnnouncementsFeed';
import ProjectTableEnhanced from './ProjectTableEnhanced';
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Typography variant="body2" fontWeight="semibold" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        component="span"
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            mr: 1,
                            bgcolor: color
                        }}
                    />
                    {advisor.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {count} / {advisor.quota} {t('projects')}
                </Typography>
            </Box>
            <Box sx={{ width: '100%', bgcolor: 'action.hover', borderRadius: '999px', height: 8, mt: 0.5 }}>
                <LinearProgress
                    variant="determinate"
                    value={Math.min(percentage, 100)}
                    sx={{
                        height: 8,
                        borderRadius: '999px',
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: '999px',
                            bgcolor: color
                        }
                    }}
                />
            </Box>
        </Box>
    );
};


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

  // Sorting is now handled by DataGrid internally
  const sortedProjects = filteredProjects;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
                value={activeTab} 
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        minHeight: 48,
                        fontWeight: 500
                    }
                }}
            >
                <Tab value="dashboard" label={t('dashboard')} />
                <Tab value="projects" label={t('browseAllProjects')} />
            </Tabs>
        </Box>

        {activeTab === 'dashboard' && (
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Paper 
                        id="welcome-panel"
                        elevation={3}
                        sx={{ 
                            position: 'relative',
                            textAlign: 'center',
                            py: 8,
                            px: 3
                        }}
                    >
                        <IconButton
                            onClick={onStartTour}
                            sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                color: 'text.secondary',
                                '&:hover': {
                                    color: 'primary.main',
                                    bgcolor: 'action.hover'
                                }
                            }}
                            title="Replay introduction tour"
                        >
                            <QuestionMarkCircleIcon sx={{ width: 24, height: 24 }} />
                        </IconButton>
                        <BuildingLibraryIcon sx={{ width: 64, height: 64, color: 'primary.main', mx: 'auto' }} />
                        <Typography variant="h4" component="h2" fontWeight="bold" sx={{ mt: 2 }}>
                            {t('welcomeToPortal')}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                            {t('notAssignedToProject')}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            {t('canRegisterProject')}
                        </Typography>
                        <Stack 
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            sx={{ mt: 4, justifyContent: 'center', alignItems: 'center' }}
                        >
                            <Button
                                id="ai-topic-suggester-btn-welcome"
                                variant="contained"
                                onClick={onOpenSuggester}
                                startIcon={<SparklesIcon sx={{ width: 20, height: 20 }} />}
                                sx={{
                                    bgcolor: 'purple.600',
                                    '&:hover': {
                                        bgcolor: 'purple.700',
                                        transform: 'scale(1.05)'
                                    },
                                    transition: 'transform 0.2s',
                                    textTransform: 'none',
                                    fontWeight: 600
                                }}
                            >
                                {t('aiTopicSuggestion')}
                            </Button>
                            <Button
                                id="register-project-btn-welcome"
                                variant="contained"
                                color="primary"
                                onClick={onRegisterClick}
                                startIcon={<PlusIcon sx={{ width: 20, height: 20 }} />}
                                sx={{
                                    '&:hover': {
                                        transform: 'scale(1.05)'
                                    },
                                    transition: 'transform 0.2s',
                                    textTransform: 'none',
                                    fontWeight: 600
                                }}
                            >
                                {t('registerYourProject')}
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Stack spacing={3}>
                        <AnnouncementsFeed announcements={announcements} user={user} />
                        <Paper 
                            id="advisor-workload-panel"
                            elevation={3}
                            sx={{ p: 3 }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <Box
                                    sx={{
                                        flexShrink: 0,
                                        bgcolor: 'primary.light',
                                        color: 'primary.main',
                                        borderRadius: '50%',
                                        p: 1.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <AcademicCapIcon sx={{ width: 24, height: 24 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" fontWeight="semibold" sx={{ mb: 2 }}>
                                        {t('allAdvisors')}
                                    </Typography>
                                    <Box sx={{ maxHeight: 256, overflowY: 'auto', pr: 1 }}>
                                        <Stack spacing={2}>
                                            {advisors.map(adv => (
                                                <AdvisorWorkload 
                                                    key={adv.id} 
                                                    advisor={adv} 
                                                    count={advisorProjectCounts[adv.name] || 0} 
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>
        )}
        
        {activeTab === 'projects' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                <ProjectTableEnhanced
                    user={user}
                    projectGroups={sortedProjects}
                    onSelectProject={onSelectProject}
                    onRegisterClick={onRegisterClick}
                    onUpdateStatus={(projectId: string, status: ProjectStatus) => {}}
                    loading={false}
                />
            </Box>
        )}
    </Box>
  );
};
