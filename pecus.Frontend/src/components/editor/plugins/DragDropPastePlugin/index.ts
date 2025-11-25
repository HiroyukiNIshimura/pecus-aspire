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
 * 画像ファイルをバックエンドにアップロードしてプロキシURLを取得
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

export default function DragDropPaste(): null {
  const [editor] = useLexicalComposerContext();
  const { workspaceId, itemId } = useEditorContext();

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
              // workspaceId/itemId が設定されている場合はアップロード
              if (workspaceId !== undefined && itemId !== undefined) {
                const uploadedUrl = await uploadImageFile(
                  file,
                  workspaceId,
                  itemId,
                );

                if (uploadedUrl) {
                  // アップロード成功時はプロキシURLを使用
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
              } else {
                // workspaceId/itemId が未設定の場合はローカルプレビュー（既存動作）
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
  }, [editor, workspaceId, itemId]);

  return null;
}
