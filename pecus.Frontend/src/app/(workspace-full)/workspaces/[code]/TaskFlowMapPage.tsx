'use client';

import { useCallback, useEffect, useState } from 'react';
import { getTaskFlowMap } from '@/actions/workspaceTask';
import UserAvatar from '@/components/common/UserAvatar';
import TaskFlowMap from '@/components/tasks/TaskFlowMap';
import type { TaskFlowMapResponse, TaskFlowNode } from '@/connectors/api/pecus';

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
  itemCommitterAvatarUrl,
  onTaskClick,
  canEditTask,
}: TaskFlowMapPageProps) {
  const [data, setData] = useState<TaskFlowMapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="card">
      <div className="card-body">
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-4 mb-4">
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
                  identityIconUrl={itemCommitterAvatarUrl}
                  size={20}
                  nameClassName="font-medium"
                />
              </div>
            )}
          </div>
          {/* 右側: 戻るボタン */}
          <div className="shrink-0">
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

        {/* コンテンツ */}
        <div className="flex-1 min-h-0">
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
            <div className="bg-base-100 rounded-lg border border-base-300 p-4">
              <TaskFlowMap data={data} onTaskClick={handleTaskClick} canEditTask={canEditTask} />
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-base-content/50">
              <p>データがありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
