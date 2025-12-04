'use client';

import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComments,
  updateTaskComment,
} from '@/actions/workspaceTaskComment';
import type {
  CreateTaskCommentRequest,
  TaskCommentDetailResponse,
  TaskCommentType,
  WorkspaceTaskDetailResponse,
} from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { getDisplayIconUrl } from '@/utils/imageUrl';

/** コメントタイプのラベルと色 */
const commentTypeConfig: Record<TaskCommentType, { label: string; color: string; icon: string }> = {
  Normal: { label: '通常', color: 'badge-neutral', icon: 'icon-[tabler--message]' },
  Memo: { label: 'メモ', color: 'badge-info', icon: 'icon-[tabler--note]' },
  HelpWanted: { label: '助けて', color: 'badge-warning', icon: 'icon-[tabler--help]' },
  NeedReply: { label: '返事が欲しい', color: 'badge-primary', icon: 'icon-[tabler--mail-question]' },
  Reminder: { label: 'リマインダー', color: 'badge-secondary', icon: 'icon-[tabler--bell]' },
  Urge: { label: '督促', color: 'badge-error', icon: 'icon-[tabler--urgent]' },
};

interface TaskCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  itemId: number;
  task: WorkspaceTaskDetailResponse;
  currentUserId: number;
}

export default function TaskCommentModal({
  isOpen,
  onClose,
  workspaceId,
  itemId,
  task,
  currentUserId,
}: TaskCommentModalProps) {
  const notify = useNotify();
  const [comments, setComments] = useState<TaskCommentDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 新規コメント入力
  const [newComment, setNewComment] = useState('');
  const [newCommentType, setNewCommentType] = useState<TaskCommentType>('Normal');

  // 編集中のコメント
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingType, setEditingType] = useState<TaskCommentType>('Normal');

  // スクロール位置
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // コメント一覧を取得
  const fetchComments = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      setIsLoading(true);
      try {
        const result = await getTaskComments(workspaceId, itemId, task.id, pageNum, 20);
        if (result.success) {
          const newComments = result.data.data || [];
          if (append) {
            setComments((prev) => [...prev, ...newComments]);
          } else {
            setComments(newComments);
          }
          setTotalPages(result.data.totalPages || 1);
          setTotalCount(result.data.totalCount || 0);
          setPage(pageNum);

          console.log('Fetched comments:', newComments);
        } else {
          notify.error(result.message || 'コメントの取得に失敗しました');
        }
      } catch {
        notify.error('コメントの取得中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceId, itemId, task.id],
  );

  // モーダルが開いた時にコメントを取得
  useEffect(() => {
    if (isOpen) {
      fetchComments(1);
      setNewComment('');
      setNewCommentType('Normal');
      setEditingCommentId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, workspaceId, itemId, task.id]);

  // さらに読み込む
  const handleLoadMore = useCallback(() => {
    if (page < totalPages && !isLoading) {
      fetchComments(page + 1, true);
    }
  }, [page, totalPages, isLoading, fetchComments]);

  // コメント投稿
  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim()) {
      notify.error('コメントを入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const request: CreateTaskCommentRequest = {
        content: newComment.trim(),
        commentType: newCommentType,
      };

      const result = await createTaskComment(workspaceId, itemId, task.id, request);
      if (result.success) {
        notify.success('コメントを投稿しました');
        setNewComment('');
        setNewCommentType('Normal');
        // コメント一覧を再取得
        await fetchComments(1);
        // 新しいコメントへスクロール
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        notify.error(result.message || 'コメントの投稿に失敗しました');
      }
    } catch {
      notify.error('コメントの投稿中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, newCommentType, workspaceId, itemId, task.id, fetchComments, notify]);

  // 編集開始
  const handleStartEdit = useCallback((comment: TaskCommentDetailResponse) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content || '');
    setEditingType(comment.commentType || 'Normal');
  }, []);

  // 編集キャンセル
  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditingContent('');
    setEditingType('Normal');
  }, []);

  // 編集保存
  const handleSaveEdit = useCallback(
    async (comment: TaskCommentDetailResponse) => {
      if (!editingContent.trim()) {
        notify.error('コメントを入力してください');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await updateTaskComment(workspaceId, itemId, task.id, comment.id, {
          content: editingContent.trim(),
          commentType: editingType,
          rowVersion: comment.rowVersion,
        });

        if (result.success) {
          notify.success('コメントを更新しました');
          setEditingCommentId(null);
          // コメント一覧を再取得
          await fetchComments(1);
        } else {
          if (result.error === 'conflict') {
            notify.error('他のユーザーが更新しました。ページを再読み込みしてください。');
          } else {
            notify.error(result.message || 'コメントの更新に失敗しました');
          }
        }
      } catch {
        notify.error('コメントの更新中にエラーが発生しました');
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingContent, editingType, workspaceId, itemId, task.id, fetchComments, notify],
  );

  // 削除
  const handleDelete = useCallback(
    async (comment: TaskCommentDetailResponse) => {
      if (!confirm('このコメントを削除しますか？')) {
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await deleteTaskComment(workspaceId, itemId, task.id, comment.id, comment.rowVersion);

        if (result.success) {
          notify.success('コメントを削除しました');
          // コメント一覧を再取得
          await fetchComments(1);
        } else {
          if (result.error === 'conflict') {
            notify.error('他のユーザーが更新しました。ページを再読み込みしてください。');
          } else {
            notify.error(result.message || 'コメントの削除に失敗しました');
          }
        }
      } catch {
        notify.error('コメントの削除中にエラーが発生しました');
      } finally {
        setIsSubmitting(false);
      }
    },
    [workspaceId, itemId, task.id, fetchComments, notify],
  );

  // Enter キーでコメント投稿
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmitComment();
      }
    },
    [handleSubmitComment],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* モーダル背景オーバーレイ */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />

      {/* モーダルコンテンツ */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* モーダルヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-base-300 flex-shrink-0">
            <div className="flex items-center gap-3">
              <ChatBubbleOutlineIcon className="text-primary" />
              <h2 className="text-lg font-bold">コメント</h2>
              <span className="badge badge-neutral badge-sm">{totalCount}件</span>
            </div>
            <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={onClose} aria-label="閉じる">
              <CloseIcon />
            </button>
          </div>

          {/* タスク情報 */}
          <div className="px-4 py-3 bg-base-200/50 border-b border-base-300 flex-shrink-0">
            <div className="flex items-center gap-2">
              {task.taskTypeIcon && (
                <img
                  src={`/icons/task/${task.taskTypeIcon.replace(/-/g, '').toLowerCase()}.svg`}
                  alt={task.taskTypeName || ''}
                  className="w-5 h-5"
                />
              )}
              <span className="font-medium text-sm truncate">{task.content}</span>
            </div>
          </div>

          {/* コメント一覧 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {isLoading && comments.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-base-content/50 py-8">
                <ChatBubbleOutlineIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>コメントはまだありません</p>
              </div>
            ) : (
              <>
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`flex gap-3 ${comment.isDeleted ? 'opacity-50' : ''} ${
                      comment.userId === currentUserId ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* アバター */}
                    <div className="flex-shrink-0">
                      <img
                        src={getDisplayIconUrl(comment.avatarUrl)}
                        alt={comment.username || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </div>

                    {/* コメント本体 */}
                    <div
                      className={`flex-1 max-w-[85%] ${comment.userId === currentUserId ? 'text-right' : 'text-left'}`}
                    >
                      {/* ヘッダー */}
                      <div
                        className={`flex items-center gap-2 mb-1 ${comment.userId === currentUserId ? 'justify-end' : ''}`}
                      >
                        <span className="font-medium text-sm">{comment.username}</span>
                        {(() => {
                          const type = comment.commentType || 'Normal';
                          const config = commentTypeConfig[type];
                          return config ? (
                            <span className={`badge badge-xs ${config.color}`} title={config.label}>
                              <span className={`${config.icon} w-3 h-3 mr-0.5`}></span>
                              {config.label}
                            </span>
                          ) : null;
                        })()}
                        <span className="text-xs text-base-content/50">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleString('ja-JP') : ''}
                        </span>
                      </div>

                      {/* 内容 */}
                      {editingCommentId === comment.id ? (
                        // 編集モード
                        <div className="space-y-2">
                          <textarea
                            className="textarea textarea-bordered w-full text-sm"
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={3}
                            disabled={isSubmitting}
                          />
                          <div className="flex items-center gap-2">
                            <select
                              className="select select-bordered select-sm"
                              value={editingType}
                              onChange={(e) => setEditingType(e.target.value as TaskCommentType)}
                              disabled={isSubmitting}
                            >
                              {Object.entries(commentTypeConfig).map(([key, config]) => (
                                <option key={key} value={key}>
                                  {config.label}
                                </option>
                              ))}
                            </select>
                            <div className="flex-1"></div>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={handleCancelEdit}
                              disabled={isSubmitting}
                            >
                              キャンセル
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => handleSaveEdit(comment)}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : '保存'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        // 表示モード
                        <div
                          className={`rounded-lg p-3 ${
                            comment.userId === currentUserId ? 'bg-primary/10 text-left' : 'bg-base-200 text-left'
                          }`}
                        >
                          {comment.isDeleted ? (
                            <span className="italic text-base-content/50">このコメントは削除されました</span>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                          )}
                        </div>
                      )}

                      {/* アクションボタン（自分のコメントかつ削除されていない場合のみ） */}
                      {!comment.isDeleted && comment.userId === currentUserId && editingCommentId !== comment.id && (
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <button
                            type="button"
                            className="btn btn-xs btn-ghost text-base-content/50 hover:text-primary"
                            onClick={() => handleStartEdit(comment)}
                            title="編集"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-ghost text-base-content/50 hover:text-error"
                            onClick={() => handleDelete(comment)}
                            title="削除"
                          >
                            <DeleteOutlineIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* さらに読み込むボタン */}
                {page < totalPages && (
                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? <span className="loading loading-spinner loading-xs"></span> : 'さらに読み込む'}
                    </button>
                  </div>
                )}

                <div ref={commentsEndRef} />
              </>
            )}
          </div>

          {/* 新規コメント入力エリア */}
          <div className="p-4 border-t border-base-300 flex-shrink-0 bg-base-100">
            <div className="flex gap-2 items-end">
              {/* コメントタイプ選択 */}
              <select
                className="select select-bordered select-sm w-28"
                value={newCommentType}
                onChange={(e) => setNewCommentType(e.target.value as TaskCommentType)}
                disabled={isSubmitting}
              >
                {Object.entries(commentTypeConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>

              {/* テキストエリア */}
              <textarea
                className="textarea textarea-bordered flex-1 min-h-[2.5rem] max-h-32 resize-none text-sm"
                placeholder="コメントを入力... (Shift+Enterで改行)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                rows={1}
              />

              {/* 送信ボタン */}
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSubmitComment}
                disabled={isSubmitting || !newComment.trim()}
                title="送信 (Enter)"
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
