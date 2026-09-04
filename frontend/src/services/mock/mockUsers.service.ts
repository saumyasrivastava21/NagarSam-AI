import { IUsersService, UserFilterParams } from '../contracts/users.contract';
import { PaginatedResult } from '../contracts/reports.contract';
import { User, UserRole } from '../../types';
import { mockStore } from './mockStore';

export class MockUsersService implements IUsersService {
  async getUsers(params?: UserFilterParams): Promise<PaginatedResult<User>> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const db = mockStore.getDB();
    let list = [...db.users];

    if (params?.role) {
      list = list.filter((u) => u.role === params.role);
    }
    if (params?.status) {
      list = list.filter((u) => u.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q))
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const total = list.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getUserById(id: string): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const user = mockStore.getDB().users.find((u) => u.id === id);
    if (!user) throw new Error(`User ${id} not found`);
    return user;
  }

  async updateUserStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<User> {
    const user = await this.getUserById(id);
    user.status = status;
    mockStore.addAuditLog('UPDATE_USER_STATUS', 'User', id, 'SUCCESS', `Status set to ${status}`);
    return user;
  }

  async updateUserRole(id: string, role: UserRole): Promise<User> {
    const user = await this.getUserById(id);
    user.role = role;
    mockStore.addAuditLog('UPDATE_USER_ROLE', 'User', id, 'SUCCESS', `Role set to ${role}`);
    return user;
  }
}

export const mockUsersService = new MockUsersService();
