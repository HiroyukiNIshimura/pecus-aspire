'use client';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { useCallback, useMemo, useState } from 'react';
import { createWorkspaceItem } from '@/actions/workspaceItem';
import TagInput from '@/components/common/TagInput';
import type { EditorContextSettings } from '@/components/editor/core/appSettings';
import { PecusNotionLikeEditor } from '@/components/editor';
import type { CreateWorkspaceItemRequest, TaskPriority } from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import type { CreateWorkspaceItemInput } from '@/schemas/editSchemas';
import { createWorkspaceItemSchema } from '@/schemas/editSchemas';

interface CreateWorkspaceItemProps {
  workspaceId: number;
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (itemId: number) => void;
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
    priority: 'Medium',
    isDraft: true,
  });

  const [editorState, setEditorState] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // 一時ファイルアップロード完了時のコールバック
  const handleTempFileUploaded = useCallback((tempFileId: string, _previewUrl: string) => {
    setTempFileIds((prev) => {
      if (!prev.includes(tempFileId)) {
        return [...prev, tempFileId];
      }
      return prev;
    });
  }, []);

  // エディタに渡す設定（新規作成時はsessionIdを使用）
  const editorSettings: EditorContextSettings = useMemo(
    () => ({
      workspaceId,
      sessionId,
      onTempFileUploaded: handleTempFileUploaded,
    }),
    [workspaceId, sessionId, handleTempFileUploaded],
  );

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
          body: editorState || null,
          dueDate: dueDateValue,
          priority: data.priority as TaskPriority | undefined,
          isDraft: data.isDraft,
          tagNames: tags.length > 0 ? tags : null,
          // 一時ファイル情報を追加
          tempSessionId: tempFileIds.length > 0 ? sessionId : null,
          tempAttachmentIds: tempFileIds.length > 0 ? tempFileIds : null,
        };

        const result = await createWorkspaceItem(workspaceId, request);

        if (result.success) {
          // 作成成功時のコールバック
          if (onCreate && result.data.workspaceItem?.id) {
            onCreate(result.data.workspaceItem.id);
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

  // フォームリセット
  const resetForm = () => {
    // フォームバリデーションフックのリセット（fieldErrors、touchedFields、フォーム要素をリセット）
    resetFormValidation();

    // コンポーネント独自の状態をリセット
    setFormData({
      subject: '',
      dueDate: '',
      priority: 'Medium',
      isDraft: true,
    });
    setEditorState('');
    setTags([]);
    setGlobalError(null);
    // 一時ファイルIDリストをリセット（次のモーダル表示時に新しいsessionIdが使われる）
    setTempFileIds([]);
  };

  // モーダルを閉じる際の処理
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* モーダル背景オーバーレイ */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleClose} aria-hidden="true" />

      {/* モーダルコンテンツ */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
        <div className="bg-base-100 rounded-none sm:rounded-lg shadow-xl w-full h-full sm:max-w-6xl sm:w-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
          {/* モーダルヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-base-300">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <AddIcon />
              新規アイテム作成
            </h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle"
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="閉じる"
            >
              <CloseIcon />
            </button>
          </div>

          {/* モーダルボディ */}
          <div className="p-6">
            {/* グローバルエラー表示 */}
            {globalError && (
              <div className="alert alert-error mb-4">
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
                <div>
                  <PecusNotionLikeEditor
                    onChange={handleEditorChange}
                    debounceMs={500}
                    autoFocus={false}
                    workspaceId={editorSettings.workspaceId}
                    sessionId={editorSettings.sessionId}
                    onTempFileUploaded={editorSettings.onTempFileUploaded}
                  />
                </div>
              </div>{' '}
              {/* 期限日 */}
              <div className="form-control">
                <label htmlFor="dueDate" className="label">
                  <span className="label-text font-semibold">期限日</span>
                </label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  className={`input input-bordered w-full ${shouldShowError('dueDate') ? 'input-error' : ''}`}
                  value={formData.dueDate}
                  onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  onBlur={() => validateField('dueDate', formData.dueDate)}
                  disabled={isSubmitting}
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
                  value={formData.priority}
                  onChange={(e) => handleFieldChange('priority', e.target.value as TaskPriority)}
                  disabled={isSubmitting}
                >
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
              {/* タグ */}
              <div className="form-control">
                <label htmlFor="tags" className="label">
                  <span className="label-text font-semibold">タグ</span>
                  <span className="label-text-alt">Enterキーで追加、ドラッグで並び替え</span>
                </label>
                <TagInput
                  tags={tags}
                  onChange={setTags}
                  placeholder="タグを入力してEnterキーを押す..."
                  disabled={isSubmitting}
                />
              </div>
              {/* 下書きフラグ */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    name="isDraft"
                    className="checkbox checkbox-primary"
                    checked={formData.isDraft}
                    onChange={(e) => handleFieldChange('isDraft', e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span className="label-text">下書きとして保存</span>
                </label>
              </div>
              {/* ボタングループ */}
              <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
                <button type="button" onClick={handleClose} className="btn btn-outline" disabled={isSubmitting}>
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      作成中...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="w-5 h-5" />
                      作成
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
