import { User, UserRole } from '../../types';
import { PaginatedResult } from './reports.contract';

export interface UserFilterParams {
  role?: UserRole;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IUsersService {
  getUsers(params?: UserFilterParams): Promise<PaginatedResult<User>>;
  getUserById(id: string): Promise<User>;
  updateUserStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<User>;
  updateUserRole(id: string, role: UserRole): Promise<User>;
}
