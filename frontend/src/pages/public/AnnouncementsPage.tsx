import React from 'react';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ANNOUNCEMENTS_MOCK } from '../../constants';
import { Bell, Calendar } from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Announcements & Notices' }]} />

      <div className="max-w-3xl space-y-2">
        <Badge variant="primary" size="md">Public Communications</Badge>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Municipal Advisories & Public Notices
        </h1>
        <p className="text-sm text-slate-600">
          Official maintenance advisories, weather resilience updates, and road repair drive notifications.
        </p>
      </div>

      <div className="space-y-6">
        {ANNOUNCEMENTS_MOCK.map((item) => (
          <Card key={item.id} className="p-6 space-y-4 hover:border-primary-300 transition shadow-civic">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-50 text-primary-700">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{item.title}</h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="accent" size="sm">{item.badge}</Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.date}</span>
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {item.summary}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 leading-relaxed">
              {item.content}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
