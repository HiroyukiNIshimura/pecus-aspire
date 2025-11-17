"use client";

import { useEffect, useState } from "react";
import type { WorkspaceItemDetailResponse } from "@/connectors/api/pecus";

interface WorkspaceItemDetailProps {
  workspaceId: number;
  itemId: number;
}

export default function WorkspaceItemDetail({
  workspaceId,
  itemId,
}: WorkspaceItemDetailProps) {
  const [item, setItem] = useState<WorkspaceItemDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItemDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/workspaces/${workspaceId}/items/${itemId}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "アイテムの取得に失敗しました。");
        }

        const data: WorkspaceItemDetailResponse = await response.json();
        setItem(data);
      } catch (err: any) {
        setError(err.message || "アイテムの取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchItemDetail();
  }, [workspaceId, itemId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="alert alert-warning">
        <span>アイテムが見つかりません。</span>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold mb-2">
              {item.subject || "（未設定）"}
            </h2>
            {item.code && (
              <code className="text-sm badge badge-ghost badge-md">
                {item.code}
              </code>
            )}
          </div>
          {item.priority !== undefined && item.priority !== null && (
            <div className="badge badge-primary">
              優先度: {item.priority}
            </div>
          )}
        </div>

        {/* ステータスバッジ */}
        <div className="flex flex-wrap gap-2 mb-4">
          {item.isDraft && (
            <span className="badge badge-warning">下書き</span>
          )}
          {item.isArchived && (
            <span className="badge badge-neutral">アーカイブ済み</span>
          )}
          {item.isPinned && (
            <span className="badge badge-info">📌 ピン留め</span>
          )}
        </div>

        {/* 本文 */}
        {item.body && (
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2">内容</h3>
            <div className="whitespace-pre-wrap break-words bg-base-200 p-4 rounded">
              {item.body}
            </div>
          </div>
        )}

        {/* メタ情報 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4 border-y border-base-300 text-sm">
          {/* 作成日時 */}
          {item.createdAt && (
            <div>
              <span className="text-xs text-base-content/70">作成日時</span>
              <p className="font-semibold">
                {new Date(item.createdAt).toLocaleString("ja-JP")}
              </p>
            </div>
          )}

          {/* 作成者 */}
          {item.ownerId && (
            <div>
              <span className="text-xs text-base-content/70">オーナー</span>
              <div className="flex items-center gap-2 mt-1">
                {item.ownerAvatarUrl && (
                  <img
                    src={item.ownerAvatarUrl}
                    alt={item.ownerUsername || "ユーザー"}
                    className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <p className="font-semibold truncate">
                  {item.ownerUsername}
                </p>
              </div>
            </div>
          )}

          {/* 更新日時 */}
          {item.updatedAt && (
            <div>
              <span className="text-xs text-base-content/70">更新日時</span>
              <p className="font-semibold">
                {new Date(item.updatedAt).toLocaleString("ja-JP")}
              </p>
            </div>
          )}

          {/* 担当者 */}
          {item.assigneeId && (
            <div>
              <span className="text-xs text-base-content/70">担当者</span>
              <div className="flex items-center gap-2 mt-1">
                {item.assigneeAvatarUrl && (
                  <img
                    src={item.assigneeAvatarUrl}
                    alt={item.assigneeUsername || "ユーザー"}
                    className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <p className="font-semibold truncate">
                  {item.assigneeUsername}
                </p>
              </div>
            </div>
          )}

          {/* コミッター */}
          {item.committerId && (
            <div>
              <span className="text-xs text-base-content/70">コミッター</span>
              <div className="flex items-center gap-2 mt-1">
                {item.committerAvatarUrl && (
                  <img
                    src={item.committerAvatarUrl}
                    alt={item.committerUsername || "ユーザー"}
                    className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <p className="font-semibold truncate">
                  {item.committerUsername}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* タグ */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">タグ</h3>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="badge badge-outline"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
