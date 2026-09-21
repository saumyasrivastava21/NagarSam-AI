import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCreateReport } from '../../hooks/useReports';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { FileUploader } from '../../components/forms/FileUploader';
import { LocationPicker } from '../../components/forms/LocationPicker';
import { VoiceInputButton } from '../../components/forms/VoiceInputButton';
import { DetectionOverlay } from '../../components/ui/DetectionOverlay';
import { WARDS_DATA, LUCKNOW_COORDINATES, ROAD_DEFECT_CLASSES } from '../../constants';
import { formatDefectClass, getDefectClassId } from '../../utils/defectClasses';
import { aiService } from '../../services/api/ai.service';
import { RoadDefectDetection } from '../../types';
import {
  Camera,
  MapPin,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Info,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

interface SamplePhotoOption {
  label: string;
  url: string;          // proxy URL used for display (avoids CORS)
  inferenceUrl: string; // original URL sent to backend for model inference
  inherentDemoDefect: string;
  inherentDemoClassId: number;
  inherentDemoBbox: [number, number, number, number];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const proxyUrl = (src: string) => `${API_BASE}/ai/proxy-image?url=${encodeURIComponent(src)}`;

const SAMPLE_ROAD_PHOTOS: SamplePhotoOption[] = [
  {
    label: 'Longitudinal Crack',
    inferenceUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
    get url() { return proxyUrl(this.inferenceUrl); },
    inherentDemoDefect: 'longitudinal crack',
    inherentDemoClassId: 0,
    inherentDemoBbox: [120, 180, 500, 480],
  },
  {
    label: 'Severe Pothole',
    inferenceUrl: 'https://images.unsplash.com/photo-1578983427937-26078ee3d9d3?w=800&auto=format&fit=crop&q=80',
    get url() { return proxyUrl(this.inferenceUrl); },
    inherentDemoDefect: 'pothole',
    inherentDemoClassId: 4,
    inherentDemoBbox: [140, 200, 520, 610],
  },
  {
    label: 'Alligator Surface Crack',
    inferenceUrl: 'https://images.unsplash.com/photo-1584463699039-38c6d71b5634?w=800&auto=format&fit=crop&q=80',
    get url() { return proxyUrl(this.inferenceUrl); },
    inherentDemoDefect: 'alligator crack',
    inherentDemoClassId: 2,
    inherentDemoBbox: [100, 150, 680, 520],
  },
  {
    label: 'Transverse Fissure',
    inferenceUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
    get url() { return proxyUrl(this.inferenceUrl); },
    inherentDemoDefect: 'transverse crack',
    inherentDemoClassId: 1,
    inherentDemoBbox: [80, 240, 720, 360],
  },
];

interface ReportDraftState {
  image: {
    file?: File;
    previewUrl: string;
    imageId: string;
  };
  location: {
    latitude: number;
    longitude: number;
    wardId: string;
    address: string;
    landmark: string;
  };
  description: string;
  citizenReportedCategory: string;
  inference: {
    status: 'idle' | 'loading' | 'completed' | 'failed';
    source: 'mock' | 'live' | null;
    imageId: string | null;
    result: RoadDefectDetection | null;
    error: string | null;
  };
}

export const ReportPotholePage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuthStore();
  const createReportMutation = useCreateReport();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const activeAbortController = useRef<AbortController | null>(null);

  // Single Source of Truth: Unified Report Draft State
  const [draft, setDraft] = useState<ReportDraftState>(() => ({
    image: {
      previewUrl: SAMPLE_ROAD_PHOTOS[0].url,
      imageId: `img_${Date.now()}_initial`,
    },
    location: {
      latitude: LUCKNOW_COORDINATES.lat,
      longitude: LUCKNOW_COORDINATES.lng,
      wardId: WARDS_DATA[0].id,
      address: 'MG Marg, Hazratganj, Lucknow, UP',
      landmark: 'Opposite GPO crossing',
    },
    description: 'Road surface defect creating safety hazard for two-wheelers and traffic bottleneck during peak hours.',
    citizenReportedCategory: 'longitudinal crack',
    inference: {
      status: 'idle',
      source: null,
      imageId: null,
      result: null,
      error: null,
    },
  }));

  // Success State
  const [createdReportId, setCreatedReportId] = useState<string | null>(null);

  const isProductionApi = import.meta.env.VITE_API_MODE === 'production';

  // Run AI Inference with strict Image ID tracking & AbortController to prevent race conditions
  const runInferenceForImage = async (previewUrl: string, file: File | undefined, imageId: string, inherentPhotoDefect?: SamplePhotoOption) => {
    // Cancel previous in-flight request
    if (activeAbortController.current) {
      activeAbortController.current.abort();
    }
    const abortController = new AbortController();
    activeAbortController.current = abortController;

    // 1. Immediately invalidate previous detections & set loading
    setDraft((prev) => ({
      ...prev,
      inference: {
        status: 'loading',
        source: isProductionApi ? 'live' : 'mock',
        imageId,
        result: null,
        error: null,
      },
    }));

    if (isProductionApi) {
      try {
        // Find if previewUrl is a proxy URL, and if so, send the real inferenceUrl to backend
        const matchedSample = SAMPLE_ROAD_PHOTOS.find((p) => p.url === previewUrl);
        const backendImageUrl = matchedSample ? matchedSample.inferenceUrl : (!file ? previewUrl : undefined);
        const detection = await aiService.detectDefects({
          file,
          image_url: !file ? backendImageUrl : undefined,
          confidence_threshold: 0.20,
        });

        if (abortController.signal.aborted) return;

        // 2. Ensure results are only accepted if imageId is still current
        setDraft((prev) => {
          if (prev.image.imageId !== imageId) {
            return prev; // Stale response discarded
          }
          return {
            ...prev,
            inference: {
              status: 'completed',
              source: 'live',
              imageId,
              result: detection,
              error: null,
            },
          };
        });
      } catch (err: any) {
        if (abortController.signal.aborted) return;
        setDraft((prev) => {
          if (prev.image.imageId !== imageId) return prev;
          return {
            ...prev,
            inference: {
              status: 'failed',
              source: 'live',
              imageId,
              result: null,
              error: 'AI analysis is currently unavailable. Please retry or proceed with manual submission.',
            },
          };
        });
      }
    } else {
      // Mock Mode: Generate demo detection based strictly on image features, NOT on citizen category
      const targetClass = inherentPhotoDefect?.inherentDemoDefect || 'longitudinal crack';
      const classId = inherentPhotoDefect?.inherentDemoClassId ?? getDefectClassId(targetClass);
      const bbox = inherentPhotoDefect?.inherentDemoBbox || [120, 180, 500, 480];
      const simConfidence = 0.88;

      const mockDetection: RoadDefectDetection = {
        request_id: `mock_req_${Date.now()}`,
        model_name: 'NagarSam Road Defect Detector',
        model_version: 'RDD2022-YOLO11m-demo',
        source: 'mock',
        detected: true,
        pothole_detected: targetClass.toLowerCase().includes('pothole'),
        confidence: simConfidence,
        primaryDefectClass: targetClass,
        primary_defect: targetClass,
        primary_confidence: simConfidence,
        detections: [
          {
            class: targetClass,
            class_id: classId,
            class_name: targetClass,
            confidence: simConfidence,
            bbox: bbox,
          },
        ],
        inference_time_ms: 76,
        timestamp: new Date().toISOString(),
        isMock: true,
        image_width: 800,
        image_height: 600,
      };

      setDraft((prev) => {
        if (prev.image.imageId !== imageId) return prev;
        return {
          ...prev,
          inference: {
            status: 'completed',
            source: 'mock',
            imageId,
            result: mockDetection,
            error: null,
          },
        };
      });
    }
  };

  // Initial trigger on mount
  useEffect(() => {
    runInferenceForImage(draft.image.previewUrl, draft.image.file, draft.image.imageId, SAMPLE_ROAD_PHOTOS[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Image Change & Discard Stale Predictions immediately
  const handleImageChange = (url: string, file?: File, sampleOption?: SamplePhotoOption) => {
    const newImageId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setDraft((prev) => ({
      ...prev,
      image: {
        file,
        previewUrl: url,
        imageId: newImageId,
      },
    }));

    runInferenceForImage(url, file, newImageId, sampleOption);
  };

  const handleNext = () => {
    if (step === 1 && !draft.image.previewUrl) {
      toast.error('Please upload or select a road defect photograph.');
      return;
    }
    if (step === 2 && (!draft.location.latitude || !draft.location.longitude)) {
      toast.error('Please pick or detect the road location.');
      return;
    }
    if (step === 3 && draft.description.trim().length < 10) {
      toast.error('Please provide a descriptive explanation (min 10 characters).');
      return;
    }
    setStep((prev) => (prev + 1) as any);
  };

  const handleBack = () => {
    setStep((prev) => (prev - 1) as any);
  };

  // Submit report using unified draft state
  const handleSubmit = async () => {
    try {
      const selectedWard = WARDS_DATA.find((w) => w.id === draft.location.wardId) || WARDS_DATA[0];
      
      // AI-detected primary defect (if available)
      const aiPrimary = draft.inference.result?.primary_defect 
        || draft.inference.result?.primaryDefectClass 
        || (draft.inference.result?.detections && draft.inference.result.detections.length > 0 ? draft.inference.result.detections[0].class_name || draft.inference.result.detections[0].class : undefined);

      const result = await createReportMutation.mutateAsync({
        imageUrl: draft.image.previewUrl,
        imageFile: draft.image.file,
        latitude: draft.location.latitude,
        longitude: draft.location.longitude,
        address: draft.location.address,
        wardId: selectedWard.id,
        description: draft.description,
        landmark: draft.location.landmark,
        // Citizen observation and AI primary defect are tracked faithfully
        issueType: draft.citizenReportedCategory,
        primaryDefect: aiPrimary || draft.citizenReportedCategory,
        aiDetection: draft.inference.result || undefined,
        citizenName: currentUser?.name || 'Citizen Reporter',
        citizenPhone: currentUser?.phone || '+91 98765 43210',
      });

      setCreatedReportId(result.id);
      toast.success(`Report ${result.id} registered for municipal triage!`);
    } catch {
      toast.error('Failed to submit report. Please try again.');
    }
  };

  // Derive primary defect and defect list from AI result
  const inferenceResult = draft.inference.result;
  const detectionsList = inferenceResult?.detections || [];
  
  const aiPrimaryDefectName = inferenceResult?.primary_defect 
    || inferenceResult?.primaryDefectClass 
    || (detectionsList.length > 0 ? detectionsList[0].class_name || detectionsList[0].class : null);

  const aiPrimaryConfidence = inferenceResult?.primary_confidence 
    || (detectionsList.length > 0 ? detectionsList[0].confidence : null);

  // Success View
  if (createdReportId) {
    return (
      <div className="max-w-xl mx-auto py-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-in zoom-in-50 duration-200">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {t('reportSubmittedSuccess')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your road defect report has been registered and routed to the municipal officer triage queue.
          </p>
        </div>

        <Card className="p-6 text-left space-y-4 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Tracking Reference ID</span>
              <div className="text-lg font-black text-primary-700 dark:text-primary-400">{createdReportId}</div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
              Submitted
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div><strong>Location:</strong> {draft.location.address}</div>
            <div>
              <strong>Citizen Observation:</strong>{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatDefectClass(draft.citizenReportedCategory)}
              </span>
            </div>
            <div>
              <strong>AI Model Inference:</strong>{' '}
              <span className="font-semibold text-primary-700 dark:text-primary-400">
                {aiPrimaryDefectName ? formatDefectClass(aiPrimaryDefectName) : 'No defect detected'}
                {aiPrimaryConfidence ? ` (${(aiPrimaryConfidence * 100).toFixed(0)}% Confidence)` : ''}
              </span>
            </div>
            <div><strong>Description:</strong> {draft.description}</div>
            <div className="pt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {draft.inference.source === 'live' ? 'YOLO11m Live Prediction' : 'Demo Mode Output'} (Source:{' '}
                {draft.inference.source?.toUpperCase() || 'MANUAL'})
              </span>
            </div>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={`/citizen/reports/${createdReportId}`} className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full font-bold">
              {t('trackReport')}
            </Button>
          </Link>
          <Link to="/citizen" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full">
              {t('navDashboard')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const stepsHeader = [
    { num: 1, label: t('stepPhoto'), icon: <Camera className="w-4 h-4" /> },
    { num: 2, label: t('stepLocation'), icon: <MapPin className="w-4 h-4" /> },
    { num: 3, label: t('stepDescription'), icon: <FileText className="w-4 h-4" /> },
    { num: 4, label: t('stepReview'), icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumbs
        items={[{ label: t('citizenTitle'), href: '/citizen' }, { label: t('navReportPothole') }]}
      />

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {t('navReportPothole')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('citizenSubtitle')}
        </p>
      </div>

      {/* Step Progress Bar */}
      <div className="grid grid-cols-4 gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        {stepsHeader.map((s) => (
          <div
            key={s.num}
            className={`flex flex-col sm:flex-row items-center gap-2 p-2 rounded-xl text-center sm:text-left transition ${
              step === s.num
                ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold border border-primary-200 dark:border-primary-800'
                : step > s.num
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full text-xs flex items-center justify-center shrink-0 ${
                step === s.num
                  ? 'bg-primary-600 text-white'
                  : step > s.num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {step > s.num ? '✓' : s.num}
            </div>
            <span className="text-xs truncate hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step Content Card */}
      <Card className="p-6 sm:p-8 shadow-civic space-y-6">
        {/* STEP 1: Upload Photo */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Step 1: Upload Road Defect Photograph</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clear photographs enable the RDD2022 YOLO11 model to independently infer defect class, bounding coordinates, and dimensions.
              </p>
            </div>

            <FileUploader
              value={draft.image.previewUrl}
              onChange={(url, file) => handleImageChange(url, file)}
            />

            {/* Quick Demo Photo Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Or select a sample test defect:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_ROAD_PHOTOS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleImageChange(p.url, undefined, p)}
                    className={`relative rounded-xl overflow-hidden border p-1 text-left transition ${
                      draft.image.previewUrl === p.url ? 'border-primary-600 ring-2 ring-primary-200 dark:ring-primary-900' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <img src={p.url} alt={p.label} className="w-full h-16 object-cover rounded-lg" />
                    <span className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate mt-1">
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live AI Overlay Preview */}
            {draft.image.previewUrl && (
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                    Independent AI Model Detection Overlay
                  </span>
                  {isProductionApi && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => runInferenceForImage(draft.image.previewUrl, draft.image.file, draft.image.imageId)}
                      isLoading={draft.inference.status === 'loading'}
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    >
                      Retry Analysis
                    </Button>
                  )}
                </div>

                <DetectionOverlay
                  imageUrl={draft.image.previewUrl}
                  detection={draft.inference.result || undefined}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Location */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Step 2: Road Geolocation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pin the exact road coordinates so municipal inspection crews can navigate directly to the site.
              </p>
            </div>

            <LocationPicker
              latitude={draft.location.latitude}
              longitude={draft.location.longitude}
              address={draft.location.address}
              onChange={(lat, lng, addr) => {
                setDraft((prev) => ({
                  ...prev,
                  location: {
                    ...prev.location,
                    latitude: lat,
                    longitude: lng,
                    address: addr,
                  },
                }));
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Select
                label="Municipal Ward"
                options={WARDS_DATA.map((w) => ({ value: w.id, label: `${w.name} (${w.zone})` }))}
                value={draft.location.wardId}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  location: { ...prev.location, wardId: e.target.value }
                }))}
              />
              <Input
                label="Street / Landmark Address"
                value={draft.location.address}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  location: { ...prev.location, address: e.target.value }
                }))}
                placeholder="MG Marg, Hazratganj"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Description, Citizen Category & Landmark */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Step 3: Citizen Observation & Context</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                State what you observed and describe the condition. The AI model's independent prediction remains completely separate.
              </p>
            </div>

            {/* Citizen Reported Category (Strictly Independent - never alters model detection) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Observed Defect Type <span className="text-slate-400 font-normal">(Citizen Observation)</span>
              </label>
              <select
                value={draft.citizenReportedCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  // Strictly updates citizen observation without modifying or triggering AI model detections
                  setDraft((prev) => ({ ...prev, citizenReportedCategory: val }));
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {ROAD_DEFECT_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {formatDefectClass(cls)}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Note: The YOLO11m AI model will independently infer the defect class directly from the image pixels.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Description of Road Defect <span className="text-red-500">*</span>
                </label>
                <VoiceInputButton
                  onTranscript={(text) => setDraft((prev) => ({
                    ...prev,
                    description: prev.description ? `${prev.description} ${text}` : text
                  }))}
                  className="scale-90"
                />
              </div>
              <Textarea
                rows={4}
                required
                value={draft.description}
                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe road condition, depth, hazard to two-wheelers, or traffic bottleneck..."
                helperText="Min 10 characters required. You can type or use the microphone button to dictate."
              />
            </div>

            {/* Landmark */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Prominent Nearby Landmark (Optional)
                </label>
                <VoiceInputButton
                  onTranscript={(text) => setDraft((prev) => ({
                    ...prev,
                    location: { ...prev.location, landmark: text }
                  }))}
                  className="scale-90"
                />
              </div>
              <Input
                value={draft.location.landmark}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  location: { ...prev.location, landmark: e.target.value }
                }))}
                placeholder="e.g. Opposite GPO building, near Metro Pillar 42"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Review Report Summary (Separates Citizen Observation & AI Model Detections) */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Step 4: Review Report Summary</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Ready for your review
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify defect classification, AI inference, and location details before submitting to municipal triage.
              </p>
            </div>

            {/* Section A: Image Evidence with AI Bounding Boxes */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                A. Image Evidence & AI Defect Localization
              </span>
              <DetectionOverlay
                imageUrl={draft.image.previewUrl}
                detection={draft.inference.result || undefined}
                className="w-full"
              />
            </div>

            {/* Section B: AI Model Detections (Derived strictly from YOLO11m) */}
            <Card className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    B. AI Model Detections (YOLO11m)
                  </span>
                </div>
                {draft.inference.source === 'live' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                    LIVE MODEL INFERENCE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    DEMO DATA
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {detectionsList.length > 0 ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-slate-100">AI Primary Defect:</strong>
                      <span className="px-2 py-0.5 rounded font-bold bg-primary-100 dark:bg-primary-950 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                        {formatDefectClass(aiPrimaryDefectName)}
                      </span>
                      {aiPrimaryConfidence !== null && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          ({(aiPrimaryConfidence * 100).toFixed(0)}% Confidence)
                        </span>
                      )}
                    </div>

                    <div className="pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        All Detected Defect Boxes ({detectionsList.length}):
                      </span>
                      <ul className="mt-1 space-y-1 pl-3 list-disc">
                        {detectionsList.map((d, i) => (
                          <li key={i} className="text-xs">
                            <span className="font-semibold">{formatDefectClass(d.class_name || d.class)}</span> — {(d.confidence * 100).toFixed(0)}% Confidence
                            {d.class_id !== undefined && <span className="text-slate-400 text-[10px] ml-1.5">(Class ID {d.class_id})</span>}
                            {d.bbox && <span className="text-slate-400 text-[10px] ml-1.5">[{d.bbox.map((v) => Math.round(v)).join(', ')}]</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-slate-500 dark:text-slate-400 italic flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400" />
                    <span>No road defects detected by the model.</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div><strong>Model:</strong> {inferenceResult?.model_name || 'NagarSam Road Defect Detector'}</div>
                  <div><strong>Version:</strong> {inferenceResult?.model_version || (draft.inference.source === 'live' ? 'RDD2022-YOLO11m-v1' : 'RDD2022-YOLO11m-demo')}</div>
                  <div><strong>Latency:</strong> {inferenceResult?.inference_time_ms ? `${inferenceResult.inference_time_ms} ms` : 'N/A'}</div>
                </div>
              </div>
            </Card>

            {/* Section C: Citizen Observation */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                C. Citizen Observation & Notes
              </span>
              <div>
                <strong>Your Reported Issue Type:</strong>{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatDefectClass(draft.citizenReportedCategory)}
                </span>
              </div>
              <div><strong>Your Description:</strong> {draft.description}</div>
              {aiPrimaryDefectName && aiPrimaryDefectName.toLowerCase() !== draft.citizenReportedCategory.toLowerCase() && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-start gap-2 text-[11px]">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Observation vs AI Comparison:</strong> You observed{' '}
                    <em>{formatDefectClass(draft.citizenReportedCategory)}</em>, while the AI model identified{' '}
                    <em>{formatDefectClass(aiPrimaryDefectName)}</em>. Both records are saved for municipal triage verification.
                  </span>
                </div>
              )}
            </div>

            {/* Section D: Report Location Details */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                D. Municipal Location Details
              </span>
              <div><strong>Ward:</strong> {WARDS_DATA.find((w) => w.id === draft.location.wardId)?.name}</div>
              <div><strong>Location Address:</strong> {draft.location.address}</div>
              <div><strong>Coordinates:</strong> {draft.location.latitude.toFixed(5)}, {draft.location.longitude.toFixed(5)}</div>
              <div><strong>Landmark:</strong> {draft.location.landmark || 'N/A'}</div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              {t('btnBack')}
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t('btnNext')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="accent"
              size="md"
              onClick={handleSubmit}
              isLoading={createReportMutation.isPending}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Submit Report for Officer Triage
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
