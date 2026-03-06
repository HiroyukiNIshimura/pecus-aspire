'use client';

import { useEffect, useRef } from 'react';
import type { AssigneeTaskLoadResponse } from '@/connectors/api/pecus';

/** 負荷レベルの型 */
type WorkloadLevel = 'Low' | 'Medium' | 'High' | 'Overloaded';

export interface UserWorkloadPopoverProps {
  /** ポップオーバー表示状態 */
  isOpen: boolean;
  /** 閉じるコールバック */
  onClose: () => void;
  /** 対象ユーザー名 */
  userName: string;
  /** 負荷情報 */
  workload: AssigneeTaskLoadResponse;
  /** アンカー要素の位置情報 */
  anchorRect?: DOMRect | null;
}

/** 負荷レベルの表示設定 */
const workloadConfig: Record<WorkloadLevel, { label: string; badgeClass: string; icon: string }> = {
  Low: {
    label: '低負荷',
    badgeClass: 'badge-success badge-soft',
    icon: 'icon-[mdi--check-circle-outline]',
  },
  Medium: {
    label: '中負荷',
    badgeClass: 'badge-info badge-soft',
    icon: 'icon-[mdi--information-outline]',
  },
  High: {
    label: '高負荷',
    badgeClass: 'badge-warning badge-soft',
    icon: 'icon-[mdi--alert-circle-outline]',
  },
  Overloaded: {
    label: '過負荷',
    badgeClass: 'badge-error badge-soft',
    icon: 'icon-[mdi--alert-octagon]',
  },
};

/** フォールバック設定 */
const defaultWorkloadConfig = workloadConfig.Low;

/** 負荷の数値表示 */
function getWorkloadRows(workload: AssigneeTaskLoadResponse) {
  return [
    { label: '期限切れ', value: workload.overdueCount ?? 0, emphasize: true },
    { label: '今日期限', value: workload.dueTodayCount ?? 0 },
    { label: '今週期限', value: workload.dueThisWeekCount ?? 0 },
    { label: 'アクティブタスク', value: workload.totalActiveCount ?? 0 },
    { label: '他ワークスペース', value: workload.activeWorkspaceCount ?? 0 },
  ];
}

/**
 * ユーザー負荷表示ポップオーバー
 */
export default function UserWorkloadPopover({
  isOpen,
  onClose,
  userName,
  workload,
  anchorRect,
}: UserWorkloadPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const level = (workload.workloadLevel as WorkloadLevel) || 'Low';
  const config = workloadConfig[level] ?? defaultWorkloadConfig;

  const getPopoverStyle = (): React.CSSProperties => {
    if (!anchorRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const popoverWidth = 320;
    const popoverHeight = 280;
    const margin = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = anchorRect.bottom + margin;
    let left = anchorRect.left;

    if (left + popoverWidth > viewportWidth - margin) {
      left = viewportWidth - popoverWidth - margin;
    }

    if (left < margin) {
      left = margin;
    }

    if (top + popoverHeight > viewportHeight - margin) {
      top = anchorRect.top - popoverHeight - margin;
    }

    if (top < margin) {
      top = margin;
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" aria-hidden="true" />

      <div
        ref={popoverRef}
        className="z-50 bg-base-100 rounded-box shadow-xl w-80 max-h-[60vh] flex flex-col border border-base-300"
        style={getPopoverStyle()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-workload-title"
      >
        <div className="flex items-center justify-between p-3 border-b border-base-300 shrink-0">
          <h2 id="user-workload-title" className="text-base font-bold flex items-center gap-2">
            <span className="icon-[mdi--chart-box-outline] size-5 text-info" aria-hidden="true" />
            {userName}の負荷状況
          </h2>
          <button type="button" className="btn btn-xs btn-circle btn-secondary" onClick={onClose} aria-label="閉じる">
            <span className="icon-[mdi--close] size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className={`${config.icon} size-4`} aria-hidden="true" />
            <span className={`badge ${config.badgeClass}`}>{config.label}</span>
          </div>

          <div className="space-y-1.5">
            {getWorkloadRows(workload).map((row) => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-base-content/60">{row.label}</span>
                <span className={row.emphasize && row.value > 0 ? 'text-error font-semibold' : 'font-medium'}>
                  {row.value}件
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
