'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { $ZodIssue } from 'zod/v4/core';
import { fetchLatestWorkspaceItem, updateWorkspaceItem } from '@/actions/workspaceItem';
import TagInput from '@/components/common/forms/TagInput';
import { PecusNotionLikeEditor, useExistingItemImageUploadHandler } from '@/components/editor';
import type { WorkspaceItemDetailResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { updateWorkspaceItemSchema } from '@/schemas/editSchemas';

interface EditWorkspaceItemProps {
  item: WorkspaceItemDetailResponse;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedItem: WorkspaceItemDetailResponse) => void;
  currentUserId?: number;
}

export default function EditWorkspaceItem({ item, isOpen, onClose, onSave, currentUserId }: EditWorkspaceItemProps) {
  const notify = useNotify();

  // 最新アイテムデータ
  const [latestItem, setLatestItem] = useState<WorkspaceItemDetailResponse>(item);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [itemLoadError, setItemLoadError] = useState<string | null>(null);

  // フォーム状態（スキーマの型に合わせる）
  // 注: dueDate, priority, isArchived はドロワー側で個別の属性更新APIを使用するため、このフォームでは管理しない
  const [formData, setFormData] = useState({
    subject: item.subject || '',
    isDraft: item.isDraft ?? false,
    rowVersion: item.rowVersion,
  });

  // エディタ初期値（item.body）とユーザー入力値は分離して管理
  const [initialEditorState, setInitialEditorState] = useState<string>(item.body || '');
  const [editorValue, setEditorValue] = useState<string>(item.body || '');
  const [editorInitKey, setEditorInitKey] = useState<number>(0);

  // タグ状態管理
  const [tagNames, setTagNames] = useState<string[]>(
    item.tags?.map((t) => t.name).filter((name): name is string => !!name) || [],
  );

  // 手動フォーム検証とサブミット（useFormValidation ではなく、状態管理値を直接使用）
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const shouldShowError = useCallback((fieldName: string) => !!fieldErrors[fieldName], [fieldErrors]);

  const getFieldError = useCallback((fieldName: string) => fieldErrors[fieldName]?.[0] || null, [fieldErrors]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSubmitting) return;

      setIsSubmitting(true);
      setFieldErrors({});

      try {
        // 状態管理している値で検証（FormData ではなく）
        // 注: formData, editorValue は最新の値を直接使用（React のクロージャ内なので安全）
        const result = await updateWorkspaceItemSchema.safeParseAsync({
          subject: formData.subject,
          isDraft: formData.isDraft,
          rowVersion: formData.rowVersion,
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
          setIsSubmitting(false);
          return;
        }

        // rowVersion が存在しない場合はエラー
        if (!latestItem.rowVersion) {
          notify.error('アイテム情報の更新に必要なバージョン情報が取得できませんでした。');
          setIsSubmitting(false);
          return;
        }

        const updateResult = await updateWorkspaceItem(latestItem.workspaceId || 0, latestItem.id, {
          subject: result.data.subject,
          body: editorValue || null,
          isDraft: result.data.isDraft,
          tagNames: tagNames,
          rowVersion: result.data.rowVersion,
        });

        if (updateResult.success) {
          notify.success('アイテムを更新しました。');

          // 最新のアイテムデータを再取得（body を含む完全な情報を取得）
          const fetchResult = await fetchLatestWorkspaceItem(latestItem.workspaceId || 0, latestItem.id);

          if (fetchResult.success && onSave) {
            onSave(fetchResult.data);
          }
          onClose();
        } else if (updateResult.error === 'conflict') {
          // 409 Conflict: 並行更新
          notify.error(
            updateResult.message || '別のユーザーが同時に変更しました。ページをリロードして再度操作してください。',
          );
        } else {
          notify.error(updateResult.message || 'アイテムの更新に失敗しました。');
        }
      } catch (err: unknown) {
        console.error('アイテム更新中にエラーが発生しました:', err);
        notify.error('アイテムの更新中にエラーが発生しました。');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, editorValue, tagNames, latestItem, onSave, onClose, notify, isSubmitting],
  );

  const formRef = useRef<HTMLFormElement>(null);

  // モーダルが開かれたときに最新のアイテムデータを取得し、エディタ値も初期化
  useEffect(() => {
    if (!isOpen) return;

    const fetchLatestItem = async () => {
      setIsLoadingItem(true);
      setItemLoadError(null);

      try {
        const result = await fetchLatestWorkspaceItem(item.workspaceId || 0, item.id);

        if (result.success) {
          setLatestItem(result.data);
          // フォームデータを更新
          // 注: dueDate, priority, isArchived はドロワー側で個別の属性更新APIを使用するため、このフォームでは管理しない
          setFormData({
            subject: result.data.subject || '',
            isDraft: result.data.isDraft ?? false,
            rowVersion: result.data.rowVersion,
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
  }, [isOpen, item.workspaceId, item.id]);

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
    if (!isSubmitting && !isLoadingItem) {
      onClose();
    }
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
              className="btn btn-sm btn-circle"
              onClick={handleClose}
              disabled={isSubmitting || isLoadingItem}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                        disabled={isSubmitting}
                      />
                      <label htmlFor="isDraft" className="label-text cursor-pointer">
                        下書き
                      </label>
                    </div>
                  )}

                  {/* 注: 期限日、優先度、アーカイブはドロワー側で個別の属性更新APIを使用するため、このフォームでは編集しない */}

                  {/* rowVersion（隠しフィールド） */}
                  <input type="hidden" name="rowVersion" value={formData.rowVersion} />

                  {/* ボタングループ */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
                    <button type="button" onClick={handleClose} className="btn btn-outline" disabled={isSubmitting}>
                      キャンセル
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? (
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
