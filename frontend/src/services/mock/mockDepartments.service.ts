import { IDepartmentsService } from '../contracts/departments.contract';
import { Department, Ward } from '../../types';
import { DEPARTMENTS_DATA, WARDS_DATA } from '../../constants';

export class MockDepartmentsService implements IDepartmentsService {
  async getDepartments(): Promise<Department[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return DEPARTMENTS_DATA;
  }

  async getDepartmentById(id: string): Promise<Department> {
    const dept = DEPARTMENTS_DATA.find((d) => d.id === id);
    if (!dept) throw new Error(`Department ${id} not found`);
    return dept;
  }

  async getWards(): Promise<Ward[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return WARDS_DATA;
  }

  async getWardById(id: string): Promise<Ward> {
    const ward = WARDS_DATA.find((w) => w.id === id);
    if (!ward) throw new Error(`Ward ${id} not found`);
    return ward;
  }
}

export const mockDepartmentsService = new MockDepartmentsService();
