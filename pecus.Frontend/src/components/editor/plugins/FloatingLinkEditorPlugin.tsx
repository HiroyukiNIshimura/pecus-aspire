"use client";

import type { JSX } from "react";
import type { LexicalEditor } from "lexical";

import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  getDOMSelection,
  KEY_ESCAPE_COMMAND,
  LexicalCommand,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const OPEN_LINK_EDITOR_COMMAND: LexicalCommand<void> = createCommand(
  "OPEN_LINK_EDITOR_COMMAND",
);

function getSelectedNode(selection: any) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return focus.getNode();
  } else {
    return anchor.getNode();
  }
}

function positionEditorElement(
  editor: HTMLDivElement,
  rect: DOMRect | null,
): void {
  if (rect === null) {
    editor.style.opacity = "0";
    editor.style.top = "-1000px";
    editor.style.left = "-1000px";
  } else {
    editor.style.opacity = "1";
    editor.style.top = `${rect.top + rect.height + window.pageYOffset + 10}px`;
    editor.style.left = `${
      rect.left + window.pageXOffset - editor.offsetWidth / 2 + rect.width / 2
    }px`;
  }
}

interface LinkEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  initialUrl?: string;
  anchorElem?: HTMLElement;
}

function LinkEditorModal({
  isOpen,
  onClose,
  onSubmit,
  initialUrl = "",
  anchorElem = document.body,
}: LinkEditorModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  const handleSubmit = useCallback(() => {
    if (!url.trim()) {
      setError("URLを入力してください。");
      return;
    }

    // 簡易的なURL検証
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      onSubmit(urlObj.href);
      setUrl("");
      setError("");
      onClose();
    } catch {
      setError("有効なURLを入力してください。");
    }
  }, [url, onSubmit, onClose]);

  const handleClose = useCallback(() => {
    setUrl("");
    setError("");
    onClose();
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
      onClick={handleClose}
    >
      <div
        className="modal-box bg-base-100"
        style={{
          position: "relative",
          maxWidth: "500px",
          width: "90%",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">リンクを挿入</h3>

        <div className="form-control w-full mb-4">
          <label htmlFor="link-url" className="label">
            <span className="label-text">URL</span>
          </label>
          <input
            id="link-url"
            type="text"
            placeholder="https://example.com"
            className={`input input-bordered w-full ${error ? "input-error" : ""}`}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              } else if (e.key === "Escape") {
                handleClose();
              }
            }}
            autoFocus
          />
          {error && (
            <label className="label">
              <span className="label-text-alt text-error">{error}</span>
            </label>
          )}
        </div>

        <div className="text-sm opacity-70 mb-4">
          <p className="mb-1">例:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>https://example.com</li>
            <li>https://github.com/user/repo</li>
            <li>example.com (自動的に https:// が追加されます)</li>
          </ul>
        </div>

        <div className="modal-action mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleClose}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
          >
            挿入
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, anchorElem);
}

export default function FloatingLinkEditorPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [isModalOpen, setModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isLink, setIsLink] = useState(false);
  const [lastSelection, setLastSelection] = useState<any>(null);

  const handleInsertLink = useCallback(
    (url: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
        }
      });
    },
    [editor],
  );

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const linkParent = $findMatchingParent(node, $isLinkNode);

      if (linkParent) {
        setLinkUrl(linkParent.getURL());
        setIsLink(true);
      } else {
        setLinkUrl("");
        setIsLink(false);
      }
      setLastSelection(selection);
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkEditor();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        OPEN_LINK_EDITOR_COMMAND,
        () => {
          setModalOpen(true);
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor, updateLinkEditor]);

  return (
    <LinkEditorModal
      isOpen={isModalOpen}
      onClose={() => setModalOpen(false)}
      onSubmit={handleInsertLink}
      initialUrl={linkUrl}
      anchorElem={anchorElem}
    />
  );
}
