import { ModelVersion, AIConfiguration } from '../../types';

export interface IModelsService {
  getModelVersions(): Promise<ModelVersion[]>;
  getAIConfiguration(): Promise<AIConfiguration>;
  updateAIConfiguration(config: Partial<AIConfiguration>): Promise<AIConfiguration>;
}
