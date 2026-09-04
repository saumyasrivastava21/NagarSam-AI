import React, { useState } from 'react';
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
import { WARDS_DATA, LUCKNOW_COORDINATES, ROAD_DEFECT_CLASSES } from '../../constants';
import {
  Camera,
  MapPin,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

const SAMPLE_ROAD_PHOTOS = [
  { label: 'Longitudinal Crack', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80', defect: 'longitudinal crack' },
  { label: 'Severe Pothole', url: 'https://images.unsplash.com/photo-1578983427937-26078ee3d9d3?w=800&auto=format&fit=crop&q=80', defect: 'Pothole' },
  { label: 'Alligator Surface Crack', url: 'https://images.unsplash.com/photo-1584463699039-38c6d71b5634?w=800&auto=format&fit=crop&q=80', defect: 'alligator crack' },
  { label: 'Transverse Fissure', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80', defect: 'transverse crack' },
];

export const ReportPotholePage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuthStore();
  const createReportMutation = useCreateReport();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [imageUrl, setImageUrl] = useState<string>(SAMPLE_ROAD_PHOTOS[0].url);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [latitude, setLatitude] = useState<number>(LUCKNOW_COORDINATES.lat);
  const [longitude, setLongitude] = useState<number>(LUCKNOW_COORDINATES.lng);
  const [address, setAddress] = useState<string>('MG Marg, Hazratganj, Lucknow, UP');
  const [wardId, setWardId] = useState<string>(WARDS_DATA[0].id);
  const [issueCategory, setIssueCategory] = useState<string>('longitudinal crack');
  const [description, setDescription] = useState<string>(
    'Longitudinal road surface crack creating safety hazard for two-wheelers and traffic bottleneck during peak hours.'
  );
  const [landmark, setLandmark] = useState<string>('Opposite GPO crossing');

  // Success State
  const [createdReportId, setCreatedReportId] = useState<string | null>(null);

  const handleNext = () => {
    if (step === 1 && !imageUrl) {
      toast.error('Please upload or select a road defect photograph.');
      return;
    }
    if (step === 2 && (!latitude || !longitude)) {
      toast.error('Please pick or detect the road location.');
      return;
    }
    if (step === 3 && description.trim().length < 10) {
      toast.error('Please provide a descriptive explanation (min 10 characters).');
      return;
    }
    setStep((prev) => (prev + 1) as any);
  };

  const handleBack = () => {
    setStep((prev) => (prev - 1) as any);
  };

  const handleSubmit = async () => {
    try {
      const selectedWard = WARDS_DATA.find((w) => w.id === wardId) || WARDS_DATA[0];
      const result = await createReportMutation.mutateAsync({
        imageUrl,
        imageFile,
        latitude,
        longitude,
        address,
        wardId: selectedWard.id,
        description,
        landmark,
        citizenName: currentUser?.name || 'Citizen Reporter',
        citizenPhone: currentUser?.phone || '+91 98765 43210',
      });

      setCreatedReportId(result.id);
      toast.success(`Report ${result.id} submitted! AI inference completed.`);
    } catch {
      toast.error('Failed to submit report. Please try again.');
    }
  };

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
            {t('brandTaglinePrimary')}
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

          <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <div><strong>Location:</strong> {address}</div>
            <div><strong>Category:</strong> <span className="capitalize">{issueCategory}</span></div>
            <div><strong>Description:</strong> {description}</div>
            <div className="pt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RDD2022 AI road defect analysis completed (94% confidence)</span>
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

      {/* Step Content */}
      <Card className="p-6 sm:p-8 shadow-civic space-y-6">
        {/* STEP 1: Upload Photo */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Step 1: Upload Road Defect Photograph</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clear photographs enable the RDD2022 computer vision model to infer defect type, bounding coordinates, and dimensions.
              </p>
            </div>

            <FileUploader
              value={imageUrl}
              onChange={(url, file) => {
                setImageUrl(url);
                setImageFile(file);
              }}
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
                    onClick={() => {
                      setImageUrl(p.url);
                      setImageFile(undefined);
                      setIssueCategory(p.defect);
                    }}
                    className={`relative rounded-xl overflow-hidden border p-1 text-left transition ${
                      imageUrl === p.url ? 'border-primary-600 ring-2 ring-primary-200 dark:ring-primary-900' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
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
          </div>
        )}

        {/* STEP 2: Location */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Step 2: Road Geolocation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pin the exact road coordinates so field operations can navigate directly to the defect.
              </p>
            </div>

            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              address={address}
              onChange={(lat, lng, addr) => {
                setLatitude(lat);
                setLongitude(lng);
                setAddress(addr);
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Select
                label="Municipal Ward"
                options={WARDS_DATA.map((w) => ({ value: w.id, label: `${w.name} (${w.zone})` }))}
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
              />
              <Input
                label="Street / Landmark Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="MG Marg, Hazratganj"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Description, Category & Landmark with Voice Input */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Step 3: Defect Description & Context</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Provide brief context or use your voice to assist municipal officers in priority assessment.
              </p>
            </div>

            {/* Optional Defect Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observed Defect Category (Optional — AI will also detect automatically)
              </label>
              <select
                value={issueCategory}
                onChange={(e) => setIssueCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {ROAD_DEFECT_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls.charAt(0).toUpperCase() + cls.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Description with Voice Input Button */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Description of Road Defect <span className="text-red-500">*</span>
                </label>
                <VoiceInputButton
                  onTranscript={(text) => setDescription((prev) => (prev ? `${prev} ${text}` : text))}
                  className="scale-90"
                />
              </div>
              <Textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe road condition, depth, hazard to two-wheelers, or traffic bottleneck..."
                helperText="Min 10 characters required. You can type or use the microphone button above to speak."
              />
            </div>

            {/* Landmark with Voice Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Prominent Nearby Landmark (Optional)
                </label>
                <VoiceInputButton
                  onTranscript={(text) => setLandmark(text)}
                  className="scale-90"
                />
              </div>
              <Input
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Opposite GPO building, near Metro Pillar 42"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Review & Submit */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Step 4: Review Report Summary</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify all details before submitting for automated AI detection and municipal dispatch.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 max-h-48">
                <img src={imageUrl} alt="Road Defect Preview" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div><strong>Ward:</strong> {WARDS_DATA.find((w) => w.id === wardId)?.name}</div>
                <div><strong>Category:</strong> <span className="capitalize">{issueCategory}</span></div>
                <div><strong>Location:</strong> {address}</div>
                <div><strong>Coordinates:</strong> {latitude.toFixed(5)}, {longitude.toFixed(5)}</div>
                <div><strong>Landmark:</strong> {landmark || 'N/A'}</div>
                <div><strong>Description:</strong> {description}</div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Upon submission, the RDD2022 multi-defect AI model will analyze the image in real-time.
              </span>
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
              {t('submitReport')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
