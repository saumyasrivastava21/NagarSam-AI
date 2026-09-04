import { Department, Ward } from '../../types';

export interface IDepartmentsService {
  getDepartments(): Promise<Department[]>;
  getDepartmentById(id: string): Promise<Department>;
  getWards(): Promise<Ward[]>;
  getWardById(id: string): Promise<Ward>;
}
