'use client';

import type { AssigneeTaskLoadResponse } from '@/connectors/api/pecus';

/** 負荷レベルの型 */
type WorkloadLevel = 'Low' | 'Medium' | 'High' | 'Overloaded';

interface WorkloadIndicatorProps {
  /** 負荷情報 */
  workload: AssigneeTaskLoadResponse;
  /** コンパクト表示（バッジのみ） */
  compact?: boolean;
  /** サイズ */
  size?: 'sm' | 'md';
}

/**
 * 負荷レベルに応じたスタイルを取得
 */
function getWorkloadStyles(level: WorkloadLevel) {
  switch (level) {
    case 'Overloaded':
      return {
        badge: 'badge-error',
        text: 'text-error',
        icon: 'icon-[mdi--alert-octagon]',
        label: '過負荷',
      };
    case 'High':
      return {
        badge: 'badge-warning',
        text: 'text-warning',
        icon: 'icon-[mdi--alert-circle-outline]',
        label: '高',
      };
    case 'Medium':
      return {
        badge: 'badge-info',
        text: 'text-info',
        icon: 'icon-[mdi--information-outline]',
        label: '中',
      };
    default:
      return {
        badge: 'badge-success',
        text: 'text-success',
        icon: 'icon-[mdi--check-circle-outline]',
        label: '低負荷',
      };
  }
}

/**
 * メンバーの負荷状況を表示するインジケーター
 */
export default function WorkloadIndicator({ workload, compact = false, size = 'sm' }: WorkloadIndicatorProps) {
  const level = (workload.workloadLevel as WorkloadLevel) || 'Low';
  const styles = getWorkloadStyles(level);

  // ツールチップ用の詳細情報を構築
  const buildTooltip = () => {
    const parts: string[] = [`負荷: ${styles.label}`];
    if ((workload.overdueCount ?? 0) > 0) {
      parts.push(`期限切れ: ${workload.overdueCount}件`);
    }
    if ((workload.dueTodayCount ?? 0) > 0) {
      parts.push(`今日期限: ${workload.dueTodayCount}件`);
    }
    if ((workload.dueThisWeekCount ?? 0) > 0) {
      parts.push(`今週期限: ${workload.dueThisWeekCount}件`);
    }
    if ((workload.totalActiveCount ?? 0) > 0) {
      parts.push(`アクティブタスク: ${workload.totalActiveCount}件`);
    }
    if ((workload.activeWorkspaceCount ?? 0) > 0) {
      parts.push(`他ワークスペース: ${workload.activeWorkspaceCount}`);
    }
    return parts.join('\n');
  };

  if (compact) {
    // コンパクト表示：バッジのみ（詳細はツールチップ）
    return (
      <span className={`badge ${styles.badge} ${size === 'sm' ? 'badge-sm' : ''}`} title={buildTooltip()}>
        {styles.label}
      </span>
    );
  }

  // 詳細表示
  return (
    <div className="flex flex-col gap-0.5">
      {/* 負荷レベルバッジ */}
      <div className="flex items-center gap-1">
        <span className={`${styles.icon} ${size === 'sm' ? 'size-3' : 'size-4'}`} aria-hidden="true" />
        <span className={`badge ${styles.badge} ${size === 'sm' ? 'badge-xs' : 'badge-sm'}`}>{styles.label}</span>
      </div>

      {/* 詳細情報 */}
      <div className={`flex flex-wrap gap-x-2 ${size === 'sm' ? 'text-[10px]' : 'text-xs'} text-base-content/60`}>
        {(workload.overdueCount ?? 0) > 0 && <span className="text-error font-medium">⚠️{workload.overdueCount}</span>}
        <span title="今週期限">📅{workload.dueThisWeekCount ?? 0}</span>
        <span title="ワークスペース横断">🔀{workload.activeWorkspaceCount ?? 0}</span>
      </div>
    </div>
  );
}

/**
 * 負荷レベルバッジのみ（最小表示）
 */
export function WorkloadBadge({
  level,
  size = 'sm',
}: {
  level: WorkloadLevel | string | undefined;
  size?: 'sm' | 'md';
}) {
  const safeLevel = (level as WorkloadLevel) || 'Low';
  const styles = getWorkloadStyles(safeLevel);

  return (
    <span
      className={`badge ${styles.badge} ${size === 'sm' ? 'badge-xs' : 'badge-sm'}`}
      title={`負荷: ${styles.label}`}
    >
      {styles.label}
    </span>
  );
}
