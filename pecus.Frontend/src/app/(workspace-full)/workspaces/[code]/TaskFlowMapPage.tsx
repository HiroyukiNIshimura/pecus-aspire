'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { getTaskFlowMap } from '@/actions/workspaceTask';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import TaskFlowMap from '@/components/tasks/TaskFlowMap';
import type { TaskFlowMapResponse, TaskFlowNode } from '@/connectors/api/pecus';

/** 表示モード */
type ViewMode = 'chain' | 'graph';

/** React Flowはクライアントサイドのみで動作するためdynamic importでSSRを無効化 */
const TaskFlowGraphView = dynamic(() => import('@/components/tasks/flow-graph/TaskFlowGraphView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  ),
});

export interface TaskFlowMapPageProps {
  /** 閉じるコールバック */
  onClose: () => void;
  /** ワークスペースID */
  workspaceId: number;
  /** ワークスペースアイテムID */
  itemId: number;
  /** アイテムコード（表示用） */
  itemCode?: string | null;
  /** アイテムタイトル（表示用） */
  itemTitle?: string | null;
  /** アイテムのコミッター名 */
  itemCommitterName?: string | null;
  /** アイテムのコミッターがアクティブかどうか */
  itemCommitterIsActive?: boolean;
  /** アイテムのコミッターアバターURL */
  itemCommitterAvatarUrl?: string | null;
  /** タスクカードクリック時のコールバック */
  onTaskClick?: (task: TaskFlowNode) => void;
  /** タスクごとにクリック可能かどうかを判断する関数 */
  canEditTask?: (task: TaskFlowNode) => boolean;
}

/**
 * タスクフローマップページ
 * アイテム内のタスク依存関係を可視化するページ
 */
export default function TaskFlowMapPage({
  onClose,
  workspaceId,
  itemId,
  itemCode,
  itemTitle,
  itemCommitterName,
  itemCommitterIsActive,
  itemCommitterAvatarUrl,
  onTaskClick,
  canEditTask,
}: TaskFlowMapPageProps) {
  const [data, setData] = useState<TaskFlowMapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('chain'); // デフォルトはチェーン表示

  // データ取得
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTaskFlowMap(workspaceId, itemId);
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'データの取得に失敗しました');
      }
    } catch {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, itemId]);

  // 初期データ取得
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // タスクカードクリック時
  const handleTaskClick = (task: TaskFlowNode) => {
    onTaskClick?.(task);
  };

  // ESCキーでアイテム詳細に戻る
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="card flex flex-col flex-1 min-h-0">
      <div className="card-body flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-4 shrink-0">
          {/* 左側: タイトルとコミッター */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
              <span className="icon-[mdi--sitemap] size-6 shrink-0" aria-hidden="true" />
              <span>タスクフローマップ</span>
              {(itemCode || itemTitle) && (
                <span className="text-base-content/70 text-base font-normal truncate max-w-md">
                  - {itemCode && `#${itemCode}`}
                  {itemCode && itemTitle && ' '}
                  {itemTitle}
                </span>
              )}
            </h2>
            {/* コミッター表示 */}
            {itemCommitterName && (
              <div className="flex items-center gap-2 text-sm text-base-content/70 mt-1">
                <span className="text-base-content/50">コミッター:</span>
                <UserAvatar
                  userName={itemCommitterName}
                  isActive={itemCommitterIsActive ?? false}
                  identityIconUrl={itemCommitterAvatarUrl}
                  size={20}
                  nameClassName="font-medium"
                />
              </div>
            )}
          </div>
          {/* 右側: 表示切替と戻るボタン */}
          <div className="shrink-0 flex items-center gap-2">
            {/* 表示モード切替タブ */}
            <div className="tabs tabs-box hidden sm:flex">
              <button
                type="button"
                className={`tab tab-sm gap-1.5 ${viewMode === 'graph' ? 'tab-active' : ''}`}
                onClick={() => setViewMode('graph')}
                aria-pressed={viewMode === 'graph'}
              >
                <span className="icon-[mdi--graph-outline] size-4" aria-hidden="true" />
                グラフ
              </button>
              <button
                type="button"
                className={`tab tab-sm gap-1.5 ${viewMode === 'chain' ? 'tab-active' : ''}`}
                onClick={() => setViewMode('chain')}
                aria-pressed={viewMode === 'chain'}
              >
                <span className="icon-[mdi--format-list-bulleted] size-4" aria-hidden="true" />
                チェーン
              </button>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-secondary gap-2"
              onClick={onClose}
              aria-label="アイテム詳細に戻る"
            >
              <span className="icon-[mdi--arrow-left] size-5" aria-hidden="true" />
              アイテム
            </button>
          </div>
        </div>

        {/* コンテンツ（スクロール可能） */}
        {/* モバイル時はドロワーハンドル（h-12 = 48px）の分だけ下部パディングを追加 */}
        <div className="flex-1 min-h-0 overflow-y-auto mt-4 pb-14 lg:pb-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : error ? (
            <div className="alert alert-soft alert-error">
              <span className="icon-[mdi--alert-circle-outline] size-6 shrink-0" aria-hidden="true" />
              <div>
                <h3 className="font-bold">エラーが発生しました</h3>
                <p>{error}</p>
              </div>
              <button type="button" className="btn btn-sm btn-primary" onClick={fetchData}>
                <span className="icon-[mdi--refresh] size-4" aria-hidden="true" />
                再読み込み
              </button>
            </div>
          ) : data ? (
            <div className="bg-base-100 rounded-lg border border-base-300 p-4 h-full flex flex-col">
              {/* モバイル用表示切替 */}
              <div className="tabs tabs-box sm:hidden mb-3">
                <button
                  type="button"
                  className={`tab tab-sm gap-1.5 ${viewMode === 'graph' ? 'tab-active' : ''}`}
                  onClick={() => setViewMode('graph')}
                  aria-pressed={viewMode === 'graph'}
                >
                  <span className="icon-[mdi--graph-outline] size-4" aria-hidden="true" />
                  グラフ
                </button>
                <button
                  type="button"
                  className={`tab tab-sm gap-1.5 ${viewMode === 'chain' ? 'tab-active' : ''}`}
                  onClick={() => setViewMode('chain')}
                  aria-pressed={viewMode === 'chain'}
                >
                  <span className="icon-[mdi--format-list-bulleted] size-4" aria-hidden="true" />
                  チェーン
                </button>
              </div>

              {/* 表示コンテンツ */}
              {viewMode === 'graph' ? (
                <TaskFlowGraphView data={data} onTaskClick={handleTaskClick} canEditTask={canEditTask} />
              ) : (
                <TaskFlowMap data={data} onTaskClick={handleTaskClick} canEditTask={canEditTask} />
              )}
            </div>
          ) : (
            <EmptyState iconClass="icon-[mdi--clipboard-text-outline]" message="データがありません" />
          )}
        </div>
      </div>
    </div>
  );
}
