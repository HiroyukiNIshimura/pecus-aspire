'use client';

import { type DropOptions, type NodeModel, Tree } from '@minoru/react-dnd-treeview';
import { useCallback, useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { fetchWorkspaceRelations, updateItemParent } from '@/actions/workspaceRelation';
import type { WorkspaceItemDetailResponse, WorkspaceItemRelationResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';

interface DocumentTreeSidebarProps {
  workspaceId: number;
  items: WorkspaceItemDetailResponse[];
  onItemSelect?: (itemId: number, itemCode: string) => void;
  selectedItemId?: number | null;
}

type CustomNodeModel = NodeModel<WorkspaceItemDetailResponse>;

export default function DocumentTreeSidebar({
  workspaceId,
  items,
  onItemSelect,
  selectedItemId,
}: DocumentTreeSidebarProps) {
  const [treeData, setTreeData] = useState<CustomNodeModel[]>([]);
  const [relations, setRelations] = useState<WorkspaceItemRelationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const notify = useNotify();

  // リレーションデータの取得
  const loadRelations = useCallback(async () => {
    try {
      const data = await fetchWorkspaceRelations(workspaceId);
      setRelations(data.relations || []);
    } catch (error) {
      console.error('Failed to fetch relations:', error);
      notify.error('リレーション情報の取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, notify]);

  useEffect(() => {
    loadRelations();
  }, [loadRelations]);

  // ツリーデータの構築
  useEffect(() => {
    if (isLoading) return;

    // 親子関係のマッピングを作成 (ChildId -> ParentId)
    // RelationType.ParentOf の場合、From=Parent, To=Child なので、ToItemId をキーに FromItemId を取得
    const parentMap = new Map<number, number>();
    relations.forEach((rel) => {
      if (rel.relationType === 'ParentOf' && rel.toItemId !== undefined && rel.fromItemId !== undefined) {
        parentMap.set(rel.toItemId as number, rel.fromItemId as number);
      }
    });

    const nodes: CustomNodeModel[] = items.map((item) => ({
      id: item.id,
      parent: parentMap.get(item.id) || 0, // 0 はルート
      text: item.subject || '（件名なし）',
      droppable: true,
      data: item,
    }));

    setTreeData(nodes);
  }, [items, relations, isLoading]);

  // ドロップ時の処理
  const handleDrop = async (newTree: CustomNodeModel[], options: DropOptions) => {
    const { dragSourceId, dropTargetId } = options;

    // 親子関係の更新
    // dropTargetId が 0 の場合はルートへの移動
    const newParentId = dropTargetId === 0 ? null : Number(dropTargetId);
    const targetItemId = Number(dragSourceId);

    // 楽観的UI更新
    setTreeData(newTree);

    try {
      // 対象アイテムの現在のRowVersionを取得
      const targetItem = items.find((i) => i.id === targetItemId);
      if (!targetItem) {
        throw new Error('Target item not found');
      }

      await updateItemParent(workspaceId, {
        itemId: targetItemId,
        newParentItemId: newParentId,
        rowVersion: targetItem.rowVersion,
      });

      notify.success('アイテムを移動しました。');

      // リレーション情報を再取得して整合性を保つ
      await loadRelations();
    } catch (error) {
      console.error('Failed to update parent:', error);
      notify.error('アイテムの移動に失敗しました。');
      // エラー時はリレーションを再取得して元に戻す（簡易的なロールバック）
      loadRelations();
    }
  };

  // ノードのレンダリング
  const renderNode = (node: CustomNodeModel) => {
    const isSelected = selectedItemId === Number(node.id);
    const item = node.data;

    return (
      <div
        className={`flex items-center p-2 rounded cursor-pointer hover:bg-base-300 transition-colors ${
          isSelected ? 'bg-primary/10 text-primary font-semibold' : ''
        }`}
        onClick={() => onItemSelect?.(Number(node.id), item?.code || '')}
      >
        <div className="flex-1 truncate flex items-center gap-2">
          <span className="icon-[mdi--file-document-outline] w-4 h-4 flex-shrink-0 opacity-70" aria-hidden="true" />
          <span className="truncate">{node.text}</span>
        </div>
        {item?.isDraft && <span className="badge badge-xs badge-ghost ml-2">Draft</span>}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 overflow-y-auto bg-base-200 p-2 h-full">
        {treeData.length === 0 ? (
          <div className="text-center text-base-content/70 mt-10">
            <p>表示するアイテムがありません。</p>
          </div>
        ) : (
          <Tree
            tree={treeData}
            rootId={0}
            onDrop={handleDrop}
            render={renderNode}
            classes={{
              root: 'h-full',
              container: 'h-full',
              draggingSource: 'opacity-50',
              dropTarget: 'bg-primary/20',
            }}
            sort={false}
            insertDroppableFirst={false}
            canDrop={(tree, { dragSource, dropTargetId }) => {
              if (dragSource?.parent === dropTargetId) {
                return true;
              }
              return true;
            }}
            dropTargetOffset={10}
            placeholderRender={(node, { depth }) => (
              <div className="bg-primary/50 h-[2px] absolute right-0 z-50" style={{ left: depth * 24 }} />
            )}
          />
        )}
      </div>
    </DndProvider>
  );
}
