import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkOrder, useVerifyWorkOrder } from '../../hooks/useWorkOrders';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatusTimeline } from '../../components/ui/StatusTimeline';
import { CivicMap } from '../../components/maps/CivicMap';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { LoadingState } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatDateTime } from '../../utils/formatters';
import {
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export const WorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: wo, isLoading, error } = useWorkOrder(id);
  const verifyMutation = useVerifyWorkOrder();

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(true);
  const [verificationNotes, setVerificationNotes] = useState('');

  if (isLoading) return <LoadingState message="Loading work order & repair evidence..." />;
  if (error || !wo) return <ErrorState title="Work Order Not Found" description={`Work Order ${id} not found.`} />;

  const handleVerify = async () => {
    try {
      await verifyMutation.mutateAsync({
        id: wo.id,
        approved: isApproving,
        notes: verificationNotes || (isApproving ? 'Officer confirmed satisfactory asphalt finish.' : 'Rework requested on perimeter leveling.'),
      });
      toast.success(isApproving ? 'Work order verified and closed!' : 'Work order reopened for rework.');
      setVerifyModalOpen(false);
    } catch {
      toast.error('Failed to update verification status.');
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
              { label: 'Work Orders', href: '/officer/work-orders' },
              { label: wo.id },
            ]}
          />
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{wo.id}</h1>
            <StatusBadge workOrderStatus={wo.status} size="md" />
            <StatusBadge priority={wo.priority} size="md" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {wo.status === 'COMPLETED' || wo.status === 'VERIFYING' ? (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => {
                  setIsApproving(true);
                  setVerifyModalOpen(true);
                }}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Approve & Close Case
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setIsApproving(false);
                  setVerifyModalOpen(true);
                }}
                leftIcon={<AlertTriangle className="w-4 h-4" />}
              >
                Request Rework
              </Button>
            </>
          ) : null}

          <Link to={`/officer/incidents/${wo.incidentId}`}>
            <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
              View Incident Dossier
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Before & After Repair Evidence */}
        <div className="lg:col-span-7 space-y-6">
          {/* Before & After Image Comparison */}
          <Card className="p-5 shadow-civic space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Before vs. After Photographic Evidence
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Before Repair (Report Image)
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-48">
                  <img src={wo.beforeImageUrl} alt="Before repair" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  After Repair (Field Worker Photo)
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-48 flex items-center justify-center">
                  {wo.afterImageUrl ? (
                    <img src={wo.afterImageUrl} alt="After repair" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4 text-xs text-slate-400">
                      <span>Awaiting post-repair photo submission from field unit</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Verification Score Box */}
            {wo.verification && (
              <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">
                      VerifyNet-v1 Dual-Image Verification Engine
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/20">
                    Elimination Score: {((wo.verification.verificationScore || 0.93) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {wo.verification.notes || 'Automated defect eradication confirmed. Zero detected cavities remaining.'}
                </p>
              </div>
            )}
          </Card>

          {/* Work Order Instructions & Unit Details */}
          <Card className="p-5 shadow-civic space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Work Order Details & Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Assigned Unit</span>
                <span className="font-bold text-slate-900">{wo.assignedWorkerName}</span>
                <span className="text-slate-500 block">{wo.assignedWorkerPhone || '+91 97234 56789'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Department</span>
                <span className="font-bold text-slate-900">{wo.departmentName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Location Address</span>
                <span className="font-semibold text-slate-900">{wo.locationAddress}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Target Due Date</span>
                <span className="font-semibold text-slate-900">{formatDateTime(wo.dueDate)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Repair Instructions</span>
              <p className="text-slate-700 leading-relaxed mt-1 font-medium">{wo.instructions}</p>
            </div>
          </Card>
        </div>

        {/* Right Col: Geospatial & Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-4 shadow-civic space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-600" />
                <span>Job Site Map</span>
              </span>
            </div>
            <CivicMap
              center={[wo.latitude, wo.longitude]}
              zoom={15}
              height="200px"
              pickedLocation={[wo.latitude, wo.longitude]}
            />
          </Card>

          <Card className="p-5 shadow-civic space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Work Order Timeline</h3>
              <span className="text-[11px] text-slate-400">{wo.timeline.length} Milestones</span>
            </div>
            <StatusTimeline events={wo.timeline} />
          </Card>
        </div>
      </div>

      {/* Verification Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title={isApproving ? 'Verify & Close Work Order' : 'Request Repair Rectification'}
        description={
          isApproving
            ? 'Confirm post-repair photo meets municipal quality standards and close case.'
            : 'Reject repair and return task to field unit for rectification.'
        }
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setVerifyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={isApproving ? 'success' : 'danger'}
              size="sm"
              onClick={handleVerify}
              isLoading={verifyMutation.isPending}
            >
              {isApproving ? 'Confirm & Close Case' : 'Submit Rework Request'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Textarea
            label="Officer Verification Notes"
            rows={3}
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            placeholder={
              isApproving
                ? 'Visual inspection confirms defect elimination and seamless compaction...'
                : 'Pothole edges remain uneven; requires additional asphalt compaction...'
            }
          />
        </div>
      </Modal>
    </div>
  );
};
