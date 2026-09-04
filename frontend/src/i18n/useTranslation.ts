import { useUIStore } from '../stores/useUIStore';
import { translations, TranslationKey, Language } from './translations';

export const useTranslation = () => {
  const { activeLanguage, setLanguage } = useUIStore();

  const t = (key: TranslationKey, fallback?: string): string => {
    const langDict = translations[activeLanguage] || translations.en;
    return (langDict as Record<string, string>)[key] || fallback || key;
  };

  return {
    t,
    language: activeLanguage,
    setLanguage: (lang: Language) => setLanguage(lang),
    isHindi: activeLanguage === 'hi',
  };
};

export { translations };
export type { TranslationKey, Language };
