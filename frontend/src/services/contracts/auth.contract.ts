import { User, UserRole } from '../../types';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(payload: RegisterPayload): Promise<AuthResponse>;
  getCurrentUser(): Promise<User | null>;
  logout(): Promise<void>;
  switchRole(role: UserRole): Promise<User>;
}
