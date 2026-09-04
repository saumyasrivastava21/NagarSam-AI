import { IModelsService } from '../contracts/models.contract';
import { ModelVersion, AIConfiguration } from '../../types';
import { mockStore } from './mockStore';

export class MockModelsService implements IModelsService {
  async getModelVersions(): Promise<ModelVersion[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockStore.getDB().models;
  }

  async getAIConfiguration(): Promise<AIConfiguration> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return mockStore.getDB().aiConfig;
  }

  async updateAIConfiguration(config: Partial<AIConfiguration>): Promise<AIConfiguration> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const current = mockStore.getDB().aiConfig;
    const updated = { ...current, ...config };
    mockStore.getDB().aiConfig = updated;
    mockStore.addAuditLog('UPDATE_AI_CONFIG', 'AIConfiguration', 'CONFIG-01', 'SUCCESS', 'Thresholds adjusted');
    return updated;
  }
}

export const mockModelsService = new MockModelsService();
