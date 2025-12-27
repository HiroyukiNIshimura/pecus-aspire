'use client';

import { useCallback, useRef, useState } from 'react';

/** 許可される拡張子のデフォルト値 */
const DEFAULT_ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  '.zip',
  '.rar',
];

/** デフォルトの最大ファイルサイズ（20MB） */
const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024;

interface AttachmentDropzoneProps {
  /** ファイル選択時のコールバック */
  onFilesSelected: (files: File[]) => void;
  /** 無効化フラグ */
  disabled?: boolean;
  /** 最大ファイルサイズ（バイト単位） */
  maxFileSize?: number;
  /** 許可される拡張子 */
  allowedExtensions?: string[];
  /** エラーコールバック */
  onError?: (message: string) => void;
}

/**
 * ドラッグ＆ドロップとファイル選択を処理するコンポーネント
 */
export default function AttachmentDropzone({
  onFilesSelected,
  disabled = false,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  allowedExtensions = DEFAULT_ALLOWED_EXTENSIONS,
  onError,
}: AttachmentDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル拡張子を取得
  const getFileExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.slice(lastDotIndex).toLowerCase() : '';
  };

  // ファイルのバリデーション
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      const extension = getFileExtension(file.name);

      if (!allowedExtensions.includes(extension)) {
        return {
          valid: false,
          error: `「${file.name}」は許可されていないファイル形式です。`,
        };
      }

      if (file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
        return {
          valid: false,
          error: `「${file.name}」はファイルサイズが${maxSizeMB}MBを超えています。`,
        };
      }

      return { valid: true };
    },
    [allowedExtensions, maxFileSize],
  );

  // ファイル処理
  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const validFiles: File[] = [];
      const errors: string[] = [];

      Array.from(fileList).forEach((file) => {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else if (validation.error) {
          errors.push(validation.error);
        }
      });

      if (errors.length > 0) {
        onError?.(errors.join('\n'));
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [validateFile, onFilesSelected, onError],
  );

  // ドラッグイベントハンドラー
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const { files } = e.dataTransfer;
      handleFiles(files);
    },
    [disabled, handleFiles],
  );

  // クリックでファイル選択ダイアログを開く
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // ファイル選択時
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // 同じファイルを再選択できるようにリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFiles],
  );

  // accept属性用の文字列を生成
  const acceptAttribute = allowedExtensions.join(',');

  // 許可拡張子の表示用テキスト
  const formatAllowedExtensions = () => {
    const displayExtensions = allowedExtensions.slice(0, 5).map((ext) => ext.replace('.', '').toUpperCase());
    if (allowedExtensions.length > 5) {
      return `${displayExtensions.join(', ')}など`;
    }
    return displayExtensions.join(', ');
  };

  // 最大ファイルサイズの表示用テキスト
  const formatMaxFileSize = () => {
    const sizeMB = Math.round(maxFileSize / (1024 * 1024));
    return `${sizeMB}MB`;
  };

  if (disabled) {
    return null;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
        flex flex-col items-center
        ${
          isDragOver
            ? 'border-primary bg-primary/10 scale-[1.02]'
            : 'border-base-300 hover:border-primary/50 hover:bg-base-200/50'
        }
      `}
      aria-label="ファイルをドラッグ＆ドロップまたはクリックして選択"
    >
      {isDragOver ? (
        <>
          <span className="icon-[mdi--cloud-upload] size-10 text-primary mb-2" aria-hidden="true" />
          <p className="text-sm text-primary font-medium">ファイルをドロップしてアップロード</p>
        </>
      ) : (
        <>
          <span className="icon-[mdi--cloud-upload-outline] size-10 text-base-content/40 mb-2" aria-hidden="true" />
          <p className="text-sm text-base-content/60">ここにファイルをドラッグ＆ドロップ</p>
          <p className="text-xs text-base-content/40 mt-1">またはクリックしてファイルを選択</p>
          <p className="text-xs text-base-content/40 mt-2">
            最大{formatMaxFileSize()} / {formatAllowedExtensions()}
          </p>
        </>
      )}

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptAttribute}
        onChange={handleFileChange}
        className="hidden"
        tabIndex={-1}
      />
    </div>
  );
}
