import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { UserRole } from '../../types';
import { UserCheck, Shield, Wrench, Settings, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';

export const DemoRoleSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, switchRole } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const roles: Array<{ role: UserRole; label: string; desc: string; path: string; icon: React.ReactNode; color: string }> = [
    {
      role: 'CITIZEN',
      label: 'Citizen Portal',
      desc: 'Report road defects, track resolution milestones & photo verification',
      path: '/citizen',
      icon: <UserCheck className="w-4 h-4 text-emerald-600" />,
      color: 'hover:border-emerald-300',
    },
    {
      role: 'OFFICER',
      label: 'Municipal Officer',
      desc: 'Triage incident queue, AI review & dispatch work orders',
      path: '/officer',
      icon: <Shield className="w-4 h-4 text-primary-600" />,
      color: 'hover:border-primary-300',
    },
    {
      role: 'FIELD_WORKER',
      label: 'Field Worker',
      desc: 'Job cards, mobile repair logs & after-repair photos',
      path: '/worker',
      icon: <Wrench className="w-4 h-4 text-amber-600" />,
      color: 'hover:border-amber-300',
    },
    {
      role: 'ADMIN',
      label: 'System Admin',
      desc: 'Model registry, AI thresholds, system health & audit logs',
      path: '/admin',
      icon: <Settings className="w-4 h-4 text-purple-600" />,
      color: 'hover:border-purple-300',
    },
  ];

  const handleSwitch = async (role: UserRole, path: string) => {
    try {
      const user = await switchRole(role);
      toast.success(`Active workspace: ${user.role} (${user.name})`);
      navigate(path);
      setIsExpanded(false);
    } catch {
      toast.error('Failed to switch workspace');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      {/* Expanded Menu */}
      {isExpanded && (
        <div className="mb-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-3 space-y-2 animate-in slide-in-from-bottom-3 duration-150">
          <div className="px-2 py-1 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Workspace Switcher
            </span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Switch role & access portal
            </p>
          </div>

          <div className="space-y-1">
            {roles.map((r) => {
              const isActive = currentUser?.role === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => handleSwitch(r.role, r.path)}
                  className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-3 ${r.color} ${
                    isActive
                      ? 'bg-primary-50/80 dark:bg-primary-950/60 border-primary-300 dark:border-primary-700 shadow-2xs'
                      : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-2xs mt-0.5">{r.icon}</div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{r.label}</span>
                        {isActive && <span className="text-[10px] text-primary-700 dark:text-primary-400 font-extrabold">(Active)</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-primary-700 dark:text-primary-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-full shadow-xl border border-slate-700 flex items-center gap-2 transition hover:scale-105"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Workspace: {currentUser?.role || 'Citizen'}</span>
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
      </button>
    </div>
  );
};
