import type { DashboardPersonalSummaryResponse } from '@/connectors/api/pecus';
import StatCard from './StatCard';

interface PersonalSummarySectionProps {
  /** 個人サマリデータ */
  data: DashboardPersonalSummaryResponse;
}

/**
 * 個人サマリセクション
 * ログインユーザー自身のタスク状況を表示
 */
export default function PersonalSummarySection({ data }: PersonalSummarySectionProps) {
  return (
    <section aria-labelledby="personal-summary-heading">
      <h2 id="personal-summary-heading" className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="icon-[mdi--account-circle-outline] w-5 h-5 text-primary" aria-hidden="true" />
        マイタスク
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="担当中"
          value={data.assignedCount}
          description="未完了タスク"
          iconClass="icon-[mdi--clipboard-list-outline]"
          iconColorClass="text-info"
        />
        <StatCard
          title="完了"
          value={data.completedCount}
          description="累計"
          iconClass="icon-[mdi--check-all]"
          iconColorClass="text-success"
        />
        <StatCard
          title="期限切れ"
          value={data.overdueCount}
          description="要対応"
          iconClass="icon-[mdi--clock-alert-outline]"
          iconColorClass="text-error"
          isWarning={data.overdueCount > 0}
        />
        <StatCard
          title="今週期限"
          value={data.dueThisWeekCount}
          description="締切り間近"
          iconClass="icon-[mdi--calendar-week]"
          iconColorClass="text-warning"
        />
        <StatCard
          title="今週完了"
          value={data.completedThisWeekCount}
          description="今週の成果"
          iconClass="icon-[mdi--trophy-outline]"
          iconColorClass="text-success"
        />
      </div>
    </section>
  );
}
