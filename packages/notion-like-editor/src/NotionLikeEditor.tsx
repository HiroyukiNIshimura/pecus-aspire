/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
"use client";

import "./Editor.css";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import type { EditorState, LexicalEditor } from "lexical";
import { $getRoot, defineExtension } from "lexical";
import { useCallback, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import { INITIAL_SETTINGS } from "./appSettings";
import { buildHTMLConfig } from "./buildHTMLConfig";
import { FlashMessageContext } from "./context/FlashMessageContext";
import { SettingsContext } from "./context/SettingsContext";
import { SharedHistoryContext } from "./context/SharedHistoryContext";
import { ToolbarContext } from "./context/ToolbarContext";
import Editor from "./Editor";
import NotionLikeEditorNodes from "./nodes/NotionLikeEditorNodes";
import OnChangePlugin from "./plugins/OnChangePlugin";
import { TableContext } from "./plugins/TablePlugin";
import TypingPerfPlugin from "./plugins/TypingPerfPlugin";
import NotionLikeEditorTheme from "./themes/NotionLikeEditorTheme";
import type { ImageUploader } from "./types";
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
	 */
	initialEditorState?: string;

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
	 * 画像アップロード関数
	 *
	 * エディタ内で画像を挿入する際に呼び出されます。
	 * 実装側で適切なAPIエンドポイントにアップロードし、結果を返してください。
	 *
	 * @example
	 * ```typescript
	 * const imageUploader: ImageUploader = async (file) => {
	 *   const formData = new FormData();
	 *   formData.append('file', file);
	 *   const response = await fetch('/api/upload', { method: 'POST', body: formData });
	 *   const data = await response.json();
	 *   return { url: data.url, id: data.id };
	 * };
	 * ```
	 */
	imageUploader?: ImageUploader;
}

export default function NotionLikeEditor({
	showToolbar = true,
	autoFocus = true,
	measureTypingPerf = false,
	initialEditorState,
	onChange,
	onChangePlainText,
	onChangeHtml,
	onChangeMarkdown,
	debounceMs = 300,
	isCodeShiki = false,
	imageUploader,
}: NotionLikeEditorProps) {
	// Props から settings を構築
	const settings = useMemo(
		() => ({
			...INITIAL_SETTINGS,
			showToolbar,
			autoFocus,
			measureTypingPerf,
			isCodeShiki,
		}),
		[showToolbar, measureTypingPerf, autoFocus, isCodeShiki],
	);

	// エディタコンテキスト設定（画像アップロード用）
	const editorContext = useMemo(
		() => ({
			imageUploader,
		}),
		[imageUploader],
	);

	const app = useMemo(
		() =>
			defineExtension({
				$initialEditorState: initialEditorState,
				html: buildHTMLConfig(),
				name: "notion-like-editor/Editor",
				namespace: "NotionLikeEditor",
				nodes: NotionLikeEditorNodes,
				theme: NotionLikeEditorTheme,
				// dependencies: [
				// ],
			}),
		[initialEditorState],
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
		<div className="notion-like-editor">
			<FlashMessageContext>
				<SettingsContext initialSettings={settings} editorContext={editorContext}>
					<LexicalExtensionComposer extension={app} contentEditable={null}>
						<SharedHistoryContext>
							<TableContext>
								<ToolbarContext>
									<div className="editor-shell">
										<Editor />
									</div>
									{(onChange || onChangePlainText || onChangeHtml || onChangeMarkdown) && (
										<OnChangePlugin onChange={handleChange} />
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
