/**
 * Iconify (Tailwind CSS) ベースのアイコンコンポーネント
 * @iconify/tailwind4 + Material Design Icons (mdi) を使用してテーマ対応のアイコンを表示
 *
 * 使用例（直接クラス名を使用）:
 * <span className="icon-[mdi--pin] size-5" />
 *
 * ショートカットコンポーネント:
 * <PlusIcon size="lg" />
 *
 * アイコン検索: https://iconify.design/
 *
 * ⚠️ 注意: Tailwind JIT は静的なクラス名のみビルドに含めます。
 * 動的な name 指定はクライアントサイドで表示されません。
 * 新しいアイコンが必要な場合は、ショートカットコンポーネントを追加してください。
 */

import type { FC } from 'react';

// サイズのプリセット（Tailwind の size-* クラスを使用）
const sizeClasses = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
  xl: 'size-8',
  '2xl': 'size-10',
  '3xl': 'size-12',
} as const;

type IconSize = keyof typeof sizeClasses;

interface IconProps {
  /** アイコンサイズ (プリセット) */
  size?: IconSize;
  /** 追加の className */
  className?: string;
  /** アクセシビリティ用のタイトル */
  title?: string;
  /** aria-label */
  'aria-label'?: string;
  /** aria-hidden */
  'aria-hidden'?: boolean;
}

// 共通の props を生成するヘルパー
const iconProps = (
  iconClass: string,
  { size = 'md', className = '', title, 'aria-label': ariaLabel, 'aria-hidden': ariaHidden = true }: IconProps,
) => ({
  className: `${iconClass} ${sizeClasses[size]} ${className}`.trim(),
  role: ariaLabel ? ('img' as const) : undefined,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden && !ariaLabel,
  title,
});

// ショートカットアイコンコンポーネント（Material Design Icons）
// 静的なクラス名を使用することで Tailwind JIT がビルド時に検出可能

// 基本操作
export const PlusIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--plus-circle-outline]', props)} />;
export const EditIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--pencil-outline]', props)} />;
export const CloseIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--close]', props)} />;
export const ClearIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--close-circle-outline]', props)} />;
export const SearchIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--magnify]', props)} />;
export const FilterIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--filter-outline]', props)} />;
export const DeleteIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--delete-outline]', props)} />;
export const DeleteOutlineIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--delete-outline]', props)} />;
export const SaveIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--content-save-outline]', props)} />;
export const SendIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--send-outline]', props)} />;

// ナビゲーション
export const ChevronLeftIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--chevron-left]', props)} />;
export const ChevronRightIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--chevron-right]', props)} />;
export const ChevronDownIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--chevron-down]', props)} />;
export const MenuIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--menu]', props)} />;
export const MoreVertIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--dots-vertical]', props)} />;
export const HomeIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--home-outline]', props)} />;

// ステータス・通知
export const CheckIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--check]', props)} />;
export const CheckCircleIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[mdi--check-circle-outline]', props)} />
);
export const WarningIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--alert-outline]', props)} />;
export const MessageIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--message-outline]', props)} />;

// ユーザー関連
export const PersonIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--account-outline]', props)} />;
export const PeopleIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--account-group-outline]', props)} />;

// UI・レイアウト
export const DashboardIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[mdi--view-dashboard-outline]', props)} />
);
export const GridViewIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--view-grid-outline]', props)} />;
export const ViewListIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--view-list-outline]', props)} />;

// タスク・管理
export const TaskIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--clipboard-check-outline]', props)} />;
export const ArchiveIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--archive-outline]', props)} />;
export const HistoryIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--history]', props)} />;
export const AssignmentIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[mdi--clipboard-text-outline]', props)} />
);
export const AssignmentIndIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[mdi--clipboard-account-outline]', props)} />
);

// 組織・設定
export const AdminPanelSettingsIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[mdi--cog-outline]', props)} />
);
export const BadgeIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--badge-account-outline]', props)} />;
export const BusinessIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[mdi--office-building-outline]', props)} />
);
export const LocalOfferIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--tag-outline]', props)} />;
export const PsychologyIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--lightbulb-outline]', props)} />;

// カレンダー
export const CalendarIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--calendar-outline]', props)} />;

// リンク
export const LinkIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--link]', props)} />;
export const LinkOffIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--link-off]', props)} />;
export const AddLinkIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--link-plus]', props)} />;

// ピン
export const PinIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--pin]', props)} />;
export const PinOutlineIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--pin-outline]', props)} />;

// トグル・電源
export const ToggleOnIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--toggle-switch]', props)} />;
export const ToggleOffIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[mdi--toggle-switch-off-outline]', props)} />
);
export const PowerOnIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--power]', props)} />;
export const PowerOffIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--power-off]', props)} />;

// 編集
export const EditNoteIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[mdi--file-document-edit-outline]', props)} />
);

// チェックボックス
export const CheckboxIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[mdi--checkbox-marked-outline]', props)} />
);
export const CheckboxBlankIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[mdi--checkbox-blank-outline]', props)} />
);
export const HighlightOffIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[mdi--close-circle-outline]', props)} />
);

// テーマ
export const SunIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--white-balance-sunny]', props)} />;
export const MoonIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--moon-waning-crescent]', props)} />;
export const AutoBrightnessIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[mdi--brightness-auto]', props)} />
);

// その他
export const StarIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--star-outline]', props)} />;
export const StarFilledIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--star]', props)} />;
export const NoteIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--note-outline]', props)} />;
export const HelpIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--help-circle-outline]', props)} />;
export const MailQuestionIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--email-outline]', props)} />;
export const BellIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--bell-outline]', props)} />;
export const UrgentIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--alarm]', props)} />;

// 数値操作
export const MinusIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--minus-circle-outline]', props)} />;
export const PlusSimpleIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[mdi--plus-circle-outline]', props)} />
);

// ナビゲーション追加
export const ChevronUpIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[mdi--chevron-up]', props)} />;
