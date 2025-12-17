'use client';

import { useEffect, useState } from 'react';
import { createWorkspace } from '@/actions/workspace';
import GenreSelect from '@/components/workspaces/GenreSelect';
import type { MasterGenreResponse, WorkspaceMode } from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import { createWorkspaceSchema } from '@/schemas/workspaceSchemas';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  genres: MasterGenreResponse[];
}

export default function CreateWorkspaceModal({ isOpen, onClose, onSuccess, genres }: CreateWorkspaceModalProps) {
  const [serverErrors, setServerErrors] = useState<{ key: number; message: string }[]>([]);
  const [selectedMode, setSelectedMode] = useState<WorkspaceMode>('Normal');

  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError, resetForm } =
    useFormValidation({
      schema: createWorkspaceSchema,
      onSubmit: async (data) => {
        setServerErrors([]);

        // genreId が string の場合は number に変換
        const requestData = {
          ...data,
          genreId: typeof data.genreId === 'string' ? parseInt(data.genreId, 10) : data.genreId,
          mode: selectedMode,
        };

        const result = await createWorkspace(requestData);

        if (!result.success) {
          setServerErrors([{ key: 0, message: result.message }]);
          return;
        }

        // 成功時はモーダルを閉じて親コンポーネントに通知
        onSuccess();
        onClose();
      },
    });

  // モーダルが閉じられたらエラーとフォームをクリア
  useEffect(() => {
    if (!isOpen) {
      setServerErrors([]);
      setSelectedMode('Normal');
      resetForm();
    }
  }, [isOpen, resetForm]);

  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      {/* モーダルコンテナ */}
      <div
        className="bg-base-100 rounded-box shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="icon-[mdi--plus-circle-outline] w-6 h-6" aria-hidden="true" />
            ワークスペースを作成
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-circle"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="閉じる"
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* モーダルボディ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* サーバーエラー表示 */}
          {serverErrors.length > 0 && (
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
              <div>
                <h3 className="font-bold">エラーが発生しました</h3>
                <ul className="list-disc list-inside mt-2">
                  {serverErrors.map((error) => (
                    <li key={error.key}>{error.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* フォーム */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* ワークスペース名 */}
            <div className="form-control">
              <label htmlFor="name" className="label">
                <span className="label-text font-semibold">
                  ワークスペース名 <span className="text-error">*</span>
                </span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="例：プロジェクトA"
                className={`input input-bordered ${shouldShowError('name') ? 'input-error' : ''}`}
                onBlur={(e) => validateField('name', e.target.value)}
                disabled={isSubmitting}
              />
              {shouldShowError('name') && (
                <div className="label">
                  <span className="label-text-alt text-error">{getFieldError('name')}</span>
                </div>
              )}
            </div>

            {/* 説明 */}
            <div className="form-control">
              <label htmlFor="description" className="label">
                <span className="label-text font-semibold">説明</span>
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="ワークスペースの説明を入力してください..."
                className={`textarea textarea-bordered h-24 ${shouldShowError('description') ? 'textarea-error' : ''}`}
                onBlur={(e) => validateField('description', e.target.value)}
                disabled={isSubmitting}
              />
              {shouldShowError('description') && (
                <div className="label">
                  <span className="label-text-alt text-error">{getFieldError('description')}</span>
                </div>
              )}
            </div>

            {/* ジャンル */}
            <div className="form-control">
              <label htmlFor="genreId" className="label">
                <span className="label-text font-semibold">
                  ジャンル <span className="text-error">*</span>
                </span>
              </label>
              <GenreSelect
                id="genreId"
                name="genreId"
                genres={genres}
                className={`select select-bordered ${shouldShowError('genreId') ? 'select-error' : ''}`}
                disabled={isSubmitting || genres.length === 0}
                defaultValue=""
                onChange={(value) => validateField('genreId', value)}
              />
              {shouldShowError('genreId') && (
                <div className="label">
                  <span className="label-text-alt text-error">{getFieldError('genreId')}</span>
                </div>
              )}
            </div>

            {/* モード選択 */}
            <div className="form-control">
              <div className="label">
                <span className="label-text font-semibold">モード</span>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer" htmlFor="mode-normal">
                  <input
                    id="mode-normal"
                    type="radio"
                    name="mode"
                    className="radio radio-primary"
                    checked={selectedMode === 'Normal'}
                    onChange={() => setSelectedMode('Normal')}
                    disabled={isSubmitting}
                  />
                  <span className="flex items-center gap-1">
                    <span className="icon-[mdi--clipboard-list-outline] w-5 h-5" aria-hidden="true" />
                    通常
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer" htmlFor="mode-document">
                  <input
                    id="mode-document"
                    type="radio"
                    name="mode"
                    className="radio radio-primary"
                    checked={selectedMode === 'Document'}
                    onChange={() => setSelectedMode('Document')}
                    disabled={isSubmitting}
                  />
                  <span className="flex items-center gap-1">
                    <span className="icon-[mdi--file-document-outline] w-5 h-5" aria-hidden="true" />
                    ドキュメント
                  </span>
                </label>
              </div>
              <div className="label pb-0">
                <span className="label-text-alt text-base-content/70">
                  {selectedMode === 'Normal'
                    ? 'タスク管理や関連アイテムなどすべての機能が利用できます。'
                    : 'ドキュメント中心のシンプルなモードです。タスクや関連アイテムは非表示になります。'}
                </span>
              </div>
              <div className="label pt-0">
                <span className="label-text-alt text-warning flex items-center gap-1">
                  <span className="icon-[mdi--alert-outline] w-4 h-4" aria-hidden="true" />
                  モードは作成後に変更できません。
                </span>
              </div>
            </div>

            {/* ボタングループ */}
            <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
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
                    <span className="icon-[mdi--plus-circle-outline] w-5 h-5" aria-hidden="true" />
                    作成
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
