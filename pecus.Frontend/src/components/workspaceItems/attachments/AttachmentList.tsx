'use client';

import type { WorkspaceItemAttachmentResponse } from '@/connectors/api/pecus';
import AttachmentListItem from './AttachmentListItem';
import AttachmentUploadProgress from './AttachmentUploadProgress';

/** アップロード中のファイル情報 */
export interface UploadingFile {
  /** 一時ID */
  id: string;
  /** ファイル名 */
  fileName: string;
  /** 進捗（0-100） */
  progress: number;
}

interface AttachmentListProps {
  /** 添付ファイル一覧 */
  attachments: WorkspaceItemAttachmentResponse[];
  /** アップロード中のファイル一覧 */
  uploadingFiles: UploadingFile[];
  /** 削除コールバック */
  onDelete: (attachmentId: number) => Promise<void>;
  /** 削除可能かどうかを判定するコールバック */
  canDelete: (attachment: WorkspaceItemAttachmentResponse) => boolean;
  /** ワークスペースID */
  workspaceId: number;
  /** アイテムID */
  itemId: number;
}

/**
 * ダウンロードURLを生成
 */
function generateDownloadUrl(workspaceId: number, itemId: number, fileName: string | undefined): string {
  if (!fileName) return '#';
  return `/api/workspaces/${workspaceId}/items/${itemId}/attachments/${encodeURIComponent(fileName)}?download=true`;
}

/**
 * 添付ファイル一覧コンポーネント
 */
export default function AttachmentList({
  attachments,
  uploadingFiles,
  onDelete,
  canDelete,
  workspaceId,
  itemId,
}: AttachmentListProps) {
  const hasContent = attachments.length > 0 || uploadingFiles.length > 0;

  if (!hasContent) {
    return (
      <div className="text-center py-8 text-base-content/50">
        <span className="icon-[mdi--file-outline] size-12 mb-2" aria-hidden="true" />
        <p className="text-sm">添付ファイルはありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* アップロード中のファイル */}
      {uploadingFiles.map((file) => (
        <AttachmentUploadProgress key={file.id} fileName={file.fileName} progress={file.progress} />
      ))}

      {/* 既存の添付ファイル */}
      {attachments.map((attachment) => (
        <AttachmentListItem
          key={attachment.id}
          attachment={attachment}
          onDelete={() => onDelete(attachment.id)}
          canDelete={canDelete(attachment)}
          downloadUrl={generateDownloadUrl(workspaceId, itemId, attachment.fileName)}
        />
      ))}
    </div>
  );
}
