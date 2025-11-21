"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import type {
  WorkspaceItemDetailResponse,
  TaskPriority,
} from "@/connectors/api/pecus";
import {
  updateWorkspaceItem,
  fetchLatestWorkspaceItem,
} from "@/actions/workspaceItem";
import { useNotify } from "@/hooks/useNotify";
import { updateWorkspaceItemSchema } from "@/schemas/editSchemas";

interface EditWorkspaceItemProps {
  item: WorkspaceItemDetailResponse;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedItem: WorkspaceItemDetailResponse) => void;
}

export default function EditWorkspaceItem({
  item,
  isOpen,
  onClose,
  onSave,
}: EditWorkspaceItemProps) {
  const notify = useNotify();

  // 最新アイテムデータ
  const [latestItem, setLatestItem] =
    useState<WorkspaceItemDetailResponse>(item);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [itemLoadError, setItemLoadError] = useState<string | null>(null);

  // フォーム状態（スキーマの型に合わせる）
  const [formData, setFormData] = useState({
    subject: item.subject || "",
    dueDate: item.dueDate
      ? new Date(item.dueDate).toISOString().split("T")[0]
      : "",
    priority: (item.priority || "Medium") as TaskPriority,
    isDraft: item.isDraft ?? false,
    isArchived: item.isArchived ?? false,
    rowVersion: item.rowVersion,
  });

  const [editorValue, setEditorValue] = useState<string>(item.body || "");

  // 手動フォーム検証とサブミット（useFormValidation ではなく、状態管理値を直接使用）
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const validateField = useCallback(
    async (fieldName: string, value: unknown) => {
      try {
        const fieldSchema = (updateWorkspaceItemSchema as any).shape?.[
          fieldName
        ];
        if (!fieldSchema) return;

        const result = await fieldSchema.safeParseAsync(value);
        if (result.success) {
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[fieldName];
            return next;
          });
        } else {
          const errors = result.error.issues.map((issue: any) => issue.message);
          setFieldErrors((prev) => ({
            ...prev,
            [fieldName]: errors,
          }));
        }
      } catch (error) {
        console.error(`Field validation error for ${fieldName}:`, error);
      }
    },
    [],
  );

  const shouldShowError = useCallback(
    (fieldName: string) => !!fieldErrors[fieldName],
    [fieldErrors],
  );

  const getFieldError = useCallback(
    (fieldName: string) => fieldErrors[fieldName]?.[0] || null,
    [fieldErrors],
  );

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
          dueDate: formData.dueDate,
          priority: formData.priority,
          isDraft: formData.isDraft,
          isArchived: formData.isArchived,
          rowVersion: formData.rowVersion,
        });
        if (!result.success) {
          // エラーをフィールドごとに分類
          const errors: Record<string, string[]> = {};
          result.error.issues.forEach((issue: any) => {
            const path = issue.path.join(".");
            if (!errors[path]) errors[path] = [];
            errors[path].push(issue.message);
          });
          setFieldErrors(errors);
          setIsSubmitting(false);
          return;
        }

        // rowVersion が存在しない場合はエラー
        if (!latestItem.rowVersion) {
          notify.error(
            "アイテム情報の更新に必要なバージョン情報が取得できませんでした。",
          );
          setIsSubmitting(false);
          return;
        }

        // dueDate を ISO 8601 形式に変換（空の場合は null）
        let dueDateValue: string | null = null;
        if (result.data.dueDate) {
          const date = new Date(result.data.dueDate);
          dueDateValue = date.toISOString();
        }

        const updateResult = await updateWorkspaceItem(
          latestItem.workspaceId || 0,
          latestItem.id,
          {
            subject: result.data.subject,
            body: editorValue || null,
            dueDate: dueDateValue,
            priority: result.data.priority as TaskPriority | undefined,
            isDraft: result.data.isDraft,
            isArchived: result.data.isArchived,
            rowVersion: result.data.rowVersion,
          },
        );

        if (updateResult.success) {
          notify.success("アイテムを更新しました。");

          // 最新のアイテムデータを再取得（body を含む完全な情報を取得）
          const fetchResult = await fetchLatestWorkspaceItem(
            latestItem.workspaceId || 0,
            latestItem.id,
          );

          if (fetchResult.success && onSave) {
            onSave(fetchResult.data);
          }
          onClose();
        } else if (updateResult.error === "conflict") {
          // 409 Conflict: 並行更新
          notify.error(
            updateResult.message ||
              "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
          );
        } else {
          notify.error(
            updateResult.message || "アイテムの更新に失敗しました。",
          );
        }
      } catch (err: unknown) {
        console.error("アイテム更新中にエラーが発生しました:", err);
        notify.error("アイテムの更新中にエラーが発生しました。");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, editorValue, latestItem, onSave, onClose, notify],
  );

  const formRef = useRef<HTMLFormElement>(null);

  // モーダルが開かれたときに最新のアイテムデータを取得
  useEffect(() => {
    if (!isOpen) return;

    const fetchLatestItem = async () => {
      setIsLoadingItem(true);
      setItemLoadError(null);

      try {
        const result = await fetchLatestWorkspaceItem(
          item.workspaceId || 0,
          item.id,
        );

        if (result.success) {
          setLatestItem(result.data);
          // フォームデータを更新
          setFormData({
            subject: result.data.subject || "",
            dueDate: result.data.dueDate
              ? new Date(result.data.dueDate).toISOString().split("T")[0]
              : "",
            priority: (result.data.priority || "Medium") as TaskPriority,
            isDraft: result.data.isDraft ?? false,
            isArchived: result.data.isArchived ?? false,
            rowVersion: result.data.rowVersion,
          });
          // エディタ値を更新
          setEditorValue(result.data.body || "");
        } else {
          setItemLoadError(result.message || "アイテムの取得に失敗しました。");
        }
      } catch (err) {
        console.error("アイテム取得中にエラーが発生しました:", err);
        setItemLoadError("アイテムの取得中にエラーが発生しました。");
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
          <div className="flex items-center justify-between p-6 border-b border-base-300 sticky top-0 bg-base-100 z-10">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <EditIcon />
              アイテム編集
            </h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle"
              onClick={handleClose}
              disabled={isSubmitting || isLoadingItem}
              aria-label="閉じる"
            >
              <CloseIcon />
            </button>
          </div>

          {/* モーダルボディ */}
          <div className="p-6">
            {/* アイテム読み込みエラー表示 */}
            {itemLoadError && (
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
              <form
                ref={formRef}
                onSubmit={handleSubmit}
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
                    placeholder="例：アイテムの件名"
                    className={`input input-bordered w-full ${
                      shouldShowError("subject") ? "input-error" : ""
                    }`}
                    value={formData.subject}
                    onChange={(e) =>
                      handleFieldChange("subject", e.target.value)
                    }
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
                </div>

                {/* 期限日 */}
                <div className="form-control">
                  <label htmlFor="dueDate" className="label">
                    <span className="label-text font-semibold">期限日</span>
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
                    value={formData.priority || "Medium"}
                    onChange={(e) =>
                      handleFieldChange(
                        "priority",
                        e.target.value as TaskPriority,
                      )
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

                {/* ステータス */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      name="isDraft"
                      className="checkbox checkbox-primary"
                      checked={formData.isDraft || false}
                      onChange={(e) =>
                        handleFieldChange("isDraft", e.target.checked)
                      }
                      disabled={isSubmitting}
                    />
                    <span className="label-text">下書き</span>
                  </label>
                </div>

                {/* アーカイブフラグ */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      name="isArchived"
                      className="checkbox checkbox-neutral"
                      checked={formData.isArchived || false}
                      onChange={(e) =>
                        handleFieldChange("isArchived", e.target.checked)
                      }
                      disabled={isSubmitting}
                    />
                    <span className="label-text">アーカイブ</span>
                  </label>
                </div>

                {/* rowVersion（隠しフィールド） */}
                <input
                  type="hidden"
                  name="rowVersion"
                  value={formData.rowVersion}
                />

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
                        保存中...
                      </>
                    ) : (
                      "保存"
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
