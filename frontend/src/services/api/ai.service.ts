import { RoadDefectDetection, BoundingBox } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface DetectOptions {
  file?: File;
  image_url?: string;
  image_base64?: string;
  confidence_threshold?: number;
}

export interface BackendDetectionItem {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number];
  model_source?: string;
}

export interface BackendDetectionResponse {
  request_id?: string;
  status: string;
  source?: string;
  image: {
    width: number;
    height: number;
  };
  inference_time_ms: number;
  models?: {
    pothole?: { name: string; version: string; status: string; error?: string; classes_count?: number };
    general?: { name: string; version: string; status: string; error?: string; classes_count?: number };
  };
  detections: BackendDetectionItem[];
  primary_defect?: string;
  primary_confidence?: number;
}

export class AIService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async detectDefects(options: DetectOptions): Promise<RoadDefectDetection> {
    const formData = new FormData();
    if (options.file) {
      formData.append('file', options.file);
    }
    if (options.image_url) {
      formData.append('image_url', options.image_url);
    }
    if (options.image_base64) {
      formData.append('image_base64', options.image_base64);
    }
    if (options.confidence_threshold !== undefined) {
      formData.append('confidence_threshold', options.confidence_threshold.toString());
    }

    try {
      const response = await fetch(`${this.baseUrl}/ai/detect`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Inference API error (${response.status}): ${errorText || response.statusText}`);
      }

      const data: BackendDetectionResponse = await response.json();

      const detections: BoundingBox[] = (data.detections || []).map((d) => ({
        class: d.class_name,
        class_id: d.class_id,
        class_name: d.class_name,
        confidence: d.confidence,
        bbox: d.bbox,
        model_source: d.model_source || (d.class_name.toLowerCase().includes('pothole') ? 'pothole' : 'general'),
      }));

      const topDetection = detections.length > 0
        ? [...detections].sort((a, b) => b.confidence - a.confidence)[0]
        : null;

      const primaryClass = topDetection ? topDetection.class : undefined;
      const overallConfidence = topDetection ? topDetection.confidence : 0;

      return {
        request_id: data.request_id,
        status: data.status || 'completed',
        model_name: 'NagarSam Dual-Model Pipeline (Pothole + General Defect)',
        model_version: 'DualYOLO-v1',
        source: 'live',
        detected: detections.length > 0,
        confidence: overallConfidence,
        primaryDefectClass: primaryClass,
        primary_defect: data.primary_defect || primaryClass,
        primary_confidence: data.primary_confidence || overallConfidence,
        models: data.models,
        detections,
        inference_time_ms: data.inference_time_ms,
        timestamp: new Date().toISOString(),
        image_width: data.image?.width,
        image_height: data.image?.height,
        isMock: false,
        pothole_detected: detections.some((d) => d.class.toLowerCase().includes('pothole')),
      };
    } catch (err: any) {
      console.error('[AIService] Failed to run defect inference:', err);
      throw new Error('AI analysis is currently unavailable. Please retry.');
    }
  }

  async getModelInfo() {
    const response = await fetch(`${this.baseUrl}/ai/model-info`);
    if (!response.ok) {
      throw new Error(`Model info error: ${response.statusText}`);
    }
    return response.json();
  }
}

export const aiService = new AIService();
