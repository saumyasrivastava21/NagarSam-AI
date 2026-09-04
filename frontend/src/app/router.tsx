import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { CitizenLayout } from '../layouts/CitizenLayout';
import { OfficerLayout } from '../layouts/OfficerLayout';
import { WorkerLayout } from '../layouts/WorkerLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { AboutPage } from '../pages/public/AboutPage';
import { HowItWorksPage } from '../pages/public/HowItWorksPage';
import { PublicMapPage } from '../pages/public/PublicMapPage';
import { AnnouncementsPage } from '../pages/public/AnnouncementsPage';
import { ContactPage } from '../pages/public/ContactPage';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage, AccessDeniedPage, NotFoundPage } from '../pages/auth/ForgotPasswordPage';

// Citizen Pages
import { CitizenDashboard } from '../pages/citizen/CitizenDashboard';
import { ReportPotholePage } from '../pages/citizen/ReportPotholePage';
import { MyReportsPage } from '../pages/citizen/MyReportsPage';
import { ReportDetailPage } from '../pages/citizen/ReportDetailPage';
import { NearbyIssuesPage } from '../pages/citizen/NearbyIssuesPage';
import { CitizenNotificationsPage } from '../pages/citizen/CitizenNotificationsPage';
import { CitizenProfilePage } from '../pages/citizen/CitizenProfilePage';

// Officer Pages
import { OfficerDashboard } from '../pages/officer/OfficerDashboard';
import { IncidentQueuePage } from '../pages/officer/IncidentQueuePage';
import { IncidentDetailPage } from '../pages/officer/IncidentDetailPage';
import { OfficerMapPage } from '../pages/officer/OfficerMapPage';
import { PriorityQueuePage } from '../pages/officer/PriorityQueuePage';
import { WorkOrdersPage } from '../pages/officer/WorkOrdersPage';
import { WorkOrderDetailPage } from '../pages/officer/WorkOrderDetailPage';
import { OfficerAnalyticsPage } from '../pages/officer/OfficerAnalyticsPage';

// Worker Pages
import { WorkerDashboard } from '../pages/worker/WorkerDashboard';
import { AssignedJobsPage } from '../pages/worker/AssignedJobsPage';
import { JobDetailPage } from '../pages/worker/JobDetailPage';
import { CompletedJobsPage } from '../pages/worker/CompletedJobsPage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { UsersPage } from '../pages/admin/UsersPage';
import { DepartmentsPage } from '../pages/admin/DepartmentsPage';
import { ModelsPage } from '../pages/admin/ModelsPage';
import { AIConfigPage } from '../pages/admin/AIConfigPage';
import { SystemHealthPage } from '../pages/admin/SystemHealthPage';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'how-it-works', element: <HowItWorksPage /> },
      { path: 'map', element: <PublicMapPage /> },
      { path: 'announcements', element: <AnnouncementsPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: '403', element: <AccessDeniedPage /> },
      { path: '404', element: <NotFoundPage /> },
    ],
  },

  // Citizen Portal Routes
  {
    path: '/citizen',
    element: <CitizenLayout />,
    children: [
      { index: true, element: <CitizenDashboard /> },
      { path: 'report', element: <ReportPotholePage /> },
      { path: 'reports', element: <MyReportsPage /> },
      { path: 'reports/:id', element: <ReportDetailPage /> },
      { path: 'nearby', element: <NearbyIssuesPage /> },
      { path: 'notifications', element: <CitizenNotificationsPage /> },
      { path: 'profile', element: <CitizenProfilePage /> },
    ],
  },

  // Municipal Officer Portal Routes
  {
    path: '/officer',
    element: <OfficerLayout />,
    children: [
      { index: true, element: <OfficerDashboard /> },
      { path: 'incidents', element: <IncidentQueuePage /> },
      { path: 'incidents/:id', element: <IncidentDetailPage /> },
      { path: 'map', element: <OfficerMapPage /> },
      { path: 'priority', element: <PriorityQueuePage /> },
      { path: 'work-orders', element: <WorkOrdersPage /> },
      { path: 'work-orders/:id', element: <WorkOrderDetailPage /> },
      { path: 'analytics', element: <OfficerAnalyticsPage /> },
    ],
  },

  // Field Worker Portal Routes
  {
    path: '/worker',
    element: <WorkerLayout />,
    children: [
      { index: true, element: <WorkerDashboard /> },
      { path: 'jobs', element: <AssignedJobsPage /> },
      { path: 'jobs/:id', element: <JobDetailPage /> },
      { path: 'completed', element: <CompletedJobsPage /> },
    ],
  },

  // System Admin Portal Routes
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'departments', element: <DepartmentsPage /> },
      { path: 'models', element: <ModelsPage /> },
      { path: 'ai', element: <AIConfigPage /> },
      { path: 'system', element: <SystemHealthPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
    ],
  },

  // Catch-all
  {
    path: '*',
    element: <PublicLayout />,
    children: [{ path: '*', element: <NotFoundPage /> }],
  },
]);
