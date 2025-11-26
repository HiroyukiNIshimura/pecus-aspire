/**
 * エディタコンポーネントのエントリポイント
 *
 * エディタは以下の3層構造で構成されています：
 * - types/: 型定義（汎用 + Pecus固有）
 * - core/: 汎用エディタコア（パッケージ化候補）
 * - pecus/: Pecus固有の拡張機能
 *
 * 推奨される使用方法：
 *
 * ```tsx
 * // Pecusプロジェクト内での使用（推奨）
 * import { PecusNotionLikeEditor } from '@/components/editor';
 *
 * // 汎用エディタとして使用（将来的なパッケージ化後）
 * import { Editor } from '@/components/editor/core';
 * ```
 */

// 型定義のエクスポート
export type {
  CoreEditorProps,
  EditorChangeCallbacks,
  EditorContext,
  EditorSettings,
  PecusEditorProps,
} from './types';

// コアエディタのエクスポート
export { Editor } from './core';

// Pecus固有エディタのエクスポート（デフォルト）
export { PecusNotionLikeEditor, PecusNotionLikeViewer } from './pecus';

// 後方互換性のため、既存のエクスポートを維持
export { default as NotionLikeEditor } from './NotionLikeEditor';
export { default as NotionLikeViewer } from './NotionLikeViewer';
