'use client';

import EditIcon from '@mui/icons-material/Edit';
import MenuIcon from '@mui/icons-material/Menu';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { useEffect, useState } from 'react';
import { addWorkspaceItemPin, fetchLatestWorkspaceItem, removeWorkspaceItemPin } from '@/actions/workspaceItem';
import { PecusNotionLikeViewer } from '@/components/editor';
import type { ErrorResponse, WorkspaceDetailUserResponse, WorkspaceItemDetailResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { getDisplayIconUrl } from '@/utils/imageUrl';
import EditWorkspaceItem from './EditWorkspaceItem';
import WorkspaceItemDrawer from './WorkspaceItemDrawer';

interface WorkspaceItemDetailProps {
  workspaceId: number;
  itemId: number;
  onItemSelect: (itemId: number) => void;
  members?: WorkspaceDetailUserResponse[];
  currentUserId?: number;
}

export default function WorkspaceItemDetail({
  workspaceId,
  itemId,
  onItemSelect,
  members = [],
  currentUserId,
}: WorkspaceItemDetailProps) {
  const notify = useNotify();
  const [item, setItem] = useState<WorkspaceItemDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [isPinLoading, setIsPinLoading] = useState(false);

  useEffect(() => {
    const fetchItemDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchLatestWorkspaceItem(workspaceId, itemId);

        if (result.success) {
          setItem(result.data);
        } else {
          setError(result.message || 'アイテムの取得に失敗しました。');
        }
      } catch (err) {
        setError((err as ErrorResponse).message || 'アイテムの取得に失敗しました。');
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

  // PIN操作ハンドラー
  const handlePinToggle = async () => {
    if (!item) return;

    setIsPinLoading(true);
    try {
      const result = item.isPinned
        ? await removeWorkspaceItemPin(workspaceId, itemId)
        : await addWorkspaceItemPin(workspaceId, itemId);

      if (result.success) {
        setItem(result.data);
        notify.success(result.data.isPinned ? 'PINを追加しました。' : 'PINを解除しました。');
      } else {
        notify.error(result.message || 'PIN操作に失敗しました。');
      }
    } catch (err) {
      notify.error('PIN操作中にエラーが発生しました。');
    } finally {
      setIsPinLoading(false);
    }
  };

  // 編集ボタンクリック時の権限チェック
  const handleEditClick = () => {
    if (!item) return;

    // オーナーまたは担当者かどうかをチェック
    const isOwner = currentUserId !== undefined && item.ownerId === currentUserId;
    const isAssignee = currentUserId !== undefined && item.assigneeId === currentUserId;

    if (!isOwner && !isAssignee) {
      notify.warning(
        'アイテムを編集するにはオーナーまたは担当者である必要があります。編集するには担当者になってください。',
      );
      // ドローワーを開いて担当者を変更できるようにする
      openDrawer();
      return;
    }

    setIsEditModalOpen(true);
  };

  // 下書き時はオーナー以外は編集不可
  const isOwner = item && currentUserId !== undefined && item.ownerId === currentUserId;
  const isDraftAndNotOwner = item?.isDraft && !isOwner;

  // 編集ボタンのツールチップを決定
  const getEditButtonTooltip = () => {
    if (isDraftAndNotOwner) {
      return 'オーナーが下書き中です';
    }
    return 'アイテムを編集';
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
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold mb-2">{item.subject || '（未設定）'}</h2>
            <div className="flex items-center gap-2">
              {item.priority !== undefined && item.priority !== null && (
                <div className="badge badge-primary">優先度: {item.priority}</div>
              )}
              {item.code && <code className="text-sm badge badge-ghost badge-md">{item.code}</code>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* PINボタン */}
            <button
              type="button"
              onClick={handlePinToggle}
              className={`btn btn-sm gap-1 ${item.isPinned ? 'btn-warning' : 'btn-ghost'}`}
              title={item.isPinned ? 'PINを解除' : 'PINを追加'}
              disabled={isPinLoading}
            >
              {isPinLoading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : item.isPinned ? (
                <PushPinIcon fontSize="small" />
              ) : (
                <PushPinOutlinedIcon fontSize="small" />
              )}
              {item.pinCount !== undefined && item.pinCount > 0 && <span className="text-xs">{item.pinCount}</span>}
            </button>
            <button
              type="button"
              onClick={handleEditClick}
              className="btn btn-primary btn-sm gap-2"
              title={getEditButtonTooltip()}
              style={{ pointerEvents: 'auto' }}
              disabled={isDraftAndNotOwner}
            >
              <EditIcon fontSize="small" />
              編集
            </button>
            <button type="button" onClick={openDrawer} className="btn btn-ghost btn-sm gap-2" title="詳細オプション">
              <MenuIcon fontSize="small" />
            </button>
          </div>
        </div>

        {/* ステータスバッジ */}
        <div className="flex flex-wrap gap-2 mb-4">
          {item.isDraft && <span className="badge badge-warning">下書き</span>}
          {item.isArchived && <span className="badge badge-neutral">アーカイブ済み</span>}
          {item.isPinned && (
            <span className="badge badge-info gap-1">
              <PushPinIcon style={{ fontSize: '0.875rem' }} />
              PIN済み
            </span>
          )}
        </div>

        {/* 本文  */}
        {item.body && (
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2">本文</h3>
            <PecusNotionLikeViewer initialViewerState={item.body} />
          </div>
        )}

        {/* メタ情報 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4 border-y border-base-300 text-sm">
          {/* 作成日時 */}
          {item.createdAt && (
            <div>
              <span className="text-xs text-base-content/70">作成日時</span>
              <p className="font-semibold">{new Date(item.createdAt).toLocaleString('ja-JP')}</p>
            </div>
          )}

          {/* 作成者 */}
          {item.ownerId && (
            <div>
              <span className="text-xs text-base-content/70">オーナー</span>
              <div className="flex items-center gap-2 mt-1">
                {item.ownerAvatarUrl && (
                  <img
                    src={getDisplayIconUrl(item.ownerAvatarUrl)}
                    alt={item.ownerUsername || 'ユーザー'}
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
              <p className="font-semibold">{new Date(item.updatedAt).toLocaleString('ja-JP')}</p>
            </div>
          )}

          {/* 担当者 */}
          {item.assigneeId && (
            <div>
              <span className="text-xs text-base-content/70">担当者</span>
              <div className="flex items-center gap-2 mt-1">
                {item.assigneeAvatarUrl && (
                  <img
                    src={getDisplayIconUrl(item.assigneeAvatarUrl)}
                    alt={item.assigneeUsername || 'ユーザー'}
                    className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <p className="font-semibold truncate">{item.assigneeUsername}</p>
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
                    src={getDisplayIconUrl(item.committerAvatarUrl)}
                    alt={item.committerUsername || 'ユーザー'}
                    className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <p className="font-semibold truncate">{item.committerUsername}</p>
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
              {item.relatedItems.map((related) => (
                <div key={related.id} className="flex items-center gap-2 p-2 bg-base-200 rounded">
                  {/* 方向インジケーター */}
                  <div className="flex-shrink-0">
                    {related.direction === 'from' ? (
                      <span className="badge badge-sm badge-primary" title="このアイテムから関連">
                        →
                      </span>
                    ) : (
                      <span className="badge badge-sm badge-secondary" title="このアイテムへの関連">
                        ←
                      </span>
                    )}
                  </div>

                  {/* リレーション種別 */}
                  <div className="flex-shrink-0">
                    <span className="badge badge-sm badge-outline">{related.relationType}</span>
                  </div>

                  {/* アイテム情報 */}
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => related.id && onItemSelect(related.id)}
                      className="truncate hover:underline cursor-pointer text-left w-full"
                      disabled={!related.id}
                    >
                      {related.subject || '（件名未設定）'}
                    </button>
                    {/* オーナー情報 */}
                    {related.ownerId && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-base-content/70">
                        {related.ownerAvatarUrl && (
                          <img
                            src={getDisplayIconUrl(related.ownerAvatarUrl)}
                            alt={related.ownerUsername || 'ユーザー'}
                            className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <span className="truncate">{related.ownerUsername}</span>
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
          currentUserId={currentUserId}
        />
      )}

      {/* ドローワー */}
      <WorkspaceItemDrawer
        item={item}
        isOpen={isDrawerOpen}
        isClosing={isDrawerClosing}
        onClose={closeDrawer}
        members={members}
        onAssigneeUpdate={(updatedItem) => setItem(updatedItem)}
      />
    </div>
  );
}
