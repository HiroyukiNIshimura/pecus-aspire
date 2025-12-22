'use client';

import type { LexicalEditor } from 'lexical';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createWorkspaceItem, fetchDocumentSuggestion } from '@/actions/workspaceItem';
import DatePicker from '@/components/common/filters/DatePicker';
import TagInput from '@/components/common/forms/TagInput';
import { INSERT_MARKDOWN_COMMAND, PecusNotionLikeEditor, useNewItemImageUploadHandler } from '@/components/editor';
import type { CreateWorkspaceItemRequest, TaskPriority } from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import type { CreateWorkspaceItemInput } from '@/schemas/editSchemas';
import { createWorkspaceItemSchema } from '@/schemas/editSchemas';

interface CreateWorkspaceItemProps {
  workspaceId: number;
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (itemId: number, itemCode: string) => void;
}

export default function CreateWorkspaceItem({ workspaceId, isOpen, onClose, onCreate }: CreateWorkspaceItemProps) {
  // 一時ファイルアップロード用のセッションID（モーダル表示ごとに生成）
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  // アップロードされた一時ファイルIDのリスト
  const [tempFileIds, setTempFileIds] = useState<string[]>([]);

  // フォーム状態
  const [formData, setFormData] = useState<CreateWorkspaceItemInput>({
    subject: '',
    dueDate: '',
    priority: undefined,
    isDraft: false,
  });

  const [editorState, setEditorState] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // エディタインスタンスの参照（提案機能用）
  const editorRef = useRef<LexicalEditor | null>(null);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);

  // 提案処理のキャンセル用ref
  const suggestCancelledRef = useRef(false);

  // 一時ファイルアップロード完了時のコールバック
  const handleTempFileUploaded = useCallback((tempFileId: string, _previewUrl: string) => {
    setTempFileIds((prev) => {
      if (!prev.includes(tempFileId)) {
        return [...prev, tempFileId];
      }
      return prev;
    });
  }, []);

  // 画像アップロードハンドラー（新規アイテム作成用）
  const imageUploadHandler = useNewItemImageUploadHandler({
    workspaceId: workspaceId ?? 0,
    sessionId,
    onTempFileUploaded: handleTempFileUploaded,
  });

  // フォーム検証フック
  const {
    formRef,
    isSubmitting,
    handleSubmit: handleFormSubmit,
    validateField,
    shouldShowError,
    getFieldError,
    resetForm: resetFormValidation,
  } = useFormValidation({
    schema: createWorkspaceItemSchema,
    onSubmit: async (data) => {
      try {
        // dueDate を ISO 8601 形式に変換（空の場合は null）
        let dueDateValue: string | null = null;
        if (data.dueDate) {
          const date = new Date(data.dueDate);
          dueDateValue = date.toISOString(); // ISO 8601 形式（完全な日時）
        }

        const request: CreateWorkspaceItemRequest = {
          subject: data.subject.trim(),
          body: editorState || undefined,
          dueDate: dueDateValue,
          priority: data.priority as TaskPriority | undefined,
          isDraft: data.isDraft,
          tagNames: tags.length > 0 ? tags : undefined,
          // 一時ファイル情報を追加
          tempSessionId: tempFileIds.length > 0 ? sessionId : undefined,
          tempAttachmentIds: tempFileIds.length > 0 ? tempFileIds : undefined,
        };

        const result = await createWorkspaceItem(workspaceId, request);

        if (result.success) {
          // 作成成功時のコールバック
          if (onCreate && result.data.workspaceItem?.id && result.data.workspaceItem?.code) {
            onCreate(result.data.workspaceItem.id, result.data.workspaceItem.code);
          }

          // フォームをリセットしてモーダルを閉じる
          resetForm();
          onClose();
        } else {
          setGlobalError(result.message || 'アイテムの作成に失敗しました');
        }
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : 'エラーが発生しました');
      }
    },
  });

  // フィールド変更時の処理
  const handleFieldChange = async (fieldName: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // フィールド検証を実行
    await validateField(fieldName, value);
  };

  // エディタ変更時の処理（JSON形式）
  const handleEditorChange = (json: string) => {
    setEditorState(json);
  };

  // エディタ準備完了時のコールバック
  const handleEditorReady = useCallback((editor: LexicalEditor) => {
    editorRef.current = editor;
  }, []);

  // 提案処理のキャンセル
  const cancelSuggestion = useCallback(() => {
    if (isSuggestLoading) {
      suggestCancelledRef.current = true;
      setIsSuggestLoading(false);
    }
  }, [isSuggestLoading]);

  // エスケープキーで提案処理をキャンセル
  useEffect(() => {
    if (!isSuggestLoading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        cancelSuggestion();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSuggestLoading, cancelSuggestion]);

  // ドキュメント提案を取得
  const handleSuggestContent = async () => {
    const trimmedSubject = formData.subject.trim();
    if (!trimmedSubject || isSuggestLoading || !editorRef.current) return;

    // キャンセルフラグをリセット
    suggestCancelledRef.current = false;
    setIsSuggestLoading(true);
    setGlobalError(null);

    try {
      const result = await fetchDocumentSuggestion(workspaceId, trimmedSubject);

      // キャンセルされていた場合は結果を無視
      if (suggestCancelledRef.current) {
        return;
      }

      if (result.success && result.data.suggestedContent) {
        // Markdownをエディタに挿入（既存コンテンツの末尾に追加）
        editorRef.current.dispatchCommand(INSERT_MARKDOWN_COMMAND, result.data.suggestedContent);
      } else if (!result.success) {
        setGlobalError(result.message || '提案の取得に失敗しました。');
      }
    } catch (err) {
      // キャンセルされていた場合はエラーも無視
      if (suggestCancelledRef.current) {
        return;
      }
      setGlobalError(err instanceof Error ? err.message : '提案の取得中にエラーが発生しました。');
    } finally {
      // キャンセルされていない場合のみローディング状態を解除
      if (!suggestCancelledRef.current) {
        setIsSuggestLoading(false);
      }
    }
  };

  // フォームリセット
  const resetForm = () => {
    // フォームバリデーションフックのリセット（fieldErrors、touchedFields、フォーム要素をリセット）
    resetFormValidation();

    // コンポーネント独自の状態をリセット
    setFormData({
      subject: '',
      dueDate: '',
      priority: undefined,
      isDraft: false,
    });
    setEditorState('');
    setTags([]);
    setGlobalError(null);
    // 一時ファイルIDリストをリセット（次のモーダル表示時に新しいsessionIdが使われる）
    setTempFileIds([]);
    setIsSuggestLoading(false);
    // エディタの参照はリセットしない（モーダルが閉じられて再マウントされるため）
  };

  // モーダルを閉じる際の処理
  const handleClose = () => {
    resetForm();
    onClose();
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
              <span className="icon-[mdi--plus-circle-outline] size-5 sm:size-6" aria-hidden="true" />
              新規アイテム作成
            </h2>
            <button
              type="button"
              className="btn btn-sm btn-circle"
              onClick={handleClose}
              disabled={isSubmitting || isSuggestLoading}
              aria-label="閉じる"
            >
              <span className="icon-[mdi--close] size-5" aria-hidden="true" />
            </button>
          </div>

          {/* モーダルボディ */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-6xl mx-auto">
              {/* グローバルエラー表示 */}
              {globalError && (
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
                  <span>{globalError}</span>
                </div>
              )}

              {/* フォーム */}
              <form ref={formRef} onSubmit={handleFormSubmit} noValidate className="space-y-4">
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
                    placeholder="例：新しいタスクの件名"
                    className={`input input-bordered w-full ${shouldShowError('subject') ? 'input-error' : ''}`}
                    value={formData.subject}
                    onChange={(e) => handleFieldChange('subject', e.target.value)}
                    onBlur={() => validateField('subject', formData.subject)}
                    disabled={isSubmitting || isSuggestLoading}
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
                  <div className="label flex items-center gap-2">
                    <span className="label-text font-semibold">本文</span>
                    <button
                      type="button"
                      onClick={handleSuggestContent}
                      disabled={!formData.subject.trim() || isSubmitting || isSuggestLoading}
                      className="btn btn-xs btn-outline btn-secondary gap-1"
                      title={!formData.subject.trim() ? '件名を入力すると提案を利用できます' : 'AIが本文を提案します'}
                    >
                      <span className="icon-[mdi--auto-fix] size-4" aria-hidden="true" />
                      提案を利用
                    </button>
                  </div>
                  <div className="relative">
                    {/* ローディングオーバーレイ */}
                    {isSuggestLoading && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-base-100/80 backdrop-blur-sm rounded-box">
                        <span className="loading loading-ring loading-lg text-secondary"></span>
                        <span className="mt-2 text-sm text-base-content/70">AIが本文を生成中...</span>
                        <button
                          type="button"
                          onClick={cancelSuggestion}
                          className="mt-3 btn btn-sm btn-secondary gap-1"
                        >
                          キャンセル
                          <kbd className="kbd kbd-xs">Esc</kbd>
                        </button>
                      </div>
                    )}
                    <div className="overflow-auto max-h-[50vh]">
                      <PecusNotionLikeEditor
                        onChange={handleEditorChange}
                        onEditorReady={handleEditorReady}
                        debounceMs={500}
                        autoFocus={false}
                        imageUploadHandler={imageUploadHandler}
                      />
                    </div>
                  </div>
                </div>
                {/* タグ */}
                <div className="form-control">
                  <label htmlFor="tags" className="label">
                    <span className="label-text font-semibold">タグ</span>
                  </label>
                  <TagInput
                    tags={tags}
                    onChange={setTags}
                    placeholder="タグを入力..."
                    disabled={isSubmitting || isSuggestLoading}
                  />
                  <div className="label">
                    <span className="label-text-alt text-xs">
                      タグを入力してEnterで追加。タグは50文字以内で入力してください。
                    </span>
                  </div>
                </div>
                {/* 期限日 */}
                <div className="form-control">
                  <label htmlFor="dueDate" className="label">
                    <span className="label-text font-semibold">期限日</span>
                  </label>
                  <DatePicker
                    value={formData.dueDate ?? ''}
                    onChange={(date) => handleFieldChange('dueDate', date)}
                    disabled={isSubmitting || isSuggestLoading}
                    className={`w-full ${shouldShowError('dueDate') ? 'input-error' : ''}`}
                    placeholder="日付を選択"
                  />
                  {shouldShowError('dueDate') && (
                    <div className="label">
                      <span className="label-text-alt text-error">{getFieldError('dueDate')}</span>
                    </div>
                  )}
                </div>
                {/* 優先度 */}
                <div className="form-control">
                  <label htmlFor="priority" className="label">
                    <span className="label-text font-semibold">優先度</span>
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    className={`select select-bordered w-full ${shouldShowError('priority') ? 'select-error' : ''}`}
                    value={formData.priority ?? ''}
                    onChange={(e) =>
                      handleFieldChange('priority', e.target.value ? (e.target.value as TaskPriority) : undefined)
                    }
                    disabled={isSubmitting || isSuggestLoading}
                  >
                    <option value="">未設定</option>
                    <option value="Low">低</option>
                    <option value="Medium">中</option>
                    <option value="High">高</option>
                    <option value="Critical">緊急</option>
                  </select>
                  {shouldShowError('priority') && (
                    <div className="label">
                      <span className="label-text-alt text-error">{getFieldError('priority')}</span>
                    </div>
                  )}
                </div>
                {/* 下書きフラグ */}
                <div className="form-control">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isDraft"
                      name="isDraft"
                      className="switch switch-outline switch-warning"
                      checked={formData.isDraft}
                      onChange={(e) => handleFieldChange('isDraft', e.target.checked)}
                      disabled={isSubmitting || isSuggestLoading}
                    />
                    <label htmlFor="isDraft" className="label-text cursor-pointer">
                      下書き
                    </label>
                  </div>
                </div>
                {/* ボタングループ */}
                <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn btn-outline"
                    disabled={isSubmitting || isSuggestLoading}
                  >
                    キャンセル
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting || isSuggestLoading}>
                    {isSubmitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        作成中...
                      </>
                    ) : (
                      <>
                        <span className="icon-[mdi--content-save-outline] w-5 h-5" aria-hidden="true" />
                        作成
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
