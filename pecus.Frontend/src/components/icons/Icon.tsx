/**
 * Iconify (Tailwind CSS) ベースのアイコンコンポーネント
 * @iconify/tailwind4 + Solar Icons を使用してテーマ対応のアイコンを表示
 *
 * 使用例（直接クラス名を使用）:
 * <span className="icon-[solar--pin-bold] size-5" />
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

// ショートカットアイコンコンポーネント（Solar Icons - Linear スタイル）
// 静的なクラス名を使用することで Tailwind JIT がビルド時に検出可能

// 基本操作
export const PlusIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--add-circle-linear]', props)} />;
export const EditIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--pen-linear]', props)} />;
export const CloseIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--close-circle-linear]', props)} />;
export const ClearIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--close-circle-linear]', props)} />;
export const SearchIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--magnifer-linear]', props)} />;
export const FilterIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--filter-linear]', props)} />;
export const DeleteIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--trash-bin-2-linear]', props)} />;
export const DeleteOutlineIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--trash-bin-2-linear]', props)} />
);
export const SaveIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--diskette-linear]', props)} />;
export const SendIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--plain-linear]', props)} />;

// ナビゲーション
export const ChevronLeftIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--alt-arrow-left-linear]', props)} />
);
export const ChevronRightIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--alt-arrow-right-linear]', props)} />
);
export const ChevronDownIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--alt-arrow-down-linear]', props)} />
);
export const MenuIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--hamburger-menu-linear]', props)} />;
export const MoreVertIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--menu-dots-bold]', props)} />;
export const HomeIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--home-2-linear]', props)} />;

// ステータス・通知
export const CheckIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--check-read-linear]', props)} />;
export const CheckCircleIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--check-circle-linear]', props)} />
);
export const WarningIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--danger-triangle-linear]', props)} />
);
export const MessageIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--chat-round-line-linear]', props)} />
);

// ユーザー関連
export const PersonIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--user-linear]', props)} />;
export const PeopleIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--users-group-rounded-linear]', props)} />
);

// UI・レイアウト
export const DashboardIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--widget-2-linear]', props)} />;
export const GridViewIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--widget-4-linear]', props)} />;
export const ViewListIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--list-linear]', props)} />;

// タスク・管理
export const TaskIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--checklist-minimalistic-linear]', props)} />
);
export const ArchiveIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--archive-linear]', props)} />;
export const HistoryIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--history-linear]', props)} />;
export const AssignmentIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--clipboard-text-linear]', props)} />
);
export const AssignmentIndIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--clipboard-check-linear]', props)} />
);

// 組織・設定
export const AdminPanelSettingsIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--settings-linear]', props)} />
);
export const BadgeIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--card-linear]', props)} />;
export const BusinessIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--buildings-2-linear]', props)} />
);
export const LocalOfferIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--tag-linear]', props)} />;
export const PsychologyIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--lightbulb-linear]', props)} />
);

// カレンダー
export const CalendarIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--calendar-linear]', props)} />;

// リンク
export const LinkIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--link-linear]', props)} />;
export const LinkOffIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--link-broken-linear]', props)} />;
export const AddLinkIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--link-circle-linear]', props)} />;

// ピン
export const PinIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--pin-bold]', props)} />;
export const PinOutlineIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--pin-linear]', props)} />;

// トグル・電源（Solar Iconsにはトグルアイコンがないため、電源アイコンで代替）
export const ToggleOnIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--round-transfer-horizontal-linear]', props)} />
);
export const ToggleOffIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--round-transfer-horizontal-linear]', props)} />
);
export const PowerOnIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--power-linear]', props)} />;
export const PowerOffIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--power-linear]', props)} />;

// 編集
export const EditNoteIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--document-text-linear]', props)} />
);

// チェックボックス
export const CheckboxIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--check-square-linear]', props)} />
);
export const CheckboxBlankIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--stop-linear]', props)} />;
export const HighlightOffIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--close-circle-linear]', props)} />
);

// テーマ
export const SunIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--sun-linear]', props)} />;
export const MoonIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--moon-linear]', props)} />;
export const AutoBrightnessIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--sun-2-linear]', props)} />
);

// その他
export const StarIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--star-linear]', props)} />;
export const StarFilledIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--star-bold]', props)} />;
export const NoteIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--notes-linear]', props)} />;
export const HelpIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--question-circle-linear]', props)} />
);
export const MailQuestionIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--letter-linear]', props)} />;
export const BellIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--bell-linear]', props)} />;
export const UrgentIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--alarm-linear]', props)} />;

// 数値操作
export const MinusIcon: FC<IconProps> = (props) => <span {...iconProps('icon-[solar--minus-circle-linear]', props)} />;
export const PlusSimpleIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--add-circle-linear]', props)} />
);

// ナビゲーション追加
export const ChevronUpIcon: FC<IconProps> = (props) => (
  <span {...iconProps('icon-[solar--alt-arrow-up-linear]', props)} />
);

// default export を削除（動的 name は使用不可のため）
// 代わりにショートカットコンポーネントを使用してください
