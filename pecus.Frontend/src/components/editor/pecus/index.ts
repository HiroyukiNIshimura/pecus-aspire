/**
 * Pecus固有のエディタ機能のエクスポート
 *
 * このファイルはPecus固有のエディタ拡張機能をエクスポートします。
 * - ワークスペース連携
 * - 画像アップロード（Pecus API）
 * - AutoLinkカスタムMatcher
 * - AIアシスタントプラグイン
 */

// 型定義（@coati/editorから再エクスポート）
export type { ImageUploadHandler, ImageUploadResult, PecusEditorProps } from '@coati/editor';
export type { ItemCodeLinkMatcherOptions, LinkMatcher } from '../hooks/useAutoLinkMatchers';
// AutoLink Matcherのフック
export { createLinkMatcherWithRegExp, useItemCodeLinkMatchers } from '../hooks/useAutoLinkMatchers';
export type {
  ExistingItemUploadOptions,
  NewItemUploadOptions,
} from '../hooks/useImageUploadHandler';

// 画像アップロードハンドラーのフック
export {
  useExistingItemImageUploadHandler,
  useNewItemImageUploadHandler,
} from '../hooks/useImageUploadHandler';
// プラグイン
export { default as AiAssistantPlugin, INSERT_AI_ASSISTANT_COMMAND } from '../plugins/AiAssistantPlugin';
// コンポーネント
export { default as PecusNotionLikeEditor } from './PecusNotionLikeEditor';
export type { NotionLikeViewerProps } from './PecusNotionLikeViewer';
export { default as PecusNotionLikeViewer } from './PecusNotionLikeViewer';
