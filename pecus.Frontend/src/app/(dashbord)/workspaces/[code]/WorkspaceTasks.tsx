'use client';

import { useEffect, useState } from 'react';
import { getWorkspaceTasks } from '@/actions/workspaceTask';
import Pagination from '@/components/common/Pagination';
import type { WorkspaceTaskDetailResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { getDisplayIconUrl } from '@/utils/imageUrl';

interface WorkspaceTasksProps {
  workspaceId: number;
  itemId: number;
}

const WorkspaceTasks = ({ workspaceId, itemId }: WorkspaceTasksProps) => {
  const notify = useNotify();
  const [tasks, setTasks] = useState<WorkspaceTaskDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // タスク取得（useEffectで直接呼び出し、依存配列にnotifyを含めない）
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const result = await getWorkspaceTasks(workspaceId, itemId, 1);

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

    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, itemId]);

  // ページ変更時のタスク取得
  const handlePageChange = async ({ selected }: { selected: number }) => {
    const page = selected + 1;
    try {
      setIsLoading(true);
      const result = await getWorkspaceTasks(workspaceId, itemId, page);

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

    return <span className={`badge badge-sm ${badge.className}`}>{badge.label}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
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
        <>
          {/* カードグリッド */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`card bg-base-200 shadow-sm hover:shadow-md transition-shadow ${
                  task.isCompleted ? 'opacity-60' : ''
                } ${task.isDiscarded ? 'opacity-40' : ''}`}
              >
                <div className="card-body p-4 gap-2">
                  {/* ヘッダー: アイコン + ステータス */}
                  <div className="flex items-start justify-between gap-2">
                    {/* タスクタイプアイコン */}
                    {task.taskType && getTaskTypeIcon(task.taskType) && (
                      <div className="flex-shrink-0">
                        <img
                          src={getTaskTypeIcon(task.taskType) || undefined}
                          alt={task.taskType}
                          className="w-8 h-8 rounded"
                          title={task.taskType}
                        />
                      </div>
                    )}
                    {/* ステータスバッジ */}
                    <div className="flex flex-wrap gap-1 justify-end">
                      {task.isCompleted && <span className="badge badge-success badge-sm">完了</span>}
                      {task.isDiscarded && <span className="badge badge-neutral badge-sm">破棄</span>}
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>

                  {/* タスク内容 */}
                  <div className="flex-1 min-h-[3rem]">
                    <p className={`text-sm line-clamp-3 ${task.isCompleted ? 'line-through' : ''}`}>{task.content}</p>
                  </div>

                  {/* 進捗バー */}
                  {task.progressPercentage !== undefined && task.progressPercentage > 0 && (
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-base-content/70">進捗</span>
                        <span className="text-xs font-semibold">{task.progressPercentage}%</span>
                      </div>
                      <progress
                        className="progress progress-primary w-full h-2"
                        value={task.progressPercentage}
                        max="100"
                      ></progress>
                    </div>
                  )}

                  {/* フッター: 担当者 + 期限 */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-base-300">
                    {/* 担当者 */}
                    {task.assignedUserId && (
                      <div className="flex items-center gap-1 min-w-0">
                        {task.assignedAvatarUrl && (
                          <img
                            src={getDisplayIconUrl(task.assignedAvatarUrl)}
                            alt={task.assignedUsername || '担当者'}
                            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <span className="text-xs truncate">{task.assignedUsername}</span>
                      </div>
                    )}
                    {/* 期限 */}
                    {task.dueDate && (
                      <div className="text-xs text-base-content/70 flex-shrink-0">
                        {new Date(task.dueDate).toLocaleDateString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkspaceTasks;
