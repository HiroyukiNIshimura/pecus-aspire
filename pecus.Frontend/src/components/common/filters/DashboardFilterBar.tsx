'use client';

import type { DashboardTaskFilter } from '@/connectors/api/pecus';

export interface FilterStats {
  activeCount: number;
  completedCount: number;
  overdueCount: number;
  helpCommentCount: number;
  reminderCommentCount: number;
}

interface DashboardFilterBarProps {
  /** 現在選択中のフィルタ */
  currentFilter: DashboardTaskFilter;
  /** フィルタ変更時のコールバック */
  onFilterChange: (filter: DashboardTaskFilter) => void;
  /** 統計情報 */
  stats: FilterStats;
  /** ワークスペース数（表示のみ） */
  workspaceCount: number;
  /** アイテム数（コミッターダッシュボード用、省略可） */
  itemCount?: number;
}

interface FilterButtonProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  colorClass: string;
  iconClass: string;
}

function FilterButton({ label, count, isActive, onClick, colorClass, iconClass }: FilterButtonProps) {
  const isDisabled = count === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-all
        ${
          isDisabled
            ? 'bg-base-200/50 text-base-content/30 cursor-not-allowed'
            : isActive
              ? `${colorClass} text-white shadow-md`
              : 'bg-base-200 hover:bg-base-content/10 text-base-content'
        }
      `}
    >
      <span className={`${iconClass} w-4 h-4 ${isDisabled ? 'opacity-30' : ''}`} aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
      <span
        className={`
        text-sm font-bold min-w-6 text-center
        ${isDisabled ? 'text-base-content/30' : isActive ? 'text-white/90' : colorClass.replace('bg-', 'text-')}
      `}
      >
        {count}
      </span>
    </button>
  );
}

/**
 * ダッシュボード用フィルターバー
 * 統計情報をクリック可能なフィルターボタンとして表示
 */
export default function DashboardFilterBar({
  currentFilter,
  onFilterChange,
  stats,
  workspaceCount,
  itemCount,
}: DashboardFilterBarProps) {
  const filters: {
    filter: DashboardTaskFilter;
    label: string;
    count: number;
    colorClass: string;
    iconClass: string;
  }[] = [
    {
      filter: 'Active',
      label: '未完了',
      count: stats.activeCount,
      colorClass: 'bg-primary',
      iconClass: 'icon-[mdi--clock-outline]',
    },
    {
      filter: 'Overdue',
      label: '期限超過',
      count: stats.overdueCount,
      colorClass: 'bg-error',
      iconClass: 'icon-[mdi--alert-circle-outline]',
    },
    {
      filter: 'HelpWanted',
      label: 'ヘルプ',
      count: stats.helpCommentCount,
      colorClass: 'bg-warning',
      iconClass: 'icon-[mdi--hand-extended-outline]',
    },
    {
      filter: 'Reminder',
      label: '督促',
      count: stats.reminderCommentCount,
      colorClass: 'bg-warning',
      iconClass: 'icon-[mdi--bell-alert-outline]',
    },
    {
      filter: 'Completed',
      label: '完了',
      count: stats.completedCount,
      colorClass: 'bg-success',
      iconClass: 'icon-[mdi--check-circle-outline]',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* ワークスペース数・アイテム数（情報表示のみ、ボタンではない） */}
      <div className="flex items-center gap-4 text-sm text-base-content/60">
        <div className="flex items-center gap-1.5">
          <span className="icon-[mdi--folder-outline] w-4 h-4" aria-hidden="true" />
          <span>ワークスペース</span>
          <span className="font-bold text-base-content">{workspaceCount}</span>
        </div>

        {itemCount !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="icon-[mdi--file-document-outline] w-4 h-4" aria-hidden="true" />
            <span>アイテム</span>
            <span className="font-bold text-base-content">{itemCount}</span>
          </div>
        )}
      </div>

      {/* 区切り線 */}
      <div className="hidden sm:block w-px h-6 bg-base-300" />

      {/* フィルタボタン */}
      {filters.map((f) => (
        <FilterButton
          key={f.filter}
          label={f.label}
          count={f.count}
          isActive={currentFilter === f.filter}
          onClick={() => onFilterChange(f.filter)}
          colorClass={f.colorClass}
          iconClass={f.iconClass}
        />
      ))}
    </div>
  );
}
