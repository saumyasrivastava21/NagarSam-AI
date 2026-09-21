import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LOCKED_CLASS_MAPPING, LOCKED_DISPLAY_LABELS, formatDefectClass } from '../utils/defectClasses';
import { DetectionOverlay } from '../components/ui/DetectionOverlay';
import { RoadDefectDetection } from '../types';

describe('NagarSam AI — Locked 5-Class Mapping & Detection Regression Tests', () => {
  // Test 1-5: Exact class ID mappings
  it('1. Class ID 0 maps to longitudinal crack', () => {
    expect(LOCKED_CLASS_MAPPING[0]).toBe('longitudinal crack');
    expect(LOCKED_DISPLAY_LABELS[0]).toBe('Longitudinal Crack');
    expect(formatDefectClass(0)).toBe('Longitudinal Crack');
    expect(formatDefectClass('longitudinal crack')).toBe('Longitudinal Crack');
  });

  it('2. Class ID 1 maps to transverse crack', () => {
    expect(LOCKED_CLASS_MAPPING[1]).toBe('transverse crack');
    expect(LOCKED_DISPLAY_LABELS[1]).toBe('Transverse Crack');
    expect(formatDefectClass(1)).toBe('Transverse Crack');
    expect(formatDefectClass('transverse crack')).toBe('Transverse Crack');
  });

  it('3. Class ID 2 maps to alligator crack', () => {
    expect(LOCKED_CLASS_MAPPING[2]).toBe('alligator crack');
    expect(LOCKED_DISPLAY_LABELS[2]).toBe('Alligator Crack');
    expect(formatDefectClass(2)).toBe('Alligator Crack');
    expect(formatDefectClass('alligator crack')).toBe('Alligator Crack');
  });

  it('4. Class ID 3 maps to other corruption', () => {
    expect(LOCKED_CLASS_MAPPING[3]).toBe('other corruption');
    expect(LOCKED_DISPLAY_LABELS[3]).toBe('Other Corruption');
    expect(formatDefectClass(3)).toBe('Other Corruption');
    expect(formatDefectClass('other corruption')).toBe('Other Corruption');
  });

  it('5. Class ID 4 maps to Pothole', () => {
    expect(LOCKED_CLASS_MAPPING[4]).toBe('pothole');
    expect(LOCKED_DISPLAY_LABELS[4]).toBe('Pothole');
    expect(formatDefectClass(4)).toBe('Pothole');
    expect(formatDefectClass('pothole')).toBe('Pothole');
    expect(formatDefectClass('Pothole')).toBe('Pothole');
  });

  it('6. API class names match checkpoint names', () => {
    const checkpointNames = {
      0: 'longitudinal crack',
      1: 'transverse crack',
      2: 'alligator crack',
      3: 'other corruption',
      4: 'pothole',
    };
    Object.entries(checkpointNames).forEach(([id, name]) => {
      expect(LOCKED_CLASS_MAPPING[Number(id)]).toBe(name);
    });
  });

  it('7. Frontend renders the exact API class name without remapping to Pothole (Bug A Fix)', () => {
    const mockDetection: RoadDefectDetection = {
      model_version: 'RDD2022-YOLO11m-v1',
      source: 'live',
      detected: true,
      confidence: 0.91,
      primaryDefectClass: 'transverse crack',
      primary_defect: 'transverse crack',
      detections: [
        {
          class: 'transverse crack',
          class_id: 1,
          class_name: 'transverse crack',
          confidence: 0.91,
          bbox: [100, 200, 500, 300],
        },
      ],
      inference_time_ms: 68,
      timestamp: new Date().toISOString(),
      image_width: 800,
      image_height: 600,
    };

    render(
      <DetectionOverlay
        imageUrl="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7"
        detection={mockDetection}
      />
    );

    // Must render Transverse Crack, NOT Pothole
    expect(screen.getByText('Transverse Crack')).toBeDefined();
    expect(screen.queryByText('Pothole')).toBeNull();
  });

  it('8. Multiple detections render independently with separate classes (Bug D Fix)', () => {
    const mockMultiDetection: RoadDefectDetection = {
      model_version: 'RDD2022-YOLO11m-v1',
      source: 'live',
      detected: true,
      confidence: 0.94,
      primary_defect: 'longitudinal crack',
      detections: [
        {
          class: 'longitudinal crack',
          class_id: 0,
          confidence: 0.94,
          bbox: [50, 100, 200, 400],
        },
        {
          class: 'pothole',
          class_id: 4,
          confidence: 0.88,
          bbox: [400, 300, 600, 500],
        },
      ],
      inference_time_ms: 72,
      timestamp: new Date().toISOString(),
      image_width: 800,
      image_height: 600,
    };

    render(
      <DetectionOverlay
        imageUrl="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7"
        detection={mockMultiDetection}
      />
    );

    expect(screen.getByText('Longitudinal Crack')).toBeDefined();
    expect(screen.getByText('Pothole')).toBeDefined();
    expect(screen.getByText('2 Defects Found')).toBeDefined();
  });

  it('9. Empty detections show clean empty state without fallback boxes', () => {
    const emptyDetection: RoadDefectDetection = {
      model_version: 'RDD2022-YOLO11m-v1',
      source: 'live',
      detected: false,
      confidence: 0,
      detections: [],
      inference_time_ms: 45,
      timestamp: new Date().toISOString(),
      image_width: 800,
      image_height: 600,
    };

    render(
      <DetectionOverlay
        imageUrl="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7"
        detection={emptyDetection}
      />
    );

    expect(screen.queryByText('Pothole')).toBeNull();
    expect(screen.queryByText('Longitudinal Crack')).toBeNull();
  });

  it('10. Production error state displays retry notice without fake fallback detections', () => {
    const errorDetection: RoadDefectDetection = {
      model_version: 'RDD2022-YOLO11m-v1',
      source: 'live',
      detected: false,
      confidence: 0,
      detections: [],
      inference_time_ms: 0,
      timestamp: new Date().toISOString(),
      error: 'AI analysis is currently unavailable. Please retry.',
    };

    render(
      <DetectionOverlay
        imageUrl="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7"
        detection={errorDetection}
      />
    );

    expect(screen.getByText('AI analysis is currently unavailable. Please retry.')).toBeDefined();
    expect(screen.queryByText('Pothole')).toBeNull();
  });

  it('11. Distinguishes LIVE INFERENCE badge and model indicators', () => {
    const liveDetection: RoadDefectDetection = {
      model_version: 'pothole-v1+road-defect-v1',
      source: 'live',
      detected: true,
      confidence: 0.92,
      detections: [
        {
          class: 'longitudinal crack',
          class_id: 0,
          confidence: 0.92,
          bbox: [100, 100, 400, 400],
          model_source: 'general',
        },
      ],
      inference_time_ms: 78,
      timestamp: new Date().toISOString(),
    };

    render(
      <DetectionOverlay
        imageUrl="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7"
        detection={liveDetection}
      />
    );

    expect(screen.getByText('LIVE')).toBeDefined();
    expect(screen.getByText('Dual YOLO (Pothole + General Defect)')).toBeDefined();
  });

  it('12. Bounding boxes align within 0-100% of image dimensions', () => {
    const detectionWithBbox: RoadDefectDetection = {
      model_version: 'RDD2022-YOLO11m-v1',
      source: 'live',
      detected: true,
      confidence: 0.85,
      detections: [
        {
          class: 'alligator crack',
          class_id: 2,
          confidence: 0.85,
          bbox: [200, 150, 600, 450],
        },
      ],
      inference_time_ms: 60,
      timestamp: new Date().toISOString(),
      image_width: 800,
      image_height: 600,
    };

    const { container } = render(
      <DetectionOverlay
        imageUrl="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7"
        detection={detectionWithBbox}
      />
    );

    const bboxElement = container.querySelector('.animate-bbox') as HTMLElement;
    expect(bboxElement).toBeDefined();
    expect(bboxElement?.style.left).toBe('25%');
    expect(bboxElement?.style.top).toBe('25%');
    expect(bboxElement?.style.width).toBe('50%');
    expect(bboxElement?.style.height).toBe('50%');
  });

  // Test A: Category Independence (Citizen selects Longitudinal Crack, Model detects Pothole)
  it('13. Test A — Category Independence: Citizen observation does NOT override or influence AI detections', () => {
    const citizenSelectedCategory = 'longitudinal crack';
    const modelDetectedOutput: RoadDefectDetection = {
      model_version: 'RDD2022-YOLO11m-v1',
      source: 'live',
      detected: true,
      confidence: 0.87,
      primaryDefectClass: 'pothole',
      primary_defect: 'pothole',
      primary_confidence: 0.87,
      detections: [
        {
          class: 'pothole',
          class_id: 4,
          class_name: 'pothole',
          confidence: 0.87,
          bbox: [150, 200, 550, 600],
        },
      ],
      inference_time_ms: 82,
      timestamp: new Date().toISOString(),
      image_width: 800,
      image_height: 600,
    };

    render(
      <div>
        <div data-testid="citizen-observation">Your reported issue: {formatDefectClass(citizenSelectedCategory)}</div>
        <DetectionOverlay
          imageUrl="https://images.unsplash.com/photo-1578983427937-26078ee3d9d3"
          detection={modelDetectedOutput}
        />
      </div>
    );

    // Citizen observation is preserved as Longitudinal Crack
    expect(screen.getByTestId('citizen-observation').textContent).toContain('Longitudinal Crack');
    // AI overlay renders Pothole from the model output
    expect(screen.getByText('Pothole')).toBeDefined();
  });
});

