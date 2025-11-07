import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, IconButton, Grid, Stack,
    Popover as MuiPopover, List, ListItem, ListItemButton, ListItemText,
    Chip, Divider
} from '@mui/material';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { CalendarDaysIcon } from './icons';
import { ProjectGroup, User, Advisor, MilestoneStatus } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useTheme } from '@mui/material/styles';

interface CalendarViewProps {
    projectGroups: ProjectGroup[];
    user: User;
    advisors: Advisor[];
    onSelectProject: (projectGroup: ProjectGroup) => void;
}

interface CalendarEvent {
    id: string;
    type: 'milestone' | 'defense';
    title: string;
    project: ProjectGroup;
    isOverdue?: boolean;
    date: Date;
}

const Popover: React.FC<{ 
    date: Date; 
    events: CalendarEvent[]; 
    onSelectEvent: (event: CalendarEvent) => void; 
    onClose: () => void; 
    anchorEl: HTMLElement | null;
    t: (key: any) => string 
}> = ({ date, events, onSelectEvent, onClose, anchorEl, t }) => {
    const open = Boolean(anchorEl);

    return (
        <MuiPopover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
            sx={{ mt: 1 }}
        >
            <Box sx={{ width: 256, p: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </Typography>
                <List sx={{ maxHeight: 192, overflow: 'auto', p: 0 }}>
                    {events.map((event, index) => (
                        <React.Fragment key={event.id}>
                            <ListItem disablePadding>
                                <ListItemButton 
                                    onClick={() => onSelectEvent(event)}
                                    sx={{ borderRadius: 1, mb: 0.5 }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <Box
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                mr: 1.5,
                                                flexShrink: 0,
                                                bgcolor: event.type === 'milestone' 
                                                    ? (event.isOverdue ? 'error.main' : 'primary.main') 
                                                    : 'success.main'
                                            }}
                                        />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight="semibold" noWrap>
                                                {event.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                {event.project.project.projectId}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </ListItemButton>
                            </ListItem>
                            {index < events.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            </Box>
        </MuiPopover>
    );
};

const CalendarView: React.FC<CalendarViewProps> = ({ projectGroups, user, advisors, onSelectProject }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
    const [popoverDate, setPopoverDate] = useState<Date | null>(null);
    const t = useTranslations();
    const theme = useTheme();

    const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    
    const eventsByDate = useMemo(() => {
        const eventMap = new Map<string, CalendarEvent[]>();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const userProjects = projectGroups.filter(pg => {
            if (user.role === 'Admin' || user.role === 'DepartmentAdmin') return true;
            if (user.role === 'Student') return pg.students.some(s => s.studentId === user.id);
            if (user.role === 'Advisor') {
                return pg.project.advisorName === user.name ||
                       pg.project.mainCommitteeId === user.id ||
                       pg.project.secondCommitteeId === user.id ||
                       pg.project.thirdCommitteeId === user.id;
            }
            return false;
        });

        userProjects.forEach(pg => {
            pg.project.milestones?.forEach(m => {
                const dueDate = new Date(m.dueDate);
                const dateKey = dueDate.toISOString().split('T')[0];
                const isOverdue = dueDate < today && m.status !== MilestoneStatus.Approved && m.status !== MilestoneStatus.Submitted;
                const event: CalendarEvent = { id: m.id, type: 'milestone', title: m.name, project: pg, isOverdue, date: dueDate };
                
                if (!eventMap.has(dateKey)) eventMap.set(dateKey, []);
                eventMap.get(dateKey)!.push(event);
            });

            if (pg.project.defenseDate) {
                const defenseDate = new Date(pg.project.defenseDate);
                const dateKey = defenseDate.toISOString().split('T')[0];
                const event: CalendarEvent = { id: `${pg.project.projectId}-defense`, type: 'defense', title: `${t('defense')}: ${pg.project.projectId}`, project: pg, date: defenseDate };
                if (!eventMap.has(dateKey)) eventMap.set(dateKey, []);
                eventMap.get(dateKey)!.push(event);
            }
        });

        return eventMap;
    }, [projectGroups, user, advisors, t]);

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay();

        const grid: { date: Date, isCurrentMonth: boolean, isToday: boolean, events: CalendarEvent[] }[] = [];
        const today = new Date();
        today.setHours(0,0,0,0);

        for (let i = 0; i < startDayOfWeek; i++) {
            const date = new Date(year, month, i - startDayOfWeek + 1);
            grid.push({ date, isCurrentMonth: false, isToday: false, events: [] });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateKey = date.toISOString().split('T')[0];
            const isToday = date.getTime() === today.getTime();
            grid.push({ date, isCurrentMonth: true, isToday, events: eventsByDate.get(dateKey) || [] });
        }
        
        const remainingCells = 42 - grid.length;
        for (let i = 1; i <= remainingCells; i++) {
            const date = new Date(year, month + 1, i);
            grid.push({ date, isCurrentMonth: false, isToday: false, events: [] });
        }
        
        return grid;
    }, [currentDate, eventsByDate]);

    const handleDayClick = (e: React.MouseEvent<HTMLDivElement>, events: CalendarEvent[], date: Date) => {
        if (events.length > 2) {
            setPopoverAnchor(e.currentTarget);
            setPopoverDate(date);
        } else if (events.length > 0) {
            onSelectProject(events[0].project);
        }
    };

    const handlePopoverClose = () => {
        setPopoverAnchor(null);
        setPopoverDate(null);
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        onSelectProject(event.project);
        handlePopoverClose();
    };

    const popoverEvents = popoverDate 
        ? (eventsByDate.get(popoverDate.toISOString().split('T')[0]) || [])
        : [];

    const weekDays = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
    
    return (
        <Box>
            <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    mb: 3
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
                        <CalendarDaysIcon sx={{ width: 32, height: 32, color: 'primary.main', mr: 1.5 }} />
                        <Box>
                            <Typography variant="h5" component="h2" fontWeight="bold">
                                {t('calendar')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {t('calendarDescription')}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 2 
                }}>
                    <IconButton 
                        onClick={goToPreviousMonth}
                        sx={{ 
                            borderRadius: '50%',
                            '&:hover': { bgcolor: 'action.hover' }
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                    <Typography variant="h6" fontWeight="bold">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </Typography>
                    <IconButton 
                        onClick={goToNextMonth}
                        sx={{ 
                            borderRadius: '50%',
                            '&:hover': { bgcolor: 'action.hover' }
                        }}
                    >
                        <ChevronRightIcon />
                    </IconButton>
                </Box>
                
                <Grid container spacing={0.5} sx={{ mb: 1 }}>
                    {weekDays.map(day => (
                        <Grid size={{ xs: 12/7 }} key={day}>
                            <Box sx={{ 
                                textAlign: 'center', 
                                py: 1,
                                fontWeight: 'semibold',
                                fontSize: '0.875rem',
                                color: 'text.secondary'
                            }}>
                                {day}
                            </Box>
                        </Grid>
                    ))}
                </Grid>
                
                <Grid container spacing={0.5}>
                    {calendarGrid.map(({ date, isCurrentMonth, isToday, events }, index) => (
                        <Grid size={{ xs: 12/7 }} key={index}>
                            <Paper
                                elevation={0}
                                sx={{
                                    height: 112,
                                    p: 1,
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    cursor: events.length > 0 ? 'pointer' : 'default',
                                    bgcolor: isCurrentMonth 
                                        ? 'background.paper' 
                                        : 'action.hover',
                                    transition: 'all 0.2s',
                                    '&:hover': events.length > 0 ? {
                                        bgcolor: 'action.hover',
                                        transform: 'scale(1.02)'
                                    } : {},
                                    position: 'relative'
                                }}
                                onClick={(e) => handleDayClick(e, events, date)}
                            >
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    mb: 0.5
                                }}>
                                    {isToday ? (
                                        <Box
                                            sx={{
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                borderRadius: '50%',
                                                width: 24,
                                                height: 24,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.875rem',
                                                fontWeight: 'semibold'
                                            }}
                                        >
                                            {date.getDate()}
                                        </Box>
                                    ) : (
                                        <Typography
                                            variant="body2"
                                            fontWeight="semibold"
                                            sx={{
                                                color: isCurrentMonth 
                                                    ? 'text.primary' 
                                                    : 'text.disabled'
                                            }}
                                        >
                                            {date.getDate()}
                                        </Typography>
                                    )}
                                </Box>
                                <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
                                    {events.slice(0, 2).map(event => (
                                        <Chip
                                            key={event.id}
                                            label={event.title}
                                            size="small"
                                            sx={{
                                                height: 18,
                                                fontSize: '0.625rem',
                                                fontWeight: 'semibold',
                                                bgcolor: event.type === 'milestone' 
                                                    ? (event.isOverdue ? 'error.main' : 'primary.main') 
                                                    : 'success.main',
                                                color: 'white',
                                                '& .MuiChip-label': {
                                                    px: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }
                                            }}
                                        />
                                    ))}
                                    {events.length > 2 && (
                                        <Typography 
                                            variant="caption" 
                                            color="primary.main"
                                            fontWeight="bold"
                                            sx={{ 
                                                cursor: 'pointer',
                                                '&:hover': { textDecoration: 'underline' }
                                            }}
                                        >
                                            +{events.length - 2} {t('more')}
                                        </Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: 'primary.main'
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {t('milestone')}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: 'error.main'
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {t('overdueMilestone')}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: 'success.main'
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {t('defense')}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>
            <Popover 
                date={popoverDate || new Date()} 
                events={popoverEvents}
                onSelectEvent={handleSelectEvent} 
                onClose={handlePopoverClose}
                anchorEl={popoverAnchor}
                t={t}
            />
        </Box>
    );
};

export default CalendarView;
