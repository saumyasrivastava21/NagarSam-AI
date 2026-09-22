import { apiClient } from './client';
import { IModelsService } from '../contracts/models.contract';
import { ModelVersion, AIConfiguration } from '../../types';

export class ApiModelsService implements IModelsService {
  async getModelVersions(): Promise<ModelVersion[]> {
    const res = await apiClient.get<ModelVersion[]>('/models');
    return res.data;
  }

  async getAIConfiguration(): Promise<AIConfiguration> {
    const res = await apiClient.get<AIConfiguration>('/models/config');
    return res.data;
  }

  async updateAIConfiguration(config: Partial<AIConfiguration>): Promise<AIConfiguration> {
    const res = await apiClient.patch<AIConfiguration>('/models/config', config);
    return res.data;
  }
}
