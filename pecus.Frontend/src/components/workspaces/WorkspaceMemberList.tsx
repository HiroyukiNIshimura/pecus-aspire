'use client';

import type { WorkspaceUserItem } from '@/connectors/api/pecus';
import { getDisplayIconUrl } from '@/utils/imageUrl';

interface WorkspaceMemberListProps {
  members: WorkspaceUserItem[];
}

/**
 * ワークスペースメンバー一覧コンポーネント
 * - Owner → Member → Viewer の順にソート
 * - 権限に応じた badge の色分け
 */
export default function WorkspaceMemberList({ members }: WorkspaceMemberListProps) {
  if (!members || members.length === 0) {
    return null;
  }

  // 権限の優先順位を定義: Owner > Member > Viewer
  const roleOrder: Record<string, number> = { Owner: 0, Member: 1, Viewer: 2 };

  const sortedMembers = [...members].sort((a, b) => {
    const orderA = roleOrder[a.workspaceRole || ''] ?? 3;
    const orderB = roleOrder[b.workspaceRole || ''] ?? 3;
    return orderA - orderB;
  });

  /**
   * 権限に応じた badge の色を取得
   */
  const getRoleBadgeClass = (role: string | undefined): string => {
    switch (role) {
      case 'Owner':
        return 'badge-warning';
      case 'Member':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <h2 className="card-title text-lg mb-4">メンバー一覧</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {sortedMembers.map((member) => (
            <div key={member.userId} className="flex items-center gap-2 p-2 bg-base-100 rounded">
              {member.identityIconUrl && (
                <img
                  src={getDisplayIconUrl(member.identityIconUrl)}
                  alt={member.username || 'ユーザー'}
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{member.username}</p>
                <div className="flex items-center gap-2">
                  <span className={`badge badge-xs ${getRoleBadgeClass(member.workspaceRole)}`}>
                    {member.workspaceRole}
                  </span>
                  {!member.isActive && <span className="text-xs text-base-content/50">(非アクティブ)</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
