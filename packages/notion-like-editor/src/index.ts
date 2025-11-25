/**
 * @pecus/notion-like-editor
 *
 * Notion風リッチテキストエディター (Lexical ベース)
 */

export type {
	EditorContextSettings,
	SettingName,
	Settings,
} from "./appSettings";
// 設定
export { DEFAULT_SETTINGS, INITIAL_SETTINGS } from "./appSettings";
// ユーティリティ
export { buildHTMLConfig } from "./buildHTMLConfig";
// コンテキスト
export { useEditorContext, useSettings } from "./context/SettingsContext";
export { useSharedHistoryContext } from "./context/SharedHistoryContext";
export { useToolbarState } from "./context/ToolbarContext";
export type { NotionLikeEditorProps } from "./NotionLikeEditor";
// メインコンポーネント
export { default as NotionLikeEditor } from "./NotionLikeEditor";
// ビューワー
export { default as NotionLikeViewer } from "./NotionLikeViewer";
// ノード（カスタムノードが必要な場合）
export { default as NotionLikeEditorNodes } from "./nodes/NotionLikeEditorNodes";
// テーマ
export { default as NotionLikeEditorTheme } from "./themes/NotionLikeEditorTheme";
// 型定義
export type { ImageUploader, ImageUploadResult } from "./types";
