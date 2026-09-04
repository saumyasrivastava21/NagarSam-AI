import React from 'react';
import { Outlet } from 'react-router-dom';
import { GovtTopBar } from '../components/layout/GovtTopBar';
import { PublicHeader, PublicFooter } from '../components/layout/PublicHeader';
import { DemoRoleSwitcher } from '../components/layout/DemoRoleSwitcher';
import { CommandPalette } from '../components/ui/CommandPalette';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
      <GovtTopBar />
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <DemoRoleSwitcher />
      <CommandPalette />
    </div>
  );
};
