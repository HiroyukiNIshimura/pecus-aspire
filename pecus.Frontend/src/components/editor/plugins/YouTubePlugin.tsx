"use client";

import type { JSX } from "react";
import type { LexicalEditor } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from "lexical";
import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";

import { $createYouTubeNode, YouTubeNode } from "../nodes/YouTubeNode";

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<string> = createCommand(
  "INSERT_YOUTUBE_COMMAND",
);

export const OPEN_YOUTUBE_MODAL_COMMAND: LexicalCommand<void> = createCommand(
  "OPEN_YOUTUBE_MODAL_COMMAND",
);

export function openYouTubeModal(editor: LexicalEditor) {
  editor.dispatchCommand(OPEN_YOUTUBE_MODAL_COMMAND, undefined);
}

interface YouTubeEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (videoID: string) => void;
}

function YouTubeEmbedModal({
  isOpen,
  onClose,
  onSubmit,
}: YouTubeEmbedModalProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = useCallback(() => {
    if (!url.trim()) {
      setError("URLを入力してください。");
      return;
    }

    const match =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url);
    const id = match ? (match?.[2].length === 11 ? match[2] : null) : null;

    if (id) {
      onSubmit(id);
      setUrl("");
      setError("");
      onClose();
    } else {
      setError("有効なYouTube URLを入力してください。");
    }
  }, [url, onSubmit]);

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
        <h3 className="text-lg font-bold mb-4">YouTube動画を埋め込む</h3>

        <div className="form-control w-full mb-4">
          <label htmlFor="youtube-url" className="label">
            <span className="label-text">YouTube URL</span>
          </label>
          <input
            id="youtube-url"
            type="text"
            placeholder="https://www.youtube.com/watch?v=..."
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
          <p className="mb-1">対応形式:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>https://www.youtube.com/watch?v=VIDEO_ID</li>
            <li>https://youtu.be/VIDEO_ID</li>
            <li>https://www.youtube.com/embed/VIDEO_ID</li>
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
            埋め込む
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default function YouTubePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [isModalOpen, setModalOpen] = useState(false);

  const handleInsertYouTube = useCallback(
    (videoID: string) => {
      editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, videoID);
    },
    [editor],
  );

  useEffect(() => {
    if (!editor.hasNodes([YouTubeNode])) {
      throw new Error("YouTubePlugin: YouTubeNode not registered on editor");
    }

    return editor.registerCommand<string>(
      INSERT_YOUTUBE_COMMAND,
      (payload) => {
        const youTubeNode = $createYouTubeNode(payload);
        $insertNodeToNearestRoot(youTubeNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      OPEN_YOUTUBE_MODAL_COMMAND,
      () => {
        setModalOpen(true);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return (
    <YouTubeEmbedModal
      isOpen={isModalOpen}
      onClose={() => setModalOpen(false)}
      onSubmit={handleInsertYouTube}
    />
  );
}
