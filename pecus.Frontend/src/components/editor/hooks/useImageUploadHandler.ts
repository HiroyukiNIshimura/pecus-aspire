'use client';

import type { ImageUploadHandler, ImageUploadResult } from '@coati/editor';
import { useCallback, useMemo } from 'react';

/**
 * エディター画像の一時添付アップロード用オプション
 */
export interface TempAttachmentUploadOptions {
  /** ワークスペースID */
  workspaceId: number;
  /** セッションID */
  sessionId: string;
  /** 一時ファイルアップロード完了時のコールバック */
  onTempFileUploaded?: (tempFileId: string, previewUrl: string) => void;
}

/**
 * エディター画像を一時添付としてアップロードするフック
 *
 * @example
 * ```tsx
 * const [tempFileIds, setTempFileIds] = useState<string[]>([]);
 *
 * const imageUploadHandler = useTempAttachmentImageUploadHandler({
 *   workspaceId,
 *   sessionId,
 *   onTempFileUploaded: (tempFileId) => {
 *     setTempFileIds(prev => [...prev, tempFileId]);
 *   },
 * });
 *
 * <NotionLikeEditor imageUploadHandler={imageUploadHandler} />
 * ```
 */
export function useTempAttachmentImageUploadHandler(options: TempAttachmentUploadOptions): ImageUploadHandler {
  const { workspaceId, sessionId, onTempFileUploaded } = options;

  const uploadImage = useCallback(
    async (file: File): Promise<ImageUploadResult> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/workspaces/${workspaceId}/temp-attachments/${sessionId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '画像の一時アップロードに失敗しました');
      }

      const result = await response.json();

      // コールバックを呼び出し
      onTempFileUploaded?.(result.tempFileId, result.previewUrl);

      return {
        url: result.previewUrl,
      };
    },
    [workspaceId, sessionId, onTempFileUploaded],
  );

  return useMemo(() => ({ uploadImage }), [uploadImage]);
}

// 型の再エクスポート
export type { ImageUploadHandler, ImageUploadResult } from '@coati/editor';
