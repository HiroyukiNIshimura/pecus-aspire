/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType, mediaFileReader } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW } from "lexical";
import { useEffect } from "react";

import { INSERT_IMAGE_COMMAND } from "../ImagesPlugin";
import { useEditorContext } from "../../context/SettingsContext";

const ACCEPTABLE_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

/**
 * 画像ファイルをバックエンドにアップロードしてプロキシURLを取得（既存アイテム用）
 * @param file アップロードするファイル
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 * @returns アップロード結果（成功時はURL、失敗時はnull）
 */
async function uploadImageFile(
  file: File,
  workspaceId: number,
  itemId: number,
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `/api/workspaces/${workspaceId}/items/${itemId}/attachments`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (response.ok) {
      const result = await response.json();
      return result.url;
    } else {
      console.error("Failed to upload image:", await response.text());
      return null;
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

/**
 * 画像ファイルを一時領域にアップロード（新規アイテム作成用）
 * @param file アップロードするファイル
 * @param workspaceId ワークスペースID
 * @param sessionId セッションID
 * @returns アップロード結果（成功時は{tempFileId, previewUrl}、失敗時はnull）
 */
async function uploadTempImageFile(
  file: File,
  workspaceId: number,
  sessionId: string,
): Promise<{ tempFileId: string; previewUrl: string } | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `/api/workspaces/${workspaceId}/temp-attachments/${sessionId}`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (response.ok) {
      const result = await response.json();
      return {
        tempFileId: result.tempFileId,
        previewUrl: result.previewUrl,
      };
    } else {
      console.error("Failed to upload temp image:", await response.text());
      return null;
    }
  } catch (error) {
    console.error("Error uploading temp image:", error);
    return null;
  }
}

export default function DragDropPaste(): null {
  const [editor] = useLexicalComposerContext();
  const { workspaceId, itemId, sessionId, onTempFileUploaded } =
    useEditorContext();

  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(
            files,
            [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x),
          );

          for (const { file, result } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              // 既存アイテム編集時: workspaceId/itemId が設定されている場合
              if (workspaceId !== undefined && itemId !== undefined) {
                const uploadedUrl = await uploadImageFile(
                  file,
                  workspaceId,
                  itemId,
                );

                if (uploadedUrl) {
                  editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                    altText: file.name,
                    src: uploadedUrl,
                  });
                } else {
                  // アップロード失敗時はローカルプレビュー（フォールバック）
                  editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                    altText: file.name,
                    src: result,
                  });
                }
              }
              // 新規アイテム作成時: workspaceId/sessionId が設定されている場合
              else if (workspaceId !== undefined && sessionId !== undefined) {
                const uploadResult = await uploadTempImageFile(
                  file,
                  workspaceId,
                  sessionId,
                );

                if (uploadResult) {
                  // コールバックで一時ファイルIDを通知
                  onTempFileUploaded?.(
                    uploadResult.tempFileId,
                    uploadResult.previewUrl,
                  );

                  editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                    altText: file.name,
                    src: uploadResult.previewUrl,
                  });
                } else {
                  // アップロード失敗時はローカルプレビュー（フォールバック）
                  editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                    altText: file.name,
                    src: result,
                  });
                }
              }
              // workspaceId が未設定の場合はローカルプレビュー（既存動作）
              else {
                editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                  altText: file.name,
                  src: result,
                });
              }
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, workspaceId, itemId, sessionId, onTempFileUploaded]);

  return null;
}
