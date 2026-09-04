import React from 'react';
import { Card } from './Card';
import { cn } from '../../utils/cn';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'default';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className,
}) => {
  const iconBgs = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400',
    secondary: 'bg-secondary-50 text-secondary-600 dark:bg-secondary-950 dark:text-secondary-400',
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-950 dark:text-accent-400',
    danger: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <Card className={cn('relative overflow-hidden transition-all hover:shadow-civic-md', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <div className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">{value}</div>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {icon && (
          <div className={cn('p-2.5 rounded-xl shrink-0 flex items-center justify-center', iconBgs[variant])}>
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-medium">
          <span className={trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger-600 dark:text-danger-400'}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
          {trend.label && <span className="text-slate-400 dark:text-slate-500">{trend.label}</span>}
        </div>
      )}
    </Card>
  );
};

