import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface ColumnSelectorProps {
    allColumns: { key: string; label: string }[];
    selectedColumns: string[];
    setSelectedColumns: (keys: string[]) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ allColumns, selectedColumns, setSelectedColumns }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const t = useTranslations();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggleColumn = (key: string) => {
        const newSelected = selectedColumns.includes(key)
            ? selectedColumns.filter(c => c !== key)
            : [...selectedColumns, key];
        setSelectedColumns(newSelected);
    };
    
    const handleSelectAll = () => {
        if (selectedColumns.length === allColumns.length) {
            setSelectedColumns([]);
        } else {
            setSelectedColumns(allColumns.map(c => c.key));
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-full cursor-default rounded-md bg-white dark:bg-slate-700 py-2 pl-3 pr-10 text-left text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
            >
                <span className="block truncate">{t('columnsSelected').replace('{count}', String(selectedColumns.length))}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                </span>
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    <div className="px-3 py-2 border-b dark:border-slate-600">
                        <label className="flex items-center space-x-3 text-sm">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={selectedColumns.length === allColumns.length}
                                onChange={handleSelectAll}
                            />
                            <span>{t('allColumns')}</span>
                        </label>
                    </div>
                    {allColumns.map(column => (
                         <label key={column.key} className="relative flex cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">
                             <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                                checked={selectedColumns.includes(column.key)}
                                onChange={() => handleToggleColumn(column.key)}
                            />
                            <span className="block truncate">{column.label}</span>
                         </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ColumnSelector;