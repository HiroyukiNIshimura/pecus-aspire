"use client";

import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { YouTubeNode } from "./nodes/YouTubeNode";
import type { EditorState } from "lexical";
import { useCallback, useState } from "react";
import styles from "./PecusEditor.module.css";
import { OnChangePlugin } from "./plugins/OnChangePlugin";
import ComponentPickerMenuPlugin from "./plugins/SlashCommandPlugin";
import DraggableBlockPlugin from "./plugins/DraggableBlockPlugin";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingTextFormatToolbarPlugin";
import YouTubePlugin from "./plugins/YouTubePlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import CodeActionMenuPlugin from "./plugins/CodeActionMenuPlugin";

interface PecusEditorProps {
  /**
   * 初期コンテンツ（JSON文字列）
   */
  initialContent?: string;
  /**
   * プレースホルダーテキスト
   */
  placeholder?: string;
  /**
   * エディタ状態変更時のコールバック
   */
  onChange?: (content: string) => void;
  /**
   * 読み取り専用モード
   */
  readOnly?: boolean;
  /**
   * カスタムクラス名
   */
  className?: string;
}

/**
 * エディタテーマ設定
 * CSS Modulesのクラス名を使用
 */
const editorTheme = {
  paragraph: styles.editorParagraph,
  quote: styles.editorQuote,
  heading: {
    h1: styles.editorHeadingH1,
    h2: styles.editorHeadingH2,
    h3: styles.editorHeadingH3,
    h4: styles.editorHeadingH4,
    h5: styles.editorHeadingH5,
    h6: styles.editorHeadingH6,
  },
  list: {
    nested: {
      listitem: styles.editorNestedListitem,
    },
    ol: styles.editorListOl,
    ul: styles.editorListUl,
    listitem: styles.editorListitem,
    listitemChecked: styles.editorListitemChecked,
    listitemUnchecked: styles.editorListitemUnchecked,
  },
  hashtag: styles.editorHashtag,
  image: styles.editorImage,
  link: styles.editorLink,
  text: {
    bold: styles.editorTextBold,
    code: styles.editorTextCode,
    italic: styles.editorTextItalic,
    strikethrough: styles.editorTextStrikethrough,
    subscript: styles.editorTextSubscript,
    superscript: styles.editorTextSuperscript,
    underline: styles.editorTextUnderline,
    underlineStrikethrough: styles.editorTextUnderlineStrikethrough,
  },
  code: styles.editorCode,
  codeHighlight: {
    atrule: styles.editorTokenAttr,
    attr: styles.editorTokenAttr,
    boolean: styles.editorTokenProperty,
    builtin: styles.editorTokenSelector,
    cdata: styles.editorTokenComment,
    char: styles.editorTokenSelector,
    class: styles.editorTokenFunction,
    "class-name": styles.editorTokenFunction,
    comment: styles.editorTokenComment,
    constant: styles.editorTokenProperty,
    deleted: styles.editorTokenProperty,
    doctype: styles.editorTokenComment,
    entity: styles.editorTokenOperator,
    function: styles.editorTokenFunction,
    important: styles.editorTokenVariable,
    inserted: styles.editorTokenSelector,
    keyword: styles.editorTokenAttr,
    namespace: styles.editorTokenVariable,
    number: styles.editorTokenProperty,
    operator: styles.editorTokenOperator,
    prolog: styles.editorTokenComment,
    property: styles.editorTokenProperty,
    punctuation: styles.editorTokenPunctuation,
    regex: styles.editorTokenVariable,
    selector: styles.editorTokenSelector,
    string: styles.editorTokenSelector,
    symbol: styles.editorTokenProperty,
    tag: styles.editorTokenProperty,
    url: styles.editorTokenOperator,
    variable: styles.editorTokenVariable,
  },
  embedBlock: {
    base: styles.embedBlock,
    focus: styles.embedBlockFocus,
  },
};

/**
 * Pecus Editor - Notion風のリッチテキストエディタ
 *
 * Lexical を使用した高機能なエディタコンポーネント
 *
 * @example
 * ```tsx
 * <PecusEditor
 *   placeholder="ここに入力してください..."
 *   onChange={(content) => console.log(content)}
 * />
 * ```
 */
export function PecusEditor({
  initialContent,
  placeholder = "ここに入力してください...",
  onChange,
  readOnly = false,
  className = "",
}: PecusEditorProps) {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  // エディタエラーハンドラー
  const onError = useCallback((error: Error) => {
    console.error("Lexical Editor Error:", error);
  }, []);

  // エディタ状態変更ハンドラー
  const handleChange = useCallback(
    (editorState: EditorState) => {
      if (onChange) {
        // EditorStateをJSON文字列にシリアライズ
        const json = editorState.toJSON();
        const content = JSON.stringify(json);
        onChange(content);
      }
    },
    [onChange],
  );

  // エディタ初期設定
  const initialConfig = {
    namespace: "PecusEditor",
    theme: editorTheme,
    onError,
    editable: !readOnly,
    editorState:
      initialContent && initialContent.trim() ? initialContent : undefined,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
      YouTubeNode,
    ],
  };

  return (
    <div className={`${styles.editorContainer} ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className={styles.editorWrapper} ref={onRef}>
          {/* エディタ本体 */}
          <RichTextPlugin
            contentEditable={<ContentEditable className={styles.editor} />}
            placeholder={
              <div className={styles.placeholder}>{placeholder}</div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />

          {/* プラグイン */}
          <HistoryPlugin />
          <ListPlugin />
          <CheckListPlugin />
          <LinkPlugin />
          <CodeHighlightPlugin />
          <YouTubePlugin />
          <ComponentPickerMenuPlugin />
          {!readOnly && <AutoFocusPlugin />}
          {onChange && <OnChangePlugin onChange={handleChange} />}
          {floatingAnchorElem && !readOnly && (
            <>
              <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
              <FloatingTextFormatToolbarPlugin
                anchorElem={floatingAnchorElem}
              />
              <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
            </>
          )}
        </div>
      </LexicalComposer>
    </div>
  );
}

export default PecusEditor;
