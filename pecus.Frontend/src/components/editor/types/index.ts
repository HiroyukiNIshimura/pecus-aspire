/**
 * エディタの型定義
 *
 * このファイルはエディタコンポーネントの公開インターフェースを定義します。
 * - core/: 汎用エディタの型
 * - pecus/: Pecus固有の型
 */

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
 * エディタコンテキスト（Pecus固有の拡張用）
 */
export interface EditorContext {
  /** ワークスペースID（画像アップロード用） */
  workspaceId?: number;
  /** アイテムID（既存アイテム編集時に設定） */
  itemId?: number;
  /** セッションID（新規アイテム作成時の一時ファイルアップロード用） */
  sessionId?: string;
  /** 一時ファイルアップロード完了時のコールバック */
  onTempFileUploaded?: (tempFileId: string, previewUrl: string) => void;
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
  /** 各コールバックのデバウンス時間（ミリ秒） */
  debounceMs?: number;
  /** Shikiによるコードハイライトを有効化するかどうか */
  isCodeShiki?: boolean;
}

/**
 * Pecus固有エディタのProps
 */
export interface PecusEditorProps extends CoreEditorProps {
  /** ワークスペースID（画像アップロード用） */
  workspaceId?: number;
  /** アイテムID（画像アップロード用、既存アイテム編集時に設定） */
  itemId?: number;
  /** セッションID（新規アイテム作成時の一時ファイルアップロード用） */
  sessionId?: string;
  /** 一時ファイルアップロード完了時のコールバック */
  onTempFileUploaded?: (tempFileId: string, previewUrl: string) => void;
}
