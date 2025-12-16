'use client';

import type { TaskFlowMapResponse, TaskFlowNode } from '@/connectors/api/pecus';
import TaskFlowCard from './TaskFlowCard';
import TaskFlowChain from './TaskFlowChain';

interface TaskFlowMapProps {
  /** タスクフローマップデータ */
  data: TaskFlowMapResponse;
  /** タスクカードクリック時のコールバック */
  onTaskClick?: (task: TaskFlowNode) => void;
  /** タスクごとにクリック可能かどうかを判断する関数 */
  canEditTask?: (task: TaskFlowNode) => boolean;
}

/**
 * タスクフローマップ
 * アイテム内のタスク依存関係を可視化するコンポーネント
 */
export default function TaskFlowMap({ data, onTaskClick, canEditTask }: TaskFlowMapProps) {
  const { criticalPath, otherChains, independentTasks, summary } = data;

  const hasAnyTasks = summary.totalCount > 0;
  const hasChains = criticalPath.length > 0 || otherChains.length > 0;

  return (
    <div className="space-y-6">
      {/* サマリ情報 */}
      <div className="stats stats-vertical sm:stats-horizontal shadow w-full text-sm">
        <div className="stat py-3 px-4">
          <div className="stat-figure text-primary">
            <span className="icon-[mdi--clipboard-list-outline] w-6 h-6" aria-hidden="true" />
          </div>
          <div className="stat-title text-xs">総タスク</div>
          <div className="stat-value text-xl text-primary">{summary.totalCount}</div>
        </div>
        <div className="stat py-3 px-4">
          <div className="stat-figure text-success">
            <span className="icon-[mdi--play-circle-outline] w-6 h-6" aria-hidden="true" />
          </div>
          <div className="stat-title text-xs">着手可能</div>
          <div className="stat-value text-xl text-success">{summary.readyCount}</div>
        </div>
        <div className="stat py-3 px-4">
          <div className="stat-figure text-warning">
            <span className="icon-[mdi--pause-circle-outline] w-6 h-6" aria-hidden="true" />
          </div>
          <div className="stat-title text-xs">待機中</div>
          <div className="stat-value text-xl text-warning">{summary.waitingCount}</div>
        </div>
        <div className="stat py-3 px-4">
          <div className="stat-figure text-success">
            <span className="icon-[mdi--check-circle-outline] w-6 h-6" aria-hidden="true" />
          </div>
          <div className="stat-title text-xs">完了</div>
          <div className="stat-value text-xl">{summary.completedCount}</div>
        </div>
      </div>

      {!hasAnyTasks ? (
        /* タスクがない場合 */
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body items-center text-center py-8">
            <span className="icon-[mdi--clipboard-outline] w-12 h-12 text-base-content/30 mb-2" aria-hidden="true" />
            <p className="text-base-content/70">タスクがありません</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            {/* クリティカルパス */}
            {criticalPath.length > 0 && (
              <div className="rounded-box border border-error/30 bg-error/5 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="icon-[mdi--fire] w-5 h-5 text-error" aria-hidden="true" />
                  <h3 className="text-base font-bold">クリティカルパス</h3>
                  <span className="badge badge-error badge-sm">{criticalPath.length}ステップ</span>
                </div>
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
                  <TaskFlowChain tasks={criticalPath} onTaskClick={onTaskClick} canEditTask={canEditTask} />
                </div>
              </div>
            )}

            {/* その他の依存チェーン */}
            {otherChains.length > 0 && (
              <div className="rounded-box border border-info/30 bg-base-200/50 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="icon-[mdi--source-branch] w-5 h-5 text-info" aria-hidden="true" />
                  <h3 className="text-base font-bold">その他の依存チェーン</h3>
                  <span className="badge badge-info badge-sm">{otherChains.length}件</span>
                </div>
                <div className="flex flex-col gap-4">
                  {otherChains.map((chain) => (
                    <div
                      key={`chain-${chain[0]?.id ?? 'empty'}`}
                      className="rounded-box border border-base-300 bg-base-100 p-3 shadow-sm"
                    >
                      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
                        <TaskFlowChain tasks={chain} onTaskClick={onTaskClick} canEditTask={canEditTask} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 独立タスク */}
          {independentTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="icon-[mdi--checkbox-marked-circle-outline] w-5 h-5 text-secondary"
                  aria-hidden="true"
                />
                <h3 className="text-base font-bold">独立タスク（依存関係なし）</h3>
                <span className="badge badge-secondary badge-sm">{independentTasks.length}件</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {independentTasks.map((task) => {
                  const clickable = canEditTask?.(task) ?? false;
                  return (
                    <TaskFlowCard
                      key={task.id}
                      task={task}
                      clickable={clickable}
                      onClick={clickable ? () => onTaskClick?.(task) : undefined}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* 依存関係がない場合の説明 */}
          {!hasChains && independentTasks.length > 0 && (
            <div className="alert alert-info">
              <span className="icon-[mdi--information-outline] w-5 h-5" aria-hidden="true" />
              <span>
                すべてのタスクが独立しています。タスク編集画面で「先行タスク」を設定すると、依存関係を作成できます。
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
