"use client";

import { useState } from "react";
import { updateWorkspaceItemAssignee } from "@/actions/workspaceItem";
import type {
  WorkspaceDetailUserResponse,
  WorkspaceItemDetailResponse,
} from "@/connectors/api/pecus";
import { getDisplayIconUrl } from "@/utils/imageUrl";

interface WorkspaceItemDrawerProps {
  item: WorkspaceItemDetailResponse;
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  members?: WorkspaceDetailUserResponse[];
  onAssigneeUpdate?: (updatedItem: WorkspaceItemDetailResponse) => void;
}

export default function WorkspaceItemDrawer({
  item,
  isOpen,
  isClosing,
  onClose,
  members = [],
  onAssigneeUpdate,
}: WorkspaceItemDrawerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(
    item.assigneeId || null,
  );

  if (!isOpen) return null;

  const handleAssigneeChange = async (newAssigneeId: number | null) => {
    try {
      setIsUpdating(true);
      setError(null);
      setSelectedAssigneeId(newAssigneeId);

      const result = await updateWorkspaceItemAssignee(
        item.workspaceId ?? 0,
        item.id,
        {
          assigneeId: newAssigneeId,
          rowVersion: item.rowVersion,
        },
      );

      if (result.success) {
        onAssigneeUpdate?.(result.data);
      } else {
        setError(result.message || "担当者の更新に失敗しました。");
        setSelectedAssigneeId(item.assigneeId || null);
      }
    } catch (err: any) {
      setError(err.message || "担当者の更新に失敗しました。");
      setSelectedAssigneeId(item.assigneeId || null);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
      `}</style>

      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
        onClick={onClose}
        style={{
          animation: isClosing
            ? "fadeOut 0.25s ease-out"
            : "fadeIn 0.2s ease-out",
        }}
      />

      {/* ドローワー本体 */}
      <div
        id="workspace-item-drawer"
        className="fixed top-0 right-0 h-full w-80 bg-base-100 shadow-xl z-50 overflow-y-auto flex flex-col transition-transform duration-300 ease-out"
        role="dialog"
        tabIndex={-1}
        style={{
          animation: isClosing
            ? "slideOutRight 0.25s ease-in"
            : "slideInRight 0.3s ease-out",
        }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 sticky top-0 bg-base-100 z-10">
          <h3 className="text-lg font-bold">詳細オプション</h3>
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 p-4 space-y-4">
          {/* エラーメッセージ */}
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {/* 担当者設定 */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">担当者</span>
            </label>
            <select
              value={selectedAssigneeId || ""}
              onChange={(e) =>
                handleAssigneeChange(
                  e.target.value ? parseInt(e.target.value, 10) : null,
                )
              }
              disabled={isUpdating}
              className="select select-bordered"
            >
              <option value="">未割当</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.userName}
                </option>
              ))}
            </select>

            {/* 現在の担当者情報を表示 */}
            {selectedAssigneeId && (
              <div className="mt-2 flex items-center gap-2 p-2 bg-base-200 rounded">
                {item.assigneeAvatarUrl ? (
                  <img
                    src={getDisplayIconUrl(item.assigneeAvatarUrl)}
                    alt={item.assigneeUsername || "ユーザー"}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center text-xs">
                    ？
                  </div>
                )}
                <span className="text-sm font-semibold">
                  {item.assigneeUsername}
                </span>
              </div>
            )}
          </div>

          {/* 期限 */}
          {item.dueDate && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">期限</span>
              </label>
              <p className="text-sm">
                {new Date(item.dueDate).toLocaleDateString("ja-JP")}
              </p>
            </div>
          )}

          {/* その他のオプション */}
          <div className="divider my-2"></div>
          <button type="button" className="btn btn-outline btn-sm w-full">
            詳細を表示
          </button>
        </div>

        {/* フッター */}
        <div className="flex gap-2 p-4 border-t border-base-300 bg-base-100"></div>
      </div>
    </>
  );
}
