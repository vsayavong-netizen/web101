import React, { useMemo } from 'react';
import {
  Box, Paper, Typography, Tooltip, Stack, Divider
} from '@mui/material';
import {
  Schedule as ClockIcon, Upload as DocumentArrowUpIcon,
  CheckCircle as CheckCircleIcon, Refresh as ArrowPathIcon,
  Warning as ExclamationTriangleIcon, BarChart as ChartBarIcon
} from '@mui/icons-material';
import { ProjectGroup, ProjectStatus, Milestone, MilestoneStatus, FinalSubmissionFile, FinalSubmissionStatus } from '../types';
import { useTranslations } from '../hooks/useTranslations';

// Component Props
interface ProjectTimelineProps {
  projectGroups: ProjectGroup[];
}

// Milestone Tooltip Content Component
const MilestoneTooltipContent: React.FC<{ milestone: Milestone, project: ProjectGroup, t: (key: any) => string }> = ({ milestone, project, t }) => (
    <Box sx={{ p: 1 }}>
        <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', pb: 0.5, mb: 0.5, borderBottom: 1, borderColor: 'divider' }}>
            {milestone.name}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
            <strong>{t('projectLabel')}:</strong> {project.project.projectId}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
            <strong>{t('studentsLabel')}:</strong> {project.students.map(s => s.name).join(', ')}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
            <strong>{t('dueLabel')}:</strong> {new Date(milestone.dueDate).toLocaleDateString()}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
            <strong>{t('statusLabel')}:</strong> {milestone.status}
        </Typography>
    </Box>
);

// Final Submission Tooltip Content Component
const FinalSubmissionTooltipContent: React.FC<{ submission: FinalSubmissionFile, project: ProjectGroup, type: string, t: (key: any) => string }> = ({ submission, project, type, t }) => (
    <Box sx={{ p: 1 }}>
        <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', pb: 0.5, mb: 0.5, borderBottom: 1, borderColor: 'divider' }}>
            {type}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
            <strong>{t('projectLabel')}:</strong> {project.project.projectId}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
            <strong>{t('studentsLabel')}:</strong> {project.students.map(s => s.name).join(', ')}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
            <strong>{t('submittedLabel')}:</strong> {new Date(submission.submittedAt).toLocaleDateString()}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
            <strong>{t('statusLabel')}:</strong> {submission.status}
        </Typography>
    </Box>
);


// Main Timeline Component
const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ projectGroups }) => {
    const t = useTranslations();

    const approvedProjects = useMemo(() => {
        return projectGroups
            .filter(pg => pg.project.status === ProjectStatus.Approved && (
                (pg.project.milestones && pg.project.milestones.length > 0) ||
                (pg.project.finalSubmissions && (pg.project.finalSubmissions.preDefenseFile || pg.project.finalSubmissions.postDefenseFile))
            ))
            .sort((a, b) => a.project.projectId.localeCompare(b.project.projectId));
    }, [projectGroups]);

    const { startDate, endDate, totalDays } = useMemo(() => {
        if (approvedProjects.length === 0) {
            const today = new Date();
            const year = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1; // Academic year starts in Aug
            const start = new Date(year, 7, 1);
            const end = new Date(year + 1, 6, 31);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
            return { startDate: start, endDate: end, totalDays: days };
        }

        const allDates: Date[] = approvedProjects.flatMap(pg => [
            ...(pg.project.milestones?.map(m => new Date(m.dueDate)) || []),
            ...(pg.project.finalSubmissions?.preDefenseFile ? [new Date(pg.project.finalSubmissions.preDefenseFile.submittedAt)] : []),
            ...(pg.project.finalSubmissions?.postDefenseFile ? [new Date(pg.project.finalSubmissions.postDefenseFile.submittedAt)] : [])
        ]).filter(Boolean);

        if (allDates.length === 0) {
            const today = new Date();
            const year = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
            const start = new Date(year, 7, 1);
            const end = new Date(year + 1, 6, 31);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
            return { startDate: start, endDate: end, totalDays: days };
        }
        
        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

        const start = new Date(minDate);
        start.setDate(start.getDate() - 15);

        const end = new Date(maxDate);
        end.setDate(end.getDate() + 15);
        
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        
        return { startDate: start, endDate: end, totalDays: days };
    }, [approvedProjects]);

    const getDayPosition = (date: Date) => {
        const diff = (date.getTime() - startDate.getTime());
        if (diff < 0) return 0;
        const diffDays = diff / (1000 * 3600 * 24);
        return (diffDays / totalDays) * 100;
    };
    
    const getMilestoneStatusInfo = (milestone: Milestone) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const dueDate = new Date(milestone.dueDate);
        const isOverdue = (milestone.status === MilestoneStatus.Pending || milestone.status === MilestoneStatus.RequiresRevision) && dueDate < today;

        if (isOverdue) {
            return { icon: <ExclamationTriangleIcon sx={{ fontSize: 16, color: 'white' }} />, color: 'error.main', label: t('overdue') };
        }

        switch (milestone.status) {
            case MilestoneStatus.Approved: return { icon: <CheckCircleIcon sx={{ fontSize: 16, color: 'white' }} />, color: 'success.main', label: t('approved') };
            case MilestoneStatus.Submitted: return { icon: <DocumentArrowUpIcon sx={{ fontSize: 16, color: 'white' }} />, color: 'info.main', label: t('submitted') };
            case MilestoneStatus.RequiresRevision: return { icon: <ArrowPathIcon sx={{ fontSize: 16, color: 'white' }} />, color: 'warning.main', label: t('requiresRevision') };
            default: return { icon: <ClockIcon sx={{ fontSize: 16, color: 'white' }} />, color: 'grey.400', label: t('pending') };
        }
    };

    const getFinalSubmissionStatusInfo = (submission: FinalSubmissionFile) => {
        switch (submission.status) {
            case FinalSubmissionStatus.Approved: return { icon: <CheckCircleIcon sx={{ fontSize: 16, color: 'white' }} />, color: 'success.main', label: t('approved') };
            case FinalSubmissionStatus.Submitted: return { icon: <DocumentArrowUpIcon sx={{ fontSize: 16, color: 'white' }} />, color: 'info.main', label: t('submitted') };
            case FinalSubmissionStatus.RequiresRevision: return { icon: <ArrowPathIcon sx={{ fontSize: 16, color: 'white' }} />, color: 'warning.main', label: t('requiresRevision') };
            default: return { icon: <ClockIcon sx={{ fontSize: 16, color: 'white' }} />, color: 'grey.400', label: t('unknown') };
        }
    };

    const months = useMemo(() => {
        const monthArray: { name: string; position: number; width: number }[] = [];
        let current = new Date(startDate);
        current.setDate(1);

        while (current <= endDate) {
            const nextMonth = new Date(current);
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            const startPos = getDayPosition(current > startDate ? current : startDate);
            const endPos = getDayPosition(nextMonth < endDate ? nextMonth : endDate);

            monthArray.push({
                name: current.toLocaleString('default', { month: 'short', year: 'numeric' }),
                position: startPos,
                width: endPos - startPos,
            });
            current = nextMonth;
        }
        return monthArray;
    }, [startDate, endDate]);

    const todayPosition = getDayPosition(new Date());

    if (approvedProjects.length === 0) {
        return (
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                <ChartBarIcon sx={{ fontSize: 48, color: 'text.secondary', mx: 'auto', display: 'block' }} />
                <Typography variant="h6" fontWeight="medium" sx={{ mt: 2 }}>
                    {t('noTimelineTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t('noTimelineData')}
                </Typography>
            </Paper>
        );
    }
    
    return (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                {t('projectTimelineTitle')}
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ position: 'relative', minWidth: 1200 }}>
                    {/* Month Headers */}
                    <Box sx={{ position: 'relative', height: 32, mb: 1 }}>
                        {months.map(month => (
                            <Box
                                key={month.name}
                                sx={{
                                    position: 'absolute',
                                    left: `${month.position}%`,
                                    width: `${month.width}%`,
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    color: 'text.secondary',
                                    borderRight: 1,
                                    borderColor: 'divider',
                                    textAlign: 'center'
                                }}
                            >
                                {month.name}
                            </Box>
                        ))}
                    </Box>

                    {/* Today Marker */}
                    {todayPosition >= 0 && todayPosition <= 100 && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 32,
                                bottom: 0,
                                width: 2,
                                bgcolor: 'primary.main',
                                zIndex: 10,
                                left: `${todayPosition}%`
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -24,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    bgcolor: 'primary.main',
                                    color: 'primary.contrastText',
                                    px: 0.75,
                                    py: 0.25,
                                    borderRadius: 0.5
                                }}
                            >
                                {t('today')}
                            </Box>
                        </Box>
                    )}
                    
                    {/* Project Rows */}
                    <Stack spacing={1} sx={{ pt: 1 }}>
                        {approvedProjects.map((pg, index) => (
                            <Box
                                key={pg.project.projectId}
                                sx={{
                                    height: 40,
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: 1,
                                    bgcolor: index % 2 === 0 ? 'action.hover' : 'transparent'
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 192,
                                        px: 1,
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        color: 'text.secondary',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 10,
                                        bgcolor: 'inherit'
                                    }}
                                >
                                    {pg.project.projectId}
                                </Box>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        flex: 1,
                                        height: '100%',
                                        borderLeft: 1,
                                        borderColor: 'divider'
                                    }}
                                >
                                    {/* Milestones */}
                                    {pg.project.milestones?.map(milestone => {
                                        const pos = getDayPosition(new Date(milestone.dueDate));
                                        const statusInfo = getMilestoneStatusInfo(milestone);
                                        return (
                                            <Tooltip
                                                key={milestone.id}
                                                title={<MilestoneTooltipContent milestone={milestone} project={pg} t={t} />}
                                                arrow
                                                placement="top"
                                            >
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        left: `${pos}%`,
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: '50%',
                                                        bgcolor: statusInfo.color,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        border: 2,
                                                        borderColor: 'background.paper',
                                                        boxShadow: 1
                                                    }}
                                                >
                                                    {statusInfo.icon}
                                                </Box>
                                            </Tooltip>
                                        );
                                    })}
                                    {/* Final Submissions */}
                                    {pg.project.finalSubmissions?.preDefenseFile && (() => {
                                        const submission = pg.project.finalSubmissions.preDefenseFile;
                                        const pos = getDayPosition(new Date(submission.submittedAt));
                                        const statusInfo = getFinalSubmissionStatusInfo(submission);
                                        return (
                                            <Tooltip
                                                title={<FinalSubmissionTooltipContent submission={submission} project={pg} type={t('preDefenseFilesLabel')} t={t} />}
                                                arrow
                                                placement="top"
                                            >
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        left: `${pos}%`,
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: 1,
                                                        bgcolor: statusInfo.color,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        border: 2,
                                                        borderColor: 'background.paper',
                                                        boxShadow: 1
                                                    }}
                                                >
                                                    {statusInfo.icon}
                                                </Box>
                                            </Tooltip>
                                        );
                                    })()}
                                    {pg.project.finalSubmissions?.postDefenseFile && (() => {
                                        const submission = pg.project.finalSubmissions.postDefenseFile;
                                        const pos = getDayPosition(new Date(submission.submittedAt));
                                        const statusInfo = getFinalSubmissionStatusInfo(submission);
                                        return (
                                            <Tooltip
                                                title={<FinalSubmissionTooltipContent submission={submission} project={pg} type={t('postDefenseFilesLabel')} t={t} />}
                                                arrow
                                                placement="top"
                                            >
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        left: `${pos}%`,
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: 1,
                                                        bgcolor: statusInfo.color,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        border: 2,
                                                        borderColor: 'background.paper',
                                                        boxShadow: 1
                                                    }}
                                                >
                                                    {statusInfo.icon}
                                                </Box>
                                            </Tooltip>
                                        );
                                    })()}
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ fontSize: '0.75rem' }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'info.main' }} />
                    <Typography variant="caption" color="text.secondary">
                        {t('milestoneUnit')}
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={0.75} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'error.main' }} />
                    <Typography variant="caption" color="text.secondary">
                        {t('overdueMilestone')}
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={0.75} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main' }} />
                    <Typography variant="caption" color="text.secondary">
                        {t('defense')}
                    </Typography>
                </Stack>
            </Stack>
        </Paper>
    );
};

export default ProjectTimeline;