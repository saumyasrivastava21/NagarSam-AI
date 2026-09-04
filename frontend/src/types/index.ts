export type UserRole = 'CITIZEN' | 'OFFICER' | 'FIELD_WORKER' | 'ADMIN';

export type ReportStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'VERIFYING'
  | 'RESOLVED'
  | 'REJECTED';

export type WorkOrderStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'VERIFYING'
  | 'RESOLVED'
  | 'REOPENED'
  | 'CANCELLED';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AIJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ThemeMode = 'light' | 'dark' | 'system';

export type RoadDefectClass =
  | 'longitudinal crack'
  | 'transverse crack'
  | 'alligator crack'
  | 'other corruption'
  | 'pothole'
  | 'Pothole'
  | string;

export interface DefectClass {
  id: string;
  name: string;
  label: string;
  description?: string;
  severityHint?: Severity;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  departmentId?: string;
  wardId?: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  lastActiveAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headName: string;
  contactEmail: string;
  contactPhone: string;
  activeIncidentsCount: number;
  completedIncidentsCount: number;
}

export interface Ward {
  id: string;
  number: number;
  name: string;
  zone: string;
  corporatorName: string;
  corporatorPhone: string;
  activeHazardsCount: number;
  activePotholesCount?: number; // legacy alias
}

export interface BoundingBox {
  class: string;
  confidence: number;
  // Normalized or pixel coords: [x1, y1, x2, y2]
  bbox: [number, number, number, number];
}

export interface RoadDefectDetection {
  model_version: string;
  detected: boolean;
  confidence: number;
  primaryDefectClass?: string;
  detections: BoundingBox[];
  inference_time_ms: number;
  timestamp: string;
  pothole_detected?: boolean; // legacy alias
}

// Backward-compatible alias
export type PotholeDetection = RoadDefectDetection;

export interface TimelineEvent {
  id: string;
  status: string;
  title: string;
  description: string;
  actor: string;
  actorRole: UserRole;
  timestamp: string;
}

export interface Report {
  id: string; // e.g. NS-2026-001001
  citizenId: string;
  citizenName: string;
  citizenPhone?: string;
  imageUrl: string;
  issueType?: string; // e.g. "Longitudinal Crack", "Pothole", etc.
  primaryDefect?: string;
  description: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  address: string;
  wardId: string;
  wardName: string;
  status: ReportStatus;
  severity: Severity;
  priority: Priority;
  aiDetection?: RoadDefectDetection;
  aiPriorityReasoning?: {
    recommendation: Priority;
    confidenceScore: number; // 0-100
    factors: string[];
  };
  incidentId?: string;
  departmentId?: string;
  departmentName?: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
}

export interface Incident {
  id: string; // e.g. INC-2026-001
  reportId: string;
  title: string;
  issueType?: string;
  primaryDefect?: string;
  description: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address: string;
  wardId: string;
  wardName: string;
  departmentId: string;
  departmentName: string;
  status: ReportStatus;
  severity: Severity;
  priority: Priority;
  priorityScore: number; // 0-100
  aiDetection: RoadDefectDetection;
  aiFactors: string[];
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  workOrderId?: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
}

export interface Verification {
  id: string;
  workOrderId: string;
  issueType?: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  verificationScore: number; // e.g. 0.91
  status: 'PENDING' | 'AI_VERIFIED' | 'HUMAN_CONFIRMED' | 'REJECTED';
  notes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface WorkOrder {
  id: string; // e.g. WO-2026-001
  incidentId: string;
  reportId: string;
  title: string;
  issueType?: string;
  description: string;
  instructions: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  priority: Priority;
  status: WorkOrderStatus;
  assignedWorkerId: string;
  assignedWorkerName: string;
  assignedWorkerPhone?: string;
  departmentId: string;
  departmentName: string;
  beforeImageUrl: string;
  afterImageUrl?: string;
  verification?: Verification;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  timeline: TimelineEvent[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  read: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  resource: string;
  resourceId: string;
  result: 'SUCCESS' | 'FAILURE' | 'WARNING';
  ipAddress: string;
  details?: string;
}

export interface ModelVersion {
  id: string;
  name: string;
  version: string;
  framework: string;
  task: string;
  classesCount: number;
  classesList: string[];
  inputSize: string;
  mAP50: number;
  inferenceTimeMs: number;
  status: 'PRODUCTION_CANDIDATE' | 'EVALUATING' | 'ARCHIVED' | 'DEVELOPMENT_MOCK';
  parameters: string;
  createdAt: string;
}

export interface AIConfiguration {
  detectionConfidenceThreshold: number; // e.g. 0.70
  humanReviewThreshold: number; // e.g. 0.40
  verificationThreshold: number; // e.g. 0.70
  autoAssignmentEnabled: boolean;
  maxDailyJobsPerWorker: number;
}

export interface SystemServiceHealth {
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  uptimePercentage: number;
  queueLength: number;
  lastChecked: string;
}

export interface AnalyticsOverview {
  totalReports: number;
  openIncidents: number;
  criticalIncidents: number;
  inProgressJobs: number;
  resolvedIncidents: number;
  resolutionRatePercentage: number;
  averageResolutionHours: number;
  reportsToday: number;
  aiJobsToday: number;
  systemHealthSummary: string;
  defectDistribution?: { defect: string; count: number }[];
}
