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

// Mock implementations
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

const API_MODE = import.meta.env.VITE_API_MODE || 'mock';

// In Phase 1, we use the Mock Service Layer. In Phase 2, production FastAPI clients satisfying the same contracts are selected.
export const authService: IAuthService = API_MODE === 'mock' ? mockAuthService : mockAuthService;
export const reportsService: IReportsService = API_MODE === 'mock' ? mockReportsService : mockReportsService;
export const incidentsService: IIncidentsService = API_MODE === 'mock' ? mockIncidentsService : mockIncidentsService;
export const workOrdersService: IWorkOrdersService = API_MODE === 'mock' ? mockWorkOrdersService : mockWorkOrdersService;
export const notificationsService: INotificationsService = API_MODE === 'mock' ? mockNotificationsService : mockNotificationsService;
export const analyticsService: IAnalyticsService = API_MODE === 'mock' ? mockAnalyticsService : mockAnalyticsService;
export const usersService: IUsersService = API_MODE === 'mock' ? mockUsersService : mockUsersService;
export const departmentsService: IDepartmentsService = API_MODE === 'mock' ? mockDepartmentsService : mockDepartmentsService;
export const modelsService: IModelsService = API_MODE === 'mock' ? mockModelsService : mockModelsService;
export const systemService: ISystemService = API_MODE === 'mock' ? mockSystemService : mockSystemService;

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
