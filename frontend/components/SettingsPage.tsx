import React, { useState } from 'react';
import {
    Box, Typography, Tabs, Tab, Stack
} from '@mui/material';
import {
    CalendarToday as CalendarTodayIcon,
    Edit as EditIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { CalendarPlusIcon, PencilSquareIcon, Cog6ToothIcon } from './icons';
import { DefenseSettings, Major, ScoringSettings, Advisor, GeneralSettings } from '../types';
import DefenseSettingsEditor from './DefenseSettingsEditor';
import { ScoringSettingsEditor } from './ScoringSettingsEditor';
import { useTranslations } from '../hooks/useTranslations';

interface SettingsPageProps {
    defenseSettings: DefenseSettings;
    majors: Major[];
    advisors: Advisor[];
    updateDefenseSettings: (settings: DefenseSettings) => void;
    autoScheduleDefenses: (settings: DefenseSettings) => { committeesAssigned: number; defensesScheduled: number; };
    scoringSettings: ScoringSettings;
    updateScoringSettings: (settings: ScoringSettings) => void;
}

type ActiveTab = 'defense' | 'scoring';

export const SettingsPage: React.FC<SettingsPageProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('defense');
    const t = useTranslations();

    const handleTabChange = (_event: React.SyntheticEvent, newValue: ActiveTab) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Cog6ToothIcon sx={{ width: 32, height: 32, color: 'primary.main' }} />
                <Box>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                        {t('settings')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {t('settingsDescription')}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            minHeight: 48,
                            fontWeight: 500
                        }
                    }}
                >
                    <Tab 
                        value="defense"
                        label={
                            <Stack direction="row" spacing={1} alignItems="center">
                                <CalendarPlusIcon sx={{ width: 20, height: 20 }} />
                                <span>{t('defenseScheduling')}</span>
                            </Stack>
                        }
                    />
                    <Tab 
                        value="scoring"
                        label={
                            <Stack direction="row" spacing={1} alignItems="center">
                                <PencilSquareIcon sx={{ width: 20, height: 20 }} />
                                <span>{t('scoringGrading')}</span>
                            </Stack>
                        }
                    />
                </Tabs>
            </Box>
            
            <Box>
                {activeTab === 'defense' && <DefenseSettingsEditor {...props} />}
                {activeTab === 'scoring' && <ScoringSettingsEditor {...props} />}
            </Box>
        </Box>
    );
};

export default SettingsPage;
