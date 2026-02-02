'use client';

import { useState } from 'react';
import type { WorkspaceItemAttachmentResponse } from '@/connectors/api/pecus';
import { formatDate } from '@/libs/utils/date';

interface AttachmentListItemProps {
  /** 添付ファイル情報 */
  attachment: WorkspaceItemAttachmentResponse;
  /** 削除処理のコールバック */
  onDelete: () => Promise<void>;
  /** 削除可能かどうか */
  canDelete: boolean;
  /** ダウンロードURL */
  downloadUrl: string;
  /** サムネイルURL（画像の場合のみ） */
  thumbnailUrl?: string;
}

/**
 * ファイル拡張子からアイコンクラスと色を取得
 */
function getFileIconInfo(fileName: string | undefined): { iconClass: string; colorClass: string } {
  if (!fileName) {
    return { iconClass: 'icon-[mdi--file]', colorClass: 'text-base-content/60' };
  }

  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  switch (extension) {
    case 'pdf':
      return { iconClass: 'icon-[mdi--file-pdf-box]', colorClass: 'text-error' };
    case 'doc':
    case 'docx':
      return { iconClass: 'icon-[mdi--file-word-box]', colorClass: 'text-info' };
    case 'xls':
    case 'xlsx':
      return { iconClass: 'icon-[mdi--file-excel-box]', colorClass: 'text-success' };
    case 'ppt':
    case 'pptx':
      return { iconClass: 'icon-[mdi--file-powerpoint-box]', colorClass: 'text-warning' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return { iconClass: 'icon-[mdi--file-image]', colorClass: 'text-secondary' };
    case 'txt':
    case 'csv':
      return { iconClass: 'icon-[mdi--file-document-outline]', colorClass: 'text-base-content/60' };
    case 'zip':
    case 'rar':
      return { iconClass: 'icon-[mdi--folder-zip]', colorClass: 'text-base-content/60' };
    default:
      return { iconClass: 'icon-[mdi--file]', colorClass: 'text-base-content/60' };
  }
}

/**
 * ファイルサイズを人間可読形式にフォーマット
 */
function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined || bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * 個別の添付ファイル行コンポーネント
 * インライン削除確認UIを内包
 */
export default function AttachmentListItem({
  attachment,
  onDelete,
  canDelete,
  downloadUrl,
  thumbnailUrl,
}: AttachmentListItemProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // サムネイル読み込み状態: 'loading' | 'loaded' | 'error'
  const [imgState, setImgState] = useState<'loading' | 'loaded' | 'error'>('loading');

  const { iconClass, colorClass } = getFileIconInfo(attachment.fileName);
  // 画像ファイルかどうかを判定
  const isImage = attachment.mimeType?.startsWith('image/');

  const handleDeleteClick = () => {
    setIsConfirmingDelete(true);
  };

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  // 削除確認モード
  if (isConfirmingDelete) {
    return (
      <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning rounded-lg">
        <span className="icon-[mdi--alert] size-5 text-warning shrink-0" aria-hidden="true" />
        <span className="flex-1 text-sm truncate">
          「<span className="font-medium">{attachment.fileName}</span>」を削除しますか？
        </span>
        <button type="button" onClick={handleCancelDelete} className="btn btn-sm" disabled={isDeleting}>
          キャンセル
        </button>
        <button type="button" onClick={handleConfirmDelete} className="btn btn-error btn-sm" disabled={isDeleting}>
          {isDeleting ? (
            <>
              <span className="loading loading-spinner loading-xs" />
              削除中
            </>
          ) : (
            '削除'
          )}
        </button>
      </div>
    );
  }

  // 通常表示
  return (
    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg hover:bg-base-content/10 transition-colors group">
      {/* ファイルタイプアイコンまたはサムネイル */}
      {isImage && thumbnailUrl ? (
        <>
          {/* 読み込み中はスケルトン表示 */}
          {imgState === 'loading' && <div className="size-10 rounded shrink-0 bg-base-300 animate-pulse" />}
          {/* サムネイル画像 */}
          <img
            src={thumbnailUrl}
            alt={attachment.fileName || '画像'}
            className={`size-10 rounded object-cover shrink-0 bg-base-300 ${imgState !== 'loaded' ? 'hidden' : ''}`}
            onLoad={() => setImgState('loaded')}
            onError={() => setImgState('error')}
          />
          {/* エラー時はアイコン表示 */}
          {imgState === 'error' && <span className={`${iconClass} size-6 ${colorClass} shrink-0`} aria-hidden="true" />}
        </>
      ) : (
        <span className={`${iconClass} size-6 ${colorClass} shrink-0`} aria-hidden="true" />
      )}

      {/* ファイル情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <a href={downloadUrl} download className="font-medium text-sm truncate hover:underline hover:text-primary">
            {attachment.fileName || '不明なファイル'}
          </a>
          {attachment.task?.sequenceNumber && (
            <span className="badge badge-secondary badge-xs font-mono">T-{attachment.task.sequenceNumber}</span>
          )}
        </div>
        <p className="text-xs text-base-content/60">
          {formatFileSize(attachment.fileSize)}
          {attachment.uploadedBy?.username && ` • ${attachment.uploadedBy.username}`}
          {attachment.uploadedAt && ` • ${formatDate(attachment.uploadedAt)}`}
        </p>
      </div>

      {/* 削除ボタン */}
      {canDelete && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className="btn btn-secondary btn-xs text-error opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`${attachment.fileName}を削除`}
        >
          <span className="icon-[mdi--trash-can-outline] size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
