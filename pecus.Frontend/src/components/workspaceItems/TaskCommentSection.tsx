'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComments,
  updateTaskComment,
} from '@/actions/workspaceTaskComment';
import UserAvatar from '@/components/common/UserAvatar';
import type { CreateTaskCommentRequest, TaskCommentDetailResponse, TaskCommentType } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';

/** コメントタイプのラベルと色 */
/** コメントの最大文字数 */
const MAX_COMMENT_LENGTH = 500;

const commentTypeConfig: Record<TaskCommentType, { label: string; color: string; iconClass: string }> = {
  Normal: { label: '通常', color: 'badge-neutral', iconClass: 'icon-[mdi--message-outline]' },
  Memo: { label: 'メモ', color: 'badge-info', iconClass: 'icon-[mdi--note-outline]' },
  HelpWanted: { label: '助けて', color: 'badge-warning', iconClass: 'icon-[mdi--help-circle-outline]' },
  NeedReply: { label: '返事が欲しい', color: 'badge-primary', iconClass: 'icon-[mdi--email-outline]' },
  Reminder: { label: 'リマインダー', color: 'badge-secondary', iconClass: 'icon-[mdi--bell-outline]' },
  Urge: { label: '督促', color: 'badge-error', iconClass: 'icon-[mdi--alarm]' },
};

interface TaskCommentSectionProps {
  workspaceId: number;
  itemId: number;
  taskId: number;
  /** 現在のユーザーID（未ログイン時はundefined） */
  currentUserId?: number;
  /** コメント数が変更された時のコールバック */
  onCommentCountChange?: (count: number) => void;
  /** コメント入力欄にフォーカスするかどうか */
  autoFocus?: boolean;
}

export default function TaskCommentSection({
  workspaceId,
  itemId,
  taskId,
  currentUserId,
  onCommentCountChange,
  autoFocus = false,
}: TaskCommentSectionProps) {
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
  const [newCommentError, setNewCommentError] = useState<string | null>(null);

  // 編集中のコメント
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingType, setEditingType] = useState<TaskCommentType>('Normal');

  // 削除確認モーダル
  const [deleteTargetComment, setDeleteTargetComment] = useState<TaskCommentDetailResponse | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // スクロール位置
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // コメント一覧を取得（削除済み含む）
  const fetchComments = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      setIsLoading(true);
      try {
        // includeDeleted: true で削除済みコメントも含めて取得
        const result = await getTaskComments(workspaceId, itemId, taskId, pageNum, undefined, true);
        if (result.success) {
          const newComments = result.data.data || [];
          if (append) {
            setComments((prev) => [...prev, ...newComments]);
          } else {
            setComments(newComments);
          }
          setTotalPages(result.data.totalPages || 1);
          const count = result.data.totalCount || 0;
          setTotalCount(count);
          setPage(pageNum);
          onCommentCountChange?.(count);
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
    [workspaceId, itemId, taskId, onCommentCountChange],
  );

  // 初回取得
  useEffect(() => {
    fetchComments(1);
    setNewComment('');
    setNewCommentType('Normal');
    setEditingCommentId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, itemId, taskId]);

  // autoFocus
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // さらに読み込む
  const handleLoadMore = useCallback(() => {
    if (page < totalPages && !isLoading) {
      fetchComments(page + 1, true);
    }
  }, [page, totalPages, isLoading, fetchComments]);

  // 新規コメント入力時のバリデーション
  const handleNewCommentChange = useCallback((value: string) => {
    setNewComment(value);
    if (value.length > MAX_COMMENT_LENGTH) {
      setNewCommentError(`コメントは${MAX_COMMENT_LENGTH}文字以内で入力してください。`);
    } else {
      setNewCommentError(null);
    }
  }, []);

  // 新規コメント投稿
  const handleSubmitComment = useCallback(async () => {
    const trimmed = newComment.trim();
    if (!trimmed) {
      setNewCommentError('コメントを入力してください。');
      return;
    }
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setNewCommentError(`コメントは${MAX_COMMENT_LENGTH}文字以内で入力してください。`);
      return;
    }

    setIsSubmitting(true);
    try {
      const request: CreateTaskCommentRequest = {
        content: newComment.trim(),
        commentType: newCommentType,
      };

      const result = await createTaskComment(workspaceId, itemId, taskId, request);
      if (result.success) {
        notify.success('コメントを投稿しました');
        setNewComment('');
        setNewCommentType('Normal');
        setNewCommentError(null);
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
  }, [newComment, newCommentType, workspaceId, itemId, taskId, fetchComments, notify]);

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
        const result = await updateTaskComment(workspaceId, itemId, taskId, comment.id, {
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
    [editingContent, editingType, workspaceId, itemId, taskId, fetchComments, notify],
  );

  // 削除確認モーダルを開く
  const handleDeleteClick = useCallback((comment: TaskCommentDetailResponse) => {
    setDeleteTargetComment(comment);
    setIsDeleteModalOpen(true);
  }, []);

  // 削除確認モーダルを閉じる
  const handleDeleteModalClose = useCallback(() => {
    setDeleteTargetComment(null);
    setIsDeleteModalOpen(false);
  }, []);

  // 削除実行
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTargetComment) return;

    setIsSubmitting(true);
    try {
      const result = await deleteTaskComment(
        workspaceId,
        itemId,
        taskId,
        deleteTargetComment.id,
        deleteTargetComment.rowVersion,
      );

      if (result.success) {
        notify.success('コメントを削除しました');
        handleDeleteModalClose();
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
  }, [deleteTargetComment, workspaceId, itemId, taskId, fetchComments, notify, handleDeleteModalClose]);

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

  return (
    <div className="flex flex-col h-full flex-1 min-h-0">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 p-3 border-b border-base-300 flex-shrink-0">
        <span className="icon-[mdi--message-outline] text-primary w-5 h-5" aria-hidden="true" />
        <span className="font-bold">コメント</span>
        <span className="badge badge-neutral badge-sm">{totalCount}件</span>
      </div>

      {/* コメント一覧 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {isLoading && comments.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-base-content/50 py-8">
            <span className="icon-[mdi--message-outline] w-10 h-10 mx-auto mb-2 opacity-30 block" aria-hidden="true" />
            <p className="text-sm">コメントはまだありません</p>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`flex gap-2 ${comment.isDeleted ? 'opacity-50' : ''} ${
                  comment.userId === currentUserId ? 'flex-row-reverse' : ''
                }`}
              >
                {/* アバター */}
                <div className="flex-shrink-0">
                  <UserAvatar
                    userName={comment.username}
                    identityIconUrl={comment.avatarUrl}
                    size={32}
                    showName={false}
                  />
                </div>

                {/* コメント本体 */}
                <div className={`flex-1 max-w-[85%] ${comment.userId === currentUserId ? 'text-right' : 'text-left'}`}>
                  {/* ヘッダー */}
                  <div
                    className={`flex items-center gap-2 mb-1 flex-wrap ${comment.userId === currentUserId ? 'justify-end' : ''}`}
                  >
                    <span className="font-medium text-sm">{comment.username}</span>
                    {(() => {
                      const type = comment.commentType || 'Normal';
                      const config = commentTypeConfig[type];
                      return config ? (
                        <span className={`badge badge-sm ${config.color}`} title={config.label}>
                          <span className={`${config.iconClass} size-3 mr-0.5`} aria-hidden="true" />
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
                        className="textarea textarea-bordered textarea-sm w-full"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={2}
                        disabled={isSubmitting}
                      />
                      <div className="flex items-center gap-1.5">
                        <select
                          className="select select-bordered select-xs"
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
                          className="btn btn-xs btn-secondary"
                          onClick={handleCancelEdit}
                          disabled={isSubmitting}
                        >
                          キャンセル
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
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
                      className={`rounded-lg p-2.5 ${comment.userId === currentUserId ? 'bg-primary/10 text-left' : 'bg-base-200 text-left'}`}
                    >
                      {comment.isDeleted ? (
                        <span className="italic text-base-content/50 text-sm">このコメントは削除されました</span>
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
                        className="btn btn-xs btn-secondary text-base-content/50 hover:text-primary p-1 min-h-0 h-auto"
                        onClick={() => handleStartEdit(comment)}
                        title="編集"
                      >
                        <span className="icon-[mdi--pencil-outline] w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-secondary text-base-content/50 hover:text-error p-1 min-h-0 h-auto"
                        onClick={() => handleDeleteClick(comment)}
                        title="削除"
                      >
                        <span className="icon-[mdi--delete-outline] w-4 h-4" aria-hidden="true" />
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
                  className="btn btn-xs btn-secondary"
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
      <div className="p-3 border-t border-base-300 flex-shrink-0 bg-base-100">
        <div className="flex gap-2 items-end">
          {/* コメントタイプ選択 */}
          <select
            className="select select-bordered select-sm w-24"
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
          <div className="flex-1 flex flex-col">
            <textarea
              ref={textareaRef}
              className={`textarea textarea-bordered textarea-sm w-full min-h-[2.5rem] max-h-24 resize-none ${newCommentError ? 'textarea-error' : ''}`}
              placeholder="コメント... (Shift+Enterで改行)"
              value={newComment}
              onChange={(e) => handleNewCommentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              rows={1}
              maxLength={MAX_COMMENT_LENGTH + 50}
            />
            <div className="flex justify-between items-center mt-1">
              {newCommentError ? <span className="text-error text-xs">{newCommentError}</span> : <span></span>}
              <span
                className={`text-xs ${newComment.length > MAX_COMMENT_LENGTH ? 'text-error font-medium' : 'text-base-content/50'}`}
              >
                {newComment.length}/{MAX_COMMENT_LENGTH}
              </span>
            </div>
          </div>

          {/* 送信ボタン */}
          <button
            type="button"
            className="btn btn-primary btn-sm self-start"
            onClick={handleSubmitComment}
            disabled={isSubmitting || !newComment.trim() || newComment.length > MAX_COMMENT_LENGTH}
            title="送信 (Enter)"
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <span className="icon-[mdi--send-outline] w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* 削除確認モーダル */}
      {isDeleteModalOpen && deleteTargetComment && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={handleDeleteModalClose} aria-hidden="true" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-lg shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">コメントの削除</h3>
              <p className="text-base-content/70 mb-6">このコメントを削除しますか？</p>
              <div className="bg-base-200 rounded-lg p-3 mb-6">
                <p className="text-sm whitespace-pre-wrap line-clamp-3">{deleteTargetComment.content}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleDeleteModalClose}
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className="btn btn-error btn-sm"
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      削除中...
                    </>
                  ) : (
                    '削除する'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
