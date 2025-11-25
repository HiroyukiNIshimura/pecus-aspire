"use client";

import {
  type ImageUploader,
  NotionLikeEditor,
  type NotionLikeEditorProps,
} from "@pecus/notion-like-editor";
import { useCallback, useMemo } from "react";

/**
 * PecusEditor のプロパティ
 *
 * NotionLikeEditor のプロパティを継承し、pecus 固有の設定を追加しています。
 * 画像アップロードは `workspaceId` と `itemId` または `sessionId` を元に
 * 自動的に適切な API エンドポイントに送信されます。
 */
export interface PecusEditorProps
  extends Omit<NotionLikeEditorProps, "imageUploader"> {
  /**
   * ワークスペースID（画像アップロード用）
   */
  workspaceId: number;

  /**
   * アイテムID（既存アイテム編集時に指定）
   * itemId が指定されている場合、画像は添付ファイルとして直接アイテムに保存されます。
   */
  itemId?: number;

  /**
   * セッションID（新規アイテム作成時に指定）
   * sessionId が指定されている場合、画像は一時ファイルとして保存されます。
   */
  sessionId?: string;

  /**
   * 一時ファイルアップロード完了時のコールバック
   * 新規アイテム作成時に一時ファイルのIDを受け取るために使用します。
   */
  onTempFileUploaded?: (tempFileId: string, previewUrl: string) => void;
}

/**
 * pecus プロジェクト用のエディタコンポーネント
 *
 * @pecus/notion-like-editor を pecus 固有の画像アップロードロジックでラップしています。
 *
 * @example
 * ```tsx
 * // 既存アイテム編集時
 * <PecusEditor
 *   workspaceId={1}
 *   itemId={123}
 *   initialEditorState={item.body}
 *   onChange={handleChange}
 * />
 *
 * // 新規アイテム作成時
 * <PecusEditor
 *   workspaceId={1}
 *   sessionId="uuid-session-id"
 *   onTempFileUploaded={(tempFileId, previewUrl) => {
 *     // 一時ファイルIDを保存
 *   }}
 *   onChange={handleChange}
 * />
 * ```
 */
export function PecusEditor({
  workspaceId,
  itemId,
  sessionId,
  onTempFileUploaded,
  ...editorProps
}: PecusEditorProps) {
  /**
   * pecus 固有の画像アップロード関数
   */
  const imageUploader: ImageUploader = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      // 既存アイテム編集時: 添付ファイルAPI
      if (itemId !== undefined) {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/items/${itemId}/attachments`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            (errorData as { error?: string }).error ||
              "アップロードに失敗しました",
          );
        }

        const result = (await response.json()) as { url: string; id?: string };
        return { url: result.url, id: result.id };
      }

      // 新規アイテム作成時: 一時ファイルAPI
      if (sessionId !== undefined) {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/temp-attachments/${sessionId}`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            (errorData as { error?: string }).error ||
              "アップロードに失敗しました",
          );
        }

        const result = (await response.json()) as {
          tempFileId: string;
          previewUrl: string;
        };

        // コールバックで一時ファイルIDを通知
        onTempFileUploaded?.(result.tempFileId, result.previewUrl);

        return { url: result.previewUrl, id: result.tempFileId };
      }

      // itemId も sessionId もない場合はエラー
      throw new Error(
        "画像アップロードには itemId または sessionId が必要です",
      );
    },
    [workspaceId, itemId, sessionId, onTempFileUploaded],
  );

  // imageUploader を使用可能かどうか
  const hasUploadCapability = useMemo(
    () => itemId !== undefined || sessionId !== undefined,
    [itemId, sessionId],
  );

  return (
    <NotionLikeEditor
      {...editorProps}
      imageUploader={hasUploadCapability ? imageUploader : undefined}
    />
  );
}

export default PecusEditor;
