'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComments,
  updateTaskComment,
} from '@/actions/workspaceTaskComment';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import type { CreateTaskCommentRequest, TaskCommentDetailResponse, TaskCommentType } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { convertToLinks } from '@/libs/utils/autoLink';
import { formatDateTime } from '@/libs/utils/date';
import { useCurrentUserId } from '@/providers/AppSettingsProvider';

/** コメントタイプのラベルと色 */
/** コメントの最大文字数 */
const MAX_COMMENT_LENGTH = 500;

const commentTypeConfig: Record<
  NonNullable<TaskCommentType>,
  { label: string; color: string; iconClass: string; placeholder: string }
> = {
  Normal: {
    label: '通常',
    color: 'badge-neutral',
    iconClass: 'icon-[mdi--message-outline]',
    placeholder: 'コメント... (Shift+Enterで改行)',
  },
  Memo: {
    label: 'メモ',
    color: 'badge-info',
    iconClass: 'icon-[mdi--note-outline]',
    placeholder: 'コメント... (Shift+Enterで改行)',
  },
  HelpWanted: {
    label: '助けて',
    color: 'badge-warning',
    iconClass: 'icon-[mdi--help-circle-outline]',
    placeholder: '宛先考えずに助けてほしい内容を書きましょう！',
  },
  NeedReply: {
    label: '返事が欲しい',
    color: 'badge-primary',
    iconClass: 'icon-[mdi--email-outline]',
    placeholder: '誰から返事が欲しいかを含めましょう！',
  },
  Reminder: {
    label: 'リマインダー',
    color: 'badge-secondary',
    iconClass: 'icon-[mdi--bell-outline]',
    placeholder: '通知を受けたい日付を含めましょう！',
  },
  Urge: {
    label: '督促',
    color: 'badge-error',
    iconClass: 'icon-[mdi--alarm]',
    placeholder: 'コメント... (Shift+Enterで改行)',
  },
};

interface TaskCommentSectionProps {
  workspaceId: number;
  itemId: number;
  taskId: number;
  /** コメント数が変更された時のコールバック */
  onCommentCountChange?: (count: number) => void;
  /** コメント入力欄にフォーカスするかどうか */
  autoFocus?: boolean;
  /** ワークスペース編集権限があるかどうか（Viewer以外）*/
  canEdit?: boolean;
  /** タスクの担当者ID */
  taskAssigneeId?: number | null;
  /** アイテムのオーナーID */
  itemOwnerId?: number | null;
  /** アイテムの担当者ID */
  itemAssigneeId?: number | null;
  /** アイテムのコミッターID */
  itemCommitterId?: number | null;
}

/** ユーザーの役割に応じて利用可能なコメントタイプを取得 */
function getAvailableCommentTypes(
  currentUserId: number,
  taskAssigneeId?: number | null,
  itemOwnerId?: number | null,
  itemAssigneeId?: number | null,
  itemCommitterId?: number | null,
): NonNullable<TaskCommentType>[] {
  const isTaskAssignee = taskAssigneeId != null && taskAssigneeId === currentUserId;
  const isItemOwnerOrAssigneeOrCommitter =
    (itemOwnerId != null && itemOwnerId === currentUserId) ||
    (itemAssigneeId != null && itemAssigneeId === currentUserId) ||
    (itemCommitterId != null && itemCommitterId === currentUserId);

  if (isTaskAssignee) {
    return ['Normal', 'Memo', 'HelpWanted', 'NeedReply', 'Reminder'];
  }
  if (isItemOwnerOrAssigneeOrCommitter) {
    return ['Normal', 'NeedReply', 'Urge'];
  }
  return ['Normal'];
}

export default function TaskCommentSection({
  workspaceId,
  itemId,
  taskId,
  onCommentCountChange,
  autoFocus = false,
  canEdit = true,
  taskAssigneeId,
  itemOwnerId,
  itemAssigneeId,
  itemCommitterId,
}: TaskCommentSectionProps) {
  const notify = useNotify();
  const currentUserId = useCurrentUserId();
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

  // 削除確認モーダル
  const [deleteTargetComment, setDeleteTargetComment] = useState<TaskCommentDetailResponse | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // スクロール位置
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // IME入力中かどうか（日本語変換中のEnterでサブミットされるのを防止）
  const isComposingRef = useRef(false);

  // 利用可能なコメントタイプ
  const availableCommentTypes = getAvailableCommentTypes(
    currentUserId,
    taskAssigneeId,
    itemOwnerId,
    itemAssigneeId,
    itemCommitterId,
  );

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
    // ワークスペース編集権限チェック
    if (!canEdit) {
      notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
      return;
    }

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
  }, [newComment, newCommentType, workspaceId, itemId, taskId, fetchComments, notify, canEdit]);

  // 編集開始
  const handleStartEdit = useCallback((comment: TaskCommentDetailResponse) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content || '');
  }, []);

  // 編集キャンセル
  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditingContent('');
  }, []);

  // 編集保存
  const handleSaveEdit = useCallback(
    async (comment: TaskCommentDetailResponse) => {
      // ワークスペース編集権限チェック
      if (!canEdit) {
        notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
        return;
      }

      if (!editingContent.trim()) {
        notify.error('コメントを入力してください');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await updateTaskComment(workspaceId, itemId, taskId, comment.id, {
          content: editingContent.trim(),
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
    [editingContent, workspaceId, itemId, taskId, fetchComments, notify, canEdit],
  );

  // 削除確認モーダルを開く
  const handleDeleteClick = useCallback(
    (comment: TaskCommentDetailResponse) => {
      // ワークスペース編集権限チェック
      if (!canEdit) {
        notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
        return;
      }
      setDeleteTargetComment(comment);
      setIsDeleteModalOpen(true);
    },
    [canEdit, notify],
  );

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

  // Enter キーでコメント投稿（IME入力中は無視）
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // IME入力中（日本語変換中など）は無視
      if (isComposingRef.current) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmitComment();
      }
    },
    [handleSubmitComment],
  );

  // IME入力開始
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  // IME入力終了
  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
  }, []);

  return (
    <div className="flex flex-col h-full flex-1 min-h-0">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 p-3 border-b border-base-300 flex-shrink-0">
        <span className="icon-[mdi--message-outline] text-primary w-5 h-5" aria-hidden="true" />
        <span className="font-bold">コメント</span>
        <span className="badge badge-secondary badge-sm">{totalCount}件</span>
      </div>

      {/* コメント一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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
            {comments.map((comment) => {
              const isOwn = comment.user?.id === currentUserId;
              return (
                <div
                  key={comment.id}
                  className={`flex gap-3 ${comment.isDeleted ? 'opacity-50' : ''} ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {/* アバター（相手のみ左側に表示） */}
                  {!isOwn && (
                    <div className="flex-shrink-0 pt-0.5">
                      <UserAvatar
                        userName={comment.user?.username}
                        isActive={comment.user?.isActive ?? false}
                        identityIconUrl={comment.user?.identityIconUrl}
                        size={36}
                        showName={false}
                      />
                    </div>
                  )}

                  {/* コメント本体 */}
                  <div className={`max-w-[75%] ${isOwn ? 'text-right' : 'text-left'}`}>
                    {/* ヘッダー */}
                    <div className={`flex items-center gap-2 mb-1 flex-wrap ${isOwn ? 'justify-end' : ''}`}>
                      <span className="font-medium text-sm">{comment.user?.username}</span>
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
                        {comment.createdAt ? formatDateTime(comment.createdAt) : ''}
                      </span>
                    </div>

                    {/* 内容 */}
                    {editingCommentId === comment.id ? (
                      // 編集モード（内容のみ編集可、コメントタイプは変更不可）
                      <div className="space-y-2">
                        <textarea
                          className="textarea textarea-bordered textarea-sm w-full"
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={2}
                          disabled={isSubmitting}
                        />
                        <div className="flex items-center gap-1.5 justify-end">
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
                        className={`rounded-2xl px-3 py-2 inline-block text-left ${isOwn ? 'bg-primary/20' : 'bg-base-200'}`}
                      >
                        {comment.isDeleted ? (
                          <span className="italic text-base-content/50 text-sm">このコメントは削除されました</span>
                        ) : (
                          <div
                            className="text-sm whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: convertToLinks(comment.content ?? '') }}
                          />
                        )}
                      </div>
                    )}

                    {/* アクションボタン（自分のコメントかつ削除されていない場合のみ） */}
                    {!comment.isDeleted && isOwn && editingCommentId !== comment.id && (
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <button
                          type="button"
                          className="btn btn-xs btn-soft btn-secondary p-1 min-h-0 h-auto"
                          onClick={() => handleStartEdit(comment)}
                          title="編集"
                        >
                          <span className="icon-[mdi--pencil-outline] w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-soft btn-secondary p-1 min-h-0 h-auto"
                          onClick={() => handleDeleteClick(comment)}
                          title="削除"
                        >
                          <span className="icon-[mdi--delete-outline] w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* アバター（自分のみ右側に表示） */}
                  {isOwn && (
                    <div className="flex-shrink-0 pt-0.5">
                      <UserAvatar
                        userName={comment.user?.username}
                        isActive={comment.user?.isActive ?? false}
                        identityIconUrl={comment.user?.identityIconUrl}
                        size={36}
                        showName={false}
                      />
                    </div>
                  )}
                </div>
              );
            })}

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
        {/* テキストエリアと送信ボタン */}
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              className={`textarea textarea-bordered textarea-sm w-full min-h-10 max-h-24 resize-none ${newCommentError ? 'textarea-error' : ''}`}
              placeholder={commentTypeConfig[newCommentType ?? 'Normal'].placeholder}
              value={newComment}
              onChange={(e) => handleNewCommentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              disabled={isSubmitting}
              rows={1}
              maxLength={MAX_COMMENT_LENGTH + 50}
            />
          </div>
          {/* 送信ボタン */}
          <button
            type="button"
            className="btn btn-primary btn-sm h-10 w-10 p-0 flex-shrink-0"
            onClick={handleSubmitComment}
            disabled={isSubmitting || !newComment.trim() || newComment.length > MAX_COMMENT_LENGTH}
            title="送信 (Enter)"
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <span className="icon-[mdi--send] w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {/* コメントタイプ選択と文字数 */}
        <div className="flex justify-between items-center mt-2">
          {availableCommentTypes.length > 1 ? (
            <select
              className="select select-bordered select-xs w-auto min-w-0"
              value={newCommentType ?? 'Normal'}
              onChange={(e) => setNewCommentType(e.target.value as TaskCommentType)}
              disabled={isSubmitting}
            >
              {availableCommentTypes.map((key) => (
                <option key={key} value={key}>
                  {commentTypeConfig[key].label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-base-content/50">{commentTypeConfig[availableCommentTypes[0]].label}</span>
          )}
          <div className="flex items-center gap-2">
            {newCommentError && <span className="text-error text-xs">{newCommentError}</span>}
            <span
              className={`text-xs tabular-nums ${newComment.length > MAX_COMMENT_LENGTH ? 'text-error font-medium' : 'text-base-content/50'}`}
            >
              {newComment.length}/{MAX_COMMENT_LENGTH}
            </span>
          </div>
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
