import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useTranslation } from '../../i18n';
import { PlusCircle, LogIn, Menu, X } from 'lucide-react';

export const PublicHeader: React.FC = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: t('navHome'), path: '/' },
    { label: t('navHowItWorks'), path: '/how-it-works' },
    { label: t('navMap'), path: '/map' },
    { label: t('navAnnouncements'), path: '/announcements' },
    { label: t('navAbout'), path: '/about' },
    { label: t('navContact'), path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-900/20 group-hover:bg-primary-700 transition">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19L9 5h6l5 14" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 8v3" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M12 14v3" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="12" cy="7" r="2" fill="#14B8A6" stroke="#FFFFFF" strokeWidth="1" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-primary-700 dark:text-primary-400 font-sans">
                {t('brandName')}
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                Road Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all select-none ${
                  isActive(link.path)
                    ? 'text-primary-700 dark:text-primary-300 bg-primary-50/80 dark:bg-primary-950 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-primary-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" leftIcon={<LogIn className="w-4 h-4" />}>
                {t('navLogin')}
              </Button>
            </Link>
            <Link to="/citizen/report">
              <Button
                variant="accent"
                size="sm"
                leftIcon={<PlusCircle className="w-4 h-4" />}
                className="shadow-sm"
              >
                {t('navReportPothole')}
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                  isActive(link.path)
                    ? 'text-primary-700 bg-primary-50 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <Link to="/citizen/report" onClick={() => setMobileMenuOpen(false)} className="block w-full">
              <Button variant="accent" size="md" className="w-full justify-center" leftIcon={<PlusCircle className="w-4 h-4" />}>
                {t('navReportPothole')}
              </Button>
            </Link>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full">
              <Button variant="outline" size="md" className="w-full justify-center" leftIcon={<LogIn className="w-4 h-4" />}>
                {t('navLogin')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export const PublicFooter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold">
                N
              </div>
              <span className="text-lg font-bold text-white tracking-tight">{t('brandName')}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {t('brandTaglinePrimary')}
            </p>
            <div className="pt-2 text-[11px] text-amber-400 font-semibold">
              {t('demoNotice')}
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {t('brandName')}
            </h4>
            <ul className="space-y-1.5">
              <li><Link to="/how-it-works" className="hover:text-white transition">{t('navHowItWorks')}</Link></li>
              <li><Link to="/map" className="hover:text-white transition">{t('navMap')}</Link></li>
              <li><Link to="/announcements" className="hover:text-white transition">{t('navAnnouncements')}</Link></li>
              <li><Link to="/about" className="hover:text-white transition">{t('navAbout')}</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {t('citizenTitle')}
            </h4>
            <ul className="space-y-1.5">
              <li><Link to="/citizen/report" className="hover:text-white transition">{t('navReportPothole')}</Link></li>
              <li><Link to="/citizen/reports" className="hover:text-white transition">{t('myReports')}</Link></li>
              <li><Link to="/citizen/nearby" className="hover:text-white transition">{t('nearbyIssues')}</Link></li>
              <li><Link to="/login" className="hover:text-white transition">{t('navLogin')}</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {t('navContact')}
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              {t('brandTaglineSecondary')}
            </p>
            <ul className="space-y-1.5 pt-1">
              <li><Link to="/contact" className="hover:text-white transition">{t('navContact')}</Link></li>
              <li><span className="text-slate-500">Hazratganj Municipal Zone, Lucknow</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} NagarSam AI. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 transition cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 transition cursor-pointer">{t('accessibility')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
