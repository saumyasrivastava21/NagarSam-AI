import {
  User,
  Report,
  Incident,
  WorkOrder,
  Notification,
  AuditLog,
  ModelVersion,
  AIConfiguration,
  SystemServiceHealth,
  ReportStatus,
  WorkOrderStatus,
  UserRole,
} from '../../types';
import {
  INITIAL_USERS,
  INITIAL_REPORTS,
  INITIAL_INCIDENTS,
  INITIAL_WORK_ORDERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_MODELS,
  INITIAL_AI_CONFIG,
  INITIAL_SYSTEM_HEALTH,
  INITIAL_AUDIT_LOGS,
} from './mockData';

const STORAGE_KEY = 'nagarsam_mock_db_v1';

export interface MockDatabase {
  users: User[];
  reports: Report[];
  incidents: Incident[];
  workOrders: WorkOrder[];
  notifications: Notification[];
  models: ModelVersion[];
  aiConfig: AIConfiguration;
  systemHealth: SystemServiceHealth[];
  auditLogs: AuditLog[];
  currentUser: User;
}

class MockStoreManager {
  private db: MockDatabase;
  private subscribers: Set<() => void> = new Set();

  constructor() {
    this.db = this.loadFromStorage();
  }

  private loadFromStorage(): MockDatabase {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch {
      console.warn('Could not read from localStorage, using initial seeds');
    }

    const initial: MockDatabase = {
      users: INITIAL_USERS,
      reports: INITIAL_REPORTS,
      incidents: INITIAL_INCIDENTS,
      workOrders: INITIAL_WORK_ORDERS,
      notifications: INITIAL_NOTIFICATIONS,
      models: INITIAL_MODELS,
      aiConfig: INITIAL_AI_CONFIG,
      systemHealth: INITIAL_SYSTEM_HEALTH,
      auditLogs: INITIAL_AUDIT_LOGS,
      currentUser: INITIAL_USERS[0], // Citizen by default
    };

    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(db: MockDatabase) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
    }
  }

  private notify() {
    this.saveToStorage(this.db);
    this.subscribers.forEach((cb) => cb());
  }

  public subscribe(cb: () => void) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  public resetToDefaults() {
    this.db = {
      users: INITIAL_USERS,
      reports: INITIAL_REPORTS,
      incidents: INITIAL_INCIDENTS,
      workOrders: INITIAL_WORK_ORDERS,
      notifications: INITIAL_NOTIFICATIONS,
      models: INITIAL_MODELS,
      aiConfig: INITIAL_AI_CONFIG,
      systemHealth: INITIAL_SYSTEM_HEALTH,
      auditLogs: INITIAL_AUDIT_LOGS,
      currentUser: INITIAL_USERS[0],
    };
    this.notify();
  }

  public getDB(): MockDatabase {
    return this.db;
  }

  // --- Auth operations ---
  public getCurrentUser(): User {
    return this.db.currentUser;
  }

  public setCurrentUser(user: User) {
    this.db.currentUser = user;
    this.notify();
  }

  public switchRole(role: UserRole): User {
    const user = this.db.users.find((u) => u.role === role) || {
      id: `USR-DEMO-${role}`,
      name: `Demo ${role}`,
      email: `${role.toLowerCase()}@example.com`,
      role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
    this.db.currentUser = user;
    this.notify();
    return user;
  }

  // --- Report operations ---
  public addReport(newReport: Report): Report {
    this.db.reports.unshift(newReport);
    
    const defectClass = newReport.issueType || newReport.primaryDefect || 'Road Defect';
    const capitalizedDefect = defectClass.charAt(0).toUpperCase() + defectClass.slice(1);

    // Auto-create corresponding Incident
    const newIncident: Incident = {
      id: `INC-2026-${(this.db.incidents.length + 1).toString().padStart(3, '0')}`,
      reportId: newReport.id,
      title: `${capitalizedDefect} at ${newReport.wardName} (${newReport.address.split(',')[0]})`,
      description: newReport.description,
      imageUrl: newReport.imageUrl,
      latitude: newReport.latitude,
      longitude: newReport.longitude,
      address: newReport.address,
      wardId: newReport.wardId,
      wardName: newReport.wardName,
      departmentId: newReport.departmentId || 'DEPT-01',
      departmentName: newReport.departmentName || 'Road Maintenance Division',
      status: newReport.status,
      severity: newReport.severity,
      priority: newReport.priority,
      priorityScore: newReport.aiPriorityReasoning?.confidenceScore || 85,
      issueType: defectClass,
      primaryDefect: defectClass,
      aiDetection: newReport.aiDetection!,
      aiFactors: newReport.aiPriorityReasoning?.factors || ['High-confidence AI defect boundary', 'Transit route'],
      createdAt: newReport.createdAt,
      updatedAt: newReport.updatedAt,
      timeline: newReport.timeline,
    };
    newReport.incidentId = newIncident.id;
    this.db.incidents.unshift(newIncident);

    // Notify Officer
    this.db.notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      userId: 'USR-02',
      title: `New ${capitalizedDefect} Report Logged`,
      message: `New road issue report ${newReport.id} at ${newReport.wardName} flagged for officer review.`,
      type: 'INFO',
      read: false,
      linkUrl: `/officer/incidents/${newIncident.id}`,
      createdAt: new Date().toISOString(),
    });

    // Audit log
    this.addAuditLog('SUBMIT_REPORT', 'Report', newReport.id, 'SUCCESS', `Citizen created report ${newReport.id}`);

    this.notify();
    return newReport;
  }

  public updateReportStatus(reportId: string, status: ReportStatus, note?: string): Report {
    const report = this.db.reports.find((r) => r.id === reportId);
    if (!report) throw new Error(`Report ${reportId} not found`);

    report.status = status;
    report.updatedAt = new Date().toISOString();
    report.timeline.push({
      id: `TL-${Date.now()}`,
      status,
      title: `Status updated to ${status}`,
      description: note || `Report status updated in operations center.`,
      actor: this.db.currentUser.name,
      actorRole: this.db.currentUser.role,
      timestamp: new Date().toISOString(),
    });

    // Sync corresponding incident if exists
    if (report.incidentId) {
      const inc = this.db.incidents.find((i) => i.id === report.incidentId);
      if (inc) {
        inc.status = status;
        inc.updatedAt = new Date().toISOString();
        inc.timeline = [...report.timeline];
      }
    }

    this.notify();
    return report;
  }

  // --- Incident operations ---
  public assignIncidentToWorker(incidentId: string, workerId: string, instructions?: string): Incident {
    const incident = this.db.incidents.find((i) => i.id === incidentId);
    if (!incident) throw new Error(`Incident ${incidentId} not found`);
    const worker = this.db.users.find((u) => u.id === workerId);
    if (!worker) throw new Error(`Worker ${workerId} not found`);

    incident.assignedWorkerId = worker.id;
    incident.assignedWorkerName = worker.name;
    incident.status = 'ASSIGNED';
    incident.updatedAt = new Date().toISOString();

    // Create Work Order
    const woId = `WO-2026-${(this.db.workOrders.length + 1).toString().padStart(3, '0')}`;
    const newWO: WorkOrder = {
      id: woId,
      incidentId: incident.id,
      reportId: incident.reportId,
      title: `Repair — ${incident.title}`,
      description: incident.description,
      instructions: instructions || 'Clear perimeter debris, fill crater with standard bitumin mix, compact and level.',
      locationAddress: incident.address,
      latitude: incident.latitude,
      longitude: incident.longitude,
      priority: incident.priority,
      status: 'ASSIGNED',
      assignedWorkerId: worker.id,
      assignedWorkerName: worker.name,
      assignedWorkerPhone: worker.phone,
      departmentId: incident.departmentId,
      departmentName: incident.departmentName,
      beforeImageUrl: incident.imageUrl,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `WTL-${Date.now()}`,
          status: 'ASSIGNED',
          title: 'Work Order Dispatched',
          description: `Assigned to ${worker.name} by ${this.db.currentUser.name}`,
          actor: this.db.currentUser.name,
          actorRole: this.db.currentUser.role,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    incident.workOrderId = woId;
    this.db.workOrders.unshift(newWO);

    // Sync report
    const report = this.db.reports.find((r) => r.id === incident.reportId);
    if (report) {
      report.status = 'ASSIGNED';
      report.updatedAt = new Date().toISOString();
      report.timeline.push({
        id: `TL-${Date.now()}`,
        status: 'ASSIGNED',
        title: 'Assigned to Field Unit',
        description: `Dispatched to field worker ${worker.name}.`,
        actor: this.db.currentUser.name,
        actorRole: this.db.currentUser.role,
        timestamp: new Date().toISOString(),
      });
    }

    // Notify Worker
    this.db.notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      userId: worker.id,
      title: 'New Job Assigned',
      message: `Work Order ${woId} assigned to you at ${incident.address}`,
      type: 'WARNING',
      read: false,
      linkUrl: `/worker/jobs/${woId}`,
      createdAt: new Date().toISOString(),
    });

    this.addAuditLog('ASSIGN_WORKER', 'Incident', incident.id, 'SUCCESS', `Assigned to worker ${worker.name}`);
    this.notify();
    return incident;
  }

  // --- Work Order operations ---
  public updateWorkOrderStatus(workOrderId: string, status: WorkOrderStatus, note?: string): WorkOrder {
    const wo = this.db.workOrders.find((w) => w.id === workOrderId);
    if (!wo) throw new Error(`WorkOrder ${workOrderId} not found`);

    wo.status = status;
    wo.updatedAt = new Date().toISOString();
    wo.timeline.push({
      id: `WTL-${Date.now()}`,
      status,
      title: `Job marked ${status}`,
      description: note || `Work order updated by ${this.db.currentUser.name}`,
      actor: this.db.currentUser.name,
      actorRole: this.db.currentUser.role,
      timestamp: new Date().toISOString(),
    });

    // Map work order status to report status
    let mappedReportStatus: ReportStatus = 'ASSIGNED';
    if (status === 'IN_PROGRESS' || status === 'ACCEPTED') mappedReportStatus = 'IN_PROGRESS';
    if (status === 'COMPLETED' || status === 'VERIFYING') mappedReportStatus = 'VERIFYING';
    if (status === 'RESOLVED') mappedReportStatus = 'RESOLVED';

    const incident = this.db.incidents.find((i) => i.id === wo.incidentId);
    if (incident) {
      incident.status = mappedReportStatus;
      incident.updatedAt = new Date().toISOString();
    }

    const report = this.db.reports.find((r) => r.id === wo.reportId);
    if (report) {
      report.status = mappedReportStatus;
      report.updatedAt = new Date().toISOString();
      report.timeline.push({
        id: `TL-${Date.now()}`,
        status: mappedReportStatus,
        title: `Work Order Status: ${status}`,
        description: note || `Field operations updated work order ${wo.id}`,
        actor: this.db.currentUser.name,
        actorRole: this.db.currentUser.role,
        timestamp: new Date().toISOString(),
      });
    }

    this.notify();
    return wo;
  }

  public completeWorkOrderWithVerification(
    workOrderId: string,
    afterImageUrl: string,
    notes?: string
  ): WorkOrder {
    const wo = this.db.workOrders.find((w) => w.id === workOrderId);
    if (!wo) throw new Error(`WorkOrder ${workOrderId} not found`);

    wo.afterImageUrl = afterImageUrl;
    wo.completedAt = new Date().toISOString();
    wo.status = 'COMPLETED';

    // Mock AI verification result (RDD2022-VerifyNet)
    const verificationScore = 0.93;
    wo.verification = {
      id: `VER-${Date.now()}`,
      workOrderId: wo.id,
      beforeImageUrl: wo.beforeImageUrl,
      afterImageUrl,
      verificationScore,
      status: 'AI_VERIFIED',
      notes: notes || 'AI Verification: Pothole cavity eradicated. Surface plane restored (93% score).',
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'VerifyNet-v1 Model',
    };

    wo.timeline.push({
      id: `WTL-${Date.now()}-1`,
      status: 'COMPLETED',
      title: 'Repair Completed & Photo Uploaded',
      description: 'Field worker submitted post-repair photograph.',
      actor: this.db.currentUser.name,
      actorRole: 'FIELD_WORKER',
      timestamp: new Date().toISOString(),
    });

    wo.timeline.push({
      id: `WTL-${Date.now()}-2`,
      status: 'VERIFYING',
      title: 'AI Verification Automated Score: 93%',
      description: 'AI model confirms repair adequacy. Awaiting final officer sign-off.',
      actor: 'VerifyNet-v1 Model',
      actorRole: 'ADMIN',
      timestamp: new Date().toISOString(),
    });

    // Notify Officer
    this.db.notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      userId: 'USR-02',
      title: 'Work Order Completed — Verification Ready',
      message: `Worker completed repair for ${wo.id}. AI verified at 93%. Ready for officer confirmation.`,
      type: 'SUCCESS',
      read: false,
      linkUrl: `/officer/work-orders/${wo.id}`,
      createdAt: new Date().toISOString(),
    });

    // Sync Incident & Report to VERIFYING
    const incident = this.db.incidents.find((i) => i.id === wo.incidentId);
    if (incident) {
      incident.status = 'VERIFYING';
      incident.updatedAt = new Date().toISOString();
    }
    const report = this.db.reports.find((r) => r.id === wo.reportId);
    if (report) {
      report.status = 'VERIFYING';
      report.updatedAt = new Date().toISOString();
      report.timeline.push({
        id: `TL-${Date.now()}`,
        status: 'VERIFYING',
        title: 'Repair Completed & AI Verified',
        description: 'Pothole patched and AI verification completed with 93% success score.',
        actor: 'VerifyNet-v1',
        actorRole: 'ADMIN',
        timestamp: new Date().toISOString(),
      });
    }

    this.addAuditLog('COMPLETE_WORK_ORDER', 'WorkOrder', wo.id, 'SUCCESS', 'After image uploaded & AI verified');
    this.notify();
    return wo;
  }

  public verifyAndCloseWorkOrder(workOrderId: string, approved: boolean, notes?: string): WorkOrder {
    const wo = this.db.workOrders.find((w) => w.id === workOrderId);
    if (!wo) throw new Error(`WorkOrder ${workOrderId} not found`);

    if (approved) {
      wo.status = 'RESOLVED';
      if (wo.verification) {
        wo.verification.status = 'HUMAN_CONFIRMED';
        wo.verification.verifiedBy = this.db.currentUser.name;
        wo.verification.notes = notes || 'Municipal Officer confirmed resolution.';
      }
      wo.timeline.push({
        id: `WTL-${Date.now()}`,
        status: 'RESOLVED',
        title: 'Verified & Closed by Officer',
        description: notes || 'Visual inspection verified. Case closed.',
        actor: this.db.currentUser.name,
        actorRole: 'OFFICER',
        timestamp: new Date().toISOString(),
      });

      // Close Incident & Report
      const incident = this.db.incidents.find((i) => i.id === wo.incidentId);
      if (incident) {
        incident.status = 'RESOLVED';
        incident.updatedAt = new Date().toISOString();
      }
      const report = this.db.reports.find((r) => r.id === wo.reportId);
      if (report) {
        report.status = 'RESOLVED';
        report.updatedAt = new Date().toISOString();
        report.timeline.push({
          id: `TL-${Date.now()}`,
          status: 'RESOLVED',
          title: 'Resolved & Closed',
          description: 'Official confirmation complete. Thank you for contributing to safer roads!',
          actor: this.db.currentUser.name,
          actorRole: 'OFFICER',
          timestamp: new Date().toISOString(),
        });

        // Notify Citizen
        this.db.notifications.unshift({
          id: `NOTIF-${Date.now()}`,
          userId: report.citizenId,
          title: 'Pothole Repaired & Resolved!',
          message: `Your report ${report.id} at ${report.address} has been fully repaired and closed.`,
          type: 'SUCCESS',
          read: false,
          linkUrl: `/citizen/reports/${report.id}`,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      wo.status = 'REOPENED';
      if (wo.verification) {
        wo.verification.status = 'REJECTED';
      }
      wo.timeline.push({
        id: `WTL-${Date.now()}`,
        status: 'REOPENED',
        title: 'Reopened for Rectification',
        description: notes || 'Officer requested rework.',
        actor: this.db.currentUser.name,
        actorRole: 'OFFICER',
        timestamp: new Date().toISOString(),
      });
    }

    this.notify();
    return wo;
  }

  // --- Audit Log operations ---
  public addAuditLog(
    action: string,
    resource: string,
    resourceId: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING',
    details?: string
  ): AuditLog {
    const user = this.db.currentUser;
    const log: AuditLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      resource,
      resourceId,
      result,
      ipAddress: '127.0.0.1 (Local Mock Session)',
      details,
    };
    this.db.auditLogs.unshift(log);
    this.notify();
    return log;
  }
}

export const mockStore = new MockStoreManager();
