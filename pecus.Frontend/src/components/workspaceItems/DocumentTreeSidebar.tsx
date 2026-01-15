'use client';

import { type DropOptions, type NodeModel, Tree } from '@minoru/react-dnd-treeview';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { fetchDocumentTree, updateItemParent } from '@/actions/workspaceRelation';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import type { DocumentTreeItemResponse } from '@/connectors/api/pecus';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useNotify } from '@/hooks/useNotify';

interface DocumentTreeSidebarProps {
  workspaceId: number;
  onItemSelect?: (itemId: number, itemCode: string) => void;
  selectedItemId?: number | null;
  /** アイテムが移動された後に呼び出されるコールバック */
  onItemMoved?: () => Promise<void> | void;
  /** ツリーを再取得するためのキー（変更されると再取得） */
  refreshKey?: number;
  /** 編集権限があるかどうか（Viewer以外）*/
  canEdit?: boolean;
}

type CustomNodeModel = NodeModel<DocumentTreeItemResponse>;

export default function DocumentTreeSidebar({
  workspaceId,
  onItemSelect,
  selectedItemId,
  onItemMoved,
  refreshKey,
  canEdit = true,
}: DocumentTreeSidebarProps) {
  const [treeData, setTreeData] = useState<CustomNodeModel[]>([]);
  const [items, setItems] = useState<DocumentTreeItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ドロップ処理中フラグ（楽観的更新を維持するため）
  const [isDropping, setIsDropping] = useState(false);
  const notify = useNotify();
  const notifyRef = useRef(notify);
  const isMobile = useIsMobile();

  // notifyの最新値をrefで保持
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  // ドキュメントツリーデータの取得
  const loadDocumentTree = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchDocumentTree(workspaceId);
      if (result.success) {
        setItems(result.data.items || []);
        return;
      }

      const errorMessage = result.message || 'ドキュメントツリーの取得に失敗しました。';
      setError(errorMessage);
      notifyRef.current.error(errorMessage);
    } catch (err) {
      console.error('Failed to fetch document tree:', err);
      const errorMessage = err instanceof Error ? err.message : 'ドキュメントツリーの取得に失敗しました。';
      setError(errorMessage);
      notifyRef.current.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadDocumentTree();
  }, [loadDocumentTree, refreshKey]);

  // ツリーデータの構築
  useEffect(() => {
    // ドロップ処理中は楽観的更新を維持するため再構築しない
    if (isLoading || isDropping) return;

    const nodes: CustomNodeModel[] = items.map((item) => ({
      id: item.id ?? 0,
      parent: item.parentId ?? 0, // nullの場合は0（ルート）
      text: item.subject || '（件名なし）',
      droppable: true,
      data: item,
    }));

    setTreeData(nodes);
  }, [items, isLoading, isDropping]);

  // ドロップ時の処理
  const handleDrop = async (newTree: CustomNodeModel[], options: DropOptions) => {
    // 編集権限がない場合は通知を表示して処理中断
    if (!canEdit) {
      notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
      return;
    }

    const { dragSourceId, dropTargetId } = options;

    // 親子関係の更新
    // dropTargetId が 0 の場合はルートへの移動
    const newParentId = dropTargetId === 0 ? null : Number(dropTargetId);
    const targetItemId = Number(dragSourceId);

    // ドロップ処理中フラグをON（楽観的更新を維持）
    setIsDropping(true);
    // 楽観的UI更新
    setTreeData(newTree);

    try {
      // ドラッグ対象のアイテムからRowVersionを取得
      const draggedItem = items.find((item) => item.id === targetItemId);
      const rowVersion = draggedItem?.rowVersion ?? 0;

      const updateResult = await updateItemParent(workspaceId, {
        itemId: targetItemId,
        newParentItemId: newParentId,
        rowVersion,
      });

      if (!updateResult.success) {
        notifyRef.current.error(updateResult.message || 'アイテムの移動に失敗しました。');
        // エラー時はツリーを再取得して元に戻す
        await loadDocumentTree();
        return;
      }

      notifyRef.current.success('アイテムを移動しました。');

      // ツリー情報を再取得
      await loadDocumentTree();
      // 親コンポーネントに通知
      if (onItemMoved) {
        await onItemMoved();
      }
    } catch (err) {
      console.error('Failed to update parent:', err);
      notifyRef.current.error('アイテムの移動に失敗しました。');
      // エラー時はツリーを再取得して元に戻す
      await loadDocumentTree();
    } finally {
      // ドロップ処理完了後、フラグをOFF
      setIsDropping(false);
    }
  };

  // ノードのレンダリング
  const renderNode = (
    node: CustomNodeModel,
    { depth, isOpen, onToggle, hasChild }: { depth: number; isOpen: boolean; onToggle: () => void; hasChild: boolean },
  ) => {
    const isSelected = selectedItemId === Number(node.id);
    const item = node.data;
    const indent = depth * 20; // 階層ごとに20pxインデント

    return (
      <div
        className={`flex items-center p-2 rounded cursor-pointer hover:bg-base-content/10 transition-colors ${
          isSelected ? 'bg-primary/10 text-primary font-semibold' : ''
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => onItemSelect?.(Number(node.id), item?.code || '')}
      >
        {/* 展開/折りたたみトグル */}
        {hasChild ? (
          <button
            type="button"
            className="w-5 h-5 flex items-center justify-center flex-shrink-0 hover:bg-base-content/10 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            <span
              className={`icon-[mdi--chevron-right] w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className="w-5 h-5 flex-shrink-0" />
        )}
        <div className="flex-1 truncate flex items-center gap-2">
          <span className="icon-[mdi--file-document-outline] w-4 h-4 flex-shrink-0 opacity-70" aria-hidden="true" />
          <span className="text-xs text-base-content/50 flex-shrink-0">#{item?.code}</span>
          <span className="truncate">{node.text}</span>
        </div>
        {item?.isDraft && <span className="badge badge-xs badge-secondary ml-2">Draft</span>}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <span className="icon-[mdi--alert-circle-outline] w-8 h-8 text-error mb-2" aria-hidden="true" />
        <p className="text-sm text-base-content/70">{error}</p>
        <button type="button" className="btn btn-sm btn-secondary mt-2" onClick={() => loadDocumentTree()}>
          再試行
        </button>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 overflow-y-auto bg-base-200 p-2 min-h-0 flex flex-col">
        {/* モバイルサイズでのD&D無効案内 */}
        {isMobile && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-info/10 text-info text-xs rounded-lg">
            <span className="icon-[mdi--information-outline] w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>スマホの場合は長押ししてから、ドラッグ＆ドロップで親子関係を変更できます</span>
          </div>
        )}
        {treeData.length === 0 ? (
          <EmptyState
            iconClass="icon-[mdi--file-tree-outline]"
            message="アイテムを作成しましょう"
            size="sm"
            className="mt-10"
          />
        ) : (
          <Tree
            tree={treeData}
            rootId={0}
            onDrop={handleDrop}
            render={renderNode}
            initialOpen={true}
            classes={{
              root: 'h-full flex-1',
              container: 'h-full',
              draggingSource: 'opacity-50',
              dropTarget: 'bg-primary/20',
            }}
            sort={false}
            insertDroppableFirst={false}
            canDrop={(_tree, { dragSource, dropTargetId }) => {
              // 編集権限がない場合はドロップ不可
              if (!canEdit) {
                return false;
              }
              if (dragSource?.parent === dropTargetId) {
                return true;
              }
              return true;
            }}
            dropTargetOffset={10}
            placeholderRender={(_node, { depth }) => (
              <div className="bg-primary/50 h-0.5 absolute right-0 z-50" style={{ left: depth * 24 }} />
            )}
          />
        )}
      </div>
    </DndProvider>
  );
}
