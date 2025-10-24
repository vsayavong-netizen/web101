
import React, { useState } from 'react';
import { DefenseSettings, Major, ScoringSettings, Advisor, GeneralSettings } from '../types';
import DefenseSettingsEditor from './DefenseSettingsEditor';
import { ScoringSettingsEditor } from './ScoringSettingsEditor';
import { CalendarPlusIcon, PencilSquareIcon, Cog6ToothIcon } from './icons';
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

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }> = ({ active, onClick, children, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2
      ${active
        ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
        : 'text-slate-500 border-transparent hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600'
      }`
    }
  >
    {icon}
    {children}
  </button>
);

export const SettingsPage: React.FC<SettingsPageProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('defense');
    const t = useTranslations();

    return (
        <div className="space-y-6">
             <div className="flex items-center">
               <Cog6ToothIcon className="w-8 h-8 text-blue-600 mr-3"/>
               <div>
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('settings')}</h2>
                 <p className="text-slate-500 dark:text-slate-400 mt-1">{t('settingsDescription')}</p>
               </div>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex -mb-px">
                  <TabButton active={activeTab === 'defense'} onClick={() => setActiveTab('defense')} icon={<CalendarPlusIcon className="w-5 h-5"/>}>{t('defenseScheduling')}</TabButton>
                  <TabButton active={activeTab === 'scoring'} onClick={() => setActiveTab('scoring')} icon={<PencilSquareIcon className="w-5 h-5"/>}>{t('scoringGrading')}</TabButton>
              </div>
          </div>
          
          <div>
            {activeTab === 'defense' && <DefenseSettingsEditor {...props} />}
            {activeTab === 'scoring' && <ScoringSettingsEditor {...props} />}
          </div>
        </div>
    );
}

export default SettingsPage;
