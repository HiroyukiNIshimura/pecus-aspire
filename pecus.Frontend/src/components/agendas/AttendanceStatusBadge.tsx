'use client';

import type { AttendanceStatus } from '@/connectors/api/pecus';

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<AttendanceStatus, { label: string; className: string; icon: string }> = {
  Pending: { label: '未回答', className: 'badge-neutral', icon: 'icon-[tabler--clock]' },
  Accepted: { label: '参加', className: 'badge-success', icon: 'icon-[tabler--check]' },
  Tentative: { label: '仮', className: 'badge-warning', icon: 'icon-[tabler--help]' },
  Declined: { label: '不参加', className: 'badge-error', icon: 'icon-[tabler--x]' },
};

export function AttendanceStatusBadge({ status, size = 'md' }: AttendanceStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = size === 'sm' ? 'badge-sm' : '';
  const iconSize = size === 'sm' ? 'size-3' : 'size-4';

  return (
    <span className={`badge ${config.className} ${sizeClass} gap-1`}>
      <span className={`${config.icon} ${iconSize}`} />
      {config.label}
    </span>
  );
}
