'use client';

import type { WorkspaceItemDetailResponse } from '@/connectors/api/pecus';

interface DocumentTreeSidebarProps {
  items: WorkspaceItemDetailResponse[];
  onItemSelect?: (itemId: number, itemCode: string) => void;
}

export default function DocumentTreeSidebar({ items, onItemSelect }: DocumentTreeSidebarProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-base-200 p-4">
      <div className="text-center text-base-content/70 mt-10">
        <span className="icon-[mdi--file-tree-outline] w-12 h-12 mb-2 opacity-50" aria-hidden="true" />
        <p className="font-bold">ドキュメントツリー</p>
        <p className="text-xs mt-2">この機能は現在準備中です。</p>
        <p className="text-xs mt-1">{items.length} 件のアイテムを読み込みました。</p>
      </div>
    </div>
  );
}
