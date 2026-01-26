/**
 * エディタの型定義
 *
 * このファイルはエディタコンポーネントの公開インターフェースを定義します。
 * - core/: 汎用エディタの型
 * - pecus/: Pecus固有の型
 */

import type { LexicalEditor } from 'lexical';
import type { LinkMatcher } from '../context/AutoLinkContext';
import type { ExtraOptionsProvider } from '../context/ComponentPickerContext';
import type { ImageUploadHandler } from '../context/ImageUploadContext';

/**
 * エディタの基本設定
 */
export interface EditorSettings {
  /** ツールバーの表示 */
  showToolbar?: boolean;
  /** 自動フォーカス */
  autoFocus?: boolean;
  /** タイピング性能測定（開発/デバッグ用） */
  measureTypingPerf?: boolean;
  /** コードハイライトを有効化 */
  isCodeHighlighted?: boolean;
  /** Shikiによるコードハイライトを使用 */
  isCodeShiki?: boolean;
  /** オートコンプリート */
  isAutocomplete?: boolean;
  /** 最大長制限 */
  isMaxLength?: boolean;
  /** 文字数制限 */
  isCharLimit?: boolean;
  /** UTF-8文字数制限 */
  isCharLimitUtf8?: boolean;
  /** リンク属性の有効化 */
  hasLinkAttributes?: boolean;
  /** ネストテーブルの有効化 */
  hasNestedTables?: boolean;
  /** 目次の表示 */
  showTableOfContents?: boolean;
  /** コンテキストメニューの使用 */
  shouldUseLexicalContextMenu?: boolean;
  /** テーブルセル結合 */
  tableCellMerge?: boolean;
  /** テーブルセル背景色 */
  tableCellBackgroundColor?: boolean;
  /** テーブル横スクロール */
  tableHorizontalScroll?: boolean;
  /** ブラケットハイライト */
  shouldAllowHighlightingWithBrackets?: boolean;
  /** 選択常時表示 */
  selectionAlwaysOnDisplay?: boolean;
  /** リスト厳密インデント */
  listStrictIndent?: boolean;
}

/**
 * エディタコンテキスト（画像アップロードハンドラー等の注入用）
 */
export interface EditorContext {
  /** 画像アップロードハンドラー */
  imageUploadHandler?: ImageUploadHandler;
}

/**
 * エディタ変更コールバック
 */
export interface EditorChangeCallbacks {
  /** エディタ内容変更時のコールバック（EditorState JSON） */
  onChange?: (editorState: string) => void;
  /** プレーンテキスト変更時のコールバック */
  onChangePlainText?: (plainText: string) => void;
  /** HTML変更時のコールバック */
  onChangeHtml?: (html: string) => void;
  /** Markdown変更時のコールバック */
  onChangeMarkdown?: (markdown: string) => void;
}

/**
 * 汎用エディタのProps（コア機能のみ）
 */
export interface CoreEditorProps extends EditorChangeCallbacks {
  /** ツールバーの表示 */
  showToolbar?: boolean;
  /** 自動フォーカス */
  autoFocus?: boolean;
  /** タイピング性能測定（開発/デバッグ用） */
  measureTypingPerf?: boolean;
  /** エディタの初期値（EditorState JSON文字列） */
  initialEditorState?: string;
  /** エディタの初期値（Markdown文字列） */
  initialMarkdown?: string;
  /** 各コールバックのデバウンス時間（ミリ秒） */
  debounceMs?: number;
  /** Shikiによるコードハイライトを有効化するかどうか */
  isCodeShiki?: boolean;
  /** 画像アップロードハンドラー（指定しない場合はローカルプレビューモード） */
  imageUploadHandler?: ImageUploadHandler;
  /** カスタムのAutoLink Matcher配列 */
  customLinkMatchers?: LinkMatcher[];
  /** エディタの準備完了時のコールバック */
  onEditorReady?: (editor: LexicalEditor) => void;
  /** 追加のプラグイン（ReactNode配列） */
  extraPlugins?: React.ReactNode;
  /** ComponentPickerPlugin（/メニュー）に追加オプションを提供する関数 */
  extraComponentPickerOptions?: ExtraOptionsProvider;
  /** 全画面モード変更時のコールバック */
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

/**
 * Pecus固有エディタのProps
 * 現在はCoreEditorPropsと同じ（workspaceId等はハンドラー側で管理）
 */
export type PecusEditorProps = CoreEditorProps;
