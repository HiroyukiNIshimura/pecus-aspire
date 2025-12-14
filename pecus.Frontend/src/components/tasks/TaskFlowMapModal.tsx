'use client';

import { useCallback, useEffect, useState } from 'react';
import { getTaskFlowMap } from '@/actions/workspaceTask';
import type { TaskFlowMapResponse, TaskFlowNode } from '@/connectors/api/pecus';
import TaskFlowMap from './TaskFlowMap';

interface TaskFlowMapModalProps {
  /** モーダルが開いているか */
  isOpen: boolean;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
  /** ワークスペースID */
  workspaceId: number;
  /** ワークスペースアイテムID */
  itemId: number;
  /** タスクカードクリック時のコールバック（モーダルを閉じてから呼ばれる） */
  onTaskClick?: (task: TaskFlowNode) => void;
  /** カードをクリック可能にするか */
  clickable?: boolean;
}

/**
 * タスクフローマップモーダル
 * アイテム内のタスク依存関係を可視化するモーダル
 */
export default function TaskFlowMapModal({
  isOpen,
  onClose,
  workspaceId,
  itemId,
  onTaskClick,
  clickable = false,
}: TaskFlowMapModalProps) {
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

  // モーダルが開いたらデータ取得
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  // タスクカードクリック時
  const handleTaskClick = (task: TaskFlowNode) => {
    // モーダルを閉じてから親にコールバック
    onClose();
    onTaskClick?.(task);
  };

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // モーダルが開いているときはbodyのスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        {/* モーダルコンテナ */}
        <div
          className="bg-base-100 rounded-box shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-flow-map-title"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <h2 id="task-flow-map-title" className="text-lg font-bold flex items-center gap-2">
              <span className="icon-[mdi--sitemap] w-6 h-6 text-primary" aria-hidden="true" />
              タスクフローマップ
            </h2>
            <button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="閉じる">
              <span className="icon-[mdi--close] w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : error ? (
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body items-center text-center py-8">
                  <span className="icon-[mdi--alert-circle-outline] w-12 h-12 text-error mb-2" aria-hidden="true" />
                  <p className="text-error">{error}</p>
                  <button type="button" className="btn btn-sm btn-primary mt-4" onClick={fetchData}>
                    再読み込み
                  </button>
                </div>
              </div>
            ) : data ? (
              <TaskFlowMap data={data} onTaskClick={handleTaskClick} clickable={clickable} />
            ) : null}
          </div>

          {/* フッター */}
          <div className="flex justify-end gap-2 p-4 border-t border-base-300">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              閉じる
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
