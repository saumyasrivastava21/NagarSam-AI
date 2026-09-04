import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useIncident, useUpdateIncidentPriority, useAssignIncidentWorker } from '../../hooks/useIncidents';
import { useUsers } from '../../hooks/useUsers';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DetectionOverlay } from '../../components/ui/DetectionOverlay';
import { StatusTimeline } from '../../components/ui/StatusTimeline';
import { CivicMap } from '../../components/maps/CivicMap';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { LoadingState } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { Priority } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  Sparkles,
  MapPin,
  Wrench,
  Flame,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: incident, isLoading, error } = useIncident(id);
  const { data: workersResult } = useUsers({ role: 'FIELD_WORKER' });
  const workers = workersResult?.data || [];

  const updatePriorityMutation = useUpdateIncidentPriority();
  const assignWorkerMutation = useAssignIncidentWorker();

  // Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.id || 'USR-03');
  const [instructions, setInstructions] = useState(
    'Inspect road defect, mill cracked perimeter, apply tack emulsion, fill cavity with hot-mix asphalt, and compact using vibratory roller.'
  );
  const [newPriority, setNewPriority] = useState<Priority>('CRITICAL');
  const [priorityNote, setPriorityNote] = useState('');

  if (isLoading) return <LoadingState message="Loading incident telemetry & spatial AI reasoning..." />;
  if (error || !incident) return <ErrorState title="Incident Not Found" description={`Record ${id} not found.`} />;

  const defectType = incident.issueType || incident.primaryDefect || 'Road Defect';
  const detections = incident.aiDetection?.detections || [];
  const primaryConfidence = incident.aiDetection?.confidence || 0.94;

  const handleAssignWorker = async () => {
    try {
      await assignWorkerMutation.mutateAsync({
        id: incident.id,
        workerId: selectedWorkerId || workers[0]?.id || 'USR-03',
        instructions,
      });
      toast.success(`Work Order dispatched! Assigned to field worker.`);
      setAssignModalOpen(false);
    } catch {
      toast.error('Failed to assign worker.');
    }
  };

  const handleUpdatePriority = async () => {
    try {
      await updatePriorityMutation.mutateAsync({
        id: incident.id,
        priority: newPriority,
        note: priorityNote || `Operational priority adjusted by supervisor.`,
      });
      toast.success(`Priority updated to ${newPriority}`);
      setPriorityModalOpen(false);
    } catch {
      toast.error('Failed to update priority.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Operations Desk', href: '/officer' },
              { label: 'Incident Queue', href: '/officer/incidents' },
              { label: incident.id },
            ]}
          />
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{incident.id}</h1>
            <span className="bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold px-2.5 py-1 rounded-full text-xs capitalize border border-primary-200 dark:border-primary-800">
              {defectType}
            </span>
            <StatusBadge priority={incident.priority} size="md" />
            <StatusBadge status={incident.status} size="md" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              Priority: {incident.priorityScore}/100
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {incident.workOrderId ? (
            <Link to={`/officer/work-orders/${incident.workOrderId}`}>
              <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                View Work Order ({incident.workOrderId})
              </Button>
            </Link>
          ) : (
            <Button
              variant="accent"
              size="sm"
              onClick={() => setAssignModalOpen(true)}
              leftIcon={<Wrench className="w-4 h-4" />}
            >
              Dispatch Work Order
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewPriority(incident.priority);
              setPriorityModalOpen(true);
            }}
            leftIcon={<Flame className="w-4 h-4 text-red-500" />}
          >
            Escalate Priority
          </Button>
        </div>
      </div>

      {/* Main Dossier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image AI Detection & Transparent Reasoning */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visual AI Detection Overlay */}
          <Card className="p-0 overflow-hidden shadow-civic">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  RDD2022 Computer Vision Boundary Detection
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Model: RDD2022-v1 (Development/Mock)</span>
            </div>

            <div className="p-4">
              <DetectionOverlay
                imageUrl={incident.imageUrl}
                detection={incident.aiDetection}
                className="max-h-[420px]"
              />
            </div>

            {/* AI Telemetry Metrics */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Defect Class</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize truncate block">{defectType}</span>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">AI Confidence</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{(primaryConfidence * 100).toFixed(0)}%</span>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Inference Time</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{incident.aiDetection?.inference_time_ms || 84} ms</span>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Detected Objects</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{detections.length || 1}</span>
                </div>
              </div>

              {detections.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {detections.map((d, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300"
                    >
                      <strong className="capitalize">{d.class}:</strong> {(d.confidence * 100).toFixed(0)}%
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Transparent Explainable Reasoning Box */}
          <Card className="p-5 shadow-civic space-y-3 bg-slate-900 text-white border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Operational Priority Assessment Matrix
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Score: {incident.priorityScore}/100 ({incident.priority})
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-amber-300/90 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Simulated priority factors — demo data</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Operational prioritization derived from verifiable multi-dimensional signals:
            </p>

            <ul className="space-y-1.5 text-xs text-slate-300">
              {incident.aiFactors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800 flex items-center justify-between">
              <span>Assistive GIS Intelligence</span>
              <span>Human supervisor authority retains final dispatch control</span>
            </div>
          </Card>

          {/* Operational Dossier Metadata */}
          <Card className="p-5 shadow-civic space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              Incident Metadata & Assignment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Issue Type</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">{defectType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Reported Date</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDate(incident.createdAt)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Location Address</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{incident.address}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Municipal Ward</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{incident.wardName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Department</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{incident.departmentName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Assigned Field Unit</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {incident.assignedWorkerName ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">{incident.assignedWorkerName}</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">Unassigned (Action Needed)</span>
                  )}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Citizen Notes</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-1 font-medium">{incident.description}</p>
            </div>
          </Card>
        </div>

        {/* Right Column: Spatial Map & Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Spatial Pin Map */}
          <Card className="p-4 shadow-civic space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-600" />
                <span>Geospatial Incident Pin</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
              </span>
            </div>

            <CivicMap
              items={[incident]}
              center={[incident.latitude, incident.longitude]}
              zoom={15}
              height="220px"
            />
          </Card>

          {/* Operational Timeline */}
          <Card className="p-5 shadow-civic space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Operational Audit Trail</h3>
              <span className="text-[11px] text-slate-400">{incident.timeline.length} Milestones</span>
            </div>
            <StatusTimeline events={incident.timeline} />
          </Card>
        </div>
      </div>

      {/* MODAL: Dispatch Work Order */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Dispatch Formal Work Order"
        description="Assign this road defect incident to a field maintenance worker."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAssignWorker}
              isLoading={assignWorkerMutation.isPending}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Dispatch Work Order
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Select Assigned Field Worker"
            options={
              workers.length > 0
                ? workers.map((w) => ({ value: w.id, label: `${w.name} (${w.phone || 'Field Unit'})` }))
                : [
                    { value: 'USR-03', label: 'Rameshwar Yadav (+91 97234 56789)' },
                    { value: 'USR-07', label: 'Manoj Kumar (+91 97890 54321)' },
                  ]
            }
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
          />

          <Textarea
            label="Repair Instructions & Material Spec"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Specify asphalt grade, compaction standards, or curb leveling requirements..."
          />
        </div>
      </Modal>

      {/* MODAL: Update Priority */}
      <Modal
        isOpen={priorityModalOpen}
        onClose={() => setPriorityModalOpen(false)}
        title="Escalate / Adjust Incident Priority"
        description="Override AI recommendation based on operational inspection."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setPriorityModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleUpdatePriority}
              isLoading={updatePriorityMutation.isPending}
            >
              Confirm Priority Change
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Target Priority Level"
            options={[
              { value: 'CRITICAL', label: 'P0 - Critical (Immediate Dispatch)' },
              { value: 'HIGH', label: 'P1 - High Priority' },
              { value: 'MEDIUM', label: 'P2 - Standard Service' },
              { value: 'LOW', label: 'P3 - Scheduled Maintenance' },
            ]}
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as any)}
          />

          <Textarea
            label="Operational Reason for Override"
            rows={3}
            value={priorityNote}
            onChange={(e) => setPriorityNote(e.target.value)}
            placeholder="e.g. VIP movement route, imminent monsoon flooding, multiple heavy bus lines..."
          />
        </div>
      </Modal>
    </div>
  );
};
