'use client';

import { useEffect, useState } from 'react';
import { getWorkspaceDetail, updateWorkspace } from '@/actions/workspace';
import GenreSelect from '@/components/workspaces/GenreSelect';
import type {
  MasterGenreResponse,
  WorkspaceFullDetailResponse,
  WorkspaceListItemResponse,
} from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useNotify } from '@/hooks/useNotify';
import { updateWorkspaceSchema } from '@/schemas/workspaceSchemas';

interface EditWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedWorkspace: WorkspaceFullDetailResponse) => void;
  workspace: WorkspaceListItemResponse | null;
  genres: MasterGenreResponse[];
}

export default function EditWorkspaceModal({ isOpen, onClose, onSuccess, workspace, genres }: EditWorkspaceModalProps) {
  const notify = useNotify();
  const [serverErrors, setServerErrors] = useState<{ key: number; message: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workspaceDetail, setWorkspaceDetail] = useState<WorkspaceFullDetailResponse | null>(null);

  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError, resetForm } =
    useFormValidation({
      schema: updateWorkspaceSchema,
      onSubmit: async (data) => {
        if (!workspaceDetail) return;

        const result = await updateWorkspace(workspaceDetail.id, {
          name: data.name,
          description: data.description || undefined,
          genreId: typeof data.genreId === 'string' ? parseInt(data.genreId, 10) : data.genreId,
          rowVersion: workspaceDetail.rowVersion,
        });

        if (!result.success) {
          const errorMessage =
            result.error === 'conflict'
              ? result.message || '別のユーザーが同時に更新しました。'
              : result.message || 'エラーが発生しました。';
          setServerErrors([{ key: result.error === 'conflict' ? 0 : 1, message: errorMessage }]);
          notify.error(errorMessage);
          return;
        }

        onSuccess(result.data);
        onClose();
      },
    });

  // モーダルを開いた際にワークスペース詳細を取得
  useEffect(() => {
    const fetchWorkspaceDetail = async () => {
      if (!isOpen || !workspace) {
        setWorkspaceDetail(null);
        return;
      }

      setIsLoading(true);
      setServerErrors([]);

      const result = await getWorkspaceDetail(workspace.id);

      if (result.success) {
        setWorkspaceDetail(result.data);
      } else {
        setServerErrors([{ key: 2, message: result.message || 'ワークスペースの詳細情報の取得に失敗しました。' }]);
      }

      setIsLoading(false);
    };

    fetchWorkspaceDetail();
  }, [isOpen, workspace, genres]);

  // モーダルを閉じる際にフォームをリセット
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setServerErrors([]);
      setWorkspaceDetail(null);
    }
  }, [isOpen, resetForm]);

  if (!isOpen) return null;

  return (
    <>
      {/* モーダル背景オーバーレイ */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />

      {/* モーダルコンテンツ */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* モーダルヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-base-300">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="icon-[mdi--pencil-outline] size-6" aria-hidden="true" />
              ワークスペース編集
            </h2>
            <button
              type="button"
              className="btn btn-sm btn-circle"
              onClick={onClose}
              disabled={isSubmitting || isLoading}
              aria-label="閉じる"
            >
              <span className="icon-[mdi--close] size-5" aria-hidden="true" />
            </button>
          </div>

          {/* モーダルボディ */}
          <div className="p-6">
            {/* ローディング表示 */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            )}

            {/* サーバーエラー表示 */}
            {!isLoading && serverErrors.length > 0 && (
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
            {!isLoading && workspaceDetail && (
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
                    defaultValue={workspaceDetail.name}
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
                    defaultValue={workspaceDetail.description || ''}
                    placeholder="ワークスペースの説明を入力してください..."
                    className={`textarea textarea-bordered h-24 ${
                      shouldShowError('description') ? 'textarea-error' : ''
                    }`}
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
                    defaultValue={workspaceDetail.genreId ?? ''}
                    disabled={isSubmitting || genres.length === 0}
                    error={shouldShowError('genreId')}
                    onChange={() => {}}
                  />
                  {shouldShowError('genreId') && (
                    <div className="label">
                      <span className="label-text-alt text-error">{getFieldError('genreId')}</span>
                    </div>
                  )}
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
                        更新中...
                      </>
                    ) : (
                      <>
                        <span className="icon-[mdi--pencil-outline] w-5 h-5" aria-hidden="true" />
                        更新
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
