import type { DashboardItemSummary, DashboardTaskSummary } from '@/connectors/api/pecus';
import OrganizationHealthButton from './OrganizationHealthButton';
import StatCard from './StatCard.server';

interface TaskSummarySectionProps {
  /** タスクサマリデータ */
  taskSummary: DashboardTaskSummary;
  /** アイテムサマリデータ */
  itemSummary: DashboardItemSummary;
  /** ワークスペースサマリデータ */
  workspaceSummary?: { totalCount: number; documentModeCount: number };
}

/**
 * タスクサマリセクション
 * 組織全体のタスクとアイテムの統計を表示
 */
export default function TaskSummarySection({ taskSummary, itemSummary, workspaceSummary }: TaskSummarySectionProps) {
  return (
    <section aria-labelledby="task-summary-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="task-summary-heading" className="text-lg font-semibold flex items-center gap-2">
          <span className="icon-[mdi--clipboard-check-outline] w-5 h-5 text-primary" aria-hidden="true" />
          組織サマリ
        </h2>
        <OrganizationHealthButton />
      </div>

      {/* タスク統計 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="進行中タスク"
          value={taskSummary.inProgressCount}
          description="未完了・未破棄"
          iconClass="icon-[mdi--progress-clock]"
          iconColorClass="text-info"
        />
        <StatCard
          title="完了タスク"
          value={taskSummary.completedCount}
          description="完了済み"
          iconClass="icon-[mdi--check-circle-outline]"
          iconColorClass="text-success"
        />
        <StatCard
          title="期限切れ"
          value={taskSummary.overdueCount}
          description="要対応"
          iconClass="icon-[mdi--clock-alert-outline]"
          iconColorClass="text-error"
          isWarning={taskSummary.overdueCount > 0}
        />
        <StatCard
          title="今週期限"
          value={taskSummary.dueThisWeekCount}
          description="今週中に対応"
          iconClass="icon-[mdi--calendar-week]"
          iconColorClass="text-info"
          isWarning={taskSummary.dueThisWeekCount > 0}
        />
        <StatCard
          title="ワークスペース"
          value={workspaceSummary?.totalCount ?? 0}
          description="アクティブなワークスペースの総数"
          iconClass="icon-[mdi--folder-multiple-outline]"
          iconColorClass="text-primary"
        >
          <div className="mt-2 text-sm text-base-content/70 pl-1">
            <span className="text-xs text-base-content/60">内ドキュメントモード</span>
            <div className="text-lg font-medium">{workspaceSummary?.documentModeCount?.toLocaleString() ?? 0}</div>
          </div>
        </StatCard>
      </div>

      {/* アイテム統計（小さめ） */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat bg-base-200 rounded-lg p-3">
          <div className="stat-title text-xs">公開アイテム</div>
          <div className="stat-value text-xl">{itemSummary.publishedCount.toLocaleString()}</div>
        </div>
        <div className="stat bg-base-200 rounded-lg p-3">
          <div className="stat-title text-xs">下書き</div>
          <div className="stat-value text-xl">{itemSummary.draftCount.toLocaleString()}</div>
        </div>
        <div className="stat bg-base-200 rounded-lg p-3">
          <div className="stat-title text-xs">アーカイブ</div>
          <div className="stat-value text-xl">{itemSummary.archivedCount.toLocaleString()}</div>
        </div>
      </div>

      {/* （ワークスペース統計はタスク統計の横に移動しました） */}
    </section>
  );
}
