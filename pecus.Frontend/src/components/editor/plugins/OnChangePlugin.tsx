"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { EditorState } from "lexical";
import { useEffect } from "react";

interface OnChangePluginProps {
  onChange: (editorState: EditorState) => void;
}

/**
 * エディタ状態変更監視プラグイン
 * エディタの内容が変更されたときにコールバックを実行
 */
export function OnChangePlugin({ onChange }: OnChangePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      onChange(editorState);
    });
  }, [editor, onChange]);

  return null;
}
