import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ProjectGroup, User, Advisor, MilestoneStatus } from '../types';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

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

const Popover: React.FC<{ date: Date; events: CalendarEvent[]; onSelectEvent: (event: CalendarEvent) => void; onClose: () => void; target: HTMLElement; t: (key: any) => string }> = ({ date, events, onSelectEvent, onClose, target, t }) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<any>({});

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        if (popoverRef.current && target) {
            const rect = target.getBoundingClientRect();
            const popoverRect = popoverRef.current.getBoundingClientRect();
            const newStyle: any = {
                position: 'fixed',
                top: `${rect.bottom + 8}px`,
                left: `${rect.left + rect.width / 2 - popoverRect.width / 2}px`,
            };
            if (rect.left + rect.width / 2 + popoverRect.width / 2 > window.innerWidth) {
                newStyle.left = `${window.innerWidth - popoverRect.width - 8}px`;
            }
            if (rect.left + rect.width / 2 - popoverRect.width / 2 < 0) {
                newStyle.left = '8px';
            }
            setStyle(newStyle);
        }
    }, [target]);

    return (
        <div ref={popoverRef} className="z-20 w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl" style={style}>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
                {events.map(event => (
                    <li key={event.id}>
                         <button onClick={() => onSelectEvent(event)} className="w-full text-left p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                            <div className="flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${event.type === 'milestone' ? (event.isOverdue ? 'bg-red-500' : 'bg-blue-500') : 'bg-green-500'}`}></span>
                                <div>
                                    <p className="text-sm font-semibold truncate">{event.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{event.project.project.projectId}</p>
                                </div>
                            </div>
                         </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const CalendarView: React.FC<CalendarViewProps> = ({ projectGroups, user, advisors, onSelectProject }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [popoverState, setPopoverState] = useState<{ date: Date; target: HTMLElement } | null>(null);
    const t = useTranslations();

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
            setPopoverState({ date, target: e.currentTarget });
        } else if (events.length > 0) {
            onSelectProject(events[0].project);
        }
    };
    
    return (
        <>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                     <div className="flex items-center">
                       <CalendarDaysIcon className="w-8 h-8 text-blue-600 mr-3"/>
                       <div>
                         <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('calendar')}</h2>
                         <p className="text-slate-500 dark:text-slate-400 mt-1">{t('calendarDescription')}</p>
                       </div>
                    </div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                    <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeftIcon className="w-6 h-6"/></button>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRightIcon className="w-6 h-6"/></button>
                </div>
                
                <div className="grid grid-cols-7 text-center font-semibold text-sm text-slate-600 dark:text-slate-300 mb-2">
                    {[t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')].map(day => <div key={day} className="py-2">{day}</div>)}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                    {calendarGrid.map(({ date, isCurrentMonth, isToday, events }, index) => (
                        <div 
                            key={index}
                            className={`relative h-28 p-2 border border-slate-200 dark:border-slate-700 rounded-md transition-colors ${isCurrentMonth ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                            onClick={(e) => handleDayClick(e, events, date)}
                        >
                            <span className={`text-sm font-semibold ${isToday ? 'bg-blue-600 text-white rounded-full flex items-center justify-center w-6 h-6' : (isCurrentMonth ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500')}`}>
                                {date.getDate()}
                            </span>
                            <div className="mt-1 space-y-1 overflow-hidden">
                                {events.slice(0, 2).map(event => (
                                    <div key={event.id} className="text-xs font-semibold text-white px-1.5 py-0.5 rounded truncate cursor-pointer" style={{ backgroundColor: event.type === 'milestone' ? (event.isOverdue ? '#ef4444' : '#3b82f6') : '#10b981' }}>
                                        {event.title}
                                    </div>
                                ))}
                                {events.length > 2 && (
                                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                                        +{events.length - 2} {t('more')}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                 <div className="flex flex-wrap gap-x-4 gap-y-1 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full mr-1.5 bg-blue-500"></span><span className="text-slate-600 dark:text-slate-400">{t('milestone')}</span></div>
                    <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full mr-1.5 bg-red-500"></span><span className="text-slate-600 dark:text-slate-400">{t('overdueMilestone')}</span></div>
                    <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full mr-1.5 bg-green-500"></span><span className="text-slate-600 dark:text-slate-400">{t('defense')}</span></div>
                </div>
            </div>
            {popoverState && (
                <Popover 
                    date={popoverState.date} 
                    events={eventsByDate.get(popoverState.date.toISOString().split('T')[0]) || []}
                    onSelectEvent={(e) => { onSelectProject(e.project); setPopoverState(null); }} 
                    onClose={() => setPopoverState(null)}
                    target={popoverState.target}
                    t={t}
                />
            )}
        </>
    );
};

export default CalendarView;