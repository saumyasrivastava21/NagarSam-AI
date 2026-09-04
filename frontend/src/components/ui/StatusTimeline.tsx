import React from 'react';
import { TimelineEvent } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { CheckCircle2, Clock, CircleDot, AlertCircle, Wrench, ShieldCheck, UserCheck } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StatusTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ events, className }) => {
  const getIcon = (status: string, isLatest: boolean) => {
    if (status === 'RESOLVED') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (status === 'VERIFYING') return <ShieldCheck className="w-4 h-4 text-blue-600" />;
    if (status === 'IN_PROGRESS') return <Wrench className="w-4 h-4 text-amber-600" />;
    if (status === 'ASSIGNED') return <UserCheck className="w-4 h-4 text-secondary-600" />;
    if (status === 'REJECTED' || status === 'REOPENED') return <AlertCircle className="w-4 h-4 text-red-600" />;
    if (isLatest) return <CircleDot className="w-4 h-4 text-primary-600 animate-pulse" />;
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  const getDotBg = (status: string, isLatest: boolean) => {
    if (status === 'RESOLVED') return 'bg-emerald-100 border-emerald-300';
    if (status === 'VERIFYING') return 'bg-blue-100 border-blue-300';
    if (status === 'IN_PROGRESS') return 'bg-amber-100 border-amber-300';
    if (status === 'ASSIGNED') return 'bg-teal-100 border-teal-300';
    if (status === 'REJECTED') return 'bg-red-100 border-red-300';
    if (isLatest) return 'bg-primary-100 border-primary-400 ring-4 ring-primary-50';
    return 'bg-slate-100 border-slate-300';
  };

  return (
    <div className={cn('relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200', className)}>
      {events.map((event, index) => {
        const isLatest = index === events.length - 1;
        return (
          <div key={event.id || index} className="relative group">
            {/* Dot Icon */}
            <div
              className={cn(
                'absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center -translate-x-1/2 bg-white transition-all',
                getDotBg(event.status, isLatest)
              )}
            >
              {getIcon(event.status, isLatest)}
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs hover:border-primary-200 transition">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <h5 className="text-sm font-bold text-slate-900">{event.title}</h5>
                <span className="text-[11px] font-medium text-slate-500">
                  {formatDateTime(event.timestamp)}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{event.description}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <span className="font-semibold text-slate-700">{event.actor}</span>
                <span>({event.actorRole})</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
