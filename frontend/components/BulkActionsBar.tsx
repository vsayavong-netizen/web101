import React from 'react';
import { ChatBubbleBottomCenterTextIcon, XMarkIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface BulkActionsBarProps {
    selectedCount: number;
    onClear: () => void;
    onSendMessage: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ selectedCount, onClear, onSendMessage }) => {
    const t = useTranslations();
    return (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl mb-4 z-40">
            <div className="bg-slate-800 text-white rounded-lg shadow-lg p-3 flex justify-between items-center animate-fade-in-up">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-sm">{t('bulkActionsSelected').replace('${count}', String(selectedCount))}</span>
                    <button onClick={onSendMessage} className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md">
                        <ChatBubbleBottomCenterTextIcon className="w-5 h-5"/> {t('sendMessage')}
                    </button>
                </div>
                <button onClick={onClear} className="p-1.5 rounded-full hover:bg-slate-700">
                    <XMarkIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
    );
};

export default BulkActionsBar;