import { IAuthService } from './contracts/auth.contract';
import { IReportsService } from './contracts/reports.contract';
import { IIncidentsService } from './contracts/incidents.contract';
import { IWorkOrdersService } from './contracts/workOrders.contract';
import { INotificationsService } from './contracts/notifications.contract';
import { IAnalyticsService } from './contracts/analytics.contract';
import { IUsersService } from './contracts/users.contract';
import { IDepartmentsService } from './contracts/departments.contract';
import { IModelsService } from './contracts/models.contract';
import { ISystemService } from './contracts/system.contract';

// Real FastAPI implementations
import { apiReportsService } from './api/reports.api.service';
import { apiAnalyticsService } from './api/analytics.api.service';

// Mock implementations for secondary offline fallback / testing
import { mockAuthService } from './mock/mockAuth.service';
import { mockReportsService } from './mock/mockReports.service';
import { mockIncidentsService } from './mock/mockIncidents.service';
import { mockWorkOrdersService } from './mock/mockWorkOrders.service';
import { mockNotificationsService } from './mock/mockNotifications.service';
import { mockAnalyticsService } from './mock/mockAnalytics.service';
import { mockUsersService } from './mock/mockUsers.service';
import { mockDepartmentsService } from './mock/mockDepartments.service';
import { mockModelsService } from './mock/mockModels.service';
import { mockSystemService } from './mock/mockSystem.service';

const API_MODE = import.meta.env.VITE_API_MODE || 'production';

// In Phase 2: Live FastAPI endpoints are the primary authoritative service layer
export const authService: IAuthService = mockAuthService;
export const reportsService: IReportsService = API_MODE === 'mock' ? mockReportsService : apiReportsService;
export const incidentsService: IIncidentsService = mockIncidentsService;
export const workOrdersService: IWorkOrdersService = mockWorkOrdersService;
export const notificationsService: INotificationsService = mockNotificationsService;
export const analyticsService: IAnalyticsService = API_MODE === 'mock' ? mockAnalyticsService : apiAnalyticsService;
export const usersService: IUsersService = mockUsersService;
export const departmentsService: IDepartmentsService = mockDepartmentsService;
export const modelsService: IModelsService = mockModelsService;
export const systemService: ISystemService = mockSystemService;

export * from './contracts/auth.contract';
export * from './contracts/reports.contract';
export * from './contracts/incidents.contract';
export * from './contracts/workOrders.contract';
export * from './contracts/notifications.contract';
export * from './contracts/analytics.contract';
export * from './contracts/users.contract';
export * from './contracts/departments.contract';
export * from './contracts/models.contract';
export * from './contracts/system.contract';
