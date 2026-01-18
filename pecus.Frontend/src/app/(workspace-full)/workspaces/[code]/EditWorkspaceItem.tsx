'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { $ZodIssue } from 'zod/v4/core';
import { fetchLatestWorkspaceItem } from '@/actions/workspaceItem';
import { ConflictAlert } from '@/components/common/feedback/ConflictAlert';
import TagInput from '@/components/common/forms/TagInput';
import { PecusNotionLikeEditor, useExistingItemImageUploadHandler } from '@/components/editor';
import type { WorkspaceItemDetailResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { useSignalRContext } from '@/providers/SignalRProvider';
import { updateWorkspaceItemSchema } from '@/schemas/editSchemas';

/** アイテム更新リクエストの型定義（親に委譲する） */
export interface ItemUpdateRequest {
  subject: string;
  body: string | null;
  isDraft: boolean;
  tagNames: string[];
}

interface EditWorkspaceItemProps {
  item: WorkspaceItemDetailResponse;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: number;
  /** 編集権限があるかどうか（Viewer以外）*/
  canEdit?: boolean;
  /** 更新処理中かどうか（親から渡される） */
  isUpdating?: boolean;
  /** エラーメッセージ（親から渡される） */
  error?: string | null;
  /** 更新リクエスト（親に委譲） */
  onUpdate: (request: ItemUpdateRequest) => Promise<void>;
  /** 競合時の上書き更新リクエスト（親に委譲） */
  onOverwrite: (request: ItemUpdateRequest, latestRowVersion: number) => Promise<void>;
}

export default function EditWorkspaceItem({
  item,
  isOpen,
  onClose,
  currentUserId,
  canEdit = true,
  isUpdating = false,
  error = null,
  onUpdate,
  onOverwrite,
}: EditWorkspaceItemProps) {
  const notify = useNotify();
  const { startItemEdit, endItemEdit } = useSignalRContext();

  // 最新アイテムデータ
  const [latestItem, setLatestItem] = useState<WorkspaceItemDetailResponse>(item);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [itemLoadError, setItemLoadError] = useState<string | null>(null);

  // フォーム状態（スキーマの型に合わせる）
  // 注: dueDate, priority, isArchived はドロワー側で個別の属性更新APIを使用するため、このフォームでは管理しない
  // 注: rowVersionは親が管理するため、ここでは保持しない
  const [formData, setFormData] = useState({
    subject: item.subject || '',
    isDraft: item.isDraft ?? false,
  });

  // エディタ初期値（item.body）とユーザー入力値は分離して管理
  const [initialEditorState, setInitialEditorState] = useState<string>(item.body || '');
  const [editorValue, setEditorValue] = useState<string>(item.body || '');
  const [editorInitKey, setEditorInitKey] = useState<number>(0);

  // タグ状態管理
  const [tagNames, setTagNames] = useState<string[]>(
    item.tags?.map((t) => t.name).filter((name): name is string => !!name) || [],
  );

  // 手動フォーム検証（サブミット状態は親からisUpdatingとして渡される）
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // 競合状態管理
  const [isConflict, setIsConflict] = useState(false);
  const [conflictData, setConflictData] = useState<WorkspaceItemDetailResponse | null>(null);

  const shouldShowError = useCallback((fieldName: string) => !!fieldErrors[fieldName], [fieldErrors]);

  const getFieldError = useCallback((fieldName: string) => fieldErrors[fieldName]?.[0] || null, [fieldErrors]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isUpdating) return;

      // 編集権限チェック
      if (!canEdit) {
        notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
        return;
      }

      setFieldErrors({});

      // 状態管理している値で検証（FormData ではなく）
      // 注: rowVersionは親が管理するため、バリデーション用にitem.rowVersionを使用
      const result = await updateWorkspaceItemSchema.safeParseAsync({
        subject: formData.subject,
        isDraft: formData.isDraft,
        rowVersion: item.rowVersion,
      });
      if (!result.success) {
        // エラーをフィールドごとに分類
        const errors: Record<string, string[]> = {};
        result.error.issues.forEach((issue: $ZodIssue) => {
          const path = issue.path.join('.');
          if (!errors[path]) errors[path] = [];
          errors[path].push(issue.message);
        });
        setFieldErrors(errors);
        return;
      }

      try {
        // 親に更新を委譲
        await onUpdate({
          subject: result.data.subject,
          body: editorValue || null,
          isDraft: formData.isDraft,
          tagNames: tagNames,
        });
        // 成功時は親でonCloseを呼ぶ
      } catch (err: unknown) {
        // 競合エラーの場合
        if (
          typeof err === 'object' &&
          err !== null &&
          'error' in err &&
          (err as { error: string }).error === 'conflict'
        ) {
          const conflictErr = err as { error: string; latest?: { data: WorkspaceItemDetailResponse } };
          if (conflictErr.latest?.data) {
            setConflictData(conflictErr.latest.data);
            setIsConflict(true);
          }
        }
        // その他のエラーは親が処理
      }
    },
    [formData, editorValue, tagNames, item.rowVersion, canEdit, isUpdating, onUpdate, notify],
  );

  const formRef = useRef<HTMLFormElement>(null);

  // モーダルが開かれたときに最新のアイテムデータを取得し、エディタ値も初期化
  useEffect(() => {
    if (!isOpen) return;

    // 編集開始を通知
    startItemEdit(item.id).catch((err) => console.warn('[SignalR] startItemEdit failed', err));

    const fetchLatestItem = async () => {
      setIsLoadingItem(true);
      setItemLoadError(null);

      try {
        const result = await fetchLatestWorkspaceItem(item.workspaceId || 0, item.id);

        if (result.success) {
          setLatestItem(result.data);
          // フォームデータを更新
          // 注: dueDate, priority, isArchived はドロワー側で個別の属性更新APIを使用するため、このフォームでは管理しない
          // 注: rowVersionは親が管理するため、ここでは更新しない
          setFormData({
            subject: result.data.subject || '',
            isDraft: result.data.isDraft ?? false,
          });
          // エディタ初期値とユーザー入力値を両方初期化
          setInitialEditorState(result.data.body || '');
          setEditorValue(result.data.body || '');
          setEditorInitKey((k) => k + 1); // 強制再マウント
          // タグを初期化
          setTagNames(result.data.tags?.map((t) => t.name).filter((name): name is string => !!name) || []);
        } else {
          setItemLoadError(result.message || 'アイテムの取得に失敗しました。');
        }
      } catch (err) {
        console.error('アイテム取得中にエラーが発生しました:', err);
        setItemLoadError('アイテムの取得中にエラーが発生しました。');
      } finally {
        setIsLoadingItem(false);
      }
    };

    fetchLatestItem();

    return () => {
      endItemEdit(item.id).catch((err) => console.warn('[SignalR] endItemEdit failed', err));
    };
  }, [endItemEdit, isOpen, item.id, item.workspaceId, startItemEdit]);

  // 入力時の検証とフォーム状態更新
  const handleFieldChange = useCallback((fieldName: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // エラーがあればクリア（入力時は検証を行わず、エラーのみクリア）
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  // エディタ変更時の処理
  const handleEditorChange = (newValue: string) => {
    setEditorValue(newValue);
  };

  // モーダルを閉じる際の処理
  const handleClose = () => {
    if (!isUpdating && !isLoadingItem) {
      endItemEdit(item.id).catch((err) => console.warn('[SignalR] endItemEdit failed', err));
      onClose();
    }
  };

  // 競合時の上書き処理
  const handleOverwrite = async (latestRowVersion: number) => {
    setIsConflict(false);
    setConflictData(null);

    try {
      await onOverwrite(
        {
          subject: formData.subject,
          body: editorValue || null,
          isDraft: formData.isDraft,
          tagNames: tagNames,
        },
        latestRowVersion,
      );
      // 成功時は親でonCloseを呼ぶ
    } catch (err: unknown) {
      // 再度競合エラーの場合
      if (
        typeof err === 'object' &&
        err !== null &&
        'error' in err &&
        (err as { error: string }).error === 'conflict'
      ) {
        const conflictErr = err as { error: string; latest?: { data: WorkspaceItemDetailResponse } };
        if (conflictErr.latest?.data) {
          setConflictData(conflictErr.latest.data);
          setIsConflict(true);
        }
      }
    }
  };

  // 競合時の破棄処理（最新データで上書き）
  const handleDiscard = (latestData: WorkspaceItemDetailResponse) => {
    setFormData({
      subject: latestData.subject || '',
      isDraft: latestData.isDraft ?? false,
    });
    setEditorValue(latestData.body || '');
    setInitialEditorState(latestData.body || '');
    setEditorInitKey((k) => k + 1);
    setTagNames(latestData.tags?.map((t) => t.name).filter((name): name is string => !!name) || []);
    setLatestItem(latestData);
    setIsConflict(false);
    setConflictData(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* モーダルオーバーレイ */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        {/* モーダルコンテナ */}
        <div className="bg-base-100 rounded-box shadow-xl w-full max-w-4xl sm:max-w-6xl xl:max-w-7xl max-h-[90vh] flex flex-col">
          {/* モーダルヘッダー */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <span className="icon-[mdi--pencil-outline] size-5 sm:size-6" aria-hidden="true" />
              アイテム編集
            </h2>
            <button
              type="button"
              className="btn btn-sm btn-secondary btn-circle"
              onClick={handleClose}
              disabled={isUpdating || isLoadingItem}
              aria-label="閉じる"
            >
              <span className="icon-[mdi--close] size-5" aria-hidden="true" />
            </button>
          </div>

          {/* モーダルボディ */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-6xl mx-auto">
              {/* アイテム読み込みエラー表示 */}
              {itemLoadError && (
                <div className="alert alert-soft alert-error mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{itemLoadError}</span>
                </div>
              )}

              {/* 親からのエラー表示 */}
              {error && (
                <div className="alert alert-soft alert-error mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* ローディング中 */}
              {isLoadingItem && (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              )}

              {/* フォーム */}
              {!isLoadingItem && !itemLoadError && (
                <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* 件名 */}
                  <div className="form-control">
                    <label htmlFor="subject" className="label">
                      <span className="label-text font-semibold">
                        件名 <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="例：アイテムの件名"
                      className={`input input-bordered w-full ${shouldShowError('subject') ? 'input-error' : ''}`}
                      value={formData.subject}
                      onChange={(e) => handleFieldChange('subject', e.target.value)}
                      disabled={isUpdating}
                      maxLength={200}
                    />
                    {shouldShowError('subject') && (
                      <div className="label">
                        <span className="label-text-alt text-error">{getFieldError('subject')}</span>
                      </div>
                    )}
                    <div className="label">
                      <span className="label-text-alt text-xs">{formData.subject.length}/200 文字</span>
                    </div>
                  </div>

                  {/* 本文（WYSIWYGエディタ） */}
                  <div className="form-control">
                    <div className="label">
                      <span className="label-text font-semibold">本文</span>
                    </div>
                    <div className="overflow-auto max-h-[50vh]">
                      {/* モーダルオープン時のみ初期化。以降はonChangeのみで管理 */}
                      <EditWorkspaceItemEditor
                        key={editorInitKey}
                        initialEditorState={initialEditorState}
                        onChange={handleEditorChange}
                        workspaceId={latestItem.workspaceId!}
                        itemId={latestItem.id}
                      />
                    </div>
                  </div>

                  {/* タグ */}
                  <div className="form-control">
                    <label htmlFor="tagNames" className="label">
                      <span className="label-text font-semibold">タグ</span>
                    </label>
                    <TagInput
                      tags={tagNames}
                      onChange={setTagNames}
                      disabled={isUpdating}
                      placeholder="タグを入力..."
                    />
                    <div className="label">
                      <span className="label-text-alt text-xs">
                        タグを入力してEnterで追加。タグは50文字以内で入力してください。
                      </span>
                    </div>
                  </div>

                  {/* ステータス（オーナーのみ表示） */}
                  {currentUserId !== undefined && latestItem.ownerId === currentUserId && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isDraft"
                        name="isDraft"
                        className="switch switch-outline switch-warning"
                        checked={formData.isDraft || false}
                        onChange={(e) => handleFieldChange('isDraft', e.target.checked)}
                        disabled={isUpdating}
                      />
                      <label htmlFor="isDraft" className="label-text cursor-pointer">
                        下書き
                      </label>
                    </div>
                  )}

                  {/* 注: 期限日、優先度、アーカイブはドロワー側で個別の属性更新APIを使用するため、このフォームでは編集しない */}

                  {/* 競合アラート */}
                  <ConflictAlert
                    isConflict={isConflict}
                    latestData={conflictData}
                    onOverwrite={handleOverwrite}
                    onDiscard={handleDiscard}
                    isProcessing={isUpdating}
                  />

                  {/* ボタングループ */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
                    <button type="button" onClick={handleClose} className="btn btn-outline" disabled={isUpdating}>
                      キャンセル
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isUpdating || isConflict}>
                      {isUpdating ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          保存中...
                        </>
                      ) : (
                        '保存'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * 既存アイテム編集用のエディタコンポーネント
 * 画像アップロードハンドラーを設定した状態でNotionLikeEditorをラップ
 */
function EditWorkspaceItemEditor({
  workspaceId,
  itemId,
  initialEditorState,
  onChange,
}: {
  workspaceId: number;
  itemId: number;
  initialEditorState?: string;
  onChange?: (editorState: string) => void;
}) {
  const imageUploadHandler = useExistingItemImageUploadHandler({
    workspaceId,
    itemId,
  });

  return (
    <PecusNotionLikeEditor
      initialEditorState={initialEditorState}
      onChange={onChange}
      debounceMs={500}
      autoFocus={false}
      imageUploadHandler={imageUploadHandler}
    />
  );
}
