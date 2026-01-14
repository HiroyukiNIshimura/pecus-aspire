'use client';

import { getDisplayIconUrl } from '@/utils/imageUrl';

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

  // アイコン要素
  const iconElement = identityIconUrl ? (
    <img
      src={getDisplayIconUrl(identityIconUrl)}
      alt={displayName}
      className="mask mask-circle object-cover flex-shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="mask mask-circle bg-base-300 flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="text-base-content/40"
        style={{ width: size * 0.5, height: size * 0.5 }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  );

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
      {onIconClick ? (
        <button
          type="button"
          className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-full"
          onClick={onIconClick}
          aria-label={`${displayName}のプロフィールを表示`}
        >
          {identityIconUrl ? (
            <img
              src={getDisplayIconUrl(identityIconUrl)}
              alt={displayName}
              className="mask mask-circle object-cover cursor-pointer hover:opacity-80 transition-opacity"
              style={{ width: size, height: size }}
            />
          ) : (
            <div
              className="mask mask-circle bg-base-300 flex items-center justify-center cursor-pointer hover:bg-base-200 transition-colors"
              style={{ width: size, height: size }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="text-base-content/40"
                style={{ width: size * 0.5, height: size * 0.5 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </button>
      ) : (
        iconElement
      )}
      {nameElement}
    </div>
  );
}
