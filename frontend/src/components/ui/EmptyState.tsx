import React from 'react';
import { Button } from './Button';
import { Inbox, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no active records matching your current filters or query.',
  icon,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 text-center flex flex-col items-center justify-center space-y-3',
        className
      )}
    >
      <div className="p-3 rounded-full bg-slate-100 text-slate-400">
        {icon || <Inbox className="w-8 h-8 stroke-[1.5]" />}
      </div>
      <div className="max-w-md space-y-1">
        <h4 className="text-base font-semibold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load information',
  description = 'A system or network interruption occurred. Please verify your connection or retry.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-8 rounded-2xl border border-red-200 bg-red-50/40 text-center flex flex-col items-center justify-center space-y-3',
        className
      )}
    >
      <div className="p-3 rounded-full bg-red-100 text-red-600">
        <AlertCircle className="w-8 h-8 stroke-[1.5]" />
      </div>
      <div className="max-w-md space-y-1">
        <h4 className="text-base font-bold text-red-900">{title}</h4>
        <p className="text-xs text-red-700 leading-relaxed">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 border-red-300 hover:bg-red-50">
          Try Again
        </Button>
      )}
    </div>
  );
};
