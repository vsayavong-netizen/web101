import { useLanguage } from './useLanguage';
import { translations } from '../utils/translations';

export type TranslationKey = keyof typeof translations;

export const useTranslations = () => {
    const { language } = useLanguage();

    const t = (key: TranslationKey): string => {
        const translation = translations[key];
        if (translation && typeof translation === 'object' && 'en' in translation && 'lo' in translation) {
            return translation[language] || String(key);
        }
        // Fallback for non-standard or missing keys
        return String(key);
    };
    
    return t;
};