import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/layout/AppSidebar';
import { AppHeader } from '../components/layout/AppHeader';
import { GovtTopBar } from '../components/layout/GovtTopBar';
import { DemoRoleSwitcher } from '../components/layout/DemoRoleSwitcher';
import { CommandPalette } from '../components/ui/CommandPalette';

export const CitizenLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
      <GovtTopBar />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader title="Citizen Reporting Center" subtitle="Report hazards, monitor repair milestones & AI verification" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <DemoRoleSwitcher />
      <CommandPalette />
    </div>
  );
};
