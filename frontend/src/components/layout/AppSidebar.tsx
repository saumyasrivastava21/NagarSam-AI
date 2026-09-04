import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { APP_NAME } from '../../constants';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  MapPin,
  Bell,
  User,
  AlertTriangle,
  Flame,
  Wrench,
  Building2,
  BarChart3,
  Users,
  Cpu,
  Sliders,
  Activity,
  ScrollText,
  CheckCircle2,
  LogOut,
  X,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { cn } from '../../utils/cn';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

export const AppSidebar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { currentUser, logout } = useAuthStore();
  const { sidebarOpen, mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const role = currentUser?.role || 'CITIZEN';

  const citizenNav: NavItem[] = [
    { label: t('navDashboard'), path: '/citizen', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: t('navReportPothole'), path: '/citizen/report', icon: <PlusCircle className="w-4 h-4 text-accent-500" />, highlight: true },
    { label: t('myReports'), path: '/citizen/reports', icon: <FileText className="w-4 h-4" /> },
    { label: t('nearbyIssues'), path: '/citizen/nearby', icon: <MapPin className="w-4 h-4" /> },
    { label: t('notifications'), path: '/citizen/notifications', icon: <Bell className="w-4 h-4" /> },
    { label: t('profile'), path: '/citizen/profile', icon: <User className="w-4 h-4" /> },
  ];

  const officerNav: NavItem[] = [
    { label: t('officerTitle'), path: '/officer', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: t('incidentQueue'), path: '/officer/incidents', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
    { label: t('officerMap'), path: '/officer/map', icon: <MapPin className="w-4 h-4" /> },
    { label: t('priorityQueue'), path: '/officer/priority', icon: <Flame className="w-4 h-4 text-red-500" /> },
    { label: t('workOrders'), path: '/officer/work-orders', icon: <Wrench className="w-4 h-4" /> },
    { label: t('analytics'), path: '/officer/analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const workerNav: NavItem[] = [
    { label: t('workerTitle'), path: '/worker', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: t('assignedJobs'), path: '/worker/jobs', icon: <Wrench className="w-4 h-4 text-amber-500" />, highlight: true },
    { label: t('completedJobs'), path: '/worker/completed', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
    { label: t('notifications'), path: '/citizen/notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  const adminNav: NavItem[] = [
    { label: t('adminTitle'), path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: t('userManagement'), path: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { label: t('departmentsWards'), path: '/admin/departments', icon: <Building2 className="w-4 h-4" /> },
    { label: t('modelRegistry'), path: '/admin/models', icon: <Cpu className="w-4 h-4 text-primary-400" /> },
    { label: t('aiConfig'), path: '/admin/ai', icon: <Sliders className="w-4 h-4" /> },
    { label: t('systemHealth'), path: '/admin/system', icon: <Activity className="w-4 h-4 text-emerald-500" /> },
    { label: t('auditLogs'), path: '/admin/audit-logs', icon: <ScrollText className="w-4 h-4" /> },
  ];

  const getNavItems = () => {
    switch (role) {
      case 'OFFICER':
        return officerNav;
      case 'FIELD_WORKER':
        return workerNav;
      case 'ADMIN':
        return adminNav;
      default:
        return citizenNav;
    }
  };

  const navItems = getNavItems();
  const isActive = (path: string) => {
    if (path === '/citizen' || path === '/officer' || path === '/worker' || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            N
          </div>
          <div>
            <span className="font-extrabold text-white tracking-tight text-base block font-sans">
              {APP_NAME}
            </span>
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
              {role} Workspace
            </span>
          </div>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-1 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="p-3 flex-1 overflow-y-auto space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                active
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80',
                item.highlight && !active && 'text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20'
              )}
            >
              <span className={active ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          to="/map"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
        >
          <MapPin className="w-4 h-4 text-slate-500" />
          <span>Public Map</span>
        </Link>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-danger-400 hover:text-danger-300 hover:bg-red-500/10 transition font-bold"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={cn(
          'hidden md:block shrink-0 transition-all duration-200 border-r border-slate-800 z-30',
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        )}
      >
        <div className="fixed inset-y-0 w-64">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
