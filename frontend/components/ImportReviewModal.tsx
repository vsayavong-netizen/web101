import React, { useMemo } from 'react';
import { XMarkIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface ImportReviewModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (validData: T[]) => void;
  data: (T & { _status: 'new' | 'update' | 'error'; _error?: string })[];
  columns: { key: keyof T | '_status' | '_error'; header: string }[];
  dataTypeName: string;
}

const statusStyles = {
    new: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

function ImportReviewModal<T extends object>({ isOpen, onClose, onConfirm, data, columns, dataTypeName }: ImportReviewModalProps<T>) {
  const t = useTranslations();
  const { validData, errorData, newCount, updateCount } = useMemo(() => {
    const valid: T[] = [];
    const errors: (T & { _status: 'error'; _error?: string })[] = [];
    let newItems = 0;
    let updatedItems = 0;

    data.forEach(item => {
      if (item._status === 'error') {
        errors.push(item as T & { _status: 'error'; _error?: string });
      } else {
        const cleanItem = { ...item };
        delete (cleanItem as any)._status;
        delete (cleanItem as any)._error;
        valid.push(cleanItem);
        if (item._status === 'new') newItems++;
        if (item._status === 'update') updatedItems++;
      }
    });
    return { validData: valid, errorData: errors, newCount: newItems, updateCount: updatedItems };
  }, [data]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(validData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Review Imported {dataTypeName}</h2>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
            
            <div className="mt-4 flex-grow overflow-y-auto">
                <div className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Import Summary</h3>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm">
                        <p><span className="font-bold text-green-600 dark:text-green-400">{newCount}</span> new {dataTypeName.toLowerCase()} to be added.</p>
                        <p><span className="font-bold text-blue-600 dark:text-blue-400">{updateCount}</span> existing {dataTypeName.toLowerCase()} to be updated.</p>
                        <p><span className="font-bold text-red-600 dark:text-red-400">{errorData.length}</span> rows with errors (will be ignored).</p>
                    </div>
                </div>

                {validData.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2">Data to be Imported ({validData.length} rows)</h4>
                        <div className="overflow-x-auto max-h-64 border dark:border-slate-700 rounded-lg">
                            <table className="min-w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300 sticky top-0">
                                    <tr>
                                        {columns.filter(c => c.key !== '_error').map(col => <th key={String(col.key)} scope="col" className="px-4 py-3">{col.header}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-700">
                                    {data.filter(item => item._status !== 'error').map((item, index) => (
                                        <tr key={index} className="dark:bg-slate-800">
                                            {columns.filter(c => c.key !== '_error').map(col => (
                                                <td key={String(col.key)} className="px-4 py-3 dark:text-slate-300">
                                                    {col.key === '_status' ? (
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${statusStyles[item._status]}`}>
                                                            {item._status}
                                                        </span>
                                                    ) : (
                                                        String((item as any)[col.key] ?? '')
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {errorData.length > 0 && (
                    <div>
                        <h4 className="text-md font-semibold text-red-600 dark:text-red-400 mb-2">Rows with Errors ({errorData.length} rows)</h4>
                         <div className="overflow-x-auto max-h-64 border border-red-300 dark:border-red-700 rounded-lg">
                            <table className="min-w-full text-sm text-left">
                                <thead className="text-xs text-red-700 uppercase bg-red-100 dark:bg-red-900/50 dark:text-red-300 sticky top-0">
                                    <tr>
                                        {columns.filter(c => c.key !== '_status').map(col => <th key={String(col.key)} scope="col" className="px-4 py-3">{col.header}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-red-200 dark:divide-red-800">
                                    {errorData.map((item, index) => (
                                        <tr key={index} className="bg-red-50 dark:bg-red-900/20">
                                            {columns.filter(c => c.key !== '_status').map(col => (
                                                <td key={String(col.key)} className="px-4 py-3 text-red-800 dark:text-red-300">
                                                    {String((item as any)[col.key] ?? '')}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t dark:border-slate-700 mt-4">
              <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white font-bold py-2 px-4 rounded-lg">
                {t('cancel')}
              </button>
              <button 
                type="button" 
                onClick={handleConfirm}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed"
                disabled={validData.length === 0}
              >
                {t('confirm')} Import ({validData.length})
              </button>
            </div>
        </div>
    </div>
  );
}

export default ImportReviewModal;
