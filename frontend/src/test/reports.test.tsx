import { describe, it, expect, beforeEach } from 'vitest';
import { mockReportsService } from '../services/mock/mockReports.service';
import { mockWorkOrdersService } from '../services/mock/mockWorkOrders.service';
import { mockIncidentsService } from '../services/mock/mockIncidents.service';
import { mockStore } from '../services/mock/mockStore';

describe('NagarSam AI — Road Infrastructure Intelligence Mock Tests', () => {
  beforeEach(() => {
    mockStore.resetToDefaults();
  });

  it('fetches seeded multi-defect reports from the mock database', async () => {
    const result = await mockReportsService.getReports({ limit: 10 });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThanOrEqual(30);
    expect(result.data[0]).toHaveProperty('id');
    expect(result.data[0]).toHaveProperty('aiDetection');
  });

  it('creates a new road issue report and synchronizes an incident and notification', async () => {
    const newReport = await mockReportsService.createReport({
      description: 'Hazardous longitudinal road crack on Ashok Marg',
      latitude: 26.85,
      longitude: 80.95,
      address: 'Ashok Marg, Hazratganj, Lucknow',
      wardId: 'WARD-01',
    });

    expect(newReport.id).toMatch(/^NS-2026-/);
    expect(newReport.status).toBe('SUBMITTED');
    expect(newReport.aiDetection?.confidence).toBeGreaterThan(0.8);

    // Verify incident was created
    const incident = mockStore.getDB().incidents.find((i) => i.reportId === newReport.id);
    expect(incident).toBeDefined();
    expect(incident?.title).toContain('Hazratganj');
  });

  it('executes full cross-role workflow: Citizen -> Officer -> Worker -> Verified Closure', async () => {
    // 1. Citizen creates report
    const report = await mockReportsService.createReport({
      description: 'Severe road cavity and transverse fissure near metro station',
      latitude: 26.86,
      longitude: 80.96,
      address: 'Metro Road, Indira Nagar, Lucknow',
      wardId: 'WARD-04',
    });

    const incident = mockStore.getDB().incidents.find((i) => i.reportId === report.id)!;
    expect(incident).toBeDefined();

    // 2. Officer assigns to field worker
    const updatedIncident = await mockIncidentsService.assignIncidentToWorker(
      incident.id,
      'USR-03',
      'Fill with high-grade premix asphalt and compact.'
    );
    expect(updatedIncident.status).toBe('ASSIGNED');
    expect(updatedIncident.workOrderId).toBeDefined();

    // 3. Worker accepts job & starts repair
    const woId = updatedIncident.workOrderId!;
    const acceptedWO = await mockWorkOrdersService.acceptWorkOrder(woId);
    expect(acceptedWO.status).toBe('ACCEPTED');

    const startedWO = await mockWorkOrdersService.startRepair(woId);
    expect(startedWO.status).toBe('IN_PROGRESS');

    // 4. Worker uploads after-image and completes job
    const completedWO = await mockWorkOrdersService.completeWorkOrder(
      woId,
      undefined,
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
      'Asphalt compacted seamlessly.'
    );
    expect(completedWO.status).toBe('COMPLETED');
    expect(completedWO.verification?.verificationScore).toBeGreaterThanOrEqual(0.9);

    // 5. Officer confirms resolution
    const resolvedWO = await mockWorkOrdersService.verifyWorkOrder(woId, true, 'Inspected and confirmed.');
    expect(resolvedWO.status).toBe('RESOLVED');

    // 6. Verify Citizen report is now RESOLVED
    const finalReport = await mockReportsService.getReportById(report.id);
    expect(finalReport.status).toBe('RESOLVED');
  });
});
