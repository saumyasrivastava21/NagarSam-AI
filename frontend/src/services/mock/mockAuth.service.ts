import { IAuthService, LoginCredentials, RegisterPayload, AuthResponse } from '../contracts/auth.contract';
import { User, UserRole } from '../../types';
import { mockStore } from './mockStore';
import { DEMO_USERS } from '../../constants';

export class MockAuthService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Artificial small delay for realistic UX loading state
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const db = mockStore.getDB();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
    );

    if (!user) {
      // Find if demo user
      const demo = DEMO_USERS.find((d) => d.email.toLowerCase() === credentials.email.toLowerCase());
      if (demo) {
        const newUser: User = {
          id: `USR-${Date.now()}`,
          name: demo.name,
          email: demo.email,
          phone: demo.phone,
          role: demo.role,
          avatarUrl: demo.avatar,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        };
        db.users.push(newUser);
        mockStore.setCurrentUser(newUser);
        return { user: newUser, token: 'mock-jwt-token-demo-xyz' };
      }
      throw new Error('Invalid email or password. Use one of the demo logins.');
    }

    mockStore.setCurrentUser(user);
    return { user, token: `mock-jwt-token-${user.id}` };
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newUser: User = {
      id: `USR-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone || '+91 98000 00000',
      role: 'CITIZEN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
    mockStore.getDB().users.push(newUser);
    mockStore.setCurrentUser(newUser);
    return { user: newUser, token: `mock-jwt-token-${newUser.id}` };
  }

  async getCurrentUser(): Promise<User | null> {
    return mockStore.getCurrentUser();
  }

  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  async switchRole(role: UserRole): Promise<User> {
    return mockStore.switchRole(role);
  }
}

export const mockAuthService = new MockAuthService();
