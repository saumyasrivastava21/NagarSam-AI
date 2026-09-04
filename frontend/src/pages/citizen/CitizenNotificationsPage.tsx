import React from 'react';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { formatTimeAgo } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { Check, CheckCircle2, AlertTriangle, Info, ExternalLink } from 'lucide-react';

export const CitizenNotificationsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  const getIcon = (type: string) => {
    if (type === 'SUCCESS') return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    if (type === 'ALERT' || type === 'WARNING') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <Info className="w-5 h-5 text-primary-600" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumbs items={[{ label: 'Citizen Portal', href: '/citizen' }, { label: 'Notifications' }]} />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Notifications & Lifecycle Alerts
          </h1>
          <p className="text-xs text-slate-500">
            Real-time updates regarding your submissions, AI triage events, and repair completions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllAsRead(currentUser?.id)}
          leftIcon={<Check className="w-4 h-4" />}
        >
          Mark All Read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400">
            No notifications logged at this time.
          </Card>
        ) : (
          notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 transition flex items-start gap-4 ${
                n.read ? 'bg-white' : 'bg-primary-50/50 border-primary-200'
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[11px] text-slate-400">{formatTimeAgo(n.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                {n.linkUrl && (
                  <div className="pt-2">
                    <Link
                      to={n.linkUrl}
                      onClick={() => !n.read && markAsRead(n.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:underline"
                    >
                      <span>Open Associated Record</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
