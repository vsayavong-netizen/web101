
import { useContext } from 'react';
import { ToastContext, ToastMessage } from '../context/ToastContext';

export const useToast = (): (toast: Omit<ToastMessage, 'id'>) => void => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context.addToast;
};
