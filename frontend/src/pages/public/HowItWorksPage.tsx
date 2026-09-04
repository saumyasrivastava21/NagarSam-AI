import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import {
  Camera,
  Cpu,
  Layers,
  Flame,
  Wrench,
  ShieldCheck,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Citizen Discovery & Submission',
      subtitle: 'Photographic evidence + precise GPS tagging',
      desc: 'A citizen spots a road defect and submits a photo via smartphone or desktop. Geolocation is extracted via browser GPS or pinned on the map.',
      icon: <Camera className="w-6 h-6 text-primary-600" />,
      tag: 'Citizen Action',
    },
    {
      step: '02',
      title: 'RDD2022 AI Surface Inference',
      subtitle: 'Bounding box generation & confidence scoring',
      desc: 'The RDD2022 computer vision model detects road cavities, fissures, and surface erosion, providing confidence metrics (e.g., 94%) in sub-100ms.',
      icon: <Cpu className="w-6 h-6 text-secondary-600" />,
      tag: 'AI Detection',
    },
    {
      step: '03',
      title: 'Spatial Intelligence & Clustering',
      subtitle: 'Transit corridor & duplicate deduplication',
      desc: 'The GIS spatial engine correlates incoming reports with ward road networks, public transit routes, school zones, and previous maintenance records.',
      icon: <Layers className="w-6 h-6 text-amber-600" />,
      tag: 'GIS Analytics',
    },
    {
      step: '04',
      title: 'Explainable Priority Escalation',
      subtitle: 'P0 Immediate to P3 Scheduled Maintenance',
      desc: 'Rather than arbitrary queues, priority is calculated using cavity area, traffic density, and corroborated citizen counts, presented clearly to officers.',
      icon: <Flame className="w-6 h-6 text-red-600" />,
      tag: 'Operational Triage',
    },
    {
      step: '05',
      title: 'Municipal Assignment & Field Execution',
      subtitle: 'Work order dispatch to zone workers',
      desc: 'Supervising officers dispatch a formal work order to field maintenance units. Workers acknowledge tasks on outdoor-friendly mobile interfaces.',
      icon: <Wrench className="w-6 h-6 text-primary-600" />,
      tag: 'Field Repair',
    },
    {
      step: '06',
      title: 'Dual Verification & Case Closure',
      subtitle: 'Post-repair photo scoring + supervisor sign-off',
      desc: 'After patch completion, the field worker uploads an "after" photograph. AI verifies defect eradication before municipal supervisor closes the ticket.',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      tag: 'Verification & Closure',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <Breadcrumbs items={[{ label: 'How It Works' }]} />

      <div className="max-w-3xl space-y-3">
        <Badge variant="primary" size="md">Step-by-Step Architecture</Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          How NagarSam AI Operates
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Explore the transparent six-stage workflow that transforms citizen reports into verified municipal road repairs.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((s) => (
          <Card key={s.step} className="p-6 hover:border-primary-300 transition shadow-civic">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-1 flex items-center justify-center">
                <span className="text-3xl font-black text-slate-300 font-sans">{s.step}</span>
              </div>
              <div className="md:col-span-8 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" size="sm">{s.tag}</Badge>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-500 font-medium">{s.subtitle}</p>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">{s.desc}</p>
              </div>
              <div className="md:col-span-3 flex justify-start md:justify-end">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-2xs">
                  {s.icon}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-primary-900 text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-xl font-bold">Ready to submit a road defect report?</h4>
          <p className="text-xs text-slate-300">Fast, accessible, and tracked from submission to closure.</p>
        </div>
        <Link to="/citizen/report">
          <Button variant="accent" size="lg" className="font-bold shrink-0">
            Submit Citizen Report
          </Button>
        </Link>
      </div>
    </div>
  );
};
