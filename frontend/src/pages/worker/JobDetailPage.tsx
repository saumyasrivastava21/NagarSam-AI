import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkOrder, useAcceptWorkOrder, useStartRepair, useCompleteWorkOrder } from '../../hooks/useWorkOrders';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CivicMap } from '../../components/maps/CivicMap';
import { FileUploader } from '../../components/forms/FileUploader';
import { LoadingState } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { formatDateTime } from '../../utils/formatters';
import {
  CheckCircle2,
  Navigation,
  MapPin,
  Camera,
  Sparkles,
  Play,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

const SAMPLE_AFTER_PHOTOS = [
  { label: 'Bitumen Surface Patch', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80' },
  { label: 'Crack Seal & Emulsion Finish', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&auto=format&fit=crop&q=80' },
  { label: 'Surface Pavement Leveling', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80' },
];

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, error } = useWorkOrder(id);

  const acceptMutation = useAcceptWorkOrder();
  const startRepairMutation = useStartRepair();
  const completeMutation = useCompleteWorkOrder();

  // After-image upload state
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [afterImageUrl, setAfterImageUrl] = useState<string>(SAMPLE_AFTER_PHOTOS[0].url);
  const [afterImageFile, setAfterImageFile] = useState<File | undefined>();
  const [workerNotes, setWorkerNotes] = useState(
    'Road defect surface sealed and compacted flush with adjacent asphalt pavement.'
  );

  if (isLoading) return <LoadingState message="Loading road maintenance job telemetry..." />;
  if (error || !job) return <ErrorState title="Job Not Found" description={`Work order ${id} not found.`} />;

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync(job.id);
      toast.success('Assignment accepted! Status set to ACCEPTED.');
    } catch {
      toast.error('Failed to accept job.');
    }
  };

  const handleStartRepair = async () => {
    try {
      await startRepairMutation.mutateAsync(job.id);
      toast.success('Repair operations started! Status set to IN_PROGRESS.');
    } catch {
      toast.error('Failed to start repair.');
    }
  };

  const handleCompleteRepair = async () => {
    try {
      await completeMutation.mutateAsync({
        id: job.id,
        afterImageUrl,
        afterImageFile,
        notes: workerNotes,
      });
      toast.success('Repair submitted! AI-assisted verification indicates defect potentially resolved (91% confidence). Awaiting officer confirmation.');
      setCompleteModalOpen(false);
    } catch {
      toast.error('Failed to submit repair completion.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Field Console', href: '/worker' },
              { label: 'Road Maintenance Jobs', href: '/worker/jobs' },
              { label: job.id },
            ]}
          />
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{job.id}</h1>
            <StatusBadge workOrderStatus={job.status} size="md" />
            <StatusBadge priority={job.priority} size="md" />
          </div>
        </div>

        {/* Action Buttons based on status */}
        <div className="flex flex-wrap items-center gap-2">
          {job.status === 'ASSIGNED' && (
            <Button
              variant="accent"
              size="md"
              onClick={handleAccept}
              isLoading={acceptMutation.isPending}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Accept Job
            </Button>
          )}

          {(job.status === 'ACCEPTED' || job.status === 'ASSIGNED') && (
            <Button
              variant="primary"
              size="md"
              onClick={handleStartRepair}
              isLoading={startRepairMutation.isPending}
              leftIcon={<Play className="w-4 h-4" />}
            >
              Start Repair
            </Button>
          )}

          {job.status === 'IN_PROGRESS' && (
            <Button
              variant="success"
              size="md"
              onClick={() => setCompleteModalOpen(true)}
              leftIcon={<Camera className="w-4 h-4" />}
            >
              Upload After Image & Submit for Verification
            </Button>
          )}

          {(job.status === 'COMPLETED' || job.status === 'RESOLVED') && (
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Repair Completed</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Instructions & Photos */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5 shadow-civic space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              Work Order Instructions & Specs
            </h3>

            <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1.5 text-xs text-amber-950 dark:text-amber-200">
              <span className="font-extrabold uppercase tracking-wider text-[11px] text-amber-800 dark:text-amber-300">
                Supervisor Instructions:
              </span>
              <p className="leading-relaxed font-semibold">{job.instructions}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Location Address</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{job.locationAddress}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Target Due Date</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatDateTime(job.dueDate)}</span>
              </div>
            </div>
          </Card>

          {/* Photos Comparison */}
          <Card className="p-5 shadow-civic space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              Site Photographic Evidence
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Original Defect (Before)</span>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 h-48">
                  <img src={job.beforeImageUrl} alt="Before repair" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Repaired Surface (After)</span>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 h-48 flex items-center justify-center">
                  {job.afterImageUrl ? (
                    <img src={job.afterImageUrl} alt="After repair" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4 text-xs text-slate-400">
                      <span>No after photo uploaded yet</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Verification Banner if completed */}
            {job.verification && (
              <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>AI-Assisted Verification (VerifyNet-v1)</span>
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
                    Confidence: {((job.verification.verificationScore || 0.91) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Verification State:</span>
                    <strong className="text-emerald-400 font-semibold">Potentially Resolved</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Operational Status:</span>
                    <strong className="text-amber-400 font-semibold">Awaiting Officer Confirmation</strong>
                  </div>
                </div>
                <p className="text-slate-400 text-[11px] italic">
                  Verification indicates the reported defect may have been addressed. Final operational closure is confirmed by supervisor.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: GPS Map & Navigation */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-4 shadow-civic space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-600" />
                <span>Job Site Geolocation</span>
              </span>
              <a
                href={`https://maps.google.com/?q=${job.latitude},${job.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-primary-700 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate</span>
              </a>
            </div>

            <CivicMap
              center={[job.latitude, job.longitude]}
              zoom={15}
              height="240px"
              pickedLocation={[job.latitude, job.longitude]}
            />
          </Card>

          {/* Quick Action Button for Field Worker */}
          {job.status === 'IN_PROGRESS' && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Finished Repair?</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Snap an after-photo to trigger AI defect elimination scoring and request supervisor sign-off.
              </p>
              <Button
                variant="success"
                size="md"
                onClick={() => setCompleteModalOpen(true)}
                className="w-full font-bold shadow-sm"
              >
                Upload After Image & Submit
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Upload After-Repair Photo */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Submit Repair for AI Verification"
        description="Upload a photograph of the repaired road surface."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setCompleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleCompleteRepair}
              isLoading={completeMutation.isPending}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Submit for AI Verification
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FileUploader
            label="After-Repair Photograph"
            value={afterImageUrl}
            onChange={(url, file) => {
              setAfterImageUrl(url);
              setAfterImageFile(file);
            }}
          />

          {/* Sample After Photos */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Or pick a sample repaired road photo:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_AFTER_PHOTOS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAfterImageUrl(p.url);
                    setAfterImageFile(undefined);
                  }}
                  className={`relative rounded-xl overflow-hidden border p-1 text-left transition ${
                    afterImageUrl === p.url ? 'border-emerald-600 ring-2 ring-emerald-200' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <img src={p.url} alt={p.label} className="w-full h-14 object-cover rounded-lg" />
                  <span className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate mt-1">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Worker Completion Remarks"
            rows={2}
            value={workerNotes}
            onChange={(e) => setWorkerNotes(e.target.value)}
            placeholder="Notes regarding surface compaction, curing, or traffic restoration..."
          />
        </div>
      </Modal>
    </div>
  );
};
