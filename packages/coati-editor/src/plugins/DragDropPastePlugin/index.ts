/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import { isMimeType, mediaFileReader } from '@lexical/utils';
import { COMMAND_PRIORITY_LOW } from 'lexical';
import { useEffect } from 'react';
import { useImageUpload } from '../../context/ImageUploadContext';
import { INSERT_IMAGE_COMMAND } from '../ImagesPlugin';

const ACCEPTABLE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export default function DragDropPaste(): null {
  const [editor] = useLexicalComposerContext();
  const imageUploadHandler = useImageUpload();

  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(files, [ACCEPTABLE_IMAGE_TYPES].flat());

          for (const { file, result } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              // アップロードハンドラーが設定されている場合
              if (imageUploadHandler) {
                try {
                  const uploadResult = await imageUploadHandler.uploadImage(file);
                  editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                    altText: file.name,
                    src: uploadResult.url,
                    width: uploadResult.width,
                    height: uploadResult.height,
                  });
                } catch (error) {
                  console.error('Image upload failed:', error);
                  // アップロード失敗時はローカルプレビュー（フォールバック）
                  editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                    altText: file.name,
                    src: result,
                  });
                }
              } else {
                // ハンドラー未設定の場合はローカルプレビュー（既存動作）
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
  }, [editor, imageUploadHandler]);

  return null;
}
