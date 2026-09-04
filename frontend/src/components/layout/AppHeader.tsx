import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { useTranslation } from '../../i18n';
import { NotificationCenter } from './NotificationCenter';
import { Search, Menu, LogOut, User as UserIcon, Shield, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const { toggleSidebar, toggleMobileMenu, setCommandPaletteOpen } = useUIStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs h-16 px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="hidden md:flex p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={toggleMobileMenu}
          className="flex md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Toggle Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          {title && <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">{title}</h1>}
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      {/* Right section: Search bar trigger, Notifications, User profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Command Palette search trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-200 transition text-xs font-medium"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{t('btnSearch')}</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-500 dark:text-slate-300">
            ⌘K
          </kbd>
        </button>

        {/* Notification Bell */}
        <NotificationCenter />

        {/* User Avatar Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
          >
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden ring-2 ring-slate-100 dark:ring-slate-700">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <span>{currentUser?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="hidden lg:block text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[120px]">
                {currentUser?.name || 'User'}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                {currentUser?.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</p>
                <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                  {currentUser?.role}
                </span>
              </div>

              {currentUser?.role === 'CITIZEN' && (
                <Link
                  to="/citizen/profile"
                  onClick={() => setProfileOpen(false)}
                  className="w-full px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>{t('profile')}</span>
                </Link>
              )}

              <Link
                to="/map"
                onClick={() => setProfileOpen(false)}
                className="w-full px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
              >
                <Shield className="w-4 h-4 text-slate-400" />
                <span>{t('navMap')}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 rounded-lg text-xs text-danger-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-bold mt-1 border-t border-slate-100 dark:border-slate-800 pt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('navLogout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
