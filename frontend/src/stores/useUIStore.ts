import { create } from 'zustand';
import { ThemeMode } from '../types';

interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  commandPaletteOpen: boolean;
  demoModalOpen: boolean;
  activeLanguage: 'en' | 'hi';
  highContrast: boolean;
  themeMode: ThemeMode;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setDemoModalOpen: (open: boolean) => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  toggleHighContrast: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const applyThemeToDOM = (mode: ThemeMode) => {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const getInitialTheme = (): ThemeMode => {
  try {
    const saved = localStorage.getItem('nagarsam_theme_mode') as ThemeMode;
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
      applyThemeToDOM(saved);
      return saved;
    }
  } catch {
    // fallback
  }
  applyThemeToDOM('light');
  return 'light';
};

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  mobileMenuOpen: false,
  commandPaletteOpen: false,
  demoModalOpen: false,
  activeLanguage: 'en',
  highContrast: false,
  themeMode: getInitialTheme(),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setDemoModalOpen: (open) => set({ demoModalOpen: open }),
  setLanguage: (lang) => set({ activeLanguage: lang }),
  toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),

  setThemeMode: (mode: ThemeMode) => {
    try {
      localStorage.setItem('nagarsam_theme_mode', mode);
    } catch {
      // ignore
    }
    applyThemeToDOM(mode);
    set({ themeMode: mode });
  },

  toggleTheme: () => {
    const current = get().themeMode;
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    get().setThemeMode(next);
  },
}));
