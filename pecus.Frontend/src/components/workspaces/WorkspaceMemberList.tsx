'use client';

import { EmptyState } from '@/components/common/feedback/EmptyState';
import MemberActionMenu from '@/components/common/widgets/user/MemberActionMenu';
import MemberCard from '@/components/common/widgets/user/MemberCard';
import MemberInfoMenu from '@/components/common/widgets/user/MemberInfoMenu';
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
  workspaceRole?: WorkspaceRole | null;
  /** アクティブフラグ */
  isActive?: boolean;
  /** 最終ログイン日時 */
  lastLoginAt?: string | null;
  /** 自分自身のユーザーかどうか */
  isMe?: boolean;
}

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
  // 最終ログイン日時でソート（新しい順、nullは最後）
  const sortedMembers = [...members].sort((a, b) => {
    const dateA = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
    const dateB = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
    return dateB - dateA;
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
          <EmptyState iconClass="icon-[mdi--account-group-outline]" message="メンバーを追加しましょう" size="sm" />
        ) : (
          /* メンバーグリッド */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {sortedMembers.map((member) => {
              const memberId = getMemberId(member);
              const memberName = member.username ?? member.userName ?? '';
              const isOwner = ownerId !== undefined && memberId === ownerId;

              return (
                <MemberCard
                  key={memberId}
                  member={member}
                  isWorkspaceOwner={isOwner}
                  isHighlighted={highlightedUserIds?.has(memberId) ?? false}
                  actionSlot={
                    <div className="flex items-center gap-1">
                      {/* 情報メニュー（常に表示） */}
                      <MemberInfoMenu userId={memberId} userName={memberName} />
                      {/* アクションメニュー（編集可能かつオーナー以外の場合のみ） */}
                      {editable && !isOwner && (
                        <MemberActionMenu
                          userId={memberId}
                          userName={memberName}
                          currentRole={member.workspaceRole || 'Viewer'}
                          onChangeRole={onChangeRole}
                          onRemove={onRemoveMember}
                        />
                      )}
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
