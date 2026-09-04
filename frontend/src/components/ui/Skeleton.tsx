import React from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  ...props
}) => {
  const variants = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={cn('animate-pulse bg-slate-200/80', variants[variant], className)}
      {...props}
    />
  );
};

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading civic intelligence data...',
  className,
}) => {
  return (
    <div className={cn('py-12 flex flex-col items-center justify-center text-center space-y-3', className)}>
      <div className="w-10 h-10 rounded-full border-3 border-primary-200 border-t-primary-600 animate-spin" />
      <p className="text-sm font-medium text-slate-600 animate-pulse">{message}</p>
    </div>
  );
};
