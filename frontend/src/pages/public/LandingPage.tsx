import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CivicMap } from '../../components/maps/CivicMap';
import { useReports } from '../../hooks/useReports';
import { ANNOUNCEMENTS_MOCK } from '../../constants';
import {
  Camera,
  Cpu,
  Wrench,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Compass,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

interface DefectDetail {
  id: string;
  num: string;
  name: string;
  technicalTerm: string;
  description: string;
  typicalCause: string;
  severityProfile: string;
  remedy: string;
  sampleImg: string;
}

const DEFECT_TAXONOMY: DefectDetail[] = [
  {
    id: 'longitudinal-crack',
    num: '01',
    name: 'Longitudinal Crack',
    technicalTerm: 'Linear Pavement Cleavage',
    description: 'Cracks running parallel to the direction of vehicle travel, typically along lane boundaries, wheel paths, or paving joints.',
    typicalCause: 'Poor joint construction, asphalt shrinkage, or localized subgrade settlement.',
    severityProfile: 'Moderate risk to two-wheelers; water infiltration accelerates base erosion.',
    remedy: 'High-pressure air cleaning + elastomeric hot-pour crack sealant.',
    sampleImg: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'transverse-crack',
    num: '02',
    name: 'Transverse Crack',
    technicalTerm: 'Perpendicular Thermal Fissure',
    description: 'Cracks running roughly perpendicular to the roadway centerline across the travel lanes.',
    typicalCause: 'Thermal contraction of asphalt binder during seasonal temperature drops.',
    severityProfile: 'Creates ride roughness; causes water pooling if unsealed.',
    remedy: 'Milling of fractured edges + rubberized bitumen filling.',
    sampleImg: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'alligator-crack',
    num: '03',
    name: 'Alligator Crack',
    technicalTerm: 'Interconnected Fatigue Cracking',
    description: 'A series of interconnected cracks resembling the pattern on an alligator hide or chicken wire.',
    typicalCause: 'Structural base failure under repeated heavy wheel loads and poor subgrade support.',
    severityProfile: 'Critical failure indicator; rapid evolution into deep potholes if left unattended.',
    remedy: 'Full-depth pavement patch + subgrade stabilization.',
    sampleImg: 'https://images.unsplash.com/photo-1584463699039-38c6d71b5634?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'other-corruption',
    num: '04',
    name: 'Other Corruption',
    technicalTerm: 'Surface Raveling & Delamination',
    description: 'Surface disintegration including aggregate loss, stripping, edge break, and asphalt bleeding.',
    typicalCause: 'Oxidation of binder, inadequate compaction, or diesel fuel spillage.',
    severityProfile: 'Reduced skid resistance and loose gravel hazard for braking vehicles.',
    remedy: 'Micro-surfacing overlay or localized surface planing.',
    sampleImg: 'https://images.unsplash.com/photo-1578983427937-26078ee3d9d3?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'pothole',
    num: '05',
    name: 'Pothole',
    technicalTerm: 'Localized Pavement Depression / Cavity',
    description: 'Bowl-shaped holes of various sizes in the pavement surface extending into the base layer.',
    typicalCause: 'Water penetration into sub-base followed by repeated traffic impact.',
    severityProfile: 'Immediate hazard to motorists, tyre blowouts, two-wheeler accidents.',
    remedy: 'Cold/hot asphalt mix compaction + edge tack sealing.',
    sampleImg: 'https://images.unsplash.com/photo-1578983427937-26078ee3d9d3?w=800&auto=format&fit=crop&q=80',
  },
];

export const LandingPage: React.FC = () => {
  const { data: reportsResult } = useReports({ limit: 6 });
  const previewReports = reportsResult?.data || [];

  const [activeDefectIndex, setActiveDefectIndex] = useState<number>(0);
  const selectedDefect = DEFECT_TAXONOMY[activeDefectIndex];

  return (
    <div className="space-y-20 pb-20 overflow-hidden">
      {/* 1. HERO SECTION: Clean, Editorial, Civic Authority */}
      <section className="relative bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Lucknow Municipal Road Intelligence System</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white font-sans leading-[1.1]">
                  Report a road issue.
                  <span className="block text-amber-400 font-extrabold mt-1">
                    NagarSam AI turns it into action.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                  AI-powered road infrastructure intelligence for photographic detection, spatial impact prioritization, municipal dispatch, and dual-verified repair closure.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link to="/citizen/report">
                  <Button
                    variant="accent"
                    size="lg"
                    className="w-full sm:w-auto font-semibold px-6 shadow-sm"
                    leftIcon={<Camera className="w-5 h-5" />}
                  >
                    Report a Road Issue
                  </Button>
                </Link>
                <Link to="/map">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                    leftIcon={<Compass className="w-5 h-5" />}
                  >
                    Explore Civic Map
                  </Button>
                </Link>
              </div>

              {/* Restrained Operational Metrics Bar */}
              <div className="pt-6 border-t border-slate-800 grid grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-bold text-white font-mono">30+</div>
                  <div className="text-xs text-slate-400 font-medium">Monitored Hotspots</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">94.2%</div>
                  <div className="text-xs text-slate-400 font-medium">RDD2022 AI Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-400 font-mono">18.4h</div>
                  <div className="text-xs text-slate-400 font-medium">Average Repair Cycle</div>
                </div>
              </div>
            </div>

            {/* Right: Operational Pipeline Snapshot */}
            <div className="lg:col-span-5">
              <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Live Operational Pipeline</span>
                  </div>
                  <Badge variant="outline" size="sm" className="text-slate-400 border-slate-700 font-mono text-[10px]">
                    LKO-OPS-891
                  </Badge>
                </div>

                {/* Pipeline Stages */}
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-200">1. Citizen Submission</div>
                      <div className="text-slate-400 text-[11px]">Hazratganj MG Marg · GPS (26.8467, 80.9462)</div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-200">2. Multi-Class CV Inference</div>
                      <div className="text-slate-400 text-[11px]">Identified: Pothole (96% Conf) + Alligator Crack</div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
                      78ms
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-200">3. Priority Assessment: P0 Critical</div>
                      <div className="text-slate-400 text-[11px]">Transit Bus Corridor · High Traffic Impact</div>
                    </div>
                    <span className="text-[10px] font-semibold text-red-400 bg-red-950/60 border border-red-800/60 px-1.5 py-0.5 rounded">
                      Urgent
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-200">4. Work Order Dispatched</div>
                      <div className="text-slate-400 text-[11px]">Field Unit #4 (Er. Rameshwar) · Asphalt Mix</div>
                    </div>
                    <Wrench className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Transparent Public Audit Trail</span>
                  <Link to="/how-it-works" className="text-primary-400 hover:text-primary-300 font-medium">
                    Learn workflow →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SUPPORTED ROAD DEFECT TAXONOMY (01–05 Editorial Index) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-3xl space-y-2">
          <Badge variant="secondary" size="sm">RDD2022 AI Detection Standard</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Multi-Class Road Defect Intelligence
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            NagarSam AI classifies road infrastructure degradation into five distinct engineering categories, ensuring appropriate material selection and repair prioritization.
          </p>
        </div>

        {/* Editorial Layout: Left Index + Right Technical Detail Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 01-05 Index List */}
          <div className="lg:col-span-5 space-y-2">
            {DEFECT_TAXONOMY.map((defect, idx) => {
              const isActive = activeDefectIndex === idx;
              return (
                <div
                  key={defect.id}
                  onClick={() => setActiveDefectIndex(idx)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-primary-900 text-white border-primary-900 shadow-md'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-sm font-bold ${isActive ? 'text-amber-400' : 'text-slate-400'}`}>
                      {defect.num}
                    </span>
                    <div>
                      <div className="font-semibold text-sm">{defect.name}</div>
                      <div className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                        {defect.technicalTerm}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-300'}`} />
                </div>
              );
            })}
          </div>

          {/* Right: Selected Category Details Panel */}
          <div className="lg:col-span-7">
            <Card className="p-6 sm:p-8 space-y-6 border-slate-200 shadow-civic">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-primary-700">
                    CLASS {selectedDefect.num} / 05
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{selectedDefect.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedDefect.technicalTerm}</p>
                </div>
                <Badge variant="accent" size="sm">RDD2022 Certified</Badge>
              </div>

              {/* Sample Photo Preview */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-52">
                <img
                  src={selectedDefect.sampleImg}
                  alt={selectedDefect.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md font-mono">
                  Visual Pattern: {selectedDefect.name}
                </div>
              </div>

              {/* Technical Profile Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-800">Visual Pattern & Behavior</div>
                  <p className="text-slate-600 leading-relaxed">{selectedDefect.description}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-800">Typical Root Cause</div>
                  <p className="text-slate-600 leading-relaxed">{selectedDefect.typicalCause}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-800">Operational Risk Profile</div>
                  <p className="text-slate-600 leading-relaxed">{selectedDefect.severityProfile}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-800">Prescribed Engineering Remedy</div>
                  <p className="text-slate-600 leading-relaxed">{selectedDefect.remedy}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. OPERATIONAL WORKFLOW (Citizen -> Officer -> Worker -> AI Verification) */}
      <section className="bg-slate-100/80 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <Badge variant="primary" size="sm">End-to-End Governance</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              The NagarSam Operational Flow
            </h2>
            <p className="text-sm text-slate-600">
              Four specialized participant roles connected by transparent status milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stage 1: Citizen */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Camera className="w-5 h-5" />
              </div>
              <div className="font-mono text-xs font-bold text-slate-400">01 / CITIZEN</div>
              <h4 className="font-bold text-slate-900 text-base">Capture & Report</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Citizens photograph road defects and provide GPS coordinates or voice descriptions with instant ticket confirmation.
              </p>
            </div>

            {/* Stage 2: AI Inference & Triage */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="font-mono text-xs font-bold text-slate-400">02 / AI SYSTEM</div>
              <h4 className="font-bold text-slate-900 text-base">Classify & Prioritize</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Computer vision detects defect bounding boxes while GIS engines calculate transit corridor priority scores.
              </p>
            </div>

            {/* Stage 3: Field Worker */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="font-mono text-xs font-bold text-slate-400">03 / FIELD CREW</div>
              <h4 className="font-bold text-slate-900 text-base">Repair & Document</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Assigned road maintenance crews navigate to coordinates, execute road repairs, and upload completion photos.
              </p>
            </div>

            {/* Stage 4: Officer & Dual Verification */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="font-mono text-xs font-bold text-slate-400">04 / VERIFICATION</div>
              <h4 className="font-bold text-slate-900 text-base">Verify & Resolve</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated post-repair defect elimination scoring provides supervisory oversight before ticket closure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. AI TRANSPARENCY & EXPLAINABILITY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 border border-slate-800 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <Badge variant="accent" size="sm">Auditable Governance</Badge>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Explainable AI, Not a Black Box
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                NagarSam AI never conceals municipal decision logic. Priority calculations evaluate transparent, measurable operational factors:
              </p>

              <div className="space-y-3 text-xs text-slate-300 pt-2">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Defect Severity & Dimensions (35%):</strong> Evaluates cavity surface area and depth ratio via RDD2022 object detection.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Transit Corridor Weighting (30%):</strong> Prioritizes bus routes, ambulance hospital corridors, and major arterial roads.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Citizen Corroboration (20%):</strong> Multi-report cluster density elevates repeated hazards in high-footfall zones.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Waterlogging Vulnerability (15%):</strong> Evaluates monsoon pooling history to prevent base erosion.
                  </div>
                </div>
              </div>
            </div>

            {/* Inference Contract Format */}
            <div className="lg:col-span-6">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>AI Inference Result Schema</span>
                  <span className="text-emerald-400 text-[10px]">RDD2022-v1.4</span>
                </div>
                <pre className="text-[11px] text-slate-300 overflow-x-auto leading-relaxed pt-1">
{`{
  "model": "rdd2022-yolov8x",
  "inference_latency_ms": 84,
  "detections": [
    {
      "class": "Pothole",
      "confidence": 0.962,
      "bounding_box": [140, 210, 480, 560],
      "estimated_area_sqm": 0.42
    }
  ],
  "priority_score": 8.8,
  "factors": [
    "Arterial bus corridor (Hazratganj)",
    "Severe cavity edge depth",
    "3 corroborated citizen reports"
  ],
  "human_review_required": false
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LIVE CIVIC MAP PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <Badge variant="secondary" size="sm">Lucknow Municipal GIS</Badge>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Live Civic Hotspots Map</h2>
            <p className="text-xs text-slate-500">
              Interactive geographic preview of active road issues, triage statuses, and active repair crews.
            </p>
          </div>
          <Link to="/map">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open Fullscreen GIS Map
            </Button>
          </Link>
        </div>

        <CivicMap items={previewReports} height="380px" />
      </section>

      {/* 6. MUNICIPAL NOTICES & ANNOUNCEMENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="primary" size="sm">Public Advisories</Badge>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Official Municipal Road Notices</h2>
          </div>
          <Link to="/announcements" className="text-xs font-semibold text-primary-700 hover:underline flex items-center gap-1">
            <span>View All Notices</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ANNOUNCEMENTS_MOCK.map((ann) => (
            <Card key={ann.id} className="p-5 hover:border-slate-300 transition space-y-2 border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <Badge variant="accent" size="sm">{ann.badge}</Badge>
                <span className="text-[11px] text-slate-400">{ann.date}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{ann.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{ann.summary}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 7. CLEAN CIVIC ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 text-center space-y-4 border border-slate-800">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
            See a damaged road or hazard on your commute?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Submit a photograph with geolocation. NagarSam AI immediately routes verified defects to the appropriate municipal repair unit.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to="/citizen/report">
              <Button variant="accent" size="lg" className="font-semibold shadow-sm">
                Report a Road Issue
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-white border-slate-700 bg-slate-800 hover:bg-slate-700">
                Staff & Officer Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

