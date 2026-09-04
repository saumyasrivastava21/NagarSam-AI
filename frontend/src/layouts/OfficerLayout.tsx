import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/layout/AppSidebar';
import { AppHeader } from '../components/layout/AppHeader';
import { GovtTopBar } from '../components/layout/GovtTopBar';
import { DemoRoleSwitcher } from '../components/layout/DemoRoleSwitcher';
import { CommandPalette } from '../components/ui/CommandPalette';

export const OfficerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
      <GovtTopBar />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader title="Municipal Operations Desk" subtitle="Civic triage, AI priority verification & department dispatch" />
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

export const WorkerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
      <GovtTopBar />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader title="Field Repair Console" subtitle="Assigned jobs, location dispatch & verification upload" />
          <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <DemoRoleSwitcher />
      <CommandPalette />
    </div>
  );
};

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
      <GovtTopBar />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader title="System Administration & AI Config" subtitle="Model registry, AI thresholds, health telemetry & audit trail" />
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

