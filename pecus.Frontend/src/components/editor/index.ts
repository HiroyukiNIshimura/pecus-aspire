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

// コアエディタのエクスポート
export { Editor } from './core';
export type {
  ExistingItemUploadOptions,
  ImageUploadHandler,
  ImageUploadResult,
  ItemCodeLinkMatcherOptions,
  LinkMatcher,
  NewItemUploadOptions,
  NotionLikeViewerProps,
} from './pecus';
// Pecus固有エディタのエクスポート
// 画像アップロードハンドラーのフック
// AutoLink Matcherのフック
export {
  createLinkMatcherWithRegExp,
  PecusNotionLikeEditor,
  PecusNotionLikeViewer,
  useExistingItemImageUploadHandler,
  useItemCodeLinkMatchers,
  useNewItemImageUploadHandler,
} from './pecus';

// 型定義のエクスポート
export type {
  CoreEditorProps,
  EditorChangeCallbacks,
  EditorContext,
  EditorSettings,
  PecusEditorProps,
} from './types';
