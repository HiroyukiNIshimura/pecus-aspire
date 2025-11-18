"use client";

import { useState, useEffect } from "react";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import type {
  CreateWorkspaceItemRequest,
  TaskPriority,
} from "@/connectors/api/pecus";
import NotionEditor from "@/components/editor/NotionEditor";
import TagInput from "@/components/common/TagInput";
import { createWorkspaceItem } from "@/actions/workspaceItem";
import { useFormValidation } from "@/hooks/useFormValidation";
import { createWorkspaceItemSchema } from "@/schemas/editSchemas";
import type { CreateWorkspaceItemInput } from "@/schemas/editSchemas";
import TailwindEditor from "@/components/editor/TailwindEditor";

interface CreateWorkspaceItemProps {
  workspaceId: number;
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (itemId: number) => void;
}

export default function CreateWorkspaceItem({
  workspaceId,
  isOpen,
  onClose,
  onCreate,
}: CreateWorkspaceItemProps) {
  // フォーム状態
  const [formData, setFormData] = useState<CreateWorkspaceItemInput>({
    subject: "",
    dueDate: "",
    priority: "Medium",
    isDraft: true,
  });

  const [editorValue, setEditorValue] = useState<any | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // フォーム検証フック
  const {
    formRef,
    isSubmitting,
    fieldErrors,
    handleSubmit: handleFormSubmit,
    validateField,
    shouldShowError,
    getFieldError,
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

        // デバッグ: 送信直前の editorValue をログ出力（開発時のみ）
        console.log("Submitting editorValue:", editorValue);

        const request: CreateWorkspaceItemRequest = {
          subject: data.subject.trim(),
          body: editorValue,
          dueDate: dueDateValue,
          priority: data.priority as TaskPriority | undefined,
          isDraft: data.isDraft,
          tagNames: tags.length > 0 ? tags : null,
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
          setGlobalError(result.message || "アイテムの作成に失敗しました");
        }
      } catch (err) {
        setGlobalError(
          err instanceof Error ? err.message : "エラーが発生しました"
        );
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

  // エディタ変更時の処理
  const handleEditorChange = (
    newValue: any,
  ) => {
    setEditorValue(newValue);
  };

  // NotionEditor will derive theme itself if caller doesn't supply it.

  // フォームリセット
  const resetForm = () => {
    setFormData({
      subject: "",
      dueDate: "",
      priority: "Medium",
      isDraft: true,
    });
    setEditorValue(undefined);
    setTags([]);
    setGlobalError(null);
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
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* モーダルコンテンツ */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
        <div
          className="bg-base-100 rounded-none sm:rounded-lg shadow-xl w-full h-full sm:max-w-6xl sm:w-full sm:h-auto sm:max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
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
            <form
              ref={formRef}
              onSubmit={handleFormSubmit}
              noValidate
              className="space-y-4"
            >
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
                  className={`input input-bordered w-full ${
                    shouldShowError("subject") ? "input-error" : ""
                  }`}
                  value={formData.subject}
                  onChange={(e) =>
                    handleFieldChange("subject", e.target.value)
                  }
                  onBlur={() => validateField("subject", formData.subject)}
                  disabled={isSubmitting}
                  maxLength={200}
                />
                {shouldShowError("subject") && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {getFieldError("subject")}
                    </span>
                  </label>
                )}
                <label className="label">
                  <span className="label-text-alt text-xs">
                    {formData.subject.length}/200 文字
                  </span>
                </label>
              </div>

              {/* 本文（WYSIWYGエディタ） */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">本文</span>
                </label>
                <NotionEditor
                  onChange={handleEditorChange}
                  editable={true}
                />
              </div>

              <div className="form-control">
                <TailwindEditor />
              </div>

              {/* 期限日と優先度（2カラムレイアウト） */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 期限日 */}
                <div className="form-control">
                  <label htmlFor="dueDate" className="label">
                    <span className="label-text font-semibold">
                      期限日
                    </span>
                  </label>
                  <input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    className={`input input-bordered w-full ${
                      shouldShowError("dueDate") ? "input-error" : ""
                    }`}
                    value={formData.dueDate}
                    onChange={(e) =>
                      handleFieldChange("dueDate", e.target.value)
                    }
                    onBlur={() => validateField("dueDate", formData.dueDate)}
                    disabled={isSubmitting}
                  />
                  {shouldShowError("dueDate") && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {getFieldError("dueDate")}
                      </span>
                    </label>
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
                    className={`select select-bordered w-full ${
                      shouldShowError("priority") ? "select-error" : ""
                    }`}
                    value={formData.priority}
                    onChange={(e) =>
                      handleFieldChange("priority", e.target.value as TaskPriority)
                    }
                    disabled={isSubmitting}
                  >
                    <option value="Low">低</option>
                    <option value="Medium">中</option>
                    <option value="High">高</option>
                    <option value="Critical">緊急</option>
                  </select>
                  {shouldShowError("priority") && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {getFieldError("priority")}
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* タグ */}
              <div className="form-control">
                <label htmlFor="tags" className="label">
                  <span className="label-text font-semibold">タグ</span>
                  <span className="label-text-alt">
                    Enterキーで追加、ドラッグで並び替え
                  </span>
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isDraft"
                    className="w-4 h-4"
                    checked={formData.isDraft}
                    onChange={(e) =>
                      handleFieldChange("isDraft", e.target.checked)
                    }
                    disabled={isSubmitting}
                  />
                  <span className="text-sm font-normal">下書きとして保存</span>
                </label>
              </div>

              {/* ボタングループ */}
              <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-outline"
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
