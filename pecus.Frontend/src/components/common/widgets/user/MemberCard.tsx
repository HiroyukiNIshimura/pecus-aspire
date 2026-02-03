'use client';

import type { MemberItem } from '@/components/workspaces/WorkspaceMemberList';
import type { AssigneeTaskLoadResponse, WorkspaceRole } from '@/connectors/api/pecus';
import AvatarImage from './AvatarImage';
import WorkloadIndicator from './WorkloadIndicator';

/** null を除外したワークスペースロール型 */
type WorkspaceRoleValue = NonNullable<WorkspaceRole>;

/**
 * ロールの表示設定
 */
const roleConfig: Record<WorkspaceRoleValue, { label: string; badgeClass: string; order: number }> = {
  Owner: { label: 'オーナー', badgeClass: 'badge-outline badge-warning', order: 0 },
  Member: { label: 'メンバー', badgeClass: 'badge-outline badge-success', order: 1 },
  Viewer: { label: '閲覧者', badgeClass: 'badge-outline badge-light', order: 2 },
};

/** メンバー情報からユーザーIDを取得 */
const getMemberId = (member: MemberItem): number => member.userId ?? member.id ?? 0;

/** メンバー情報からユーザー名を取得 */
const getMemberName = (member: MemberItem): string => member.username ?? member.userName ?? '';

/**
 * メンバーカードコンポーネントのProps
 */
export interface MemberCardProps {
  member: MemberItem;
  /** このメンバーがワークスペース作成者（スペシャルオーナー）かどうか */
  isWorkspaceOwner?: boolean;
  /** ハイライト表示（新規追加時） */
  isHighlighted?: boolean;
  /** アイコンクリック時のコールバック */
  onIconClick?: (userId: number, userName: string) => void;
  /** メンバー名クリック時のコールバック */
  onNameClick?: (userId: number, userName: string) => void;
  /** 右端に配置するアクション要素（3点メニューなど） */
  actionSlot?: React.ReactNode;
  /** 負荷情報（表示する場合に渡す） */
  workload?: AssigneeTaskLoadResponse | null;
}

/**
 * メンバーカードコンポーネント
 * - 純粋な表示コンポーネント
 * - アクションは actionSlot で外部から注入
 */
export default function MemberCard({
  member,
  isWorkspaceOwner = false,
  isHighlighted = false,
  onIconClick,
  onNameClick,
  actionSlot,
  workload,
}: MemberCardProps) {
  const memberId = getMemberId(member);
  const memberName = getMemberName(member);
  const config = roleConfig[member.workspaceRole || 'Viewer'] || roleConfig.Viewer;

  // ボーダースタイルの決定: ハイライト > 自分 > デフォルト
  const getBorderStyle = () => {
    if (isHighlighted) {
      return 'bg-primary/20 ring-2 ring-primary ring-offset-1 animate-pulse border-primary';
    }
    if (member.isMe) {
      return 'bg-base-100 border-success/40';
    }
    return 'bg-base-100 border-base-content/20';
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded border transition-all duration-500 ${getBorderStyle()}`}>
      {/* アイコン */}
      <AvatarImage
        src={member.identityIconUrl}
        alt={memberName || 'ユーザー'}
        size={36}
        clickable={!!onIconClick}
        onClick={onIconClick ? () => onIconClick(memberId, memberName) : undefined}
      />

      {/* ユーザー情報 */}
      <div className="min-w-0 flex-1">
        {onNameClick ? (
          <button
            type="button"
            className="text-sm font-semibold truncate text-left hover:text-primary hover:underline transition-colors focus:outline-none focus:text-primary"
            onClick={() => onNameClick(memberId, memberName)}
          >
            {memberName}
          </button>
        ) : (
          <p className="text-sm font-semibold truncate">{memberName}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {/* ロールバッジ（ワークスペース作成者は星マークを表示） */}
          {isWorkspaceOwner ? (
            <div className="indicator">
              <span className="indicator-item indicator-end bg-warning size-3 rounded-full flex items-center justify-center">
                <span className="icon-[mdi--star] size-3 text-warning-content" aria-hidden="true" />
              </span>
              <span className={`badge badge-xs ${config.badgeClass}`}>{config.label}</span>
            </div>
          ) : (
            <span className={`badge badge-xs ${config.badgeClass}`}>{config.label}</span>
          )}
          {/* 負荷バッジ（ロールバッジの横にコンパクト表示） */}
          {workload && <WorkloadIndicator workload={workload} compact size="sm" />}
          {/* 非アクティブ表示 */}
          {member.isActive === false && <span className="text-xs text-base-content/50">(非アクティブ)</span>}
        </div>
      </div>

      {/* アクションスロット（3点メニューなど） - カード右端に配置 */}
      {actionSlot && <div className="flex-shrink-0">{actionSlot}</div>}
    </div>
  );
}
