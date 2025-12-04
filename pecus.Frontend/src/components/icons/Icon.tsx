/**
 * Iconify (Tabler Icons) ベースのアイコンコンポーネント
 * @iconify/tailwind4 を使用してテーマ対応のアイコンを表示
 *
 * 使用例:
 * <Icon name="plus" className="w-5 h-5" />
 * <Icon name="edit" size="lg" />
 */

import type { FC } from 'react';

// サイズのプリセット
const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
} as const;

type IconSize = keyof typeof sizeClasses;

interface IconProps {
  /** Tabler アイコン名 (例: "plus", "edit", "chevron-left") */
  name: string;
  /** アイコンサイズ (プリセット) */
  size?: IconSize;
  /** 追加の className（サイズ指定時は上書きされない） */
  className?: string;
  /** アクセシビリティ用のタイトル */
  title?: string;
  /** aria-label */
  'aria-label'?: string;
  /** aria-hidden */
  'aria-hidden'?: boolean;
}

/**
 * Iconify (Tabler Icons) アイコンコンポーネント
 *
 * Tabler Icons: https://tabler.io/icons
 */
const Icon: FC<IconProps> = ({
  name,
  size = 'md',
  className = '',
  title,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden = true,
}) => {
  const sizeClass = sizeClasses[size];
  // iconify のクラス形式: icon-[tabler--icon-name]
  const iconClass = `icon-[tabler--${name}]`;

  return (
    <span
      className={`${iconClass} ${sizeClass} ${className}`.trim()}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden && !ariaLabel}
      title={title}
    />
  );
};

export default Icon;

// 便利なエクスポート: よく使うアイコンのショートカット
export const PlusIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="plus" {...props} />;
export const EditIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="edit" {...props} />;
export const CloseIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="x" {...props} />;
export const SearchIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="search" {...props} />;
export const FilterIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="filter" {...props} />;
export const ChevronLeftIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="chevron-left" {...props} />;
export const ChevronRightIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="chevron-right" {...props} />;
export const ChevronDownIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="chevron-down" {...props} />;
export const DeleteIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="trash" {...props} />;
export const SaveIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="device-floppy" {...props} />;
export const SendIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="send" {...props} />;
export const MessageIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="message" {...props} />;
export const WarningIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="alert-triangle" {...props} />;
export const CheckIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="check" {...props} />;
export const CheckCircleIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="circle-check" {...props} />;
export const ClearIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="x" {...props} />;
export const PersonIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="user" {...props} />;
export const PeopleIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="users" {...props} />;
export const HomeIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="home" {...props} />;
export const DashboardIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="layout-dashboard" {...props} />;
export const GridViewIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="grid-dots" {...props} />;
export const ViewListIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="list" {...props} />;
export const ArchiveIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="archive" {...props} />;
export const TaskIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="checkbox" {...props} />;
export const HistoryIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="history" {...props} />;
export const AssignmentIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="clipboard" {...props} />;
export const AssignmentIndIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="clipboard-check" {...props} />;
export const AdminPanelSettingsIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="settings" {...props} />;
export const BadgeIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="id-badge-2" {...props} />;
export const BusinessIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="building" {...props} />;
export const LocalOfferIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="tag" {...props} />;
export const PsychologyIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="brain" {...props} />;
export const CalendarIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="calendar" {...props} />;
export const LinkIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="link" {...props} />;
export const LinkOffIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="unlink" {...props} />;
export const AddLinkIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="link-plus" {...props} />;
export const MenuIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="menu-2" {...props} />;
export const MoreVertIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="dots-vertical" {...props} />;
export const PinIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="pin-filled" {...props} />;
export const PinOutlineIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="pin" {...props} />;
export const ToggleOnIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="toggle-right" {...props} />;
export const ToggleOffIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="toggle-left" {...props} />;
export const PowerOnIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="power" {...props} />;
export const PowerOffIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="power-off" {...props} />;
export const EditNoteIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="notes" {...props} />;
export const CheckboxIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="square-check" {...props} />;
export const CheckboxBlankIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="square" {...props} />;
export const HighlightOffIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="circle-x" {...props} />;
export const DeleteOutlineIcon: FC<Omit<IconProps, 'name'>> = (props) => <Icon name="trash" {...props} />;
