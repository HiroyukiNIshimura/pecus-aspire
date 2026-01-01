/**
 * @coati/editor - Coatiエディタパッケージ
 *
 * Lexical ベースのリッチテキストエディタコアコンポーネント
 */

// コアエディタコンポーネント
export { Editor, NotionLikeEditor, NotionLikeViewer, Viewer } from './core';

// 型定義
export type {
  CoreEditorProps,
  EditorChangeCallbacks,
  EditorContext,
  EditorSettings,
  PecusEditorProps,
} from './types';

// Context
export type { ShowFlashMessage } from './context/FlashMessageContext';
export { FlashMessageContext, useFlashMessageContext } from './context/FlashMessageContext';
export { FullscreenProvider, useFullscreen } from './context/FullscreenContext';
export type { ImageUploadHandler, ImageUploadResult } from './context/ImageUploadContext';
export { ImageUploadProvider, useImageUpload } from './context/ImageUploadContext';
export { SettingsContext, useSettings } from './context/SettingsContext';
export { SharedHistoryContext, useSharedHistoryContext } from './context/SharedHistoryContext';
export { ToolbarContext, useToolbarState, blockTypeToBlockName } from './context/ToolbarContext';
export type { ComponentPickerOptionConfig, ExtraOptionsProvider } from './context/ComponentPickerContext';
export { ComponentPickerProvider, useComponentPickerContext } from './context/ComponentPickerContext';

// Hooks
export { default as useModal } from './hooks/useModal';
export { default as useReport } from './hooks/useReport';

// UI コンポーネント
export { default as Button } from './ui/Button';
export { default as ColorPicker } from './ui/ColorPicker';
export { default as ContentEditable } from './ui/ContentEditable';
export { DialogButtonsList, DialogActions } from './ui/Dialog';
export { default as DropDown, DropDownItem } from './ui/DropDown';
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

// Themes
export { default as NotionLikeEditorTheme } from './themes/NotionLikeEditorTheme';
export { default as NotionLikeViewerTheme } from './themes/NotionLikeViewerTheme';
export { default as StickyEditorTheme } from './themes/StickyEditorTheme';

// プラグイン（よく使われるもの）
export { INSERT_MARKDOWN_COMMAND } from './plugins/InsertMarkdownPlugin';
export { HorizontalRulePlugin } from './plugins/HorizontalRulePlugin';
export { default as ImagesPlugin } from './plugins/ImagesPlugin';
export { TableContext } from './plugins/TablePlugin';
export { PLAYGROUND_TRANSFORMERS } from './plugins/MarkdownTransformers';

// ノード配列
export { default as NotionLikeEditorNodes } from './nodes/NotionLikeEditorNodes';

// ノード（個別エクスポート）
export {
  $createAutocompleteNode,
  AutocompleteNode,
  $createCollapsibleContainerNode,
  $isCollapsibleContainerNode,
  CollapsibleContainerNode,
  $createCollapsibleContentNode,
  $isCollapsibleContentNode,
  CollapsibleContentNode,
  $createCollapsibleTitleNode,
  $isCollapsibleTitleNode,
  CollapsibleTitleNode,
  $createDateTimeNode,
  $isDateTimeNode,
  DateTimeNode,
  $createEmojiNode,
  $isEmojiNode,
  EmojiNode,
  $createEquationNode,
  $isEquationNode,
  EquationNode,
  $createFigmaNode,
  $isFigmaNode,
  FigmaNode,
  $createImageNode,
  $isImageNode,
  ImageNode,
  $createKeywordNode,
  $isKeywordNode,
  KeywordNode,
  $createLayoutContainerNode,
  $isLayoutContainerNode,
  LayoutContainerNode,
  $createLayoutItemNode,
  $isLayoutItemNode,
  LayoutItemNode,
  $createMentionNode,
  $isMentionNode,
  MentionNode,
  $createPageBreakNode,
  $isPageBreakNode,
  PageBreakNode,
  $createSpecialTextNode,
  $isSpecialTextNode,
  SpecialTextNode,
  $createStickyNode,
  $isStickyNode,
  StickyNode,
  $createTweetNode,
  $isTweetNode,
  TweetNode,
  $createYouTubeNode,
  $isYouTubeNode,
  YouTubeNode,
} from './nodes';

// バージョン
export const PACKAGE_VERSION = '0.1.0';
