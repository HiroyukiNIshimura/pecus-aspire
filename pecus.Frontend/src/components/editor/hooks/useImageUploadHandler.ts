'use client';

import { useCallback, useMemo } from 'react';
import type { ImageUploadHandler, ImageUploadResult } from '../context/ImageUploadContext';

/**
 * 既存アイテム編集用のアップロードハンドラー作成オプション
 */
export interface ExistingItemUploadOptions {
  /** ワークスペースID */
  workspaceId: number;
  /** アイテムID */
  itemId: number;
}

/**
 * 新規アイテム作成用のアップロードハンドラー作成オプション
 */
export interface NewItemUploadOptions {
  /** ワークスペースID */
  workspaceId: number;
  /** セッションID */
  sessionId: string;
  /** 一時ファイルアップロード完了時のコールバック */
  onTempFileUploaded?: (tempFileId: string, previewUrl: string) => void;
}

/**
 * 既存アイテム編集用の画像アップロードハンドラーを作成するフック
 *
 * @example
 * ```tsx
 * const imageUploadHandler = useExistingItemImageUploadHandler({
 *   workspaceId: item.workspaceId,
 *   itemId: item.id,
 * });
 *
 * <NotionLikeEditor imageUploadHandler={imageUploadHandler} />
 * ```
 */
export function useExistingItemImageUploadHandler(options: ExistingItemUploadOptions): ImageUploadHandler {
  const { workspaceId, itemId } = options;

  const uploadImage = useCallback(
    async (file: File): Promise<ImageUploadResult> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/workspaces/${workspaceId}/items/${itemId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '画像のアップロードに失敗しました');
      }

      const result = await response.json();
      return {
        url: result.url,
        width: result.width,
        height: result.height,
      };
    },
    [workspaceId, itemId],
  );

  return useMemo(() => ({ uploadImage }), [uploadImage]);
}

/**
 * 新規アイテム作成用の画像アップロードハンドラーを作成するフック
 *
 * @example
 * ```tsx
 * const [tempFileIds, setTempFileIds] = useState<string[]>([]);
 *
 * const imageUploadHandler = useNewItemImageUploadHandler({
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
export function useNewItemImageUploadHandler(options: NewItemUploadOptions): ImageUploadHandler {
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

// 型のエクスポート
export type { ImageUploadHandler, ImageUploadResult } from '../context/ImageUploadContext';
