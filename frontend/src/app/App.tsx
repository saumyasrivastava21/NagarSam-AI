import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AppProviders } from './providers';
import { useAuthStore } from '../stores/useAuthStore';

export const App: React.FC = () => {
  const { currentUser, login, isAuthenticated } = useAuthStore();

  // Initialize demo session if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      login('citizen@example.com', 'DemoPass2026!').catch(() => {});
    }
  }, [isAuthenticated, currentUser, login]);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
};
