'use client';

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import type { DashboardTaskTrendResponse, WorkspaceMode } from '@/connectors/api/pecus';

interface TaskTrendChartProps {
  /** トレンドデータ */
  data: DashboardTaskTrendResponse;
  /** ワークスペースモード（ドキュメントモードの場合はタスク関連を非表示） */
  mode?: WorkspaceMode;
}

/**
 * 週次タスクトレンドチャート
 * タスクの作成数/完了数の週次推移を折れ線グラフで表示
 */
export default function TaskTrendChart({ data, mode }: TaskTrendChartProps) {
  const { weeklyTrends } = data;
  const isDocumentMode = mode === 'Document';

  // recharts用にデータを変換
  const chartData = weeklyTrends.map((trend) => ({
    label: trend.label,
    weekNumber: trend.weekNumber,
    created: trend.createdCount,
    completed: trend.completedCount,
    itemCreated: trend.itemCreatedCount ?? 0,
  }));

  // タスク用の最大値（左Y軸）
  const taskMaxValue = Math.max(...weeklyTrends.map((t) => Math.max(t.createdCount, t.completedCount)), 1);

  // アイテム用の最大値（右Y軸）- ドキュメントモードでは左Y軸として使用
  const itemMaxValue = Math.max(...weeklyTrends.map((t) => t.itemCreatedCount ?? 0), 1);

  return (
    <section aria-labelledby="task-trend-heading" className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h2 id="task-trend-heading" className="text-lg font-semibold flex items-center gap-2 mb-4">
          <span className="icon-[mdi--chart-line] w-5 h-5 text-primary" aria-hidden="true" />
          {isDocumentMode ? 'アイテム推移（週次）' : 'アイテム・タスク推移（週次）'}
        </h2>

        {weeklyTrends.length === 0 ? (
          <EmptyState iconClass="icon-[mdi--chart-line-variant]" message="トレンドデータがありません" size="sm" />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: isDocumentMode ? 20 : 60, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-base-content/70" />
                {/* 左Y軸: タスク数（ドキュメントモードでは非表示） */}
                {!isDocumentMode && (
                  <YAxis
                    yAxisId="left"
                    domain={[0, Math.ceil(taskMaxValue * 1.1)]}
                    tick={{ fontSize: 11 }}
                    className="text-base-content/70"
                    width={45}
                    label={{
                      value: 'タスク',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 10, fill: 'var(--color-base-content)', opacity: 0.6 },
                    }}
                  />
                )}
                {/* 右Y軸: アイテム数（ドキュメントモードでは左Y軸として表示） */}
                <YAxis
                  yAxisId="right"
                  orientation={isDocumentMode ? 'left' : 'right'}
                  domain={[0, Math.ceil(itemMaxValue * 1.1)]}
                  tick={{ fontSize: 11 }}
                  className="text-base-content/70"
                  width={isDocumentMode ? 40 : 50}
                  label={
                    isDocumentMode
                      ? undefined
                      : {
                          value: 'アイテム',
                          angle: 90,
                          position: 'insideRight',
                          style: { fontSize: 10, fill: 'var(--color-base-content)', opacity: 0.6 },
                        }
                  }
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
                {/* タスク作成（ドキュメントモードでは非表示） */}
                {!isDocumentMode && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="created"
                    name="タスク作成"
                    stroke="var(--color-warning)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'var(--color-warning)', stroke: 'var(--color-warning)' }}
                    activeDot={{ r: 6, fill: 'var(--color-warning)', stroke: 'var(--color-warning)' }}
                  />
                )}
                {/* タスク完了（ドキュメントモードでは非表示） */}
                {!isDocumentMode && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="completed"
                    name="タスク完了"
                    stroke="var(--color-success)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'var(--color-success)', stroke: 'var(--color-success)' }}
                    activeDot={{ r: 6, fill: 'var(--color-success)', stroke: 'var(--color-success)' }}
                  />
                )}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="itemCreated"
                  name="アイテム作成"
                  stroke="var(--color-info)"
                  strokeWidth={2}
                  strokeDasharray={isDocumentMode ? undefined : '5 5'}
                  dot={{ r: 4, fill: 'var(--color-info)', stroke: 'var(--color-info)' }}
                  activeDot={{ r: 6, fill: 'var(--color-info)', stroke: 'var(--color-info)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* サマリ情報 */}
        {weeklyTrends.length > 0 && (
          <div className="flex justify-around mt-4 pt-4 border-t border-base-300">
            {/* タスク作成（ドキュメントモードでは非表示） */}
            {!isDocumentMode && (
              <div className="text-center">
                <p className="text-xs text-base-content/60">タスク作成</p>
                <p className="text-lg font-bold text-warning">
                  {weeklyTrends.reduce((sum, t) => sum + t.createdCount, 0).toLocaleString()}
                </p>
              </div>
            )}
            {/* タスク完了（ドキュメントモードでは非表示） */}
            {!isDocumentMode && (
              <div className="text-center">
                <p className="text-xs text-base-content/60">タスク完了</p>
                <p className="text-lg font-bold text-success">
                  {weeklyTrends.reduce((sum, t) => sum + t.completedCount, 0).toLocaleString()}
                </p>
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-base-content/60">アイテム作成</p>
              <p className="text-lg font-bold text-info">
                {weeklyTrends.reduce((sum, t) => sum + (t.itemCreatedCount ?? 0), 0).toLocaleString()}
              </p>
            </div>
            {/* 消化率（ドキュメントモードでは非表示） */}
            {!isDocumentMode && (
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
            )}
          </div>
        )}
      </div>
    </section>
  );
}
