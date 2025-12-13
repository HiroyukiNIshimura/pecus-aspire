import type { DashboardItemSummary, DashboardTaskSummary } from '@/connectors/api/pecus';
import StatCard from './StatCard';

interface TaskSummarySectionProps {
  /** タスクサマリデータ */
  taskSummary: DashboardTaskSummary;
  /** アイテムサマリデータ */
  itemSummary: DashboardItemSummary;
}

/**
 * タスクサマリセクション
 * 組織全体のタスクとアイテムの統計を表示
 */
export default function TaskSummarySection({ taskSummary, itemSummary }: TaskSummarySectionProps) {
  return (
    <section aria-labelledby="task-summary-heading">
      <h2 id="task-summary-heading" className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="icon-[mdi--clipboard-check-outline] w-5 h-5 text-primary" aria-hidden="true" />
        組織サマリ
      </h2>

      {/* タスク統計 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
          title="未アサイン"
          value={taskSummary.unassignedCount}
          description="担当者未設定"
          iconClass="icon-[mdi--account-question-outline]"
          iconColorClass="text-warning"
          isWarning={taskSummary.unassignedCount > 0}
        />
      </div>

      {/* アイテム統計（小さめ） */}
      <div className="grid grid-cols-3 gap-4">
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
    </section>
  );
}
