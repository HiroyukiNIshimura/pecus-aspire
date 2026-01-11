import type { ActivityActionType } from '@/connectors/api/pecus';
import { formatDate } from '@/libs/utils/date';

/** アクションタイプごとのアイコンと色の設定 */
export const actionTypeConfig: Record<ActivityActionType, { icon: string; badgeClass: string }> = {
  Created: { icon: 'icon-[mdi--plus]', badgeClass: 'badge-success' },
  SubjectUpdated: { icon: 'icon-[mdi--pencil]', badgeClass: 'badge-primary' },
  BodyUpdated: { icon: 'icon-[mdi--text-box-edit]', badgeClass: 'badge-primary' },
  FileAdded: { icon: 'icon-[mdi--file-plus]', badgeClass: 'badge-success' },
  FileRemoved: { icon: 'icon-[mdi--file-remove]', badgeClass: 'badge-error' },
  AssigneeChanged: { icon: 'icon-[mdi--account-switch]', badgeClass: 'badge-info' },
  RelationAdded: { icon: 'icon-[mdi--link-plus]', badgeClass: 'badge-success' },
  RelationRemoved: { icon: 'icon-[mdi--link-off]', badgeClass: 'badge-error' },
  ArchivedChanged: { icon: 'icon-[mdi--archive]', badgeClass: 'badge-warning' },
  DraftChanged: { icon: 'icon-[mdi--file-edit]', badgeClass: 'badge-warning' },
  CommitterChanged: { icon: 'icon-[mdi--account-check]', badgeClass: 'badge-info' },
  PriorityChanged: { icon: 'icon-[mdi--flag]', badgeClass: 'badge-warning' },
  DueDateChanged: { icon: 'icon-[mdi--calendar]', badgeClass: 'badge-info' },
  TaskAdded: { icon: 'icon-[mdi--checkbox-marked-circle-plus-outline]', badgeClass: 'badge-success' },
  TaskCompleted: { icon: 'icon-[mdi--checkbox-marked-circle]', badgeClass: 'badge-success' },
  TaskDiscarded: { icon: 'icon-[mdi--checkbox-blank-off-outline]', badgeClass: 'badge-error' },
  TaskAssigneeChanged: { icon: 'icon-[mdi--account-switch]', badgeClass: 'badge-info' },
  TaskReopened: { icon: 'icon-[mdi--refresh]', badgeClass: 'badge-warning' },
  TaskDueDateChanged: { icon: 'icon-[mdi--calendar-clock]', badgeClass: 'badge-info' },
};

/** アクションタイプの日本語ラベル */
export const actionTypeLabels: Record<ActivityActionType, string> = {
  Created: 'アイテムを作成',
  SubjectUpdated: '件名を更新',
  BodyUpdated: '本文を更新',
  FileAdded: 'ファイルを追加',
  FileRemoved: 'ファイルを削除',
  AssigneeChanged: '担当者を変更',
  RelationAdded: '関連を追加',
  RelationRemoved: '関連を削除',
  ArchivedChanged: 'アーカイブ状態を変更',
  DraftChanged: '下書き状態を変更',
  CommitterChanged: 'コミッターを変更',
  PriorityChanged: '優先度を変更',
  DueDateChanged: '期限日を変更',
  TaskAdded: 'タスクを追加',
  TaskCompleted: 'タスクを完了',
  TaskDiscarded: 'タスクを破棄',
  TaskAssigneeChanged: 'タスク担当者を変更',
  TaskReopened: 'タスクを再開',
  TaskDueDateChanged: 'タスク期限を変更',
};

/** デフォルトのアクション設定 */
export const defaultActionConfig = { icon: 'icon-[mdi--circle]', badgeClass: 'badge-neutral' };

/** ファイルサイズを人間が読みやすい形式に変換 */
export function formatFileSize(bytes: number | null | undefined): string | null {
  if (bytes == null || bytes <= 0) return null;

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

/** 詳細データをパースして表示用テキストを生成 */
export function formatDetails(actionType: ActivityActionType, details: string | null | undefined): string | null {
  if (!details) return null;

  try {
    const parsed = JSON.parse(details);

    switch (actionType) {
      case 'SubjectUpdated':
        return `「${parsed.old}」→「${parsed.new}」`;
      case 'AssigneeChanged':
      case 'CommitterChanged':
        return `${parsed.old ?? '未割当'} → ${parsed.new ?? '未割当'}`;
      case 'PriorityChanged':
        return `${parsed.old ?? 'なし'} → ${parsed.new ?? 'なし'}`;
      case 'ArchivedChanged':
        return parsed.new ? 'アーカイブしました' : 'アーカイブを解除しました';
      case 'DraftChanged':
        return parsed.new ? '下書きに変更しました' : '公開しました';
      case 'FileAdded': {
        const size = formatFileSize(parsed.fileSize);
        return `${parsed.fileName}${size ? ` (${size})` : ''}`;
      }
      case 'FileRemoved':
        return `${parsed.fileName}`;
      case 'RelationAdded':
        return `#${parsed.relatedItemCode}${parsed.relationType ? ` (${parsed.relationType})` : ''}`;
      case 'RelationRemoved':
        return `#${parsed.relatedItemCode}${parsed.relationType ? ` (${parsed.relationType})` : ''}`;
      case 'DueDateChanged': {
        const oldDate = parsed.old ? formatDate(parsed.old) : 'なし';
        const newDate = parsed.new ? formatDate(parsed.new) : 'なし';
        return `${oldDate} → ${newDate}`;
      }
      case 'TaskAdded':
        return `${parsed.content}${parsed.assignee ? ` (担当: ${parsed.assignee})` : ''}`;
      case 'TaskCompleted':
        return `${parsed.content}${parsed.completedBy ? ` (完了: ${parsed.completedBy})` : ''}`;
      case 'TaskDiscarded':
        return `${parsed.content}${parsed.discardedBy ? ` (破棄: ${parsed.discardedBy})` : ''}`;
      case 'TaskAssigneeChanged':
        return `${parsed.content}: ${parsed.oldAssignee ?? '未割当'} → ${parsed.newAssignee ?? '未割当'}`;
      case 'TaskReopened':
        return `${parsed.content}${parsed.reopenedBy ? ` (再開: ${parsed.reopenedBy})` : ''}`;
      case 'TaskDueDateChanged': {
        const oldTaskDate = parsed.old ? formatDate(parsed.old) : 'なし';
        const newTaskDate = parsed.new ? formatDate(parsed.new) : 'なし';
        return `${parsed.content}: ${oldTaskDate} → ${newTaskDate}`;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}
