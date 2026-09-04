import React from 'react';
import { cn } from '../../utils/cn';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const inputId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex items-start gap-3">
        <div className="flex items-center h-5">
          <input
            id={inputId}
            type="checkbox"
            ref={ref}
            className={cn(
              'h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 transition cursor-pointer',
              error && 'border-red-300',
              className
            )}
            {...props}
          />
        </div>
        <div className="text-sm">
          <label htmlFor={inputId} className="font-medium text-slate-800 select-none cursor-pointer">
            {label}
          </label>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          {error && <p className="text-xs text-danger-600 mt-1">{error}</p>}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
