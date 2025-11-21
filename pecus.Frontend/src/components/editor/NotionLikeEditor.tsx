/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
"use client";

import "./Editor.css";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import type { EditorState, LexicalEditor } from "lexical";
import { defineExtension } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useMemo } from "react";

import { buildHTMLConfig } from "./buildHTMLConfig";
import { SettingsContext } from "./context/SettingsContext";
import { SharedHistoryContext } from "./context/SharedHistoryContext";
import { ToolbarContext } from "./context/ToolbarContext";
import Editor from "./Editor";
import NotionLikeEditorNodes from "./nodes/NotionLikeEditorNodes";
import OnChangePlugin from "./plugins/OnChangePlugin";
import { TableContext } from "./plugins/TablePlugin";
import TypingPerfPlugin from "./plugins/TypingPerfPlugin";
import NotionLikeEditorTheme from "./themes/NotionLikeEditorTheme";
import { FlashMessageContext } from "./context/FlashMessageContext";
import { INITIAL_SETTINGS } from "./appSettings";
import { useEffect } from "react";
import { $getRoot } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";

function ReadonlyPlugin({ readonly }: { readonly: boolean }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.setEditable(!readonly);
  }, [editor, readonly]);

  return null;
}

/**
 * エディタ内容の変更データ
 */
export interface EditorChangeData {
  /**
   * エディタの完全な状態（JSON文字列）
   */
  editorState: string;

  /**
   * プレーンテキストのみ（フォーマット情報なし）
   */
  plainText: string;

  /**
   * HTML形式のコンテンツ
   */
  html: string;

  /**
   * Markdown形式のコンテンツ
   */
  markdown: string;
}

export interface NotionLikeEditorProps {
  /**
   * 読み取り専用モード
   * @default false
   */
  readonly?: boolean;

  /**
   * ツールバーの表示
   * @default true
   */
  showToolbar?: boolean;

  /**
   * リッチテキストモード
   * @default true
   */
  isRichText?: boolean;

  /**
   * タイピング性能測定（開発/デバッグ用）
   * @default false
   */
  measureTypingPerf?: boolean;

  /**
   * エディタの初期値（EditorState JSON文字列）
   */
  initialEditorState?: string;

  /**
   * エディタ内容変更時のコールバック
   * @param editorState - シリアライズされたEditorState（JSON文字列）
   */
  onChange?: (editorState: string) => void;

  /**
   * エディタ内容変更時のコールバック（拡張版）
   * プレーンテキスト、HTML、Markdownも含む詳細データを受け取る
   * @param data - エディタの変更データ
   */
  onChangeExtended?: (data: EditorChangeData) => void;
}

export default function NotionLikeEditor({
  readonly = false,
  showToolbar = true,
  isRichText = true,
  measureTypingPerf = false,
  initialEditorState,
  onChange,
  onChangeExtended,
}: NotionLikeEditorProps) {
  // Props から settings を構築
  const settings = useMemo(
    () => ({
      ...INITIAL_SETTINGS,
      showToolbar,
      isRichText,
      measureTypingPerf,
    }),
    [showToolbar, isRichText, measureTypingPerf]
  );

  const app = useMemo(
    () =>
      defineExtension({
        $initialEditorState: initialEditorState,
        html: buildHTMLConfig(),
        name: "pecus/NotionLikeEditor",
        namespace: "NotionLikeEditor",
        nodes: NotionLikeEditorNodes,
        theme: NotionLikeEditorTheme,
      }),
    [initialEditorState]
  );

  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      if (onChange) {
        const json = JSON.stringify(editorState.toJSON());
        onChange(json);
      }
    },
    [onChange]
  );

  const handleChangeExtended = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      if (onChangeExtended) {
        editorState.read(() => {
          const root = $getRoot();
          const plainText = root.getTextContent();
          const html = $generateHtmlFromNodes(editor);
          const markdown = $convertToMarkdownString(TRANSFORMERS);

          const data: EditorChangeData = {
            editorState: JSON.stringify(editorState.toJSON()),
            plainText,
            html,
            markdown,
          };

          onChangeExtended(data);
        });
      }
    },
    [onChangeExtended]
  );

  return (
    <div className="notion-like-editor">
      <FlashMessageContext>
        <SettingsContext initialSettings={settings}>
          <LexicalExtensionComposer
            extension={app}
            contentEditable={null}
          >
            <SharedHistoryContext>
              <TableContext>
                <ToolbarContext>
                  <div className="editor-shell">
                    <Editor />
                  </div>
                  <ReadonlyPlugin readonly={readonly} />
                  {onChange && <OnChangePlugin onChange={handleChange} />}
                  {onChangeExtended && (
                    <OnChangePlugin onChange={handleChangeExtended} />
                  )}
                  {measureTypingPerf && <TypingPerfPlugin />}
                </ToolbarContext>
              </TableContext>
            </SharedHistoryContext>
          </LexicalExtensionComposer>
        </SettingsContext>
      </FlashMessageContext>
    </div>
  );
}
