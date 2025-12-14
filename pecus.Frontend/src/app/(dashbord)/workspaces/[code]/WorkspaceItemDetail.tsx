'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import {
  addWorkspaceItemPin,
  fetchLatestWorkspaceItem,
  removeWorkspaceItemPin,
  removeWorkspaceItemRelation,
} from '@/actions/workspaceItem';
import ItemActivityTimeline from '@/components/activity/ItemActivityTimeline';
import UserAvatar from '@/components/common/UserAvatar';
import { PecusNotionLikeViewer, useItemCodeLinkMatchers } from '@/components/editor';
import WorkspaceItemDrawer from '@/components/workspaceItems/WorkspaceItemDrawer';
import type { TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import type {
  ErrorResponse,
  RelatedItemInfo,
  WorkspaceDetailUserResponse,
  WorkspaceItemDetailResponse,
  WorkspaceMode,
} from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import EditWorkspaceItem from './EditWorkspaceItem';
import WorkspaceTasks from './WorkspaceTasks';

interface WorkspaceItemDetailProps {
  workspaceId: number;
  itemId: number;
  onItemSelect: (itemId: number, itemCode: string) => void;
  members?: WorkspaceDetailUserResponse[];
  currentUserId?: number;
  /** タスクタイプマスタデータ */
  taskTypes: TaskTypeOption[];
  /** 関連アイテム追加モードをトグルするコールバック */
  onStartAddRelation?: () => void;
  /** 関連アイテム追加モードが有効かどうか */
  isAddingRelation?: boolean;
  /** ワークスペースモード */
  workspaceMode?: WorkspaceMode;
}

/** WorkspaceItemDetail の外部公開メソッド */
export interface WorkspaceItemDetailHandle {
  /** アイテム詳細を再取得する */
  refreshItem: () => Promise<void>;
}

const WorkspaceItemDetail = forwardRef<WorkspaceItemDetailHandle, WorkspaceItemDetailProps>(
  function WorkspaceItemDetail(
    {
      workspaceId,
      itemId,
      onItemSelect,
      members = [],
      currentUserId,
      taskTypes,
      onStartAddRelation,
      isAddingRelation,
      workspaceMode,
    },
    ref,
  ) {
    const notify = useNotify();
    // ドキュメントモードかどうか
    const isDocumentMode = workspaceMode === 'Document';
    const [item, setItem] = useState<WorkspaceItemDetailResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isDrawerClosing, setIsDrawerClosing] = useState(false);
    const [isPinLoading, setIsPinLoading] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);

    // 関連削除モーダルの状態
    const [deleteRelationModal, setDeleteRelationModal] = useState<{
      isOpen: boolean;
      relation: RelatedItemInfo | null;
    }>({ isOpen: false, relation: null });
    const [isDeleting, setIsDeleting] = useState(false);

    // アイテム詳細を取得する関数
    const fetchItemDetail = useCallback(async () => {
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
    }, [workspaceId, itemId]);

    // 外部から呼び出せるメソッドを公開
    useImperativeHandle(ref, () => ({
      refreshItem: fetchItemDetail,
    }));

    useEffect(() => {
      fetchItemDetail();
    }, [fetchItemDetail]);

    // URLフラグメントによるスクロール（DOM構築後に実行）
    useEffect(() => {
      if (isLoading || !item) return;

      const hash = window.location.hash;
      if (hash) {
        // DOM が完全に構築されるまで少し待つ
        const timeoutId = setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }, [isLoading, item]);

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
      } catch (_err: unknown) {
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

    // 関連削除モーダルを開く
    const handleOpenDeleteRelationModal = (relation: RelatedItemInfo) => {
      setDeleteRelationModal({ isOpen: true, relation });
    };

    // 関連削除モーダルを閉じる
    const handleCloseDeleteRelationModal = () => {
      setDeleteRelationModal({ isOpen: false, relation: null });
    };

    // 関連を削除
    const handleDeleteRelation = async () => {
      if (!deleteRelationModal.relation?.relationId) return;

      setIsDeleting(true);
      try {
        const result = await removeWorkspaceItemRelation(workspaceId, itemId, deleteRelationModal.relation.relationId);

        if (result.success) {
          notify.success('関連を削除しました。');
          // アイテム詳細を再取得して関連一覧を更新
          await fetchItemDetail();
        } else {
          notify.error(result.message || '関連の削除に失敗しました。');
        }
      } catch (_err: unknown) {
        notify.error('関連の削除中にエラーが発生しました。');
      } finally {
        setIsDeleting(false);
        handleCloseDeleteRelationModal();
      }
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
        <div className="alert alert-soft alert-error">
          <span>{error}</span>
        </div>
      );
    }

    if (!item) {
      return (
        <div className="alert alert-soft alert-warning">
          <span>アイテムが見つかりません。</span>
        </div>
      );
    }

    return (
      <div className="card">
        <div className="card-body">
          {/* ヘッダー */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold mb-2">{item.subject || '（未設定）'}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {item.code && <span className="text-xs text-base-content/50 font-mono">#{item.code}</span>}
                {item.priority !== undefined && item.priority !== null && (
                  <div
                    className={`badge ${
                      item.priority === 'Critical'
                        ? 'badge-error'
                        : item.priority === 'High'
                          ? 'badge-warning'
                          : item.priority === 'Medium'
                            ? 'badge-info'
                            : ''
                    }`}
                  >
                    優先度:{' '}
                    {item.priority === 'Critical'
                      ? '緊急'
                      : item.priority === 'High'
                        ? '高'
                        : item.priority === 'Medium'
                          ? '中'
                          : '低'}
                  </div>
                )}
                {item.dueDate && (
                  <span className="badge badge-outline badge-success badge-md gap-1">
                    <span className="text-xs">期限:</span>
                    {new Date(item.dueDate).toLocaleDateString('ja-JP')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* PINボタン */}
              <button
                type="button"
                onClick={handlePinToggle}
                className={`btn btn-secondary btn-sm gap-1 ${item.isPinned ? 'btn-warning' : ''}`}
                title={item.isPinned ? 'PINを解除' : 'PINを追加'}
                disabled={isPinLoading}
              >
                {isPinLoading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : item.isPinned ? (
                  <span className="icon-[mdi--pin] size-4" aria-hidden="true" />
                ) : (
                  <span className="icon-[mdi--pin-outline] size-4" aria-hidden="true" />
                )}
                {item.pinCount !== undefined && item.pinCount > 0 && <span className="text-xs">{item.pinCount}</span>}
              </button>
              {/* タイムラインボタン */}
              <button
                type="button"
                onClick={() => setIsTimelineOpen(true)}
                className="btn btn-secondary btn-sm gap-1"
                title="タイムラインを表示"
              >
                <span className="icon-[mdi--history] size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleEditClick}
                className="btn btn-primary btn-sm gap-2"
                title={getEditButtonTooltip()}
                style={{ pointerEvents: 'auto' }}
                disabled={isDraftAndNotOwner}
              >
                <span className="icon-[mdi--pencil-outline] size-4" aria-hidden="true" />
                編集
              </button>
              <button
                type="button"
                onClick={openDrawer}
                className="btn btn-secondary btn-sm gap-2"
                title="詳細オプション"
              >
                <span className="icon-[mdi--menu] size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* ステータスバッジ */}
          <div className="flex flex-wrap gap-2 mb-4">
            {item.isDraft && <span className="badge badge-warning">下書き</span>}
            {item.isArchived && <span className="badge badge-neutral">アーカイブ済み</span>}
            {item.isPinned && (
              <span className="badge badge-info gap-1">
                <span className="icon-[mdi--pin] w-3.5 h-3.5" aria-hidden="true" />
                PIN済み
              </span>
            )}
          </div>

          {/* 本文  */}
          {item.body && (
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2">本文</h3>
              <WorkspaceItemBodyViewer body={item.body} workspaceId={item.workspaceId!} />
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
                  <UserAvatar
                    userName={item.ownerUsername}
                    identityIconUrl={item.ownerAvatarUrl}
                    size={20}
                    nameClassName="font-semibold truncate"
                  />
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
            <div>
              <span className="text-xs text-base-content/70">担当者</span>
              {item.assigneeId ? (
                <div className="flex items-center gap-2 mt-1">
                  <UserAvatar
                    userName={item.assigneeUsername}
                    identityIconUrl={item.assigneeAvatarUrl}
                    size={20}
                    nameClassName="font-semibold truncate"
                  />
                </div>
              ) : (
                <p className="font-semibold text-base-content/50">未割当</p>
              )}
            </div>
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

          {/* 関連アイテム（ドキュメントモードでは非表示） */}
          {!isDocumentMode && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">関連アイテム</h3>
                <button
                  type="button"
                  onClick={onStartAddRelation}
                  className={`btn btn-primary btn-sm gap-1 ${isAddingRelation ? 'btn-primary' : 'btn-outline'}`}
                  title={isAddingRelation ? '関連アイテム追加を解除' : '関連アイテムを追加'}
                >
                  <span className="icon-[mdi--link-plus] w-4 h-4" aria-hidden="true" />
                  <span>{isAddingRelation ? '解除' : '追加'}</span>
                </button>
              </div>
              {item.relatedItems && item.relatedItems.length > 0 ? (
                <div className="space-y-2">
                  {item.relatedItems.map((related) => (
                    <div
                      key={related.listIndex}
                      className={`flex items-center gap-2 p-2 rounded ${related.isArchived ? 'bg-base-300 opacity-60' : 'bg-base-200'}`}
                    >
                      {/* アイテム情報 */}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-base-content/50 font-mono">#{related.code}</span>
                        <button
                          type="button"
                          onClick={() => related.id && related.code && onItemSelect(related.id, related.code)}
                          className={`truncate hover:underline cursor-pointer text-left w-full ${related.isArchived ? 'line-through' : ''}`}
                          disabled={!related.id || !related.code}
                        >
                          {related.subject || '（件名未設定）'}
                        </button>
                        {/* アーカイブ状態とオーナー情報 */}
                        <div className="flex items-center gap-1 mt-1 text-xs text-base-content/70">
                          {related.isArchived && <span className="badge badge-xs badge-neutral">アーカイブ</span>}
                          {related.ownerId && (
                            <UserAvatar
                              userName={related.ownerUsername}
                              identityIconUrl={related.ownerAvatarUrl}
                              size={16}
                              nameClassName="truncate"
                            />
                          )}
                        </div>
                      </div>
                      {/* 削除ボタン */}
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteRelationModal(related)}
                        className="btn btn-secondary btn-xs text-error hover:bg-error/10"
                        title="関連を削除"
                      >
                        <span className="icon-[mdi--link-off] w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-base-content/50">関連アイテムはありません</p>
              )}
            </div>
          )}

          {/* タスク（ドキュメントモードでは非表示） */}
          {!isDocumentMode && (
            <div id="tasks">
              <WorkspaceTasks
              workspaceId={workspaceId}
              itemId={itemId}
              itemOwnerId={item?.ownerId}
              itemAssigneeId={item?.assigneeId}
              itemCommitterId={item?.committerId}
              itemCommitterName={item?.committerUsername}
              itemCommitterAvatarUrl={item?.committerAvatarUrl}
              taskTypes={taskTypes}
              currentUser={
                currentUserId && members.length > 0
                  ? (() => {
                      const user = members.find((m) => m.id === currentUserId);
                      return user
                        ? {
                            id: user.id || 0,
                            username: user.userName || '',
                            email: user.email || '',
                            identityIconUrl: user.identityIconUrl || null,
                          }
                        : null;
                    })()
                  : null
              }
            />
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
          onItemUpdate={(updatedItem) => setItem(updatedItem)}
          currentUserId={currentUserId}
        />

        {/* タイムラインモーダル */}
        <ItemActivityTimeline
          workspaceId={workspaceId}
          itemId={itemId}
          isOpen={isTimelineOpen}
          onClose={() => setIsTimelineOpen(false)}
        />

        {/* 関連削除確認モーダル */}
        {deleteRelationModal.isOpen && deleteRelationModal.relation && (
          <>
            {/* モーダル背景オーバーレイ */}
            <div
              className="fixed inset-0 bg-black/50 z-60"
              onClick={handleCloseDeleteRelationModal}
              aria-hidden="true"
            />
            {/* モーダルコンテンツ */}
            <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
              <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                  <h3 className="font-bold text-lg">関連の削除</h3>
                  <p className="py-4">以下のアイテムとの関連を削除しますか？</p>
                  <div className="bg-base-200 p-3 rounded-lg mb-4">
                    <p className="font-semibold">{deleteRelationModal.relation.subject || '（件名未設定）'}</p>
                    {deleteRelationModal.relation.ownerUsername && (
                      <p className="text-sm text-base-content/70 mt-1">
                        オーナー: {deleteRelationModal.relation.ownerUsername}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCloseDeleteRelationModal}
                      className="btn"
                      disabled={isDeleting}
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteRelation}
                      className="btn btn-error"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          削除中...
                        </>
                      ) : (
                        '削除'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  },
);

export default WorkspaceItemDetail;

/**
 * 本文表示用のビューアーコンポーネント
 * アイテムコードリンク用のMatcherを設定した状態でViewerをラップ
 */
function WorkspaceItemBodyViewer({ body, workspaceId }: { body: string; workspaceId: number }) {
  const itemCodeMatchers = useItemCodeLinkMatchers({ workspaceId });

  return <PecusNotionLikeViewer initialViewerState={body} customLinkMatchers={itemCodeMatchers} />;
}
