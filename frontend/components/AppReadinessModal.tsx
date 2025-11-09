import React, { useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Stack, IconButton, Divider, Paper
} from '@mui/material';
import {
  Close as XMarkIcon, CheckCircle as CheckCircleIcon, Warning as ExclamationTriangleIcon,
  Info as InformationCircleIcon, Refresh as ArrowPathIcon
} from '@mui/icons-material';
import { Advisor, Major, Classroom, DefenseSettings, ScoringSettings, MilestoneTemplate, ProjectGroup, Student, ProjectStatus } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface AppReadinessModalProps {
    onClose: () => void;
    advisors: Advisor[];
    majors: Major[];
    classrooms: Classroom[];
    defenseSettings: DefenseSettings;
    scoringSettings: ScoringSettings;
    milestoneTemplates: MilestoneTemplate[];
    projectGroups: ProjectGroup[];
    students: Student[];
}

type CheckStatus = 'success' | 'warning' | 'error' | 'info';

interface CheckResult {
    title: string;
    status: CheckStatus;
    message: string;
}

const StatusItem: React.FC<CheckResult> = ({ title, status, message }) => {
    const config = {
        success: { icon: <CheckCircleIcon sx={{ fontSize: 24, color: 'success.main' }} />, color: 'success.main' as const },
        warning: { icon: <ExclamationTriangleIcon sx={{ fontSize: 24, color: 'warning.main' }} />, color: 'warning.main' as const },
        error: { icon: <ExclamationTriangleIcon sx={{ fontSize: 24, color: 'error.main' }} />, color: 'error.main' as const },
        info: { icon: <InformationCircleIcon sx={{ fontSize: 24, color: 'info.main' }} />, color: 'info.main' as const },
    };
    
    const { icon, color } = config[status];

    return (
        <Paper
            elevation={1}
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                p: 1.5,
                borderLeft: 4,
                borderColor: color
            }}
        >
            <Box sx={{ flexShrink: 0, mt: 0.5 }}>{icon}</Box>
            <Box>
                <Typography variant="subtitle2" fontWeight="semibold">
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {message}
                </Typography>
            </Box>
        </Paper>
    );
};


const AppReadinessModal: React.FC<AppReadinessModalProps> = ({ onClose, advisors, majors, classrooms, defenseSettings, scoringSettings, milestoneTemplates, projectGroups, students }) => {
    const t = useTranslations();
    const [key, setKey] = useState(0); // Used to force a re-render for re-running checks

    const checks = useMemo(() => {
        // Configuration
        const defenseCheck: CheckResult = {
            title: t('defenseSettingsConfigured'),
            status: 'error',
            message: t('defenseSettingsConfigured_error')
        };
        if (defenseSettings.startDefenseDate && defenseSettings.timeSlots && defenseSettings.rooms.length > 0) {
            defenseCheck.status = 'success';
            defenseCheck.message = t('defenseSettingsConfigured_ok');
        }

        const scoringCheck: CheckResult = {
            title: t('scoringSettingsConfigured'),
            status: 'error',
            message: t('scoringSettingsConfigured_error')
        };
        if (scoringSettings.gradeBoundaries.length > 0 && scoringSettings.advisorRubrics.length > 0 && scoringSettings.committeeRubrics.length > 0) {
            scoringCheck.status = 'success';
            scoringCheck.message = t('scoringSettingsConfigured_ok');
        }

        const templateCheck: CheckResult = {
            title: t('milestoneTemplatesExist'),
            status: 'warning',
            message: t('milestoneTemplatesExist_warning')
        };
        if (milestoneTemplates.length > 0) {
            templateCheck.status = 'success';
            templateCheck.message = t('milestoneTemplatesExist_ok');
        }

        // Core Data
        const advisorCheck: CheckResult = { title: t('advisorsExist'), status: 'error', message: t('advisorsExist_error') };
        if (advisors.length > 0) {
            advisorCheck.status = 'success';
            advisorCheck.message = t('advisorsExist_ok');
        }
        
        const majorCheck: CheckResult = { title: t('majorsExist'), status: 'error', message: t('majorsExist_error') };
        if (majors.length > 0) {
            majorCheck.status = 'success';
            majorCheck.message = t('majorsExist_ok');
        }
        
        const classroomCheck: CheckResult = { title: t('classroomsExist'), status: 'warning', message: t('classroomsExist_warning') };
        if (classrooms.length > 0) {
            classroomCheck.status = 'success';
            classroomCheck.message = t('classroomsExist_ok');
        }
        
        // Data Integrity
        const assignedStudentIds = new Set(projectGroups.flatMap(pg => pg.students.map(s => s.studentId)));
        const unassignedStudents = students.filter(s => s.status === 'Approved' && !assignedStudentIds.has(s.studentId));
        const studentProjectCheck: CheckResult = {
            title: t('studentsWithoutProjects'),
            status: 'success',
            message: t('studentsWithoutProjects_ok'),
        };
        if (unassignedStudents.length > 0) {
            studentProjectCheck.status = 'info';
            studentProjectCheck.message = t('studentsWithoutProjects_warning').replace('{count}', String(unassignedStudents.length));
        }

        const advisorProjectCounts = projectGroups.reduce((acc, group) => {
            if(group.project.status === ProjectStatus.Approved || group.project.status === ProjectStatus.Pending) {
                acc[group.project.advisorName] = (acc[group.project.advisorName] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        const overloadedAdvisors = advisors.filter(adv => (advisorProjectCounts[adv.name] || 0) > adv.quota);
        const advisorQuotaCheck: CheckResult = {
            title: t('advisorsOverQuota'),
            status: 'success',
            message: t('advisorsOverQuota_ok'),
        };
        if (overloadedAdvisors.length > 0) {
            advisorQuotaCheck.status = 'warning';
            advisorQuotaCheck.message = t('advisorsOverQuota_warning').replace('{count}', String(overloadedAdvisors.length)).replace('{names}', overloadedAdvisors.map(a => a.name).join(', '));
        }
        
        const projectsMissingMilestones = projectGroups.filter(pg => pg.project.status === ProjectStatus.Approved && (!pg.project.milestones || pg.project.milestones.length === 0));
        const projectMilestoneCheck: CheckResult = {
            title: t('projectsWithoutMilestones'),
            status: 'success',
            message: t('projectsWithoutMilestones_ok'),
        };
        if (projectsMissingMilestones.length > 0) {
            projectMilestoneCheck.status = 'warning';
            projectMilestoneCheck.message = t('projectsWithoutMilestones_warning').replace('{count}', String(projectsMissingMilestones.length));
        }

        return {
            configuration: [defenseCheck, scoringCheck, templateCheck],
            coreData: [advisorCheck, majorCheck, classroomCheck],
            dataIntegrity: [studentProjectCheck, advisorQuotaCheck, projectMilestoneCheck],
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, advisors, majors, classrooms, defenseSettings, scoringSettings, milestoneTemplates, projectGroups, students, t]);

    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold">
                        {t('appReadinessStatus')}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <XMarkIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {t('readinessCheckDescription')}
                </Typography>
                <Stack spacing={3} sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                    <Box>
                        <Typography variant="h6" fontWeight="semibold" sx={{ mb: 1.5 }}>
                            {t('readinessConfiguration')}
                        </Typography>
                        <Stack spacing={1.5}>
                            {checks.configuration.map(check => <StatusItem key={check.title} {...check} />)}
                        </Stack>
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="semibold" sx={{ mb: 1.5 }}>
                            {t('readinessCoreData')}
                        </Typography>
                        <Stack spacing={1.5}>
                            {checks.coreData.map(check => <StatusItem key={check.title} {...check} />)}
                        </Stack>
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="semibold" sx={{ mb: 1.5 }}>
                            {t('readinessDataIntegrity')}
                        </Typography>
                        <Stack spacing={1.5}>
                            {checks.dataIntegrity.map(check => <StatusItem key={check.title} {...check} />)}
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
                <Button
                    onClick={() => setKey(k => k + 1)}
                    startIcon={<ArrowPathIcon />}
                    variant="outlined"
                >
                    {t('rerunChecks')}
                </Button>
                <Button onClick={onClose} variant="contained" color="primary">
                    {t('closeBtn')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AppReadinessModal;