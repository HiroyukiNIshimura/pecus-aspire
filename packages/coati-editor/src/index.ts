/**
 * @coati/editor - Coatiエディタパッケージ
 *
 * Lexical ベースのリッチテキストエディタコアコンポーネント
 */

export type { ComponentPickerOptionConfig, ExtraOptionsProvider } from './context/ComponentPickerContext';
export { ComponentPickerProvider, useComponentPickerContext } from './context/ComponentPickerContext';

// Context
export type { ShowFlashMessage } from './context/FlashMessageContext';
export { FlashMessageContext, useFlashMessageContext } from './context/FlashMessageContext';
export { FullscreenProvider, useFullscreen } from './context/FullscreenContext';
export type { ImageUploadHandler, ImageUploadResult } from './context/ImageUploadContext';
export { ImageUploadProvider, useImageUpload } from './context/ImageUploadContext';
export { SettingsContext, useSettings } from './context/SettingsContext';
export { SharedHistoryContext, useSharedHistoryContext } from './context/SharedHistoryContext';
export { blockTypeToBlockName, ToolbarContext, useToolbarState } from './context/ToolbarContext';
// コアエディタコンポーネント
export {
  Editor,
  NotionLikeEditor,
  type NotionLikeEditorProps,
  NotionLikeViewer,
  type NotionLikeViewerProps,
  Viewer,
} from './core';
// Hooks
export { default as useModal } from './hooks/useModal';
export { default as useReport } from './hooks/useReport';
// ノード（個別エクスポート）
export {
  $createAutocompleteNode,
  $createCollapsibleContainerNode,
  $createCollapsibleContentNode,
  $createCollapsibleTitleNode,
  $createDateTimeNode,
  $createEmojiNode,
  $createEquationNode,
  $createFigmaNode,
  $createImageNode,
  $createKeywordNode,
  $createLayoutContainerNode,
  $createLayoutItemNode,
  $createMentionNode,
  $createPageBreakNode,
  $createSpecialTextNode,
  $createStickyNode,
  $createTweetNode,
  $createYouTubeNode,
  $isCollapsibleContainerNode,
  $isCollapsibleContentNode,
  $isCollapsibleTitleNode,
  $isDateTimeNode,
  $isEmojiNode,
  $isEquationNode,
  $isFigmaNode,
  $isImageNode,
  $isKeywordNode,
  $isLayoutContainerNode,
  $isLayoutItemNode,
  $isMentionNode,
  $isPageBreakNode,
  $isSpecialTextNode,
  $isStickyNode,
  $isTweetNode,
  $isYouTubeNode,
  AutocompleteNode,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
  DateTimeNode,
  EmojiNode,
  EquationNode,
  FigmaNode,
  ImageNode,
  KeywordNode,
  LayoutContainerNode,
  LayoutItemNode,
  MentionNode,
  PageBreakNode,
  SpecialTextNode,
  StickyNode,
  TweetNode,
  YouTubeNode,
} from './nodes';
// ノード配列
export { default as NotionLikeEditorNodes } from './nodes/NotionLikeEditorNodes';
export { default as FragmentLinkPlugin } from './plugins/FragmentLinkPlugin';
export { HorizontalRulePlugin } from './plugins/HorizontalRulePlugin';
export { default as ImagesPlugin } from './plugins/ImagesPlugin';
// プラグイン（よく使われるもの）
export { INSERT_MARKDOWN_COMMAND } from './plugins/InsertMarkdownPlugin';
export { PLAYGROUND_TRANSFORMERS } from './plugins/MarkdownTransformers';
export { default as SearchHighlightPlugin, SEARCH_HIGHLIGHT_ID } from './plugins/SearchHighlightPlugin';
export { TableContext } from './plugins/TablePlugin';
// Themes
export { default as NotionLikeEditorTheme } from './themes/NotionLikeEditorTheme';
export { default as NotionLikeViewerTheme } from './themes/NotionLikeViewerTheme';
export { default as StickyEditorTheme } from './themes/StickyEditorTheme';
// 型定義
export type {
  CoreEditorProps,
  EditorChangeCallbacks,
  EditorContext,
  EditorSettings,
  PecusEditorProps,
} from './types';
// UI コンポーネント
export { default as Button } from './ui/Button';
export { default as ColorPicker } from './ui/ColorPicker';
export { default as ContentEditable } from './ui/ContentEditable';
export { DialogActions, DialogButtonsList } from './ui/Dialog';
export { DropDownItem, default as DropDown } from './ui/DropDown';
export { default as DropdownColorPicker } from './ui/DropdownColorPicker';
export { default as EquationEditor } from './ui/EquationEditor';
export { default as FileInput } from './ui/FileInput';
export { default as FlashMessage } from './ui/FlashMessage';
export { default as ImageResizer } from './ui/ImageResizer';
export { default as KatexEquationAlterer } from './ui/KatexEquationAlterer';
export { default as KatexRenderer } from './ui/KatexRenderer';
export { default as Modal } from './ui/Modal';
export { default as Select } from './ui/Select';
export { default as Switch } from './ui/Switch';
export { default as TextInput } from './ui/TextInput';
// Utils
export { default as emojiList } from './utils/emoji-list';
export { getSelectedNode } from './utils/getSelectedNode';
export { default as joinClasses } from './utils/joinClasses';
export { sanitizeUrl, validateUrl } from './utils/url';

// バージョン
export const PACKAGE_VERSION = '0.1.0';
