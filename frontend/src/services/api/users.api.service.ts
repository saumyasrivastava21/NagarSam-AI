import { IUsersService, UserFilterParams } from '../contracts/users.contract';
import { PaginatedResult } from '../contracts/reports.contract';
import { User, UserRole } from '../../types';
import { apiClient } from './client';

class UsersApiService implements IUsersService {
  async getUsers(params?: UserFilterParams): Promise<PaginatedResult<User>> {
    const response = await apiClient.get('/users', { params });
    const rawList = Array.isArray(response.data) ? response.data : response.data.data || [];
    const users: User[] = rawList.map((u: any) => ({
      id: u.id,
      name: u.full_name || u.name,
      email: u.email,
      phone: u.phone,
      role: u.role as UserRole,
      status: u.is_active ? 'ACTIVE' : 'INACTIVE',
      createdAt: u.created_at,
      lastActiveAt: u.updated_at,
    }));

    return {
      data: users,
      total: users.length,
      page: params?.page || 1,
      limit: params?.limit || 20,
      totalPages: 1,
    };
  }

  async getUserById(id: string): Promise<User> {
    const users = await this.getUsers();
    const user = users.data.find((u) => u.id === id);
    if (!user) {
      throw new Error(`User ${id} not found.`);
    }
    return user;
  }

  async updateUserStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<User> {
    const user = await this.getUserById(id);
    return { ...user, status };
  }

  async updateUserRole(id: string, role: UserRole): Promise<User> {
    const user = await this.getUserById(id);
    return { ...user, role };
  }
}

export const apiUsersService = new UsersApiService();
