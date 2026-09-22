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
import { apiAuthService } from './api/auth.api.service';
import { apiReportsService } from './api/reports.api.service';
import { ApiAnalyticsService } from './api/analytics.api.service';
import { apiUsersService } from './api/users.api.service';
import { ApiIncidentsService } from './api/incidents.api.service';
import { ApiWorkOrdersService } from './api/workOrders.api.service';
import { ApiNotificationsService } from './api/notifications.api.service';
import { ApiDepartmentsService } from './api/departments.api.service';
import { ApiModelsService } from './api/models.api.service';
import { ApiSystemService } from './api/system.api.service';

// Mock implementations for offline fallback / isolated component testing
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

export const apiIncidentsService = new ApiIncidentsService();
export const apiWorkOrdersService = new ApiWorkOrdersService();
export const apiNotificationsService = new ApiNotificationsService();
export const apiAnalyticsService = new ApiAnalyticsService();
export const apiDepartmentsService = new ApiDepartmentsService();
export const apiModelsService = new ApiModelsService();
export const apiSystemService = new ApiSystemService();

export const authService: IAuthService = API_MODE === 'mock' ? mockAuthService : apiAuthService;
export const reportsService: IReportsService = API_MODE === 'mock' ? mockReportsService : apiReportsService;
export const incidentsService: IIncidentsService = API_MODE === 'mock' ? mockIncidentsService : apiIncidentsService;
export const workOrdersService: IWorkOrdersService = API_MODE === 'mock' ? mockWorkOrdersService : apiWorkOrdersService;
export const notificationsService: INotificationsService = API_MODE === 'mock' ? mockNotificationsService : apiNotificationsService;
export const analyticsService: IAnalyticsService = API_MODE === 'mock' ? mockAnalyticsService : apiAnalyticsService;
export const usersService: IUsersService = API_MODE === 'mock' ? mockUsersService : apiUsersService;
export const departmentsService: IDepartmentsService = API_MODE === 'mock' ? mockDepartmentsService : apiDepartmentsService;
export const modelsService: IModelsService = API_MODE === 'mock' ? mockModelsService : apiModelsService;
export const systemService: ISystemService = API_MODE === 'mock' ? mockSystemService : apiSystemService;

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
