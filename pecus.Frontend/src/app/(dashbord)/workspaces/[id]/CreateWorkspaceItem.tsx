"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import type { OutputData } from "@editorjs/editorjs";
import type {
  CreateWorkspaceItemRequest,
  TaskPriority,
} from "@/connectors/api/pecus";

// Editor.jsを動的インポート（SSR無効化）
const EditorJSComponent = dynamic(
  () => import("@/components/editor/EditorJS"),
  {
    ssr: false,
    loading: () => (
      <div className="border border-base-300 rounded-lg p-4 min-h-[200px] bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-sm"></span>
      </div>
    ),
  },
);

interface CreateWorkspaceItemProps {
  workspaceId: number;
  onCancel?: () => void;
  onCreate?: (itemId: number) => void;
}

export default function CreateWorkspaceItem({
  workspaceId,
  onCancel,
  onCreate,
}: CreateWorkspaceItemProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState<OutputData | undefined>(undefined);
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("Medium");
  const [isDraft, setIsDraft] = useState(true);
  const [tagNamesInput, setTagNamesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // タグ名をカンマ区切りで分割
      const tagNames = tagNamesInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const request: CreateWorkspaceItemRequest = {
        subject: subject.trim(),
        body: body ? JSON.stringify(body) : null,
        content: content.trim() || null,
        dueDate,
        priority: priority || undefined,
        isDraft,
        tagNames: tagNames.length > 0 ? tagNames : null,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="text-2xl font-bold mb-4">新規アイテム作成</h2>

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

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <EditorJSComponent
              data={body}
              onChange={(data) => setBody(data)}
              placeholder="本文を入力してください..."
              readOnly={isSubmitting}
            />
          </div>

          {/* コンテンツ */}
          <div className="form-control">
            <label htmlFor="content" className="label">
              <span className="label-text font-semibold">コンテンツ</span>
            </label>
            <textarea
              id="content"
              placeholder="アイテムの内容を入力..."
              className="textarea textarea-bordered w-full h-32"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* 期限日 */}
          <div className="form-control">
            <label htmlFor="dueDate" className="label">
              <span className="label-text font-semibold">
                期限日 <span className="text-error">*</span>
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
              <span className="label-text-alt">カンマ区切りで入力</span>
            </label>
            <input
              id="tags"
              type="text"
              placeholder="例：重要, 緊急, デザイン"
              className="input input-bordered w-full"
              value={tagNamesInput}
              onChange={(e) => setTagNamesInput(e.target.value)}
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
          <div className="flex gap-2 justify-end mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-outline gap-2"
              disabled={isSubmitting}
            >
              <CancelIcon className="w-4 h-4" />
              <span>キャンセル</span>
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>作成中...</span>
                </>
              ) : (
                <>
                  <SaveIcon className="w-4 h-4" />
                  <span>作成</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
