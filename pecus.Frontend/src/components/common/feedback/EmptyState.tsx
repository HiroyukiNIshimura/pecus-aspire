import type { ReactNode } from 'react';

interface EmptyStateAction {
  /** ボタンのラベル */
  label: string;
  /** クリック時の処理 */
  onClick: () => void;
  /** ボタンのスタイル（デフォルト: primary） */
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  /** ボタンの左側に表示するアイコンクラス */
  iconClass?: string;
}

interface EmptyStateProps {
  /** メインメッセージ */
  message: string;
  /** サブメッセージ（補足説明） */
  description?: string;
  /** アイコンのクラス名（例: "icon-[tabler--folder-open]"） */
  iconClass?: string;
  /** アイコンのサイズ（デフォルト: "size-16"） */
  iconSize?: string;
  /** アクションボタン */
  action?: EmptyStateAction;
  /** カスタムの子要素（actionの代わりに使用） */
  children?: ReactNode;
  /** サイズバリエーション */
  size?: 'sm' | 'md' | 'lg';
  /** 追加のクラス名 */
  className?: string;
}

const sizeClasses = {
  sm: {
    container: 'py-6',
    icon: 'size-10 mb-2',
    message: 'text-sm',
    description: 'text-xs',
  },
  md: {
    container: 'py-12',
    icon: 'size-16 mb-4',
    message: 'text-base',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    icon: 'size-20 mb-6',
    message: 'text-lg',
    description: 'text-base',
  },
};

const buttonVariants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  outline: 'btn-outline',
};

/**
 * Empty State コンポーネント
 *
 * データがない状態を表示し、ユーザーを次のアクションに誘導する。
 *
 * @example
 * ```tsx
 * // シンプルなメッセージのみ
 * <EmptyState message="データがありません" />
 *
 * // アイコン + 説明付き
 * <EmptyState
 *   iconClass="icon-[tabler--folder-open]"
 *   message="アイテムがまだありません"
 *   description="アイテムを作成して、タスクやアイデアを整理しましょう"
 * />
 *
 * // アクションボタン付き
 * <EmptyState
 *   iconClass="icon-[tabler--plus]"
 *   message="ワークスペースがありません"
 *   description="最初のワークスペースを作成しましょう"
 *   action={{
 *     label: "ワークスペースを作成",
 *     onClick: () => router.push('/workspaces/new'),
 *     iconClass: "icon-[tabler--plus]"
 *   }}
 * />
 *
 * // 小さいサイズ（ドロップダウン内など）
 * <EmptyState
 *   size="sm"
 *   message="該当する項目がありません"
 * />
 * ```
 */
export function EmptyState({
  message,
  description,
  iconClass,
  iconSize,
  action,
  children,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const sizeClass = sizeClasses[size];

  return (
    <div className={`text-center ${sizeClass.container} ${className}`}>
      {iconClass && (
        <span className={`${iconClass} ${iconSize || sizeClass.icon} text-base-content/30 mx-auto block`} />
      )}

      <p className={`text-base-content/70 ${sizeClass.message}`}>{message}</p>

      {description && (
        <p className={`text-base-content/50 ${sizeClass.description} mt-1 max-w-md mx-auto`}>{description}</p>
      )}

      {action && (
        <div className="mt-6">
          <button
            type="button"
            className={`btn ${buttonVariants[action.variant || 'primary']}`}
            onClick={action.onClick}
          >
            {action.iconClass && <span className={`${action.iconClass} size-5`} />}
            {action.label}
          </button>
        </div>
      )}

      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

/**
 * カード内で使用するEmpty State
 *
 * card-bodyのパディングを含んだバージョン
 *
 * @example
 * ```tsx
 * <div className="card">
 *   <EmptyStateCard
 *     iconClass="icon-[tabler--list]"
 *     message="タスクがありません"
 *   />
 * </div>
 * ```
 */
export function EmptyStateCard(props: EmptyStateProps) {
  return (
    <div className="card-body">
      <EmptyState {...props} />
    </div>
  );
}
