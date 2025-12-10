'use client';

import MemberCard from '@/components/common/MemberCard';
import type { WorkspaceRole } from '@/connectors/api/pecus';

/**
 * メンバー情報の共通インターフェース
 * WorkspaceUserItem と WorkspaceDetailUserResponse の両方を受け入れ可能
 */
export interface MemberItem {
  /** ユーザーID (userId または id) */
  userId?: number;
  id?: number;
  /** ユーザー名 (username または userName) */
  username?: string;
  userName?: string | null;
  /** メールアドレス */
  email?: string | null;
  /** アイデンティティアイコンURL */
  identityIconUrl?: string | null;
  /** ワークスペースロール */
  workspaceRole?: WorkspaceRole;
  /** アクティブフラグ */
  isActive?: boolean;
}

/**
 * ロールの表示設定（ソート用）
 */
const roleConfig: Record<WorkspaceRole, { order: number }> = {
  Owner: { order: 0 },
  Member: { order: 1 },
  Viewer: { order: 2 },
};

/** メンバー情報からユーザーIDを取得 */
const getMemberId = (member: MemberItem): number => member.userId ?? member.id ?? 0;

interface WorkspaceMemberListProps {
  /** メンバー一覧 */
  members: MemberItem[];
  /** 編集モード（メンバー追加/削除/ロール変更を許可） */
  editable?: boolean;
  /** ワークスペース作成者（オーナー）のユーザーID（この人は削除/ロール変更不可） */
  ownerId?: number;
  /** メンバー追加ボタンクリック時のコールバック */
  onAddMember?: () => void;
  /** メンバー削除ボタンクリック時のコールバック */
  onRemoveMember?: (userId: number, userName: string) => void;
  /** ロール変更時のコールバック */
  onChangeRole?: (userId: number, userName: string, newRole: WorkspaceRole) => void;
  /** ハイライト表示するユーザーIDのセット（新規追加時など） */
  highlightedUserIds?: Set<number>;
}

/**
 * ワークスペースメンバー一覧コンポーネント
 * - Owner → Member → Viewer の順にソート
 * - 編集モードでは3点メニューからロール変更・削除が可能
 */
export default function WorkspaceMemberList({
  members,
  editable = false,
  ownerId,
  onAddMember,
  onRemoveMember,
  onChangeRole,
  highlightedUserIds,
}: WorkspaceMemberListProps) {
  // 権限の優先順位でソート
  const sortedMembers = [...members].sort((a, b) => {
    const orderA = roleConfig[a.workspaceRole || 'Viewer']?.order ?? 3;
    const orderB = roleConfig[b.workspaceRole || 'Viewer']?.order ?? 3;
    return orderA - orderB;
  });

  return (
    <div className="card">
      <div className="card-body">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title text-lg">メンバー一覧</h2>
          {editable && onAddMember && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onAddMember}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              メンバー追加
            </button>
          )}
        </div>

        {/* メンバーが0件の場合 */}
        {members.length === 0 ? (
          <div className="text-center py-8 text-base-content/60">メンバーが登録されていません</div>
        ) : (
          /* メンバーグリッド */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {sortedMembers.map((member) => (
              <MemberCard
                key={getMemberId(member)}
                member={member}
                editable={editable}
                isWorkspaceOwner={ownerId !== undefined && getMemberId(member) === ownerId}
                onRemove={onRemoveMember}
                onChangeRole={onChangeRole}
                isHighlighted={highlightedUserIds?.has(getMemberId(member)) ?? false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
