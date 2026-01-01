/**
 * エディタコンポーネントのエントリポイント
 *
 * @coati/editor パッケージのコアエディタコンポーネントと
 * Pecus固有の拡張機能をエクスポートします。
 *
 * 推奨される使用方法：
 *
 * ```tsx
 * // Pecusプロジェクト内での使用（推奨）
 * import { PecusNotionLikeEditor } from '@/components/editor';
 * ```
 */

// スタイルのインポート（エディタを使用する全てのコンポーネントに必要）
import '@coati/editor/styles';

// 型定義の再エクスポート
export type {
  CoreEditorProps,
  EditorChangeCallbacks,
  EditorContext,
  EditorSettings,
  ImageUploadHandler,
  ImageUploadResult,
  PecusEditorProps,
  ShowFlashMessage,
} from '@coati/editor';
// @coati/editor から汎用コンポーネントを再エクスポート
export {
  Button,
  blockTypeToBlockName,
  ColorPicker,
  ContentEditable,
  DialogActions,
  DialogButtonsList,
  DropDown,
  DropDownItem,
  DropdownColorPicker,
  Editor,
  EquationEditor,
  emojiList,
  FileInput,
  FlashMessage,
  FlashMessageContext,
  FullscreenProvider,
  getSelectedNode,
  ImageResizer,
  ImageUploadProvider,
  INSERT_MARKDOWN_COMMAND,
  joinClasses,
  KatexEquationAlterer,
  KatexRenderer,
  Modal,
  NotionLikeEditor,
  NotionLikeEditorTheme,
  NotionLikeViewer,
  NotionLikeViewerTheme,
  Select,
  SettingsContext,
  SharedHistoryContext,
  StickyEditorTheme,
  Switch,
  sanitizeUrl,
  TextInput,
  ToolbarContext,
  useFlashMessageContext,
  useFullscreen,
  useImageUpload,
  useModal,
  useReport,
  useSettings,
  useSharedHistoryContext,
  useToolbarState,
  Viewer,
  validateUrl,
} from '@coati/editor';

// Pecus固有エディタのエクスポート
export type {
  ExistingItemUploadOptions,
  ItemCodeLinkMatcherOptions,
  LinkMatcher,
  NewItemUploadOptions,
  NotionLikeViewerProps,
} from './pecus';

export {
  createLinkMatcherWithRegExp,
  PecusNotionLikeEditor,
  PecusNotionLikeViewer,
  useExistingItemImageUploadHandler,
  useItemCodeLinkMatchers,
  useNewItemImageUploadHandler,
} from './pecus';
