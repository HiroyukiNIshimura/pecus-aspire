"use client";

import { useState, useEffect } from "react";
import { useFormValidation } from "@/hooks/useFormValidation";
import { createWorkspaceSchema } from "@/schemas/workspaceSchemas";
import { createWorkspace } from "@/actions/workspace";
import type { MasterGenreResponse } from "@/connectors/api/pecus";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  genres: MasterGenreResponse[];
}

export default function CreateWorkspaceModal({
  isOpen,
  onClose,
  onSuccess,
  genres,
}: CreateWorkspaceModalProps) {
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const {
    formRef,
    isSubmitting,
    fieldErrors,
    handleSubmit,
    validateField,
    shouldShowError,
    getFieldError,
    resetForm,
  } = useFormValidation({
    schema: createWorkspaceSchema,
    onSubmit: async (data) => {
      setServerErrors([]);

      // genreId が string の場合は number に変換
      const requestData = {
        ...data,
        genreId:
          typeof data.genreId === "string"
            ? parseInt(data.genreId, 10)
            : data.genreId,
      };

      const result = await createWorkspace(requestData);

      if (!result.success) {
        setServerErrors([result.message]);
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
      resetForm();
    }
  }, [isOpen, resetForm]);

  if (!isOpen) return null;

  return (
    <>
      {/* モーダル背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* モーダルコンテンツ */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* モーダルヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-base-300">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <AddIcon />
              ワークスペースを作成
            </h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="閉じる"
            >
              <CloseIcon />
            </button>
          </div>

          {/* モーダルボディ */}
          <div className="p-6">
            {/* サーバーエラー表示 */}
            {serverErrors.length > 0 && (
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
                <div>
                  <h3 className="font-bold">エラーが発生しました</h3>
                  <ul className="list-disc list-inside mt-2">
                    {serverErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
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
                  className={`input input-bordered ${
                    shouldShowError("name") ? "input-error" : ""
                  }`}
                  onBlur={(e) => validateField("name", e.target.value)}
                  disabled={isSubmitting}
                />
                {shouldShowError("name") && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {getFieldError("name")}
                    </span>
                  </label>
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
                  className={`textarea textarea-bordered h-24 ${
                    shouldShowError("description") ? "textarea-error" : ""
                  }`}
                  onBlur={(e) => validateField("description", e.target.value)}
                  disabled={isSubmitting}
                />
                {shouldShowError("description") && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {getFieldError("description")}
                    </span>
                  </label>
                )}
              </div>

              {/* ジャンル */}
              <div className="form-control">
                <label htmlFor="genreId" className="label">
                  <span className="label-text font-semibold">
                    ジャンル <span className="text-error">*</span>
                  </span>
                </label>
                <select
                  id="genreId"
                  name="genreId"
                  className={`select select-bordered ${
                    shouldShowError("genreId") ? "select-error" : ""
                  }`}
                  disabled={isSubmitting || genres.length === 0}
                >
                  <option value="">選択してください</option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.icon && `${genre.icon} `}
                      {genre.name}
                    </option>
                  ))}
                </select>
                {shouldShowError("genreId") && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {getFieldError("genreId")}
                    </span>
                  </label>
                )}
              </div>

              {/* ボタングループ */}
              <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      作成中...
                    </>
                  ) : (
                    <>
                      <AddIcon className="w-5 h-5" />
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
