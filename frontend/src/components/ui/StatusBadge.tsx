import React from 'react';
import { Badge } from './Badge';
import { useTranslation } from '../../i18n';
import { ReportStatus, WorkOrderStatus, Severity, Priority } from '../../types';
import { REPORT_STATUS_LABELS, WORK_ORDER_STATUS_LABELS, SEVERITY_CONFIG, PRIORITY_CONFIG } from '../../constants';

export interface StatusBadgeProps {
  status?: ReportStatus;
  workOrderStatus?: WorkOrderStatus;
  severity?: Severity;
  priority?: Priority;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  workOrderStatus,
  severity,
  priority,
  size = 'md',
  className,
}) => {
  const { t } = useTranslation();

  if (status) {
    const config = REPORT_STATUS_LABELS[status] || { label: status, variant: 'default' };
    const translatedLabel = t(`status${status}` as any, config.label);
    return (
      <Badge variant={config.variant} size={size} dot className={className}>
        {translatedLabel}
      </Badge>
    );
  }

  if (workOrderStatus) {
    const config = WORK_ORDER_STATUS_LABELS[workOrderStatus] || { label: workOrderStatus, variant: 'default' };
    const translatedLabel = t(`status${workOrderStatus}` as any, config.label);
    return (
      <Badge variant={config.variant} size={size} dot className={className}>
        {translatedLabel}
      </Badge>
    );
  }

  if (severity) {
    const config = SEVERITY_CONFIG[severity] || { label: severity };
    const variantMap: Record<Severity, 'danger' | 'warning' | 'accent' | 'success'> = {
      CRITICAL: 'danger',
      HIGH: 'warning',
      MEDIUM: 'accent',
      LOW: 'success',
    };
    const translatedSeverity = t(`severity${severity}` as any, config.label);
    return (
      <Badge variant={variantMap[severity]} size={size} dot className={className}>
        {translatedSeverity}
      </Badge>
    );
  }

  if (priority) {
    const config = PRIORITY_CONFIG[priority] || { label: priority };
    const variantMap: Record<Priority, 'danger' | 'warning' | 'accent' | 'success'> = {
      CRITICAL: 'danger',
      HIGH: 'warning',
      MEDIUM: 'accent',
      LOW: 'success',
    };
    const translatedPriority = t(`priority${priority}` as any, config.label);
    return (
      <Badge variant={variantMap[priority]} size={size} dot className={className}>
        {translatedPriority}
      </Badge>
    );
  }

  return null;
};
