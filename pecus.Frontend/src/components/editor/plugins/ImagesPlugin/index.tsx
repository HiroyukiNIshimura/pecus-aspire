/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $isAutoLinkNode, $isLinkNode, type LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent, $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  getDOMSelectionFromTarget,
  isHTMLElement,
  type LexicalCommand,
  type LexicalEditor,
} from 'lexical';
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useEditorContext } from '../../context/SettingsContext';
import { $createImageNode, $isImageNode, ImageNode, type ImagePayload } from '../../nodes/ImageNode';
import Button from '../../ui/Button';
import { DialogActions, DialogButtonsList } from '../../ui/Dialog';
import FileInput from '../../ui/FileInput';
import TextInput from '../../ui/TextInput';

export type InsertImagePayload = Readonly<ImagePayload>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand('INSERT_IMAGE_COMMAND');

export function InsertImageUriDialogBody({ onClick }: { onClick: (payload: InsertImagePayload) => void }) {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');

  const isDisabled = src === '';

  return (
    <>
      <TextInput
        label="Image URL"
        placeholder="i.e. https://source.unsplash.com/random"
        onChange={setSrc}
        value={src}
        data-test-id="image-modal-url-input"
      />
      <TextInput
        label="Alt Text"
        placeholder="Random unsplash image"
        onChange={setAltText}
        value={altText}
        data-test-id="image-modal-alt-text-input"
      />
      <DialogActions>
        <Button data-test-id="image-modal-confirm-btn" disabled={isDisabled} onClick={() => onClick({ altText, src })}>
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertImageUploadedDialogBody({ onClick }: { onClick: (payload: InsertImagePayload) => void }) {
  const { workspaceId, itemId, sessionId, onTempFileUploaded } = useEditorContext();
  const [altText, setAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string>('');

  const isDisabled = !selectedFile || isUploading;
  // 既存アイテム編集時
  const canUploadToItem = workspaceId !== undefined && itemId !== undefined;
  // 新規アイテム作成時（一時アップロード）
  const canUploadToTemp = workspaceId !== undefined && sessionId !== undefined;
  const canUpload = canUploadToItem || canUploadToTemp;

  const handleFileSelect = (files: FileList | null) => {
    if (files?.[0]) {
      setSelectedFile(files[0]);
      setUploadError(null);

      // ローカルプレビュー用のデータURL生成
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPreviewSrc(reader.result);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleConfirm = async () => {
    if (!selectedFile) return;

    // workspaceId が未設定の場合はローカルプレビュー（既存動作）
    if (!canUpload) {
      if (previewSrc) {
        onClick({ altText, src: previewSrc });
      }
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // 既存アイテム編集時: 通常のアップロード
      if (canUploadToItem) {
        const response = await fetch(`/api/workspaces/${workspaceId}/items/${itemId}/attachments`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Upload result:', result);
          onClick({ altText, src: result.url });
        } else {
          const errorData = await response.json().catch(() => ({}));
          setUploadError(errorData.error || 'アップロードに失敗しました');
        }
      }
      // 新規アイテム作成時: 一時領域にアップロード
      else if (canUploadToTemp) {
        const response = await fetch(`/api/workspaces/${workspaceId}/temp-attachments/${sessionId}`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Temp upload result:', result);
          // コールバックで一時ファイルIDを通知
          onTempFileUploaded?.(result.tempFileId, result.previewUrl);
          onClick({ altText, src: result.previewUrl });
        } else {
          const errorData = await response.json().catch(() => ({}));
          setUploadError(errorData.error || 'アップロードに失敗しました');
        }
      }
    } catch {
      setUploadError('アップロード中にエラーが発生しました');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <FileInput
        label="Image Upload"
        onChange={handleFileSelect}
        accept="image/*"
        data-test-id="image-modal-file-upload"
      />
      <TextInput
        label="Alt Text"
        placeholder="Descriptive alternative text"
        onChange={setAltText}
        value={altText}
        data-test-id="image-modal-alt-text-input"
      />
      {uploadError && <div className="text-error text-sm mt-2">{uploadError}</div>}
      {!canUpload && selectedFile && (
        <div className="text-warning text-sm mt-2">
          ワークスペース情報が未設定のため、ローカルプレビューモードで動作します
        </div>
      )}
      <DialogActions>
        <Button data-test-id="image-modal-file-upload-btn" disabled={isDisabled} onClick={handleConfirm}>
          {isUploading ? 'アップロード中...' : 'Confirm'}
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertImageDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [mode, setMode] = useState<null | 'url' | 'file'>(null);
  const hasModifier = useRef(false);

  useEffect(() => {
    hasModifier.current = false;
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey;
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, []);

  const onClick = (payload: InsertImagePayload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    onClose();
  };

  return (
    <>
      {!mode && (
        <DialogButtonsList>
          <Button data-test-id="image-modal-option-url" onClick={() => setMode('url')}>
            URL
          </Button>
          <Button data-test-id="image-modal-option-file" onClick={() => setMode('file')}>
            File
          </Button>
        </DialogButtonsList>
      )}
      {mode === 'url' && <InsertImageUriDialogBody onClick={onClick} />}
      {mode === 'file' && <InsertImageUploadedDialogBody onClick={onClick} />}
    </>
  );
}

export default function ImagesPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagesPlugin: ImageNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload);
          $insertNodes([imageNode]);
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return $onDragStart(event);
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return $onDragover(event);
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return $onDrop(event, editor);
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor]);

  return null;
}

const TRANSPARENT_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
let img: HTMLImageElement | undefined;

function getTransparentImage(): HTMLImageElement {
  if (typeof window === 'undefined') {
    throw new Error('Cannot create image on server side');
  }
  if (!img) {
    img = window.document.createElement('img');
    img.src = TRANSPARENT_IMAGE;
  }
  return img;
}

function $onDragStart(event: DragEvent): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  dataTransfer.setData('text/plain', '_');
  dataTransfer.setDragImage(getTransparentImage(), 0, 0);
  dataTransfer.setData(
    'application/x-lexical-drag',
    JSON.stringify({
      data: {
        altText: node.__altText,
        caption: node.__caption,
        height: node.__height,
        key: node.getKey(),
        maxWidth: node.__maxWidth,
        showCaption: node.__showCaption,
        src: node.__src,
        width: node.__width,
      },
      type: 'image',
    }),
  );

  return true;
}

function $onDragover(event: DragEvent): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropImage(event)) {
    event.preventDefault();
  }
  return true;
}

function $onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragImageData(event);
  if (!data) {
    return false;
  }
  const existingLink = $findMatchingParent(
    node,
    (parent): parent is LinkNode => !$isAutoLinkNode(parent) && $isLinkNode(parent),
  );
  event.preventDefault();
  if (canDropImage(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
    if (existingLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, existingLink.getURL());
    }
  }
  return true;
}

function $getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isImageNode(node) ? node : null;
}

function getDragImageData(event: DragEvent): null | InsertImagePayload {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
  if (!dragData) {
    return null;
  }
  const { type, data } = JSON.parse(dragData);
  if (type !== 'image') {
    return null;
  }

  return data;
}

declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}

function canDropImage(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    isHTMLElement(target) &&
    !target.closest('code, span.editor-image') &&
    isHTMLElement(target.parentElement) &&
    target.parentElement.closest('div.ContentEditable__root')
  );
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range: Range | null | undefined;
  const domSelection = getDOMSelectionFromTarget(event.target);

  // 新しい標準API（Safari未対応の場合あり）
  if (document.caretPositionFromPoint) {
    const caretPosition = document.caretPositionFromPoint(event.clientX, event.clientY);
    if (caretPosition) {
      range = document.createRange();
      range.setStart(caretPosition.offsetNode, caretPosition.offset);
      range.collapse(true);
    }
  }
  // フォールバック: 非推奨だが互換性のため残す
  else if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY);
  }
  // Firefox等の古いフォールバック
  else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
    range = domSelection.getRangeAt(0);
  } else {
    throw Error(`Cannot get the selection when dragging`);
  }

  return range;
}
