'use client';

import AvatarImage from './AvatarImage';

/**
 * ユーザーアバター + 名前表示コンポーネントのProps
 */
export interface UserAvatarProps {
  /** ユーザー名 */
  userName: string | null | undefined;
  /** アイデンティティアイコンURL */
  identityIconUrl?: string | null;
  /** アイコンサイズ（ピクセル） */
  size?: number;
  /** 名前を表示するか（デフォルト: true） */
  showName?: boolean;
  /** 名前のフォントクラス（デフォルト: 'font-semibold'） */
  nameClassName?: string;
  /** アイコンクリック時のコールバック */
  onIconClick?: () => void;
  /** 名前クリック時のコールバック */
  onNameClick?: () => void;
}

/**
 * ユーザーアバター + 名前表示コンポーネント
 * アイコンと名前をインラインで表示するシンプルなコンポーネント
 */
export default function UserAvatar({
  userName,
  identityIconUrl,
  size = 20,
  showName = true,
  nameClassName = 'font-semibold',
  onIconClick,
  onNameClick,
}: UserAvatarProps) {
  const displayName = userName || 'ユーザー';

  // 名前要素
  const nameElement =
    showName &&
    (onNameClick ? (
      <button
        type="button"
        className={`truncate text-left hover:text-primary hover:underline transition-colors focus:outline-none focus:text-primary ${nameClassName}`}
        onClick={onNameClick}
      >
        {displayName}
      </button>
    ) : (
      <span className={`truncate ${nameClassName}`}>{displayName}</span>
    ));

  return (
    <div className="flex items-center gap-2">
      <AvatarImage
        src={identityIconUrl}
        alt={displayName}
        size={size}
        clickable={!!onIconClick}
        onClick={onIconClick}
      />
      {nameElement}
    </div>
  );
}
