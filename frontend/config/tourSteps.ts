import { translations } from '../utils/translations';

export interface TourStep {
    target: string;
    title: string;
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

type TFunction = (key: keyof typeof translations) => string;

export const getStudentWelcomeTour = (t: TFunction): TourStep[] => ([
    {
        target: '#welcome-panel',
        title: t('tourWelcomeTitle'),
        content: t('tourWelcomeContent'),
        placement: 'bottom',
    },
    {
        target: '#register-project-btn-welcome',
        title: t('tourRegisterTitle'),
        content: t('tourRegisterContent'),
        placement: 'bottom',
    },
    {
        target: '#advisor-workload-panel',
        title: t('tourAdvisorTitle'),
        content: t('tourAdvisorContent'),
        placement: 'left',
    },
]);

export const getAdvisorDashboardTour = (t: TFunction): TourStep[] => ([
    {
        target: '#dashboard-stats-grid',
        title: t('tourAdvisorWelcomeTitle'),
        content: t('tourAdvisorWelcomeContent'),
        placement: 'bottom',
    },
    {
        target: '#needs-review-btn',
        title: t('tourActionItemsTitle'),
        content: t('tourActionItemsContent'),
        placement: 'bottom',
    },
    {
        target: '.project-table-row',
        title: t('tourProjectListTitle'),
        content: t('tourProjectListContent'),
        placement: 'bottom',
    },
    {
        target: '.project-table-row',
        title: t('tourProjectDetailsTitle'),
        content: t('tourProjectDetailsContent'),
        placement: 'top',
    },
]);
