import { EmptyState } from '@/components/common/feedback/EmptyState';
import type { DashboardTasksByPriorityResponse, TaskPriority } from '@/connectors/api/pecus';

interface PriorityBreakdownCardProps {
  /** 優先度別タスク数データ */
  data: DashboardTasksByPriorityResponse;
}

/**
 * 優先度の表示設定
 */
const priorityConfig: Record<NonNullable<TaskPriority> | 'null', { label: string; color: string; bgColor: string }> = {
  Critical: { label: '緊急', color: 'text-error', bgColor: 'bg-error' },
  High: { label: '高', color: 'text-warning', bgColor: 'bg-warning' },
  Medium: { label: '中', color: 'text-info', bgColor: 'bg-info' },
  Low: { label: '低', color: 'text-success', bgColor: 'bg-success' },
  null: { label: '未設定', color: 'text-base-content/50', bgColor: 'bg-base-300' },
};

/**
 * 優先度別タスク数カード
 * 横棒グラフで優先度別のタスク数を可視化
 */
export default function PriorityBreakdownCard({ data }: PriorityBreakdownCardProps) {
  const { priorities, totalCount } = data;

  // 優先度順にソート（Critical → High → Medium → Low → null）
  const sortOrder: (TaskPriority | null)[] = ['Critical', 'High', 'Medium', 'Low', null];
  const sortedPriorities = [...priorities].sort((a, b) => {
    const aIndex = sortOrder.indexOf(a.priority ?? null);
    const bIndex = sortOrder.indexOf(b.priority ?? null);
    return aIndex - bIndex;
  });

  return (
    <section aria-labelledby="priority-breakdown-heading" className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h2 id="priority-breakdown-heading" className="text-lg font-semibold flex items-center gap-2 mb-4">
          <span className="icon-[mdi--flag-variant-outline] w-5 h-5 text-primary" aria-hidden="true" />
          優先度別タスク
          <span className="text-sm font-normal text-base-content/60 ml-auto">
            合計: {totalCount.toLocaleString()}件
          </span>
        </h2>

        <div className="space-y-3">
          {sortedPriorities.map((item) => {
            const key = item.priority ?? 'null';
            const config = priorityConfig[key];
            const percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;

            return (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-12 text-xs font-medium ${config.color}`}>{config.label}</div>
                <div className="flex-1 h-2 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config.bgColor} transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={item.count}
                    aria-valuemin={0}
                    aria-valuemax={totalCount}
                    aria-label={`${config.label}: ${item.count}件`}
                  />
                </div>
                <div className="w-12 text-xs text-right font-medium">{item.count.toLocaleString()}</div>
              </div>
            );
          })}
        </div>

        {totalCount === 0 && (
          <EmptyState
            iconClass="icon-[mdi--checkbox-marked-circle-outline]"
            message="進行中のタスクはありません"
            size="sm"
          />
        )}
      </div>
    </section>
  );
}
