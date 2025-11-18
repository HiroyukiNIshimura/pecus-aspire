"use client";

import { useState, useEffect } from "react";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import type {
  CreateWorkspaceItemRequest,
  TaskPriority,
} from "@/connectors/api/pecus";
import type {
  YooptaContentValue,
  YooptaOnChangeOptions,
} from "@yoopta/editor";
import NotionEditor from "@/components/editor/NotionEditor";
import TagInput from "@/components/common/TagInput";

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
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [editorValue, setEditorValue] = useState<YooptaContentValue | undefined>();
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("Medium");
  const [isDraft, setIsDraft] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モーダルを閉じる際にフォームをリセット
  useEffect(() => {
    if (!isOpen) {
      setSubject("");
      setContent("");
      setEditorValue(undefined);
      setDueDate("");
      setPriority("Medium");
      setIsDraft(true);
      setTags([]);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      setError("件名は必須です");
      return;
    }

    if (!dueDate) {
      setError("期限日は必須です");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const request: CreateWorkspaceItemRequest = {
        subject: subject.trim(),
        body: null,
        dueDate,
        priority: priority || undefined,
        isDraft,
        tagNames: tags.length > 0 ? tags : null,
      };

      const response = await fetch(
        `/api/workspaces/${workspaceId}/items/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "アイテムの作成に失敗しました");
      }

      const data = await response.json();

      // 作成成功時のコールバック
      if (onCreate && data.id) {
        onCreate(data.id);
      }

      // フォームをリセットしてモーダルを閉じる
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditorChange = (
    newValue: YooptaContentValue,
    options: YooptaOnChangeOptions,
  ) => {
    setEditorValue(newValue);
  };

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
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="閉じる"
            >
              <CloseIcon />
            </button>
          </div>

          {/* モーダルボディ */}
          <div className="p-6">
            {/* エラー表示 */}
            {error && (
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
                <span>{error}</span>
              </div>
            )}

            {/* フォーム */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* 件名 */}
          <div className="form-control">
            <label htmlFor="subject" className="label">
              <span className="label-text font-semibold">
                件名 <span className="text-error">*</span>
              </span>
            </label>
            <input
              id="subject"
              type="text"
              placeholder="例：新しいタスクの件名"
              className="input input-bordered w-full"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* 本文（WYSIWYGエディタ） */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">本文</span>
            </label>
            {/* WYSIWYGエディタコンポーネント */}
            <NotionEditor value={editorValue} onChange={handleEditorChange} />
          </div>

          {/* 期限日 */}
          <div className="form-control">
            <label htmlFor="dueDate" className="label">
              <span className="label-text font-semibold">
                期限日
              </span>
            </label>
            <input
              id="dueDate"
              type="date"
              className="input input-bordered w-full"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* 優先度 */}
          <div className="form-control">
            <label htmlFor="priority" className="label">
              <span className="label-text font-semibold">優先度</span>
            </label>
            <select
              id="priority"
              className="select select-bordered w-full"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as TaskPriority | "")
              }
              disabled={isSubmitting}
            >
              <option value="">未設定</option>
              <option value="Low">低</option>
              <option value="Medium">中</option>
              <option value="High">高</option>
              <option value="Critical">緊急</option>
            </select>
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
            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
                disabled={isSubmitting}
              />
              <span className="label-text">下書きとして保存</span>
            </label>
              </div>

              {/* ボタングループ */}
              <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
                <button
                  type="button"
                  onClick={onClose}
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
