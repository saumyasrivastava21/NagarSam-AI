import { apiClient } from './client';
import { IDepartmentsService } from '../contracts/departments.contract';
import { Department, Ward } from '../../types';

export class ApiDepartmentsService implements IDepartmentsService {
  async getDepartments(): Promise<Department[]> {
    const res = await apiClient.get<Department[]>('/departments');
    return res.data;
  }

  async getDepartmentById(id: string): Promise<Department> {
    const res = await apiClient.get<Department>(`/departments/${id}`);
    return res.data;
  }

  async getWards(): Promise<Ward[]> {
    const res = await apiClient.get<Ward[]>('/wards');
    return res.data;
  }

  async getWardById(id: string): Promise<Ward> {
    const res = await apiClient.get<Ward>(`/wards/${id}`);
    return res.data;
  }
}
