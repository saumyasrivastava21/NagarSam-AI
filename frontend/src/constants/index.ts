import { UserRole, ReportStatus, WorkOrderStatus, Severity, Priority, DefectClass } from '../types';

export const APP_NAME = 'NagarSam AI';
export const TAGLINE_PRIMARY = 'Report a road issue. NagarSam AI turns it into action.';
export const TAGLINE_SECONDARY = 'AI-powered road infrastructure intelligence for smarter civic operations.';

export const LUCKNOW_COORDINATES = {
  lat: 26.8467,
  lng: 80.9462,
  zoom: 13,
};

export const ROAD_DEFECT_CLASSES: string[] = [
  'Longitudinal Crack',
  'Transverse Crack',
  'Alligator Crack',
  'Other Corruption',
  'Pothole',
];

export const DEFECT_CLASSES_CONFIG: DefectClass[] = [
  {
    id: 'DEF-01',
    name: 'Longitudinal Crack',
    label: 'Longitudinal Crack',
    description: 'Parallel surface fractures along the road travel direction, indicating joint weakness or base fatigue.',
    severityHint: 'MEDIUM',
  },
  {
    id: 'DEF-02',
    name: 'Transverse Crack',
    label: 'Transverse Crack',
    description: 'Perpendicular cracks spanning across traffic lanes, typically caused by thermal contraction or sub-base movement.',
    severityHint: 'MEDIUM',
  },
  {
    id: 'DEF-03',
    name: 'Alligator Crack',
    label: 'Alligator (Fatigue) Crack',
    description: 'Interconnected spiderweb pattern fractures caused by structural load fatigue and moisture penetration.',
    severityHint: 'HIGH',
  },
  {
    id: 'DEF-04',
    name: 'Other Corruption',
    label: 'Other Road Damage / Corruption',
    description: 'Surface deformation, raveling, edge breakdown, rutting, or utility trench subsidence.',
    severityHint: 'HIGH',
  },
  {
    id: 'DEF-05',
    name: 'Pothole',
    label: 'Pothole / Cavity',
    description: 'Deep bowl-shaped depression in the pavement structure creating immediate safety hazard for vehicles.',
    severityHint: 'CRITICAL',
  },
];

export const WARDS_DATA = [
  { id: 'WARD-01', number: 1, name: 'Hazratganj Ward', zone: 'Central Zone', corporatorName: 'Smt. Anjali Srivastava', corporatorPhone: '+91 94150 11001', activeHazardsCount: 4, activePotholesCount: 4 },
  { id: 'WARD-02', number: 2, name: 'Gomti Nagar Ward', zone: 'East Zone', corporatorName: 'Shri Rajesh Kumar Verma', corporatorPhone: '+91 94150 11002', activeHazardsCount: 6, activePotholesCount: 6 },
  { id: 'WARD-03', number: 3, name: 'Alambagh Ward', zone: 'South Zone', corporatorName: 'Shri Dinesh Chandra', corporatorPhone: '+91 94150 11003', activeHazardsCount: 5, activePotholesCount: 5 },
  { id: 'WARD-04', number: 4, name: 'Indira Nagar Ward', zone: 'East Zone', corporatorName: 'Smt. Neelam Dwivedi', corporatorPhone: '+91 94150 11004', activeHazardsCount: 3, activePotholesCount: 3 },
  { id: 'WARD-05', number: 5, name: 'Chowk Ward', zone: 'Old City Zone', corporatorName: 'Shri Mohd. Tariq', corporatorPhone: '+91 94150 11005', activeHazardsCount: 7, activePotholesCount: 7 },
  { id: 'WARD-06', number: 6, name: 'Charbagh Ward', zone: 'Central Zone', corporatorName: 'Shri Sunil Pandey', corporatorPhone: '+91 94150 11006', activeHazardsCount: 5, activePotholesCount: 5 },
  { id: 'WARD-07', number: 7, name: 'Mahanagar Ward', zone: 'North Zone', corporatorName: 'Smt. Sunita Gupta', corporatorPhone: '+91 94150 11007', activeHazardsCount: 2, activePotholesCount: 2 },
  { id: 'WARD-08', number: 8, name: 'Aminabad Ward', zone: 'Central Zone', corporatorName: 'Shri Alok Rastogi', corporatorPhone: '+91 94150 11008', activeHazardsCount: 4, activePotholesCount: 4 },
  { id: 'WARD-09', number: 9, name: 'Aliganj Ward', zone: 'North Zone', corporatorName: 'Shri Pradeep Mishra', corporatorPhone: '+91 94150 11009', activeHazardsCount: 3, activePotholesCount: 3 },
  { id: 'WARD-10', number: 10, name: 'Rajajipuram Ward', zone: 'West Zone', corporatorName: 'Smt. Kavita Sharma', corporatorPhone: '+91 94150 11010', activeHazardsCount: 4, activePotholesCount: 4 },
];

export const DEPARTMENTS_DATA = [
  { id: 'DEPT-01', code: 'RMD', name: 'Road Maintenance Division', headName: 'Er. R. K. Singh', contactEmail: 'rmd.officer@example.com', contactPhone: '+91 522 2621001', activeIncidentsCount: 14, completedIncidentsCount: 82 },
  { id: 'DEPT-02', code: 'PWD', name: 'Public Works Department', headName: 'Er. Vinod Kashyap', contactEmail: 'pwd.officer@example.com', contactPhone: '+91 522 2621002', activeIncidentsCount: 8, completedIncidentsCount: 65 },
  { id: 'DEPT-03', code: 'SID', name: 'Street Infrastructure Department', headName: 'Er. Mamta Rawat', contactEmail: 'sid.officer@example.com', contactPhone: '+91 522 2621003', activeIncidentsCount: 5, completedIncidentsCount: 41 },
  { id: 'DEPT-04', code: 'ERU', name: 'Emergency Road Response Unit', headName: 'Er. Ashutosh Tripathi', contactEmail: 'eru.officer@example.com', contactPhone: '+91 522 2621004', activeIncidentsCount: 3, completedIncidentsCount: 29 },
];

export const DEMO_USERS: Array<{
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  avatar: string;
  label: string;
}> = [
  {
    email: 'citizen@example.com',
    name: 'Aarav Sharma',
    role: 'CITIZEN',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    label: 'Citizen (Report & Track)',
  },
  {
    email: 'officer@example.com',
    name: 'Vikramaditya Rao',
    role: 'OFFICER',
    phone: '+91 98123 45678',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    label: 'Municipal Officer (Triage & Assign)',
  },
  {
    email: 'worker@example.com',
    name: 'Rameshwar Yadav',
    role: 'FIELD_WORKER',
    phone: '+91 97234 56789',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    label: 'Field Worker (Repair & Verify)',
  },
  {
    email: 'admin@example.com',
    name: 'Dr. Priya Nambiar',
    role: 'ADMIN',
    phone: '+91 99345 67890',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    label: 'Admin (System, Models & Logs)',
  },
];

export const REPORT_STATUS_LABELS: Record<ReportStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' }> = {
  SUBMITTED: { label: 'Submitted', variant: 'info' },
  UNDER_REVIEW: { label: 'AI Reviewing', variant: 'warning' },
  CONFIRMED: { label: 'Confirmed', variant: 'secondary' },
  ASSIGNED: { label: 'Work Assigned', variant: 'warning' },
  IN_PROGRESS: { label: 'Repair In Progress', variant: 'warning' },
  VERIFYING: { label: 'AI Verifying', variant: 'info' },
  RESOLVED: { label: 'Resolved & Closed', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
};

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' }> = {
  CREATED: { label: 'Drafted', variant: 'secondary' },
  ASSIGNED: { label: 'Assigned', variant: 'info' },
  ACCEPTED: { label: 'Accepted by Worker', variant: 'warning' },
  IN_PROGRESS: { label: 'Work in Progress', variant: 'warning' },
  COMPLETED: { label: 'Repair Done (Pending Verification)', variant: 'info' },
  VERIFYING: { label: 'Under AI/Officer Review', variant: 'info' },
  RESOLVED: { label: 'Verified & Closed', variant: 'success' },
  REOPENED: { label: 'Reopened for Rectification', variant: 'danger' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
};

export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  CRITICAL: { label: 'Critical', color: '#DC2626', bg: 'bg-red-50 text-red-700', border: 'border-red-200' },
  HIGH: { label: 'High', color: '#EA580C', bg: 'bg-orange-50 text-orange-700', border: 'border-orange-200' },
  MEDIUM: { label: 'Medium', color: '#D97706', bg: 'bg-amber-50 text-amber-700', border: 'border-amber-200' },
  LOW: { label: 'Low', color: '#16A34A', bg: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  CRITICAL: { label: 'P0 - Immediate Action', color: '#DC2626', bg: 'bg-red-100 text-red-800', border: 'border-red-300' },
  HIGH: { label: 'P1 - High Priority', color: '#EA580C', bg: 'bg-orange-100 text-orange-800', border: 'border-orange-300' },
  MEDIUM: { label: 'P2 - Standard Service', color: '#D97706', bg: 'bg-amber-100 text-amber-800', border: 'border-amber-300' },
  LOW: { label: 'P3 - Scheduled Maintenance', color: '#16A34A', bg: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-300' },
};

export const ANNOUNCEMENTS_MOCK = [
  {
    id: 'ANN-01',
    title: 'Monsoon Road Readiness & Emergency Rapid Action Drive',
    date: 'September 2, 2026',
    category: 'Operational Advisory',
    summary: 'Nagar Nigam rapid response teams deployed across Hazratganj, Gomti Nagar and Alambagh zones for monsoon drain-edge patching and fracture leveling.',
    badge: 'Urgent',
    content: 'All road maintenance teams have been directed to prioritize arterial roads connecting major transit hubs. AI telemetry dynamically tracks cracks and cavity risks near major commuter corridors.',
  },
  {
    id: 'ANN-02',
    title: 'Deployment of NagarSam AI Multi-Defect Inspection Engine',
    date: 'August 28, 2026',
    category: 'Technology Upgrade',
    summary: 'New RDD2022-v1 computer vision model deployed with support for 5 distinct road surface corruption and crack categories.',
    badge: 'New Feature',
    content: 'Citizens and municipal inspectors can now view multi-defect bounding boxes for longitudinal, transverse, and alligator cracks with confidence telemetry.',
  },
  {
    id: 'ANN-03',
    title: 'Shaheed Path & Kanpur Road Overnight Resurfacing Schedule',
    date: 'August 20, 2026',
    category: 'Traffic Notice',
    summary: 'Night maintenance drives from 11:00 PM to 5:00 AM to minimize citizen disruption.',
    badge: 'Traffic Alert',
    content: 'Diversion routes mapped in the civic GIS console. All emergency work orders in this corridor are fast-tracked for overnight resolution.',
  },
];
