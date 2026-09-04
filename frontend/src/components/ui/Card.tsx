import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'outline' | 'interactive';
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  header,
  footer,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-civic text-slate-900 dark:text-slate-100',
    muted: 'bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs text-slate-900 dark:text-slate-100',
    outline: 'bg-transparent border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100',
    interactive:
      'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-civic hover:shadow-civic-md hover:border-primary-300 dark:hover:border-primary-500 transition-all duration-200 cursor-pointer text-slate-900 dark:text-slate-100',
  };

  return (
    <div className={cn('rounded-xl overflow-hidden', variants[variant], className)} {...props}>
      {header && <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">{header}</div>}
      <div className="p-5">{children}</div>
      {footer && <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">{footer}</div>}
    </div>
  );
};

