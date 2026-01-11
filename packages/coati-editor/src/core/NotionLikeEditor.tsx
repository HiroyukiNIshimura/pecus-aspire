/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use client';

import './Editor.css';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import type { EditorState, LexicalEditor } from 'lexical';
import { $getRoot, defineExtension } from 'lexical';
import { useCallback, useEffect, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { AutoLinkProvider, type LinkMatcher } from '../context/AutoLinkContext';
import { ComponentPickerProvider, type ExtraOptionsProvider } from '../context/ComponentPickerContext';
import { FlashMessageContext } from '../context/FlashMessageContext';
import { FullscreenProvider, useFullscreen } from '../context/FullscreenContext';
import { type ImageUploadHandler, ImageUploadProvider } from '../context/ImageUploadContext';
import { SettingsContext } from '../context/SettingsContext';
import { SharedHistoryContext } from '../context/SharedHistoryContext';
import { ToolbarContext } from '../context/ToolbarContext';
import NotionLikeEditorNodes from '../nodes/NotionLikeEditorNodes';
import InsertMarkdownPlugin from '../plugins/InsertMarkdownPlugin';
import { PLAYGROUND_TRANSFORMERS } from '../plugins/MarkdownTransformers';
import OnChangePlugin from '../plugins/OnChangePlugin';
import { TableContext } from '../plugins/TablePlugin';
import TypingPerfPlugin from '../plugins/TypingPerfPlugin';
import NotionLikeEditorTheme from '../themes/NotionLikeEditorTheme';
import { INITIAL_SETTINGS } from './appSettings';
import { buildHTMLConfig } from './buildHTMLConfig';
import Editor from './Editor';

export interface NotionLikeEditorProps {
  /**
   * ツールバーの表示
   * @default true
   */
  showToolbar?: boolean;

  /**
   * タイピング性能測定（開発/デバッグ用）
   * @default false
   */
  measureTypingPerf?: boolean;

  /**
   * エディタの初期値（EditorState JSON文字列）
   * initialMarkdownと同時に指定した場合、initialEditorStateが優先される
   */
  initialEditorState?: string;

  /**
   * エディタの初期値（Markdown文字列）
   * initialEditorStateと同時に指定した場合、initialEditorStateが優先される
   */
  initialMarkdown?: string;

  /**
   * エディタ内容変更時のコールバック（EditorState JSON）
   * @param editorState - シリアライズされたEditorState（JSON文字列）
   */
  onChange?: (editorState: string) => void;

  /**
   * プレーンテキスト変更時のコールバック
   * @param plainText - フォーマット情報を除いた純粋なテキスト
   */
  onChangePlainText?: (plainText: string) => void;

  /**
   * HTML変更時のコールバック
   * @param html - HTML形式のコンテンツ
   */
  onChangeHtml?: (html: string) => void;

  /**
   * Markdown変更時のコールバック
   * @param markdown - Markdown形式のコンテンツ
   */
  onChangeMarkdown?: (markdown: string) => void;

  /**
   * 各コールバックのデバウンス時間（ミリ秒）
   * @default 300
   */
  debounceMs?: number;

  /**
   * 自動フォーカス
   */
  autoFocus?: boolean;

  /**
   * Shikiによるコードハイライトを有効化するかどうか
   */
  isCodeShiki?: boolean;

  /**
   * Shikiコードハイライトのテーマ
   * @default 'github-light'
   */
  codeShikiTheme?: string;

  /**
   * 画像アップロードハンドラー
   * 指定しない場合はローカルプレビューモードで動作（アップロードなし）
   */
  imageUploadHandler?: ImageUploadHandler;

  /**
   * カスタムのAutoLink Matcher配列
   * URLやメールアドレスの基本Matcherに追加される
   */
  customLinkMatchers?: LinkMatcher[];

  /**
   * エディタの準備完了時のコールバック
   * editor instanceを使用して外部からエディタを操作できる
   * @param editor - LexicalEditor インスタンス
   */
  onEditorReady?: (editor: LexicalEditor) => void;

  /**
   * 追加のプラグイン（ReactNode配列）
   * LexicalComposer内部でレンダリングされる
   * 利用者側でカスタムプラグインを追加するために使用
   */
  extraPlugins?: React.ReactNode;

  /**
   * ComponentPickerPlugin（/メニュー）に追加オプションを提供する関数
   * AIアシスタントなどのカスタム機能を追加するために使用
   */
  extraComponentPickerOptions?: ExtraOptionsProvider;
}

export default function NotionLikeEditor({
  showToolbar = true,
  autoFocus = true,
  measureTypingPerf = false,
  initialEditorState,
  initialMarkdown,
  onChange,
  onChangePlainText,
  onChangeHtml,
  onChangeMarkdown,
  debounceMs = 300,
  isCodeShiki = true,
  codeShikiTheme = 'github-light',
  imageUploadHandler,
  customLinkMatchers,
  onEditorReady,
  extraPlugins,
  extraComponentPickerOptions,
}: NotionLikeEditorProps) {
  // Props から settings を構築
  const settings = useMemo(
    () => ({
      ...INITIAL_SETTINGS,
      showToolbar,
      autoFocus,
      measureTypingPerf,
      isCodeShiki,
      codeShikiTheme,
    }),
    [showToolbar, measureTypingPerf, autoFocus, isCodeShiki, codeShikiTheme],
  );

  const app = useMemo(
    () =>
      defineExtension({
        $initialEditorState: initialEditorState
          ? initialEditorState
          : initialMarkdown
            ? () => {
                $convertFromMarkdownString(initialMarkdown, PLAYGROUND_TRANSFORMERS);
              }
            : undefined,
        html: buildHTMLConfig(),
        name: 'pecus/NotionLikeEditor',
        namespace: 'NotionLikeEditor',
        nodes: NotionLikeEditorNodes,
        theme: NotionLikeEditorTheme,
      }),
    [initialEditorState, initialMarkdown],
  );

  const debouncedOnChange = useDebouncedCallback((editorState: EditorState) => {
    if (onChange) {
      const json = JSON.stringify(editorState.toJSON());
      onChange(json);
    }
  }, debounceMs);

  const debouncedOnChangePlainText = useDebouncedCallback((editorState: EditorState) => {
    if (onChangePlainText) {
      editorState.read(() => {
        const root = $getRoot();
        const plainText = root.getTextContent();
        onChangePlainText(plainText);
      });
    }
  }, debounceMs);

  const debouncedOnChangeHtml = useDebouncedCallback((editorState: EditorState, editor: LexicalEditor) => {
    if (onChangeHtml) {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor);
        onChangeHtml(html);
      });
    }
  }, debounceMs);

  const debouncedOnChangeMarkdown = useDebouncedCallback((editorState: EditorState) => {
    if (onChangeMarkdown) {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        onChangeMarkdown(markdown);
      });
    }
  }, debounceMs);

  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      debouncedOnChange(editorState);
      debouncedOnChangePlainText(editorState);
      debouncedOnChangeHtml(editorState, editor);
      debouncedOnChangeMarkdown(editorState);
    },
    [debouncedOnChange, debouncedOnChangePlainText, debouncedOnChangeHtml, debouncedOnChangeMarkdown],
  );

  return (
    <FullscreenProvider>
      <EditorContainer
        settings={settings}
        imageUploadHandler={imageUploadHandler}
        customLinkMatchers={customLinkMatchers}
        app={app}
        onChange={onChange}
        onChangePlainText={onChangePlainText}
        onChangeHtml={onChangeHtml}
        onChangeMarkdown={onChangeMarkdown}
        handleChange={handleChange}
        measureTypingPerf={measureTypingPerf}
        onEditorReady={onEditorReady}
        extraPlugins={extraPlugins}
        extraComponentPickerOptions={extraComponentPickerOptions}
      />
    </FullscreenProvider>
  );
}

/**
 * 全画面モード対応のエディタコンテナ
 * useFullscreenを使用するため、FullscreenProvider内で呼び出す必要がある
 */
function EditorContainer({
  settings,
  imageUploadHandler,
  customLinkMatchers,
  app,
  onChange,
  onChangePlainText,
  onChangeHtml,
  onChangeMarkdown,
  handleChange,
  measureTypingPerf,
  onEditorReady,
  extraPlugins,
  extraComponentPickerOptions,
}: {
  settings: ReturnType<
    typeof useMemo<
      typeof INITIAL_SETTINGS & {
        showToolbar: boolean;
        autoFocus: boolean;
        measureTypingPerf: boolean;
        isCodeShiki: boolean;
      }
    >
  >;
  imageUploadHandler?: ImageUploadHandler;
  customLinkMatchers?: LinkMatcher[];
  app: ReturnType<typeof defineExtension>;
  onChange?: (editorState: string) => void;
  onChangePlainText?: (plainText: string) => void;
  onChangeHtml?: (html: string) => void;
  onChangeMarkdown?: (markdown: string) => void;
  handleChange: (editorState: EditorState, editor: LexicalEditor) => void;
  measureTypingPerf: boolean;
  onEditorReady?: (editor: LexicalEditor) => void;
  extraPlugins?: React.ReactNode;
  extraComponentPickerOptions?: ExtraOptionsProvider;
}) {
  const { isFullscreen } = useFullscreen();

  return (
    <div className={`notion-like-editor ${isFullscreen ? 'fixed inset-0 z-9999 bg-base-100 flex flex-col' : ''}`}>
      <FlashMessageContext>
        <SettingsContext initialSettings={settings}>
          <ImageUploadProvider handler={imageUploadHandler ?? null}>
            <AutoLinkProvider customMatchers={customLinkMatchers}>
              <LexicalExtensionComposer extension={app} contentEditable={null}>
                <ComponentPickerProvider extraOptions={extraComponentPickerOptions}>
                  <SharedHistoryContext>
                    <TableContext>
                      <ToolbarContext>
                        <div className={`editor-shell ${isFullscreen ? 'flex-1 flex flex-col overflow-hidden' : ''}`}>
                          <Editor isFullscreen={isFullscreen} />
                        </div>
                        {(onChange || onChangePlainText || onChangeHtml || onChangeMarkdown) && (
                          <OnChangePlugin onChange={handleChange} />
                        )}
                        {measureTypingPerf && <TypingPerfPlugin />}
                        <InsertMarkdownPlugin />
                        {onEditorReady && <EditorReadyPlugin onReady={onEditorReady} />}
                        {extraPlugins}
                      </ToolbarContext>
                    </TableContext>
                  </SharedHistoryContext>
                </ComponentPickerProvider>
              </LexicalExtensionComposer>
            </AutoLinkProvider>
          </ImageUploadProvider>
        </SettingsContext>
      </FlashMessageContext>
    </div>
  );
}

/**
 * エディタの準備完了を通知するプラグイン
 */
function EditorReadyPlugin({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    onReady(editor);
  }, [editor, onReady]);

  return null;
}
