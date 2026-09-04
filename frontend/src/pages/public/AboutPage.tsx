import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { APP_NAME } from '../../constants';
import { Brain, Users, Lock, Eye, Compass } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <Breadcrumbs items={[{ label: 'About NagarSam AI' }]} />

      <div className="max-w-3xl space-y-3">
        <Badge variant="primary" size="md">Civic Platform Mission</Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          About {APP_NAME}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          NagarSam AI (derived from <em>Nagar</em> [city] + <em>Sam</em> [collective civic action]) is an AI-powered civic infrastructure intelligence framework designed to make municipal road repairs faster, transparent, and auditable.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="space-y-3">
          <div className="p-3 rounded-xl bg-primary-50 text-primary-700 w-fit">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">The Problem We Address</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            In growing urban centers like Lucknow, road defects such as potholes and surface erosion cause vehicle damage, traffic congestion, and severe safety hazards. Traditional complaint portals often suffer from lack of geolocation accuracy, subjective priority assessment, and absence of post-repair verification.
          </p>
        </Card>

        <Card className="space-y-3">
          <div className="p-3 rounded-xl bg-secondary-50 text-secondary-700 w-fit">
            <Brain className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Our AI-Assisted Solution</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            NagarSam AI couples lightweight computer vision (RDD2022 object detection) with GIS spatial clustering. By analyzing defect dimensions, transit corridor importance, and independent corroborations, the platform generates explainable priority rankings for municipal dispatch.
          </p>
        </Card>
      </div>

      {/* Core Principles */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 space-y-6">
        <div className="space-y-1">
          <Badge variant="accent" size="sm">Operational Principles</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Built on Public Trust & Human Oversight
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="space-y-2 p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Full Transparency</span>
            </div>
            <p className="leading-relaxed">
              Every inference score, bounding box, and priority reasoning factor is fully visible to citizens and municipal supervisors.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Human in the Loop</span>
            </div>
            <p className="leading-relaxed">
              AI provides assistive recommendations; final work order assignments, budget allocations, and official closure remain under municipal authority.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Lock className="w-4 h-4 text-primary-400" />
              <span>Immutable Audit Logs</span>
            </div>
            <p className="leading-relaxed">
              Every status change, assignment, repair submission, and verification check is logged to an immutable administrative trail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
