import { IAuthService, LoginCredentials, RegisterPayload, AuthResponse } from '../contracts/auth.contract';
import { User, UserRole } from '../../types';
import { apiClient } from './client';

class AuthApiService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', {
      email: credentials.email,
      password: credentials.password || 'password123',
    });

    const data = response.data;
    const token = data.access_token;
    const refreshToken = data.refresh_token;

    // Store tokens in localStorage
    localStorage.setItem('nagarsam_jwt_token', token);
    if (refreshToken) {
      localStorage.setItem('nagarsam_refresh_token', refreshToken);
    }

    const user: User = {
      id: data.user.id,
      name: data.user.full_name,
      email: data.user.email,
      phone: data.user.phone,
      role: data.user.role as UserRole,
      status: data.user.is_active ? 'ACTIVE' : 'INACTIVE',
      createdAt: data.user.created_at,
      lastActiveAt: data.user.updated_at,
    };

    return {
      user,
      token,
      refreshToken,
    };
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', {
      full_name: payload.name,
      email: payload.email,
      password: payload.password || 'password123',
      role: 'CITIZEN',
      phone: payload.phone,
    });

    const data = response.data;
    const token = data.access_token;
    const refreshToken = data.refresh_token;

    localStorage.setItem('nagarsam_jwt_token', token);
    if (refreshToken) {
      localStorage.setItem('nagarsam_refresh_token', refreshToken);
    }

    const user: User = {
      id: data.user.id,
      name: data.user.full_name,
      email: data.user.email,
      phone: data.user.phone,
      role: data.user.role as UserRole,
      status: data.user.is_active ? 'ACTIVE' : 'INACTIVE',
      createdAt: data.user.created_at,
      lastActiveAt: data.user.updated_at,
    };

    return {
      user,
      token,
      refreshToken,
    };
  }

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('nagarsam_jwt_token');
    if (!token) return null;

    try {
      const response = await apiClient.get('/auth/me');
      const u = response.data;
      return {
        id: u.id,
        name: u.full_name,
        email: u.email,
        phone: u.phone,
        role: u.role as UserRole,
        status: u.is_active ? 'ACTIVE' : 'INACTIVE',
        createdAt: u.created_at,
        lastActiveAt: u.updated_at,
      };
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('nagarsam_jwt_token');
      localStorage.removeItem('nagarsam_refresh_token');
    }
  }

  async switchRole(role: UserRole): Promise<User> {
    const current = await this.getCurrentUser();
    if (current) {
      return { ...current, role };
    }
    return {
      id: 'USR-DEV',
      name: `${role.charAt(0) + role.slice(1).toLowerCase().replace('_', ' ')} User`,
      email: `${role.toLowerCase()}@nagarsam.gov.in`,
      role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
  }
}

export const apiAuthService = new AuthApiService();
