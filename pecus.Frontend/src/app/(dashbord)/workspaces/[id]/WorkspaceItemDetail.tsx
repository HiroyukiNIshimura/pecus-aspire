"use client";

import { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import MenuIcon from "@mui/icons-material/Menu";
import type { WorkspaceItemDetailResponse } from "@/connectors/api/pecus";
import NotionEditor from "@/components/editor/NotionEditor";
import EditWorkspaceItem from "./EditWorkspaceItem";
import type { YooptaContentValue } from "@yoopta/editor";

interface WorkspaceItemDetailProps {
  workspaceId: number;
  itemId: number;
  onItemSelect: (itemId: number) => void;
}

export default function WorkspaceItemDetail({
  workspaceId,
  itemId,
  onItemSelect,
}: WorkspaceItemDetailProps) {
  const [item, setItem] = useState<WorkspaceItemDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);

  useEffect(() => {
    const fetchItemDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/workspaces/${workspaceId}/items/${itemId}`,
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

  // ドローワーを開く
  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  // ドローワーを閉じる
  const closeDrawer = () => {
    setIsDrawerClosing(true);
    setTimeout(() => {
      setIsDrawerOpen(false);
      setIsDrawerClosing(false);
    }, 250); // アニメーション時間と合わせる
  };

  const handleEditSave = (updatedItem: WorkspaceItemDetailResponse) => {
    setItem(updatedItem);
  };

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
      <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold mb-2">
              {item.subject || "（未設定）"}
            </h2>
            <div className="flex items-center gap-2">
              {item.priority !== undefined && item.priority !== null && (
                <div className="badge badge-primary">優先度: {item.priority}</div>
              )}
              {item.code && (
                <code className="text-sm badge badge-ghost badge-md">
                  {item.code}
                </code>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="btn btn-primary btn-sm gap-2"
              title="アイテムを編集"
            >
              <EditIcon fontSize="small" />
              編集
            </button>
            <button
              type="button"
              onClick={openDrawer}
              className="btn btn-ghost btn-sm gap-2"
              title="詳細オプション"
            >
              <MenuIcon fontSize="small" />
            </button>
          </div>
        </div>

        {/* ステータスバッジ */}
        <div className="flex flex-wrap gap-2 mb-4">
          {item.isDraft && <span className="badge badge-warning">下書き</span>}
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
            <div className="p-4 bg-base-200 rounded">
              <NotionEditor
                value={
                  (() => {
                    try {
                      return JSON.parse(item.body) as YooptaContentValue;
                    } catch {
                      return undefined;
                    }
                  })()
                }
                readOnly={true}
              />
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
                <p className="font-semibold truncate">{item.ownerUsername}</p>
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
                <span key={tag.id} className="badge badge-outline">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 関連アイテム */}
        {item.relatedItems && item.relatedItems.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">関連アイテム</h3>
            <div className="space-y-2">
              {item.relatedItems.map((related, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-base-200 rounded"
                >
                  {/* 方向インジケーター */}
                  <div className="flex-shrink-0">
                    {related.direction === "from" ? (
                      <span
                        className="badge badge-sm badge-primary"
                        title="このアイテムから関連"
                      >
                        →
                      </span>
                    ) : (
                      <span
                        className="badge badge-sm badge-secondary"
                        title="このアイテムへの関連"
                      >
                        ←
                      </span>
                    )}
                  </div>

                  {/* リレーション種別 */}
                  <div className="flex-shrink-0">
                    <span className="badge badge-sm badge-outline">
                      {related.relationType}
                    </span>
                  </div>

                  {/* アイテム情報 */}
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => related.id && onItemSelect(related.id)}
                      className="truncate hover:underline cursor-pointer text-left w-full"
                      disabled={!related.id}
                    >
                      {related.subject || "（件名未設定）"}
                    </button>
                    {/* オーナー情報 */}
                    {related.ownerId && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-base-content/70">
                        {related.ownerAvatarUrl && (
                          <img
                            src={related.ownerAvatarUrl}
                            alt={related.ownerUsername || "ユーザー"}
                            className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <span className="truncate">
                          {related.ownerUsername}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {item && (
        <EditWorkspaceItem
          item={item}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEditSave}
        />
      )}

      {/* ドローワー */}
      {isDrawerOpen && (
        <>
          {/* 背景オーバーレイ */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
            onClick={closeDrawer}
            style={{ animation: isDrawerClosing ? 'fadeOut 0.25s ease-out' : 'fadeIn 0.2s ease-out' }}
          />

          {/* ドローワー本体 */}
          <div
            id="workspace-item-drawer"
            className="fixed top-0 right-0 h-full w-80 bg-base-100 shadow-xl z-50 overflow-y-auto flex flex-col transition-transform duration-300 ease-out"
            role="dialog"
            tabIndex={-1}
            style={{ animation: isDrawerClosing ? 'slideOutRight 0.25s ease-in' : 'slideInRight 0.3s ease-out' }}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-base-300 sticky top-0 bg-base-100 z-10">
              <h3 className="text-lg font-bold">詳細オプション</h3>
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm"
                aria-label="Close"
                onClick={closeDrawer}
              >
                ✕
              </button>
            </div>

            {/* ボディ */}
            <div className="flex-1 p-4 space-y-4">
              {/* 作業者設定 */}
              {item && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">作業者</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {item.assigneeAvatarUrl ? (
                      <img
                        src={item.assigneeAvatarUrl}
                        alt={item.assigneeUsername || "ユーザー"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center text-xs">
                        ？
                      </div>
                    )}
                    <span className="text-sm">{item.assigneeUsername || "未割当"}</span>
                  </div>
                </div>
              )}

              {/* 期限 */}
              {item?.dueDate && (
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
            <div className="flex gap-2 p-4 border-t border-base-300 bg-base-100">
              <button
                type="button"
                className="btn btn-outline flex-1"
                onClick={closeDrawer}
              >
                閉じる
              </button>
              <button type="button" className="btn btn-primary flex-1">
                保存
              </button>
            </div>
          </div>
        </>
      )}

    </div>
    </>
  );
}