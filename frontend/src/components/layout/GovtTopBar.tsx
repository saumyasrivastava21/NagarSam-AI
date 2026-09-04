import React from 'react';
import { useTranslation } from '../../i18n';
import { useUIStore } from '../../stores/useUIStore';
import { Eye, Languages, Sun, Moon, Monitor } from 'lucide-react';
import { AudioReaderButton } from '../ui/AudioReaderButton';

export const GovtTopBar: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { highContrast, toggleHighContrast, themeMode, setThemeMode } = useUIStore();

  return (
    <div className="bg-slate-900 text-slate-300 text-[11px] font-medium py-1 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">{t('brandName')}</span>
          <span className="text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-300">
            {t('topbarGovtInfo')}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-slate-400">
          {/* Theme Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
            <button
              onClick={() => setThemeMode('light')}
              title={t('themeLight')}
              aria-label={t('themeLight')}
              className={`p-1 rounded-full transition ${themeMode === 'light' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <Sun className="w-3 h-3" />
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              title={t('themeDark')}
              aria-label={t('themeDark')}
              className={`p-1 rounded-full transition ${themeMode === 'dark' ? 'bg-primary-500 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <Moon className="w-3 h-3" />
            </button>
            <button
              onClick={() => setThemeMode('system')}
              title={t('themeSystem')}
              aria-label={t('themeSystem')}
              className={`p-1 rounded-full transition ${themeMode === 'system' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <Monitor className="w-3 h-3" />
            </button>
          </div>

          {/* Audio Screen Reader Button */}
          <AudioReaderButton />

          <span className="text-slate-700">|</span>

          {/* Accessibility toggle */}
          <button
            onClick={toggleHighContrast}
            className="hover:text-white flex items-center gap-1 transition"
            title="Toggle high contrast accessibility mode"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{highContrast ? t('standardContrast') : t('accessibility')}</span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
            <Languages className="w-3.5 h-3.5 text-primary-400" />
            <button
              onClick={() => setLanguage('en')}
              className={`hover:text-white transition px-1 rounded ${language === 'en' ? 'text-primary-300 font-bold underline bg-primary-950/60' : 'text-slate-400'}`}
            >
              English
            </button>
            <span className="text-slate-600">/</span>
            <button
              onClick={() => setLanguage('hi')}
              className={`hover:text-white transition px-1 rounded ${language === 'hi' ? 'text-primary-300 font-bold underline bg-primary-950/60' : 'text-slate-400'}`}
            >
              हिंदी
            </button>
          </div>

          <span className="text-slate-700 hidden lg:inline">|</span>
          <span className="text-amber-400 font-bold hidden lg:inline">
            {t('demoNotice')}
          </span>
        </div>
      </div>
    </div>
  );
};
