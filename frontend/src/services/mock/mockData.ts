import {
  User,
  UserRole,
  Report,
  Incident,
  WorkOrder,
  Notification,
  AuditLog,
  ModelVersion,
  AIConfiguration,
  SystemServiceHealth,
} from '../../types';
import { WARDS_DATA, DEPARTMENTS_DATA } from '../../constants';

// Curated realistic road / defect images
const SAMPLE_ROAD_IMAGES = [
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80', // Pothole / Crater
  'https://images.unsplash.com/photo-1578983427937-26078ee3d9d3?w=800&auto=format&fit=crop&q=80', // Longitudinal crack
  'https://images.unsplash.com/photo-1584463699039-38c6d71b5634?w=800&auto=format&fit=crop&q=80', // Alligator crack
  'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80', // Transverse crack
  'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80', // Road surface corruption
  'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80', // Edge deformation
];

const SAMPLE_REPAIRED_IMAGES = [
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
];

// 20 Deterministic Users
export const INITIAL_USERS: User[] = [
  {
    id: 'USR-01',
    name: 'Aarav Sharma',
    email: 'citizen@example.com',
    phone: '+91 98765 43210',
    role: 'CITIZEN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: '2026-01-15T10:00:00Z',
    lastActiveAt: '2026-09-04T08:30:00Z',
  },
  {
    id: 'USR-02',
    name: 'Vikramaditya Rao',
    email: 'officer@example.com',
    phone: '+91 98123 45678',
    role: 'OFFICER',
    departmentId: 'DEPT-01',
    wardId: 'WARD-01',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: '2026-01-10T10:00:00Z',
    lastActiveAt: '2026-09-04T08:45:00Z',
  },
  {
    id: 'USR-03',
    name: 'Rameshwar Yadav',
    email: 'worker@example.com',
    phone: '+91 97234 56789',
    role: 'FIELD_WORKER',
    departmentId: 'DEPT-01',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: '2026-02-01T10:00:00Z',
    lastActiveAt: '2026-09-04T07:15:00Z',
  },
  {
    id: 'USR-04',
    name: 'Dr. Priya Nambiar',
    email: 'admin@example.com',
    phone: '+91 99345 67890',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: '2026-01-01T10:00:00Z',
    lastActiveAt: '2026-09-04T09:00:00Z',
  },
  {
    id: 'USR-05',
    name: 'Rohit Mehrotra',
    email: 'rohit.m@example.com',
    phone: '+91 98456 12345',
    role: 'CITIZEN',
    status: 'ACTIVE',
    createdAt: '2026-02-10T10:00:00Z',
    lastActiveAt: '2026-09-03T18:00:00Z',
  },
  {
    id: 'USR-06',
    name: 'Er. Rajesh Tripathi',
    email: 'rajesh.pwd@example.com',
    phone: '+91 94150 99887',
    role: 'OFFICER',
    departmentId: 'DEPT-02',
    status: 'ACTIVE',
    createdAt: '2026-01-20T10:00:00Z',
    lastActiveAt: '2026-09-04T06:00:00Z',
  },
  {
    id: 'USR-07',
    name: 'Sunil Paswan',
    email: 'sunil.p@example.com',
    phone: '+91 93120 44556',
    role: 'FIELD_WORKER',
    departmentId: 'DEPT-02',
    status: 'ACTIVE',
    createdAt: '2026-02-15T10:00:00Z',
    lastActiveAt: '2026-09-03T20:00:00Z',
  },
  {
    id: 'USR-08',
    name: 'Ananya Gupta',
    email: 'ananya.g@example.com',
    phone: '+91 97788 11223',
    role: 'CITIZEN',
    status: 'ACTIVE',
    createdAt: '2026-03-01T10:00:00Z',
    lastActiveAt: '2026-09-02T15:30:00Z',
  },
  {
    id: 'USR-09',
    name: 'Er. Mamta Rawat',
    email: 'mamta.sid@example.com',
    phone: '+91 94150 33445',
    role: 'OFFICER',
    departmentId: 'DEPT-03',
    status: 'ACTIVE',
    createdAt: '2026-02-05T10:00:00Z',
    lastActiveAt: '2026-09-04T05:00:00Z',
  },
  {
    id: 'USR-10',
    name: 'Mohammad Farooq',
    email: 'farooq.w@example.com',
    phone: '+91 96543 22110',
    role: 'FIELD_WORKER',
    departmentId: 'DEPT-03',
    status: 'ACTIVE',
    createdAt: '2026-03-10T10:00:00Z',
    lastActiveAt: '2026-09-04T01:10:00Z',
  },
  // Additional 10 users for 20 total
  ...Array.from({ length: 10 }).map((_, i) => ({
    id: `USR-${11 + i}`,
    name: `Civic User ${11 + i}`,
    email: `citizen${11 + i}@example.com`,
    phone: `+91 98100 000${10 + i}`,
    role: (i % 3 === 0 ? 'FIELD_WORKER' : 'CITIZEN') as UserRole,
    departmentId: i % 3 === 0 ? 'DEPT-01' : undefined,
    status: 'ACTIVE' as const,
    createdAt: '2026-04-01T10:00:00Z',
    lastActiveAt: '2026-09-03T10:00:00Z',
  })),
];

// Helper to pick defect type
const DEFECT_TEMPLATES = [
  {
    type: 'Longitudinal Crack',
    desc: 'Severe longitudinal crack along the wheel path with early structural widening.',
    factors: ['Longitudinal fracture pattern (>2.4m linear span)', 'High-speed transit corridor', 'Base course joint fatigue'],
    detections: [
      { class: 'longitudinal crack', confidence: 0.94, bbox: [120, 200, 500, 600] as [number, number, number, number] },
    ],
  },
  {
    type: 'Pothole',
    desc: 'Deep hazardous cavity near intersection causing sharp vehicle swerving.',
    factors: ['Pothole cavity area (>0.4 sq.m)', 'Severe water-logging vulnerability', 'Arterial bus transit route'],
    detections: [
      { class: 'pothole', confidence: 0.96, bbox: [140, 180, 530, 610] as [number, number, number, number] },
    ],
  },
  {
    type: 'Alligator Crack',
    desc: 'Interconnected fatigue alligator cracking indicating sub-base moisture saturation.',
    factors: ['High-density spiderweb cracking network', 'Heavy commercial freight load zone', 'Risk of rapid surface raveling'],
    detections: [
      { class: 'alligator crack', confidence: 0.91, bbox: [100, 150, 600, 650] as [number, number, number, number] },
      { class: 'pothole', confidence: 0.85, bbox: [580, 220, 780, 540] as [number, number, number, number] },
    ],
  },
  {
    type: 'Transverse Crack',
    desc: 'Perpendicular transverse road fracture spanning across lanes.',
    factors: ['Thermal contraction fracture', 'Pavement joint degradation', 'Minor edge displacement'],
    detections: [
      { class: 'transverse crack', confidence: 0.89, bbox: [150, 300, 700, 500] as [number, number, number, number] },
    ],
  },
  {
    type: 'Other Corruption',
    desc: 'Surface deformation, depression, and asphalt stripping around utility cover.',
    factors: ['Sub-surface settlement around utility trench', 'Asphalt binder oxidation', 'Corroborated by 2 citizen reports'],
    detections: [
      { class: 'other corruption', confidence: 0.88, bbox: [200, 200, 650, 580] as [number, number, number, number] },
    ],
  },
];

// 30 Realistic Lucknow Reports across multiple defect classes
export const INITIAL_REPORTS: Report[] = Array.from({ length: 30 }).map((_, i) => {
  const num = i + 1;
  const idStr = `NS-2026-0010${num < 10 ? '0' + num : num}`;
  const ward = WARDS_DATA[i % WARDS_DATA.length];
  const template = DEFECT_TEMPLATES[i % DEFECT_TEMPLATES.length];
  const dept = DEPARTMENTS_DATA[i % DEPARTMENTS_DATA.length];

  const statuses: Array<'SUBMITTED' | 'UNDER_REVIEW' | 'CONFIRMED' | 'ASSIGNED' | 'IN_PROGRESS' | 'VERIFYING' | 'RESOLVED'> = [
    'IN_PROGRESS',
    'CONFIRMED',
    'RESOLVED',
    'ASSIGNED',
    'UNDER_REVIEW',
    'SUBMITTED',
    'VERIFYING',
  ];
  const st = statuses[i % statuses.length];

  const severities: Array<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = ['CRITICAL', 'HIGH', 'HIGH', 'MEDIUM', 'LOW'];
  const sev = severities[i % severities.length];

  const prios: Array<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const pri = prios[i % prios.length];

  const lat = 26.8467 + Math.sin(num) * 0.045;
  const lng = 80.9462 + Math.cos(num) * 0.045;

  return {
    id: idStr,
    citizenId: i % 4 === 0 ? 'USR-01' : `USR-${5 + (i % 5)}`,
    citizenName: i % 4 === 0 ? 'Aarav Sharma' : `Civic Citizen ${num}`,
    citizenPhone: '+91 98765 43210',
    imageUrl: SAMPLE_ROAD_IMAGES[i % SAMPLE_ROAD_IMAGES.length],
    issueType: template.type,
    primaryDefect: template.type,
    description: `${template.desc} Located near ${ward.name}.`,
    landmark: `Near ${ward.name} Junction / Milestone ${num}`,
    latitude: lat,
    longitude: lng,
    address: `${ward.name}, Lucknow, UP`,
    wardId: ward.id,
    wardName: ward.name,
    status: st,
    severity: sev,
    priority: pri,
    departmentId: dept.id,
    departmentName: dept.name,
    incidentId: `INC-2026-00${num}`,
    aiDetection: {
      model_version: 'rdd2022-v1',
      detected: true,
      confidence: 0.88 + ((num * 7) % 10) * 0.01,
      primaryDefectClass: template.type,
      detections: template.detections,
      inference_time_ms: 70 + (num % 25),
      timestamp: '2026-09-03T08:30:15Z',
      pothole_detected: template.type === 'Pothole',
    },
    aiPriorityReasoning: {
      recommendation: pri,
      confidenceScore: 80 + (num % 18),
      factors: template.factors,
    },
    createdAt: `2026-09-0${Math.min(4, Math.max(1, (num % 4) + 1))}T08:30:00Z`,
    updatedAt: '2026-09-04T02:00:00Z',
    timeline: [
      { id: `TL-${num}-1`, status: 'SUBMITTED', title: 'Road Issue Reported', description: `Citizen submitted photo of ${template.type}.`, actor: 'Aarav Sharma', actorRole: 'CITIZEN', timestamp: '2026-09-03T08:30:00Z' },
      { id: `TL-${num}-2`, status: 'UNDER_REVIEW', title: 'AI Defect Analysis', description: `RDD2022 identified ${template.type} with high confidence.`, actor: 'RDD2022-v1 Model', actorRole: 'ADMIN', timestamp: '2026-09-03T08:30:15Z' },
      ...(st !== 'SUBMITTED' && st !== 'UNDER_REVIEW'
        ? [{ id: `TL-${num}-3`, status: 'CONFIRMED', title: 'Incident Validated', description: `Priority confirmed as ${pri}.`, actor: 'Vikramaditya Rao', actorRole: 'OFFICER' as const, timestamp: '2026-09-03T09:10:00Z' }]
        : []),
      ...(st === 'ASSIGNED' || st === 'IN_PROGRESS' || st === 'VERIFYING' || st === 'RESOLVED'
        ? [{ id: `TL-${num}-4`, status: 'ASSIGNED', title: 'Assigned to Field Unit', description: `Work order dispatched to field unit.`, actor: 'Vikramaditya Rao', actorRole: 'OFFICER' as const, timestamp: '2026-09-03T10:00:00Z' }]
        : []),
      ...(st === 'IN_PROGRESS' || st === 'VERIFYING' || st === 'RESOLVED'
        ? [{ id: `TL-${num}-5`, status: 'IN_PROGRESS', title: 'Repair In Progress', description: `Field crew commenced pavement treatment.`, actor: 'Rameshwar Yadav', actorRole: 'FIELD_WORKER' as const, timestamp: '2026-09-04T02:00:00Z' }]
        : []),
      ...(st === 'RESOLVED'
        ? [{ id: `TL-${num}-6`, status: 'RESOLVED', title: 'Verified & Closed', description: `AI post-repair score passed and officer approved.`, actor: 'Vikramaditya Rao', actorRole: 'OFFICER' as const, timestamp: '2026-09-04T06:00:00Z' }]
        : []),
    ],
  };
});

// 30 Matching Incidents
export const INITIAL_INCIDENTS: Incident[] = INITIAL_REPORTS.map((r, i) => ({
  id: `INC-2026-00${i + 1}`,
  reportId: r.id,
  title: `${r.issueType || 'Road Defect'} — ${r.wardName}`,
  issueType: r.issueType,
  primaryDefect: r.primaryDefect,
  description: r.description,
  imageUrl: r.imageUrl,
  latitude: r.latitude,
  longitude: r.longitude,
  address: r.address,
  wardId: r.wardId,
  wardName: r.wardName,
  departmentId: r.departmentId || 'DEPT-01',
  departmentName: r.departmentName || 'Road Maintenance Division',
  status: r.status,
  severity: r.severity,
  priority: r.priority,
  priorityScore: r.aiPriorityReasoning?.confidenceScore || 80,
  aiDetection: r.aiDetection!,
  aiFactors: r.aiPriorityReasoning?.factors || ['Visual defect severity', 'GIS traffic load'],
  assignedWorkerId: r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS' || r.status === 'RESOLVED' ? 'USR-03' : undefined,
  assignedWorkerName: r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS' || r.status === 'RESOLVED' ? 'Rameshwar Yadav' : undefined,
  workOrderId: r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS' || r.status === 'RESOLVED' ? `WO-2026-00${i + 1}` : undefined,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  timeline: r.timeline,
}));

// 15 Work Orders for Field Workers
export const INITIAL_WORK_ORDERS: WorkOrder[] = Array.from({ length: 15 }).map((_, i) => {
  const num = i + 1;
  const r = INITIAL_REPORTS[i];
  const worker = i % 2 === 0 ? INITIAL_USERS[2] : INITIAL_USERS[6];
  const statuses: Array<'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'RESOLVED'> = [
    'IN_PROGRESS',
    'ASSIGNED',
    'RESOLVED',
    'ACCEPTED',
    'COMPLETED',
  ];
  const st = statuses[i % statuses.length];

  return {
    id: `WO-2026-00${num}`,
    incidentId: `INC-2026-00${num}`,
    reportId: r.id,
    title: `${r.issueType || 'Road Defect'} Maintenance — ${r.wardName}`,
    issueType: r.issueType,
    description: `Rectify ${r.issueType || 'defect'} in ${r.wardName}.`,
    instructions: r.issueType === 'Longitudinal Crack'
      ? 'Clean crack debris with compressed air, apply polymer-modified sealant, and seal edges.'
      : r.issueType === 'Alligator Crack'
      ? 'Excavate degraded asphalt area, recompact base course, and lay hot-mix overlay.'
      : 'Level defect with hot-mix bitumen, compact thoroughly with vibratory roller.',
    locationAddress: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
    priority: r.priority,
    status: st,
    assignedWorkerId: worker.id,
    assignedWorkerName: worker.name,
    assignedWorkerPhone: worker.phone,
    departmentId: r.departmentId || 'DEPT-01',
    departmentName: r.departmentName || 'Road Maintenance Division',
    beforeImageUrl: r.imageUrl,
    afterImageUrl: st === 'COMPLETED' || st === 'RESOLVED' ? SAMPLE_REPAIRED_IMAGES[i % SAMPLE_REPAIRED_IMAGES.length] : undefined,
    verification: st === 'COMPLETED' || st === 'RESOLVED'
      ? {
          id: `VER-00${num}`,
          workOrderId: `WO-2026-00${num}`,
          issueType: r.issueType,
          beforeImageUrl: r.imageUrl,
          afterImageUrl: SAMPLE_REPAIRED_IMAGES[i % SAMPLE_REPAIRED_IMAGES.length],
          verificationScore: 0.91 + (num % 8) * 0.01,
          status: st === 'RESOLVED' ? 'HUMAN_CONFIRMED' : 'AI_VERIFIED',
          notes: 'Pavement restored to grade level. High resolution match score.',
          verifiedAt: '2026-09-04T06:00:00Z',
          verifiedBy: 'Vikramaditya Rao',
        }
      : undefined,
    dueDate: '2026-09-05T18:00:00Z',
    createdAt: '2026-09-03T10:00:00Z',
    updatedAt: '2026-09-04T02:00:00Z',
    completedAt: st === 'RESOLVED' ? '2026-09-04T05:30:00Z' : undefined,
    timeline: [
      { id: `WTL-${num}-1`, status: 'ASSIGNED', title: 'Work Order Dispatched', description: `Assigned to ${worker.name}.`, actor: 'Vikramaditya Rao', actorRole: 'OFFICER' as const, timestamp: '2026-09-03T10:00:00Z' },
      { id: `WTL-${num}-2`, status: 'ACCEPTED', title: 'Job Accepted', description: 'Worker acknowledged receipt.', actor: worker.name, actorRole: 'FIELD_WORKER' as const, timestamp: '2026-09-03T11:00:00Z' },
      ...(st === 'IN_PROGRESS' || st === 'COMPLETED' || st === 'RESOLVED'
        ? [{ id: `WTL-${num}-3`, status: 'IN_PROGRESS', title: 'Repair In Progress', description: 'Worker arrived on site and commenced repair.', actor: worker.name, actorRole: 'FIELD_WORKER' as const, timestamp: '2026-09-04T02:00:00Z' }]
        : []),
      ...(st === 'COMPLETED' || st === 'RESOLVED'
        ? [{ id: `WTL-${num}-4`, status: 'COMPLETED', title: 'Work Completed', description: 'After-repair photo uploaded for verification.', actor: worker.name, actorRole: 'FIELD_WORKER' as const, timestamp: '2026-09-04T05:00:00Z' }]
        : []),
      ...(st === 'RESOLVED'
        ? [{ id: `WTL-${num}-5`, status: 'RESOLVED', title: 'AI & Officer Verified', description: 'Closure confirmed by Operations Desk.', actor: 'Vikramaditya Rao', actorRole: 'OFFICER' as const, timestamp: '2026-09-04T06:00:00Z' }]
        : []),
    ],
  };
});

// 10 Notifications
export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'NOTIF-01',
    userId: 'USR-01',
    title: 'Road Issue Received',
    message: 'Your report NS-2026-001001 on MG Marg has been received.',
    type: 'INFO',
    read: false,
    linkUrl: '/citizen/reports/NS-2026-001001',
    createdAt: '2026-09-03T08:30:00Z',
  },
  {
    id: 'NOTIF-02',
    userId: 'USR-01',
    title: 'AI Defect Analysis Complete',
    message: 'RDD2022 AI detected Longitudinal Crack with 94% confidence.',
    type: 'SUCCESS',
    read: false,
    linkUrl: '/citizen/reports/NS-2026-001001',
    createdAt: '2026-09-03T08:31:00Z',
  },
  {
    id: 'NOTIF-03',
    userId: 'USR-01',
    title: 'Assigned to Road Maintenance',
    message: 'Work order WO-2026-001 dispatched to Field Worker Rameshwar Yadav.',
    type: 'INFO',
    read: false,
    linkUrl: '/citizen/reports/NS-2026-001001',
    createdAt: '2026-09-03T10:00:00Z',
  },
  {
    id: 'NOTIF-04',
    userId: 'USR-02',
    title: 'New Critical Incident in Hazratganj',
    message: 'Incident INC-2026-001 flagged as CRITICAL priority by AI telemetry.',
    type: 'ALERT',
    read: false,
    linkUrl: '/officer/incidents/INC-2026-001',
    createdAt: '2026-09-03T08:35:00Z',
  },
  {
    id: 'NOTIF-05',
    userId: 'USR-03',
    title: 'New Job Assigned: MG Marg',
    message: 'You have been assigned work order WO-2026-001. Due today by 6:00 PM.',
    type: 'WARNING',
    read: false,
    linkUrl: '/worker/jobs/WO-2026-001',
    createdAt: '2026-09-03T10:00:00Z',
  },
  {
    id: 'NOTIF-06',
    userId: 'USR-01',
    title: 'Repair Completed for NS-2026-001003',
    message: 'Your report on Kanpur Road has been successfully repaired and verified.',
    type: 'SUCCESS',
    read: true,
    linkUrl: '/citizen/reports/NS-2026-001003',
    createdAt: '2026-09-01T17:30:00Z',
  },
  {
    id: 'NOTIF-07',
    userId: 'USR-02',
    title: 'AI Verification Pending Confirmation',
    message: 'Worker Sunil Paswan uploaded after-repair photo for WO-2026-003.',
    type: 'INFO',
    read: true,
    linkUrl: '/officer/work-orders/WO-2026-003',
    createdAt: '2026-09-01T15:10:00Z',
  },
  {
    id: 'NOTIF-08',
    userId: 'USR-04',
    title: 'System Health Check Clean',
    message: 'All core microservices operating within nominal latency thresholds.',
    type: 'INFO',
    read: true,
    linkUrl: '/admin/system',
    createdAt: '2026-09-04T00:00:00Z',
  },
  {
    id: 'NOTIF-09',
    userId: 'USR-04',
    title: 'RDD2022-v1 Multi-Class Evaluation',
    message: 'Benchmark test completed on 1,200 test images across all 5 defect categories with 84ms latency.',
    type: 'SUCCESS',
    read: true,
    linkUrl: '/admin/models',
    createdAt: '2026-09-02T14:00:00Z',
  },
  {
    id: 'NOTIF-10',
    userId: 'USR-03',
    title: 'Weather Warning: Gomti Nagar',
    message: 'Heavy rain predicted in afternoon. Prioritize water-susceptible road fissure sealing.',
    type: 'WARNING',
    read: true,
    linkUrl: '/worker',
    createdAt: '2026-09-04T03:00:00Z',
  },
];

// 5 Model Versions (Multi-class Road Defect Computer Vision)
export const INITIAL_MODELS: ModelVersion[] = [
  {
    id: 'MOD-01',
    name: 'NagarSam Road Defect Detector',
    version: 'RDD2022-v1',
    framework: 'Ultralytics YOLOv8',
    task: 'Road Defect Object Detection',
    classesCount: 5,
    classesList: ['Longitudinal Crack', 'Transverse Crack', 'Alligator Crack', 'Other Corruption', 'Pothole'],
    inputSize: '1024x1024',
    mAP50: 0.894,
    inferenceTimeMs: 84,
    status: 'DEVELOPMENT_MOCK',
    parameters: '25.9M',
    createdAt: '2026-08-15T12:00:00Z',
  },
  {
    id: 'MOD-02',
    name: 'NagarSam Edge Rapid Scanner',
    version: 'RDD2022-v2-nano',
    framework: 'YOLOv8n-Lite',
    task: 'Mobile Edge Inference',
    classesCount: 5,
    classesList: ['Longitudinal Crack', 'Transverse Crack', 'Alligator Crack', 'Other Corruption', 'Pothole'],
    inputSize: '640x640',
    mAP50: 0.812,
    inferenceTimeMs: 28,
    status: 'DEVELOPMENT_MOCK',
    parameters: '3.2M',
    createdAt: '2026-08-25T14:30:00Z',
  },
  {
    id: 'MOD-03',
    name: 'Road Surface Degradation Classifier',
    version: 'RS-Fissure-v1.2',
    framework: 'ResNet50-FPN',
    task: 'Surface Degradation Classification',
    classesCount: 5,
    classesList: ['Longitudinal Crack', 'Transverse Crack', 'Alligator Crack', 'Other Corruption', 'Pothole'],
    inputSize: '512x512',
    mAP50: 0.865,
    inferenceTimeMs: 110,
    status: 'DEVELOPMENT_MOCK',
    parameters: '38.4M',
    createdAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'MOD-04',
    name: 'Municipal Repair Verification Network',
    version: 'RS-Verify-v1',
    framework: 'Siamese-EfficientNetB4',
    task: 'Before/After Defect Elimination Scoring',
    classesCount: 5,
    classesList: ['Pothole Repair', 'Crack Seal', 'Patch Leveling', 'Resurfacing', 'No Change'],
    inputSize: '512x512',
    mAP50: 0.923,
    inferenceTimeMs: 95,
    status: 'DEVELOPMENT_MOCK',
    parameters: '19.8M',
    createdAt: '2026-08-10T09:00:00Z',
  },
  {
    id: 'MOD-05',
    name: 'Continuous Street Scanner (Thermal + RGB)',
    version: 'RS-Fusion-v0.9',
    framework: 'MultiModal-YOLO',
    task: 'Thermal & Optical Pavement Fusion',
    classesCount: 6,
    classesList: ['Sub-surface Void', 'Cavity', 'Thermal Crack', 'Moisture Seep', 'Alligator Pattern', 'Normal'],
    inputSize: '1024x1024',
    mAP50: 0.778,
    inferenceTimeMs: 145,
    status: 'DEVELOPMENT_MOCK',
    parameters: '44.1M',
    createdAt: '2026-09-01T11:00:00Z',
  },
];

export const INITIAL_AI_CONFIG: AIConfiguration = {
  detectionConfidenceThreshold: 0.70,
  humanReviewThreshold: 0.40,
  verificationThreshold: 0.70,
  autoAssignmentEnabled: true,
  maxDailyJobsPerWorker: 6,
};

export const INITIAL_SYSTEM_HEALTH: SystemServiceHealth[] = [
  { name: 'Core Civic API Gateway', status: 'HEALTHY', latencyMs: 34, uptimePercentage: 99.98, queueLength: 0, lastChecked: '2026-09-04T08:45:00Z' },
  { name: 'Spatial PostGIS Database', status: 'HEALTHY', latencyMs: 18, uptimePercentage: 99.99, queueLength: 2, lastChecked: '2026-09-04T08:45:00Z' },
  { name: 'Redis Telemetry & Queue', status: 'HEALTHY', latencyMs: 6, uptimePercentage: 100.0, queueLength: 1, lastChecked: '2026-09-04T08:45:00Z' },
  { name: 'RDD2022 AI Inference Worker', status: 'HEALTHY', latencyMs: 84, uptimePercentage: 99.92, queueLength: 0, lastChecked: '2026-09-04T08:45:00Z' },
  { name: 'Object Evidence Storage', status: 'HEALTHY', latencyMs: 45, uptimePercentage: 99.95, queueLength: 0, lastChecked: '2026-09-04T08:45:00Z' },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = Array.from({ length: 30 }).map((_, i) => {
  const num = i + 1;
  const actions = [
    'REPORT_SUBMITTED',
    'AI_INFERENCE_RUN',
    'INCIDENT_CONFIRMED',
    'WORK_ORDER_DISPATCHED',
    'REPAIR_COMPLETED',
    'VERIFICATION_APPROVED',
    'USER_ROLE_UPDATED',
    'AI_THRESHOLD_UPDATED',
  ];
  const act = actions[i % actions.length];
  const user = INITIAL_USERS[i % INITIAL_USERS.length];

  return {
    id: `AUD-2026-${1000 + num}`,
    timestamp: `2026-09-0${Math.min(4, Math.max(1, 4 - (i % 4)))}T${10 + (i % 12)}:30:00Z`,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: act,
    resource: act.startsWith('REPORT') ? 'REPORT' : act.startsWith('INCIDENT') ? 'INCIDENT' : act.startsWith('WORK') ? 'WORK_ORDER' : 'SYSTEM',
    resourceId: `RES-${2026}-${100 + num}`,
    result: 'SUCCESS',
    ipAddress: `10.175.59.${10 + num}`,
    details: `Telemetry action ${act} executed by ${user.name} (${user.role}).`,
  };
});
