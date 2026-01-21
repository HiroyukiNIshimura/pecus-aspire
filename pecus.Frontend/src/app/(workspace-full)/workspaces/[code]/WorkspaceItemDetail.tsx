'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  addWorkspaceItemPin,
  type ExportFormat,
  exportWorkspaceItemHtml,
  exportWorkspaceItemJson,
  exportWorkspaceItemMarkdown,
  fetchLatestWorkspaceItem,
  removeWorkspaceItemPin,
  removeWorkspaceItemRelation,
  updateWorkspaceItem,
  updateWorkspaceItemAssignee,
  updateWorkspaceItemAttribute,
  updateWorkspaceItemStatus,
} from '@/actions/workspaceItem';
import { fetchWorkspaceItemAttachments } from '@/actions/workspaceItemAttachment';
import ItemActivityTimeline from '@/components/activity/ItemActivityTimeline';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import ItemEditStatus from '@/components/common/feedback/ItemEditStatus';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import { PecusNotionLikeViewer, useItemCodeLinkMatchers } from '@/components/editor';
import { ItemAttachmentModal } from '@/components/workspaceItems/attachments';
import WorkspaceItemDrawer, { type ItemAttributeUpdateRequest } from '@/components/workspaceItems/WorkspaceItemDrawer';
import type { TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import type {
  ErrorResponse,
  RelatedItemInfo,
  TaskPriority,
  TaskStatusFilter,
  WorkspaceDetailUserResponse,
  WorkspaceItemAttachmentResponse,
  WorkspaceItemDetailResponse,
  WorkspaceMode,
  WorkspaceTaskDetailResponse,
} from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { formatDate, formatDateTime } from '@/libs/utils/date';
import { type ItemEditStatus as ItemEditState, useSignalRContext } from '@/providers/SignalRProvider';
import EditWorkspaceItem, { type ItemUpdateRequest } from './EditWorkspaceItem';
import WorkspaceTasks from './WorkspaceTasks';

/** 優先度の文字列を数値に変換（バックエンドの enum 値に対応） */
const PRIORITY_TO_NUMBER: Record<NonNullable<TaskPriority>, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

/** タスクナビゲーション情報 */
interface TaskNavigation {
  /** 現在表示中のタスク一覧（現在のページ） */
  tasks: WorkspaceTaskDetailResponse[];
  /** 一覧内での現在のインデックス */
  currentIndex: number;
  /** 一覧のページ番号 */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** 総タスク数 */
  totalCount: number;
  /** フィルター条件 */
  statusFilter: TaskStatusFilter;
  assignedUserId?: number;
}

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
  workspaceMode?: WorkspaceMode | null;
  /** スクロールターゲット (例: 'tasks') */
  scrollTarget?: string | null;
  /** スクロール完了時のコールバック */
  onScrollComplete?: () => void;
  /** タスク詳細ページを表示するコールバック */
  onShowTaskDetail?: (
    taskSequence: number,
    itemCode: string,
    navigation: TaskNavigation,
    itemCommitterId: number | null,
    itemCommitterName: string | null,
    itemCommitterIsActive: boolean,
    itemCommitterAvatarUrl: string | null,
    itemOwnerId: number | null,
    itemAssigneeId: number | null,
    itemTitle: string | null,
  ) => void;
  /** アイテムコード（URL生成用） */
  itemCode?: string | null;
  /** タスクフローマップページを表示するコールバック */
  onShowFlowMap?: (
    itemTitle: string | null,
    itemCommitterName: string | null,
    itemCommitterIsActive: boolean,
    itemCommitterAvatarUrl: string | null,
    itemOwnerId: number | null,
    itemAssigneeId: number | null,
    itemCommitterId: number | null,
  ) => void;
  /** アイテムアーカイブ完了時のコールバック（ツリー更新用） */
  onArchiveComplete?: () => void;
  /** アイテム属性更新時にサイドバーを更新するためのコールバック */
  onSidebarRefresh?: () => void;
  /** 編集権限があるかどうか（Viewer以外）*/
  canEdit?: boolean;
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
      scrollTarget,
      onScrollComplete,
      onShowTaskDetail,
      itemCode,
      onShowFlowMap,
      onArchiveComplete,
      onSidebarRefresh,
      canEdit = true,
    },
    ref,
  ) {
    const notify = useNotify();
    const { joinItem, leaveItem, connectionState } = useSignalRContext();
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
    const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);

    // ドローワー属性更新用の状態
    const [isAttributeUpdating, setIsAttributeUpdating] = useState(false);
    const [attributeError, setAttributeError] = useState<string | null>(null);

    // 更新中フラグをuseRefで管理（連続操作の防止用、state更新の遅延を回避）
    const isUpdatingRef = useRef<boolean>(false);

    // rowVersionをuseRefで管理（クロージャ問題を回避し、常に最新値を参照するため）
    const rowVersionRef = useRef<number>(0);

    // itemが更新されたらrowVersionRefを同期
    useEffect(() => {
      if (item) {
        rowVersionRef.current = item.rowVersion;
      }
    }, [item]);

    // 関連削除モーダルの状態
    const [deleteRelationModal, setDeleteRelationModal] = useState<{
      isOpen: boolean;
      relation: RelatedItemInfo | null;
    }>({ isOpen: false, relation: null });
    const [isDeleting, setIsDeleting] = useState(false);
    const [itemEditStatus, setItemEditStatus] = useState<ItemEditState>({ isEditing: false });
    // JoinItem の戻り値から取得した編集状態（initialStatus として渡す）
    const [initialEditStatus, setInitialEditStatus] = useState<ItemEditState | undefined>(undefined);

    // 添付ファイル関連の状態
    const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
    const [attachments, setAttachments] = useState<WorkspaceItemAttachmentResponse[]>([]);
    const [attachmentCount, setAttachmentCount] = useState(0);

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

    // SignalR: アイテムグループ参加（接続完了後に実行）
    useEffect(() => {
      // 接続が完了していない場合はスキップ
      if (connectionState !== 'connected') {
        return;
      }

      let isMounted = true;

      const join = async () => {
        try {
          const result = await joinItem(itemId, workspaceId);
          if (isMounted && result.editStatus) {
            // JoinItem の戻り値から編集状態を初期化
            setInitialEditStatus(result.editStatus);
            setItemEditStatus(result.editStatus);
          }
        } catch (err) {
          console.warn('[SignalR] joinItem failed:', err);
        }
      };

      join();

      return () => {
        isMounted = false;
        leaveItem(itemId).catch((err) => {
          console.warn('[SignalR] leaveItem failed:', err);
        });
      };
    }, [itemId, joinItem, leaveItem, workspaceId, connectionState]);

    // 外部から呼び出せるメソッドを公開
    useImperativeHandle(ref, () => ({
      refreshItem: fetchItemDetail,
    }));

    useEffect(() => {
      fetchItemDetail();
    }, [fetchItemDetail]);

    // 添付ファイル一覧を取得
    useEffect(() => {
      const loadAttachments = async () => {
        const result = await fetchWorkspaceItemAttachments(workspaceId, itemId);
        if (result.success) {
          setAttachments(result.data);
          setAttachmentCount(result.data.length);
        }
      };
      loadAttachments();
    }, [workspaceId, itemId]);

    // スクロールターゲットが指定されている場合のスクロール処理（propsベース）
    useEffect(() => {
      if (isLoading || !item || !scrollTarget) return;

      // DOM が完全に構築されるまで少し待つ
      const timeoutId = setTimeout(() => {
        const element = document.getElementById(scrollTarget);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // スクロール完了を通知
        onScrollComplete?.();
      }, 100);

      return () => clearTimeout(timeoutId);
    }, [isLoading, item, scrollTarget, onScrollComplete]);

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

    // ドローワーからの属性更新ハンドラー（一元管理）
    const handleAttributeUpdate = useCallback(
      async (request: ItemAttributeUpdateRequest) => {
        if (!item) return;
        // useRefで更新中チェック（state更新の遅延を回避）
        if (isUpdatingRef.current) return;

        isUpdatingRef.current = true;
        setIsAttributeUpdating(true);
        setAttributeError(null);

        try {
          let result: { success: boolean; data?: WorkspaceItemDetailResponse; message?: string };

          switch (request.type) {
            case 'assignee':
              result = await updateWorkspaceItemAssignee(workspaceId, itemId, {
                assigneeId: request.value as number | null,
                rowVersion: rowVersionRef.current,
              });
              break;

            case 'committer':
              result = await updateWorkspaceItemAttribute(workspaceId, itemId, 'committer', {
                value: (request.value as number | null) ?? undefined,
                rowVersion: rowVersionRef.current,
              });
              break;

            case 'archive':
              result = await updateWorkspaceItemStatus(workspaceId, itemId, {
                isArchived: request.value as boolean,
                keepChildrenRelation: request.keepChildrenRelation,
                rowVersion: rowVersionRef.current,
              });
              break;

            case 'dueDate':
              result = await updateWorkspaceItemAttribute(workspaceId, itemId, 'duedate', {
                value: (request.value as string | null) ?? undefined,
                rowVersion: rowVersionRef.current,
              });
              break;

            case 'priority': {
              const priorityValue = request.value
                ? PRIORITY_TO_NUMBER[request.value as NonNullable<TaskPriority>]
                : null;
              result = await updateWorkspaceItemAttribute(workspaceId, itemId, 'priority', {
                value: priorityValue ?? undefined,
                rowVersion: rowVersionRef.current,
              });
              break;
            }

            default:
              throw new Error(`Unknown attribute type: ${request.type}`);
          }

          if (result.success && result.data) {
            // rowVersionRefを即座に更新（次の更新で使用するため）
            rowVersionRef.current = result.data.rowVersion;
            // item stateを更新
            setItem(result.data);
            // サイドバーを更新
            onSidebarRefresh?.();
            // アーカイブの場合はツリー更新も
            if (request.type === 'archive' && workspaceMode === 'Document') {
              onArchiveComplete?.();
            }
          } else {
            setAttributeError(result.message || '更新に失敗しました。');
            throw new Error(result.message || '更新に失敗しました。');
          }
        } catch (err) {
          if (typeof err === 'object' && err !== null && 'error' in err && err.error === 'conflict') {
            setAttributeError('別のユーザーが先に更新しました。ページをリロードしてください。');
          } else if (err instanceof Error && !attributeError) {
            setAttributeError(err.message);
          }
          throw err;
        } finally {
          isUpdatingRef.current = false;
          setIsAttributeUpdating(false);
        }
      },
      [item, workspaceId, itemId, onSidebarRefresh, onArchiveComplete, workspaceMode, attributeError],
    );

    // 編集モーダル更新用の状態
    const [isItemUpdating, setIsItemUpdating] = useState(false);
    const [itemUpdateError, setItemUpdateError] = useState<string | null>(null);

    // 編集モーダルからのアイテム更新ハンドラー（一元管理）
    const handleItemUpdate = useCallback(
      async (request: ItemUpdateRequest) => {
        if (!item) return;
        if (isUpdatingRef.current) return;

        isUpdatingRef.current = true;
        setIsItemUpdating(true);
        setItemUpdateError(null);

        try {
          const result = await updateWorkspaceItem(workspaceId, itemId, {
            subject: request.subject,
            body: request.body,
            isDraft: request.isDraft,
            tagNames: request.tagNames,
            rowVersion: rowVersionRef.current,
          });

          if (!result.success) {
            // エラー処理
            if (result.error === 'conflict' && 'latest' in result && result.latest) {
              // 競合エラーは子コンポーネントで処理するため、エラーをthrow
              throw { error: 'conflict', latest: result.latest };
            }
            setItemUpdateError(result.message || 'アイテムの更新に失敗しました。');
            throw new Error(result.message || 'アイテムの更新に失敗しました。');
          }

          // 成功処理
          // rowVersionRefを即座に更新
          rowVersionRef.current = result.data.rowVersion;
          // item stateを更新
          setItem(result.data);
          // サイドバーを更新
          onSidebarRefresh?.();
          // モーダルを閉じる
          setIsEditModalOpen(false);
          notify.success('アイテムを更新しました。');
        } catch (err) {
          if (typeof err === 'object' && err !== null && 'error' in err && err.error === 'conflict') {
            // 競合エラーは再throw
            throw err;
          }
          if (err instanceof Error && !itemUpdateError) {
            setItemUpdateError(err.message);
          }
          throw err;
        } finally {
          isUpdatingRef.current = false;
          setIsItemUpdating(false);
        }
      },
      [item, workspaceId, itemId, onSidebarRefresh, notify, itemUpdateError],
    );

    // 競合時の上書き更新ハンドラー
    const handleItemOverwrite = useCallback(
      async (request: ItemUpdateRequest, latestRowVersion: number) => {
        if (!item) return;
        if (isUpdatingRef.current) return;

        isUpdatingRef.current = true;
        setIsItemUpdating(true);
        setItemUpdateError(null);

        try {
          const result = await updateWorkspaceItem(workspaceId, itemId, {
            subject: request.subject,
            body: request.body,
            isDraft: request.isDraft,
            tagNames: request.tagNames,
            rowVersion: latestRowVersion,
          });

          if (!result.success) {
            // エラー処理
            if (result.error === 'conflict' && 'latest' in result && result.latest) {
              // 再度競合エラー
              throw { error: 'conflict', latest: result.latest };
            }
            setItemUpdateError(result.message || 'アイテムの更新に失敗しました。');
            throw new Error(result.message || 'アイテムの更新に失敗しました。');
          }

          // 成功処理
          // rowVersionRefを即座に更新
          rowVersionRef.current = result.data.rowVersion;
          // item stateを更新
          setItem(result.data);
          // サイドバーを更新
          onSidebarRefresh?.();
          // モーダルを閉じる
          setIsEditModalOpen(false);
          notify.success('アイテムを更新しました。');
        } catch (err) {
          if (typeof err === 'object' && err !== null && 'error' in err && err.error === 'conflict') {
            throw err;
          }
          if (err instanceof Error && !itemUpdateError) {
            setItemUpdateError(err.message);
          }
          throw err;
        } finally {
          isUpdatingRef.current = false;
          setIsItemUpdating(false);
        }
      },
      [item, workspaceId, itemId, onSidebarRefresh, notify, itemUpdateError],
    );

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

    const effectiveCurrentUserId = currentUserId ?? 0;
    const isOwner = item && currentUserId !== undefined && item.owner?.id === currentUserId;
    const isDraftAndNotOwner = item?.isDraft && !isOwner;
    const isLockedByOther = itemEditStatus.isEditing && itemEditStatus.editor?.userId !== effectiveCurrentUserId;
    const isArchived = item?.isArchived ?? false;
    const isEditDisabled = isDraftAndNotOwner || isLockedByOther || isArchived;
    const isDrawerDisabled = isDraftAndNotOwner || isLockedByOther; // ドロワーはアーカイブ時も有効
    const editingUserName = itemEditStatus.editor?.userName ?? '他のユーザー';

    // 編集ボタンクリック時の権限チェック
    const handleEditClick = () => {
      if (!item) return;

      // ワークスペース編集権限チェック
      if (!canEdit) {
        notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
        return;
      }

      if (isLockedByOther) {
        notify.warning(`${editingUserName} さんが編集中です。`);
        return;
      }

      // オーナーまたは担当者かどうかをチェック
      const isOwner = currentUserId !== undefined && item.owner?.id === currentUserId;
      const isAssignee = currentUserId !== undefined && item.assignee?.id === currentUserId;

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

    // 編集ボタンのツールチップを決定
    const getEditButtonTooltip = () => {
      if (isArchived) {
        return 'アーカイブ済みのアイテムは編集できません';
      }
      if (isLockedByOther) {
        return `${editingUserName} さんが編集中です`;
      }
      if (isDraftAndNotOwner) {
        return 'オーナーが下書き中です';
      }
      return 'アイテムを編集';
    };

    // 関連削除モーダルを開く
    const handleOpenDeleteRelationModal = (relation: RelatedItemInfo) => {
      // ワークスペース編集権限チェック
      if (!canEdit) {
        notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
        return;
      }
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

    // ファイルダウンロードのヘルパー関数
    const downloadFile = (content: string, filename: string, mimeType: string) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    // エクスポートハンドラー
    const handleExport = async (format: ExportFormat) => {
      if (!item) return;

      setIsExporting(format);
      try {
        const filename = item.code || `item-${itemId}`;

        switch (format) {
          case 'markdown': {
            const result = await exportWorkspaceItemMarkdown(workspaceId, itemId);
            if (result.success) {
              downloadFile(result.data, `${filename}.md`, 'text/markdown;charset=utf-8');
              notify.success('Markdownファイルをダウンロードしました。');
            } else {
              notify.error(result.message || 'Markdownエクスポートに失敗しました。');
            }
            break;
          }
          case 'html': {
            const result = await exportWorkspaceItemHtml(workspaceId, itemId);
            if (result.success) {
              downloadFile(result.data, `${filename}.html`, 'text/html;charset=utf-8');
              notify.success('HTMLファイルをダウンロードしました。');
            } else {
              notify.error(result.message || 'HTMLエクスポートに失敗しました。');
            }
            break;
          }
          case 'json': {
            const result = await exportWorkspaceItemJson(workspaceId, itemId);
            if (result.success) {
              const jsonContent = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);
              downloadFile(jsonContent, `${filename}.json`, 'application/json;charset=utf-8');
              notify.success('JSONファイルをダウンロードしました。');
            } else {
              notify.error(result.message || 'JSONエクスポートに失敗しました。');
            }
            break;
          }
        }
      } catch (_err: unknown) {
        notify.error('エクスポート中にエラーが発生しました。');
      } finally {
        setIsExporting(null);
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
          <div className="flex flex-col gap-3 mb-4">
            {/* 件名とコード */}
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold wrap-break-word">{item.subject || '（未設定）'}</h2>
              {item.code && item.workspaceCode && (
                <button
                  type="button"
                  onClick={() => {
                    const refText = `${item.workspaceCode}#${item.code}`;
                    navigator.clipboard.writeText(refText);
                    notify.success(`${refText} をコピーしました`);
                  }}
                  className="text-xs text-base-content/50 font-mono block mt-1 hover:text-primary cursor-pointer transition-colors"
                  title="クリックして参照コードをコピー"
                >
                  #{item.code}
                </button>
              )}
            </div>
            {/* 優先度・期限バッジ */}
            <div className="flex items-center gap-2 flex-wrap">
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
                  {formatDate(item.dueDate)}
                </span>
              )}
            </div>
            {/* アクションボタン */}
            <div className="flex items-center gap-2 flex-wrap">
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
              {/* 添付ファイルボタン */}
              <button
                type="button"
                onClick={() => setIsAttachmentModalOpen(true)}
                className="btn btn-secondary btn-sm gap-1"
                title="添付ファイル"
              >
                <span className="icon-[mdi--paperclip] size-4" aria-hidden="true" />
                {attachmentCount > 0 && <span className="text-xs">{attachmentCount}</span>}
              </button>
              {/* タスクフローマップボタン（ドキュメントモードでは非表示） */}
              {!isDocumentMode && onShowFlowMap && (
                <button
                  type="button"
                  onClick={() =>
                    onShowFlowMap(
                      item.subject ?? null,
                      item.committer?.username ?? null,
                      item.committer?.isActive ?? false,
                      item.committer?.identityIconUrl ?? null,
                      item.owner?.id ?? null,
                      item.assignee?.id ?? null,
                      item.committer?.id ?? null,
                    )
                  }
                  className="btn btn-secondary btn-sm gap-1"
                  title="タスクフローマップを表示"
                >
                  <span className="icon-[mdi--sitemap] size-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={handleEditClick}
                className="btn btn-primary btn-sm gap-2"
                title={getEditButtonTooltip()}
                style={{ pointerEvents: 'auto' }}
                disabled={isEditDisabled}
              >
                <span className="icon-[mdi--pencil-outline] size-4" aria-hidden="true" />
                編集
              </button>
              <button
                type="button"
                onClick={openDrawer}
                className="btn btn-secondary btn-sm gap-2"
                title="詳細オプション"
                disabled={isDrawerDisabled}
              >
                <span className="icon-[mdi--menu] size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <ItemEditStatus
            itemId={itemId}
            currentUserId={effectiveCurrentUserId}
            initialStatus={initialEditStatus}
            onStatusChange={setItemEditStatus}
            className="mb-3"
          />

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
            <div className="mb-4 border border-base-300 rounded-lg p-4">
              <WorkspaceItemBodyViewer body={item.body} workspaceCode={item.workspaceCode!} />
            </div>
          )}

          {/* メタ情報 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4 border-y border-base-300 text-sm">
            {/* 作成日時 */}
            {item.createdAt && (
              <div>
                <span className="text-xs text-base-content/70">作成日時</span>
                <p className="font-semibold">{formatDateTime(item.createdAt)}</p>
              </div>
            )}

            {/* 作成者 */}
            {item.owner?.id && (
              <div>
                <span className="text-xs text-base-content/70">オーナー</span>
                <div className="flex items-center gap-2 mt-1">
                  <UserAvatar
                    userName={item.owner.username}
                    isActive={item.owner.isActive ?? false}
                    identityIconUrl={item.owner.identityIconUrl}
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
                <p className="font-semibold">{formatDateTime(item.updatedAt)}</p>
              </div>
            )}

            {/* 担当者 */}
            <div>
              <span className="text-xs text-base-content/70">担当者</span>
              {item.assignee?.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <UserAvatar
                    userName={item.assignee.username}
                    isActive={item.assignee.isActive ?? false}
                    identityIconUrl={item.assignee.identityIconUrl}
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
                          {related.owner?.id && (
                            <UserAvatar
                              userName={related.owner.username}
                              isActive={related.owner.isActive ?? false}
                              identityIconUrl={related.owner.identityIconUrl}
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
                        className="btn btn-secondary btn-xs text-error"
                        title="関連を削除"
                      >
                        <span className="icon-[mdi--link-off] w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState iconClass="icon-[mdi--link-variant]" message="関連アイテムはありません" size="sm" />
              )}
            </div>
          )}

          {/* タスク（ドキュメントモードでは非表示） */}
          {!isDocumentMode && (
            <div id="tasks">
              <WorkspaceTasks
                workspaceId={workspaceId}
                itemId={itemId}
                itemCode={itemCode ?? ''}
                itemOwnerId={item?.owner?.id}
                itemAssigneeId={item?.assignee?.id}
                itemCommitterId={item?.committer?.id}
                itemCommitterName={item?.committer?.username}
                itemCommitterIsActive={item?.committer?.isActive ?? false}
                itemCommitterAvatarUrl={item?.committer?.identityIconUrl}
                taskTypes={taskTypes}
                currentUser={
                  currentUserId
                    ? (() => {
                        const user = members.find((m) => m.id === currentUserId);
                        return {
                          id: currentUserId,
                          username: user?.userName || '',
                          email: user?.email || '',
                          identityIconUrl: user?.identityIconUrl || null,
                        };
                      })()
                    : null
                }
                onShowTaskDetail={
                  onShowTaskDetail
                    ? (
                        taskSequence,
                        itemCodeParam,
                        navigation,
                        itemCommitterId,
                        itemCommitterNameParam,
                        itemCommitterIsActiveParam,
                        itemCommitterAvatarUrlParam,
                        itemOwnerIdParam,
                        itemAssigneeIdParam,
                        _itemTitle,
                      ) =>
                        onShowTaskDetail(
                          taskSequence,
                          itemCodeParam,
                          navigation,
                          itemCommitterId,
                          itemCommitterNameParam,
                          itemCommitterIsActiveParam,
                          itemCommitterAvatarUrlParam,
                          itemOwnerIdParam,
                          itemAssigneeIdParam,
                          item.subject ?? null, // アイテムの件名を渡す
                        )
                    : undefined
                }
                onShowFlowMap={
                  onShowFlowMap
                    ? () =>
                        onShowFlowMap(
                          item.subject ?? null,
                          item.committer?.username ?? null,
                          item.committer?.isActive ?? false,
                          item.committer?.identityIconUrl ?? null,
                          item.owner?.id ?? null,
                          item.assignee?.id ?? null,
                          item.committer?.id ?? null,
                        )
                    : undefined
                }
                canEdit={canEdit}
              />
            </div>
          )}

          {/* ダウンロードセクション */}
          <div className="mt-8 pt-4 border-t border-base-300 pb-16 lg:pb-0 flex flex-col items-end">
            <div className="text-right">
              <h4 className="text-sm font-semibold mb-2 text-base-content/70">アイテム本文のエクスポート</h4>
              <div className="flex flex-wrap gap-1 justify-end">
                <button
                  type="button"
                  onClick={() => handleExport('markdown')}
                  className="btn btn-secondary btn-xs gap-1"
                  disabled={isExporting !== null}
                  title="Markdown形式でダウンロード"
                >
                  {isExporting === 'markdown' ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <span className="icon-[mdi--language-markdown] size-3.5" aria-hidden="true" />
                  )}
                  Markdown
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('html')}
                  className="btn btn-secondary btn-xs gap-1"
                  disabled={isExporting !== null}
                  title="HTML形式でダウンロード"
                >
                  {isExporting === 'html' ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <span className="icon-[mdi--language-html5] size-3.5" aria-hidden="true" />
                  )}
                  HTML
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  className="btn btn-secondary btn-xs gap-1"
                  disabled={isExporting !== null}
                  title="JSON形式でダウンロード（Nodeデータ）"
                >
                  {isExporting === 'json' ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <span className="icon-[mdi--code-json] size-3.5" aria-hidden="true" />
                  )}
                  JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 編集モーダル */}
        {item && (
          <EditWorkspaceItem
            item={item}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            currentUserId={currentUserId}
            canEdit={canEdit}
            isUpdating={isItemUpdating}
            error={itemUpdateError}
            onUpdate={handleItemUpdate}
            onOverwrite={handleItemOverwrite}
          />
        )}

        {/* ドローワー */}
        <WorkspaceItemDrawer
          item={item}
          isOpen={isDrawerOpen}
          isClosing={isDrawerClosing}
          onClose={closeDrawer}
          members={members}
          currentUserId={currentUserId}
          workspaceMode={workspaceMode}
          canEdit={canEdit}
          isUpdating={isAttributeUpdating}
          error={attributeError}
          onAttributeUpdate={handleAttributeUpdate}
        />

        {/* タイムラインモーダル */}
        <ItemActivityTimeline
          workspaceId={workspaceId}
          itemId={itemId}
          isOpen={isTimelineOpen}
          onClose={() => setIsTimelineOpen(false)}
        />

        {/* 添付ファイルモーダル */}
        <ItemAttachmentModal
          isOpen={isAttachmentModalOpen}
          onClose={() => setIsAttachmentModalOpen(false)}
          workspaceId={workspaceId}
          itemId={itemId}
          initialAttachments={attachments}
          canEdit={canEdit}
          currentUserId={currentUserId ?? 0}
          itemOwnerId={item.owner?.id}
          onAttachmentCountChange={setAttachmentCount}
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
                    {deleteRelationModal.relation.owner?.username && (
                      <p className="text-sm text-base-content/70 mt-1">
                        オーナー: {deleteRelationModal.relation.owner.username}
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
function WorkspaceItemBodyViewer({ body, workspaceCode }: { body: string; workspaceCode: string }) {
  const itemCodeMatchers = useItemCodeLinkMatchers({ workspaceCode });

  return <PecusNotionLikeViewer initialViewerState={body} customLinkMatchers={itemCodeMatchers} />;
}
