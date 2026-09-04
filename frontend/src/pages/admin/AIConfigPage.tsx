import React, { useState, useEffect } from 'react';
import { useAIConfiguration, useUpdateAIConfiguration } from '../../hooks/useUsers';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Switch } from '../../components/ui/Switch';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export const AIConfigPage: React.FC = () => {
  const { data: config } = useAIConfiguration();
  const updateMutation = useUpdateAIConfiguration();

  const [detectionThreshold, setDetectionThreshold] = useState(0.70);
  const [humanReviewThreshold, setHumanReviewThreshold] = useState(0.40);
  const [verificationThreshold, setVerificationThreshold] = useState(0.70);
  const [autoAssignment, setAutoAssignment] = useState(true);

  useEffect(() => {
    if (config) {
      setDetectionThreshold(config.detectionConfidenceThreshold);
      setHumanReviewThreshold(config.humanReviewThreshold);
      setVerificationThreshold(config.verificationThreshold);
      setAutoAssignment(config.autoAssignmentEnabled);
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        detectionConfidenceThreshold: detectionThreshold,
        humanReviewThreshold,
        verificationThreshold,
        autoAssignmentEnabled: autoAssignment,
      });
      toast.success('AI operational thresholds saved successfully.');
    } catch {
      toast.error('Failed to update configuration.');
    }
  };

  const handleReset = () => {
    setDetectionThreshold(0.70);
    setHumanReviewThreshold(0.40);
    setVerificationThreshold(0.70);
    setAutoAssignment(true);
    toast.info('Reset to default civic thresholds.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumbs items={[{ label: 'Administration', href: '/admin' }, { label: 'AI Configuration' }]} />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            AI Triage & Verification Thresholds
          </h1>
          <p className="text-xs text-slate-500">
            Tune computer vision confidence boundaries, automated routing filters, and human-review triggers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} leftIcon={<RotateCcw className="w-4 h-4" />}>
            Reset Defaults
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={updateMutation.isPending}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Save Configuration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Detection Slider */}
        <Card className="p-6 shadow-civic space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900">
                Pothole Detection Confidence Cutoff
              </h3>
              <p className="text-xs text-slate-500">
                Minimum bounding-box probability required to register an official road defect incident.
              </p>
            </div>
            <span className="text-sm font-black text-primary-700 font-mono bg-primary-50 px-3 py-1 rounded-xl">
              {(detectionThreshold * 100).toFixed(0)}%
            </span>
          </div>

          <input
            type="range"
            min="0.30"
            max="0.95"
            step="0.05"
            value={detectionThreshold}
            onChange={(e) => setDetectionThreshold(parseFloat(e.target.value))}
            className="w-full accent-primary-600 cursor-pointer"
          />
        </Card>

        {/* Human Review Threshold */}
        <Card className="p-6 shadow-civic space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900">
                Human Review Trigger Threshold
              </h3>
              <p className="text-xs text-slate-500">
                Inferences scoring between this value and the cutoff require manual officer inspection.
              </p>
            </div>
            <span className="text-sm font-black text-amber-700 font-mono bg-amber-50 px-3 py-1 rounded-xl">
              {(humanReviewThreshold * 100).toFixed(0)}%
            </span>
          </div>

          <input
            type="range"
            min="0.20"
            max="0.60"
            step="0.05"
            value={humanReviewThreshold}
            onChange={(e) => setHumanReviewThreshold(parseFloat(e.target.value))}
            className="w-full accent-amber-600 cursor-pointer"
          />
        </Card>

        {/* Verification Threshold */}
        <Card className="p-6 shadow-civic space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900">
                Post-Repair AI Verification Minimum Score
              </h3>
              <p className="text-xs text-slate-500">
                Threshold required for VerifyNet-v1 to recommend automated case closure.
              </p>
            </div>
            <span className="text-sm font-black text-emerald-700 font-mono bg-emerald-50 px-3 py-1 rounded-xl">
              {(verificationThreshold * 100).toFixed(0)}%
            </span>
          </div>

          <input
            type="range"
            min="0.50"
            max="0.95"
            step="0.05"
            value={verificationThreshold}
            onChange={(e) => setVerificationThreshold(parseFloat(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </Card>

        {/* Auto Assignment Switch */}
        <Card className="p-6 shadow-civic">
          <Switch
            label="Automated Department Routing"
            description="Automatically route confirmed incidents to Road Maintenance or PWD based on ward GIS boundary rules."
            checked={autoAssignment}
            onChange={setAutoAssignment}
          />
        </Card>
      </div>
    </div>
  );
};
