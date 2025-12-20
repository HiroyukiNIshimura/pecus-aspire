'use client';

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import type { DashboardTaskTrendResponse } from '@/connectors/api/pecus';

interface TaskTrendChartProps {
  /** トレンドデータ */
  data: DashboardTaskTrendResponse;
}

/**
 * 週次タスクトレンドチャート
 * タスクの作成数/完了数の週次推移を折れ線グラフで表示
 */
export default function TaskTrendChart({ data }: TaskTrendChartProps) {
  const { weeklyTrends } = data;

  // recharts用にデータを変換
  const chartData = weeklyTrends.map((trend) => ({
    label: trend.label,
    weekNumber: trend.weekNumber,
    created: trend.createdCount,
    completed: trend.completedCount,
  }));

  // 最大値を取得（Y軸のスケール用）
  const maxValue = Math.max(...weeklyTrends.map((t) => Math.max(t.createdCount, t.completedCount)), 1);

  return (
    <section aria-labelledby="task-trend-heading" className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h2 id="task-trend-heading" className="text-lg font-semibold flex items-center gap-2 mb-4">
          <span className="icon-[mdi--chart-line] w-5 h-5 text-primary" aria-hidden="true" />
          タスク推移（週次）
        </h2>

        {weeklyTrends.length === 0 ? (
          <EmptyState
            iconClass="icon-[mdi--chart-line-variant]"
            message="トレンドデータがありません"
            size="sm"
          />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-base-content/70" />
                <YAxis
                  domain={[0, Math.ceil(maxValue * 1.1)]}
                  tick={{ fontSize: 11 }}
                  className="text-base-content/70"
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-base-100)',
                    borderColor: 'var(--color-base-300)',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="created"
                  name="作成"
                  stroke="var(--color-info)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--color-info)', stroke: 'var(--color-info)' }}
                  activeDot={{ r: 6, fill: 'var(--color-info)', stroke: 'var(--color-info)' }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="完了"
                  stroke="var(--color-success)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--color-success)', stroke: 'var(--color-success)' }}
                  activeDot={{ r: 6, fill: 'var(--color-success)', stroke: 'var(--color-success)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* サマリ情報 */}
        {weeklyTrends.length > 0 && (
          <div className="flex justify-around mt-4 pt-4 border-t border-base-300">
            <div className="text-center">
              <p className="text-xs text-base-content/60">期間内作成</p>
              <p className="text-lg font-bold text-info">
                {weeklyTrends.reduce((sum, t) => sum + t.createdCount, 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-base-content/60">期間内完了</p>
              <p className="text-lg font-bold text-success">
                {weeklyTrends.reduce((sum, t) => sum + t.completedCount, 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-base-content/60">消化率</p>
              <p className="text-lg font-bold">
                {(() => {
                  const created = weeklyTrends.reduce((sum, t) => sum + t.createdCount, 0);
                  const completed = weeklyTrends.reduce((sum, t) => sum + t.completedCount, 0);
                  if (created === 0) return '—';
                  const rate = (completed / created) * 100;
                  return `${rate.toFixed(0)}%`;
                })()}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
