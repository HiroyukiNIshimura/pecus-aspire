'use client';

import { useEffect, useState } from 'react';
import { getWorkspaceTasks } from '@/actions/workspaceTask';
import type { WorkspaceTaskDetailResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { getDisplayIconUrl } from '@/utils/imageUrl';

interface WorkspaceTasksProps {
  workspaceId: number;
  itemId: number;
}

const ITEMS_PER_PAGE = 8; // 4列 x 2行

const WorkspaceTasks = ({ workspaceId, itemId }: WorkspaceTasksProps) => {
  const notify = useNotify();
  const [tasks, setTasks] = useState<WorkspaceTaskDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // タスク取得
  const fetchTasks = async (page: number) => {
    try {
      setIsLoading(true);
      const result = await getWorkspaceTasks(workspaceId, itemId, page, ITEMS_PER_PAGE);

      if (result.success) {
        setTasks(result.data.data || []);
        setCurrentPage(result.data.currentPage || 1);
        setTotalPages(result.data.totalPages || 0);
        setTotalCount(result.data.totalCount || 0);
      } else {
        notify.error(result.message || 'タスクの取得に失敗しました');
      }
    } catch (_err: unknown) {
      notify.error('タスクの取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 初回取得
  useEffect(() => {
    fetchTasks(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, itemId]);

  // ページ変更
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || isLoading) return;
    fetchTasks(page);
  };

  // タスクタイプのアイコンパス
  const getTaskTypeIcon = (taskType?: string) => {
    if (!taskType) return null;
    const iconName = taskType.toLowerCase();
    return `/icons/task/${iconName}.svg`;
  };

  // 優先度の表示
  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;

    const badges = {
      Critical: { label: '緊急', className: 'badge-error' },
      High: { label: '高', className: 'badge-warning' },
      Medium: { label: '中', className: 'badge-info' },
      Low: { label: '低', className: 'badge-ghost' },
    };

    const badge = badges[priority as keyof typeof badges];
    if (!badge) return null;

    return <span className={`badge badge-xs ${badge.className}`}>{badge.label}</span>;
  };

  // 初回ローディング（データがまだない場合）
  if (isLoading && tasks.length === 0) {
    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">タスク</h3>
        </div>
        <div className="flex justify-center items-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">タスク ({totalCount})</h3>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-base-content/50 text-center py-8">タスクはありません</p>
      ) : (
        <div className="relative px-9">
          {/* 左矢印 */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-sm btn-ghost bg-base-100 shadow-md hover:bg-base-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="前のページ"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* カードグリッド 4x2 */}
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-opacity ${isLoading ? 'opacity-50' : ''}`}
            style={{ gridAutoRows: '1fr' }}
          >
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`card bg-base-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full ${
                  task.isCompleted ? 'opacity-60' : ''
                } ${task.isDiscarded ? 'opacity-40' : ''}`}
              >
                {/* カードボディ: 伸縮する部分 */}
                <div className="p-3 pb-2 gap-2 flex flex-col flex-1">
                  {/* ヘッダー: アイコン + ステータス */}
                  <div className="flex items-start justify-between gap-2">
                    {/* タスクタイプアイコン */}
                    {task.taskType && getTaskTypeIcon(task.taskType) && (
                      <div className="flex-shrink-0">
                        <img
                          src={getTaskTypeIcon(task.taskType) || undefined}
                          alt={task.taskType}
                          className="w-7 h-7 rounded"
                          title={task.taskType}
                        />
                      </div>
                    )}
                    {/* ステータスバッジ */}
                    <div className="flex flex-wrap gap-1 justify-end">
                      {task.isCompleted && <span className="badge badge-success badge-xs">完了</span>}
                      {task.isDiscarded && <span className="badge badge-neutral badge-xs">破棄</span>}
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>

                  {/* タスク内容（2行で省略、ホバーで全文表示） */}
                  <div className="flex-1">
                    <p
                      className={`text-xs line-clamp-2 ${task.isCompleted ? 'line-through' : ''}`}
                      title={task.content || undefined}
                    >
                      {task.content}
                    </p>
                  </div>
                </div>

                {/* カードフッター: 固定位置 */}
                <div className="p-3 pt-0">
                  {/* 進捗バー */}
                  <div className="w-full mb-2">
                    <progress
                      className="progress progress-primary w-full h-1.5"
                      value={task.progressPercentage || 0}
                      max="100"
                    ></progress>
                  </div>

                  {/* 担当者 + 期限（固定高さ） */}
                  <div className="border-t border-base-300 pt-1.5 min-h-[3rem]">
                    {/* 担当者 */}
                    <div className="flex items-center gap-1.5 h-5">
                      {task.assignedUserId ? (
                        <>
                          {task.assignedAvatarUrl && (
                            <img
                              src={getDisplayIconUrl(task.assignedAvatarUrl)}
                              alt={task.assignedUsername || '担当者'}
                              className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                            />
                          )}
                          <span className="text-xs truncate">{task.assignedUsername}</span>
                        </>
                      ) : (
                        <span className="text-xs text-base-content/30">—</span>
                      )}
                    </div>
                    {/* 期限 */}
                    <div className="flex items-center gap-1 text-xs text-base-content/70 h-5 mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-3.5 h-3.5 flex-shrink-0"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                        />
                      </svg>
                      <span>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString('ja-JP', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 右矢印 */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-sm btn-ghost bg-base-100 shadow-md hover:bg-base-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="次のページ"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

          {/* ページインジケーター */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={`page-indicator-${pageNum}`}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentPage === pageNum ? 'bg-primary w-4' : 'bg-base-300 hover:bg-base-content/30'
                  }`}
                  aria-label={`ページ ${pageNum}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceTasks;
