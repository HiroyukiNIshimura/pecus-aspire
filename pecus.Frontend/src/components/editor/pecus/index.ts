/**
 * Pecus固有のエディタ機能のエクスポート
 *
 * このファイルはPecus固有のエディタ拡張機能をエクスポートします。
 * - ワークスペース連携
 * - 画像アップロード（Pecus API）
 * - AutoLinkカスタムMatcher
 */

export type { NotionLikeViewerProps } from '../core/NotionLikeViewer';
export type { ItemCodeLinkMatcherOptions, LinkMatcher } from '../hooks/useAutoLinkMatchers';
// AutoLink Matcherのフック
export { createLinkMatcherWithRegExp, useItemCodeLinkMatchers } from '../hooks/useAutoLinkMatchers';
export type {
  ExistingItemUploadOptions,
  ImageUploadHandler,
  ImageUploadResult,
  NewItemUploadOptions,
} from '../hooks/useImageUploadHandler';

// 画像アップロードハンドラーのフック
export {
  useExistingItemImageUploadHandler,
  useNewItemImageUploadHandler,
} from '../hooks/useImageUploadHandler';
// 型定義
export type { PecusEditorProps } from '../types';
// コンポーネント
export { default as PecusNotionLikeEditor } from './PecusNotionLikeEditor';
export { default as PecusNotionLikeViewer } from './PecusNotionLikeViewer';
