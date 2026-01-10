'use client';

interface AttachmentUploadProgressProps {
  /** ファイル名 */
  fileName: string;
  /** 進捗（0-100） */
  progress: number;
  /** キャンセルコールバック（オプション） */
  onCancel?: () => void;
}

/**
 * アップロード中のファイル進捗表示コンポーネント
 */
export default function AttachmentUploadProgress({ fileName, progress, onCancel }: AttachmentUploadProgressProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg" aria-busy="true">
      <span className="icon-[mdi--loading] size-6 text-primary animate-spin shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{fileName}</p>
        <div className="w-full bg-base-300 rounded-full h-1.5 mt-1">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${clampedProgress}%` }}
            role="progressbar"
            aria-valuenow={clampedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <p className="text-xs text-base-content/60 mt-1">アップロード中... {clampedProgress}%</p>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary btn-xs"
          aria-label="アップロードをキャンセル"
        >
          <span className="icon-[mdi--close] size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
