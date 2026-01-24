import * as react_jsx_runtime from 'react/jsx-runtime';
import { LexicalEditor, ElementFormatType, LexicalCommand, EditorThemeClasses, RangeSelection, TextNode, ElementNode } from 'lexical';
import * as react from 'react';
import { JSX, ReactNode, HTMLInputTypeAttribute } from 'react';
import { HistoryState } from '@lexical/react/LexicalHistoryPlugin';
import { LinkMatcher } from '@lexical/react/LexicalAutoLinkPlugin';
export { $createAutocompleteNode, $createCollapsibleContainerNode, $createCollapsibleContentNode, $createCollapsibleTitleNode, $createDateTimeNode, $createEmojiNode, $createEquationNode, $createFigmaNode, $createImageNode, $createKeywordNode, $createLayoutContainerNode, $createLayoutItemNode, $createMentionNode, $createPageBreakNode, $createSpecialTextNode, $createStickyNode, $createTweetNode, $createYouTubeNode, $isCollapsibleContainerNode, $isCollapsibleContentNode, $isCollapsibleTitleNode, $isDateTimeNode, $isEmojiNode, $isEquationNode, $isFigmaNode, $isImageNode, $isKeywordNode, $isLayoutContainerNode, $isLayoutItemNode, $isMentionNode, $isPageBreakNode, $isSpecialTextNode, $isStickyNode, $isTweetNode, $isYouTubeNode, AutocompleteNode, CollapsibleContainerNode, CollapsibleContentNode, CollapsibleTitleNode, DateTimeNode, EmojiNode, EquationNode, FigmaNode, ImageNode, KeywordNode, LayoutContainerNode, LayoutItemNode, MentionNode, NotionLikeEditorNodes, PageBreakNode, SpecialTextNode, StickyNode, TweetNode, YouTubeNode } from './nodes-headless.js';
import { Transformer } from '@lexical/markdown';
import '@lexical/react/LexicalDecoratorBlockNode';

interface ComponentPickerOptionConfig {
    title: string;
    icon?: JSX.Element;
    keywords?: Array<string>;
    keyboardShortcut?: string;
    onSelect: (queryString: string) => void;
}
type ExtraOptionsProvider = (editor: LexicalEditor) => ComponentPickerOptionConfig[];
interface ComponentPickerContextValue {
    extraOptions?: ExtraOptionsProvider;
}
declare function ComponentPickerProvider({ children, extraOptions, }: {
    children: ReactNode;
    extraOptions?: ExtraOptionsProvider;
}): react_jsx_runtime.JSX.Element;
declare function useComponentPickerContext(): ComponentPickerContextValue;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type ShowFlashMessage = (message?: React.ReactNode, duration?: number) => void;
declare const FlashMessageContext: ({ children }: {
    children: ReactNode;
}) => JSX.Element;
declare const useFlashMessageContext: () => ShowFlashMessage;

interface FullscreenContextType {
    isFullscreen: boolean;
    toggleFullscreen: () => void;
    exitFullscreen: () => void;
}
declare function FullscreenProvider({ children }: {
    children: ReactNode;
}): react_jsx_runtime.JSX.Element;
declare function useFullscreen(): FullscreenContextType;

/**
 * 画像アップロード結果
 */
interface ImageUploadResult {
    /** 画像のURL（表示用） */
    url: string;
    /** 画像の幅（取得できた場合） */
    width?: number;
    /** 画像の高さ（取得できた場合） */
    height?: number;
}
/**
 * 画像アップロードハンドラーの型
 */
interface ImageUploadHandler {
    /**
     * 画像ファイルをアップロードする
     * @param file - アップロードするファイル
     * @returns アップロード結果（URL等）
     * @throws アップロード失敗時はエラーをスロー
     */
    uploadImage: (file: File) => Promise<ImageUploadResult>;
}
/**
 * 画像アップロードハンドラーを取得するフック
 * @returns ハンドラー（未設定の場合はnull）
 */
declare function useImageUpload(): ImageUploadHandler | null;
/**
 * 画像アップロードコンテキストのプロバイダー
 */
interface ImageUploadProviderProps {
    children: ReactNode;
    handler: ImageUploadHandler | null;
}
declare function ImageUploadProvider({ children, handler }: ImageUploadProviderProps): react_jsx_runtime.JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
declare const DEFAULT_SETTINGS: {
    readonly autoFocus: true;
    readonly disableBeforeInput: false;
    readonly emptyEditor: false;
    readonly hasLinkAttributes: false;
    readonly hasNestedTables: false;
    readonly isAutocomplete: true;
    readonly isCharLimit: false;
    readonly isCharLimitUtf8: false;
    readonly isCodeHighlighted: true;
    readonly isCodeShiki: false;
    readonly isMaxLength: false;
    readonly listStrictIndent: false;
    readonly measureTypingPerf: true;
    readonly selectionAlwaysOnDisplay: false;
    readonly shouldAllowHighlightingWithBrackets: false;
    readonly shouldPreserveNewLinesInMarkdown: false;
    readonly shouldUseLexicalContextMenu: false;
    readonly showNestedEditorTreeView: false;
    readonly showTableOfContents: false;
    readonly showTreeView: true;
    readonly showToolbar: true;
    readonly tableCellBackgroundColor: true;
    readonly tableCellMerge: true;
    readonly tableHorizontalScroll: true;
};
type SettingName = keyof typeof DEFAULT_SETTINGS;
type Settings = {
    -readonly [K in keyof typeof DEFAULT_SETTINGS]: (typeof DEFAULT_SETTINGS)[K] extends boolean ? boolean : (typeof DEFAULT_SETTINGS)[K] extends string ? string : (typeof DEFAULT_SETTINGS)[K];
};
type SettingValue<K extends SettingName> = Settings[K];

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SettingsContextShape = {
    setOption: <K extends SettingName>(name: K, value: SettingValue<K>) => void;
    settings: Settings;
};
declare const SettingsContext: ({ children, initialSettings, }: {
    children: ReactNode;
    initialSettings?: Partial<Settings>;
}) => JSX.Element;
declare const useSettings: () => SettingsContextShape;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type ContextShape$1 = {
    historyState?: HistoryState;
};
declare const SharedHistoryContext: ({ children }: {
    children: ReactNode;
}) => JSX.Element;
declare const useSharedHistoryContext: () => ContextShape$1;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare const rootTypeToRootName: {
    root: string;
    table: string;
};
declare const blockTypeToBlockName: {
    bullet: string;
    check: string;
    code: string;
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
    number: string;
    paragraph: string;
    quote: string;
};
declare const INITIAL_TOOLBAR_STATE: {
    bgColor: string;
    blockType: keyof typeof blockTypeToBlockName;
    canRedo: boolean;
    canUndo: boolean;
    codeLanguage: string;
    codeTheme: string;
    elementFormat: ElementFormatType;
    fontColor: string;
    fontFamily: string;
    fontSize: string;
    fontSizeInputValue: string;
    isBold: boolean;
    isCode: boolean;
    isHighlight: boolean;
    isImageCaption: boolean;
    isItalic: boolean;
    isLink: boolean;
    isRTL: boolean;
    isStrikethrough: boolean;
    isSubscript: boolean;
    isSuperscript: boolean;
    isUnderline: boolean;
    isLowercase: boolean;
    isUppercase: boolean;
    isCapitalize: boolean;
    rootType: keyof typeof rootTypeToRootName;
    listStartNumber: number | null;
};
type ToolbarState = typeof INITIAL_TOOLBAR_STATE;
type ToolbarStateKey = keyof ToolbarState;
type ToolbarStateValue<Key extends ToolbarStateKey> = ToolbarState[Key];
type ContextShape = {
    toolbarState: ToolbarState;
    updateToolbarState<Key extends ToolbarStateKey>(key: Key, value: ToolbarStateValue<Key>): void;
};
declare const ToolbarContext: ({ children }: {
    children: ReactNode;
}) => JSX.Element;
declare const useToolbarState: () => ContextShape;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
declare function Editor({ isFullscreen }: {
    isFullscreen?: boolean;
}): react_jsx_runtime.JSX.Element;

interface NotionLikeEditorProps {
    /**
     * ツールバーの表示
     * @default true
     */
    showToolbar?: boolean;
    /**
     * タイピング性能測定（開発/デバッグ用）
     * @default false
     */
    measureTypingPerf?: boolean;
    /**
     * エディタの初期値（EditorState JSON文字列）
     * initialMarkdownと同時に指定した場合、initialEditorStateが優先される
     */
    initialEditorState?: string;
    /**
     * エディタの初期値（Markdown文字列）
     * initialEditorStateと同時に指定した場合、initialEditorStateが優先される
     */
    initialMarkdown?: string;
    /**
     * エディタ内容変更時のコールバック（EditorState JSON）
     * @param editorState - シリアライズされたEditorState（JSON文字列）
     */
    onChange?: (editorState: string) => void;
    /**
     * プレーンテキスト変更時のコールバック
     * @param plainText - フォーマット情報を除いた純粋なテキスト
     */
    onChangePlainText?: (plainText: string) => void;
    /**
     * HTML変更時のコールバック
     * @param html - HTML形式のコンテンツ
     */
    onChangeHtml?: (html: string) => void;
    /**
     * Markdown変更時のコールバック
     * @param markdown - Markdown形式のコンテンツ
     */
    onChangeMarkdown?: (markdown: string) => void;
    /**
     * 各コールバックのデバウンス時間（ミリ秒）
     * @default 300
     */
    debounceMs?: number;
    /**
     * 自動フォーカス
     */
    autoFocus?: boolean;
    /**
     * Shikiによるコードハイライトを有効化するかどうか
     */
    isCodeShiki?: boolean;
    /**
     * 画像アップロードハンドラー
     * 指定しない場合はローカルプレビューモードで動作（アップロードなし）
     */
    imageUploadHandler?: ImageUploadHandler;
    /**
     * カスタムのAutoLink Matcher配列
     * URLやメールアドレスの基本Matcherに追加される
     */
    customLinkMatchers?: LinkMatcher[];
    /**
     * エディタの準備完了時のコールバック
     * editor instanceを使用して外部からエディタを操作できる
     * @param editor - LexicalEditor インスタンス
     */
    onEditorReady?: (editor: LexicalEditor) => void;
    /**
     * 追加のプラグイン（ReactNode配列）
     * LexicalComposer内部でレンダリングされる
     * 利用者側でカスタムプラグインを追加するために使用
     */
    extraPlugins?: React.ReactNode;
    /**
     * ComponentPickerPlugin（/メニュー）に追加オプションを提供する関数
     * AIアシスタントなどのカスタム機能を追加するために使用
     */
    extraComponentPickerOptions?: ExtraOptionsProvider;
}
declare function NotionLikeEditor({ showToolbar, autoFocus, measureTypingPerf, initialEditorState, initialMarkdown, onChange, onChangePlainText, onChangeHtml, onChangeMarkdown, debounceMs, isCodeShiki, imageUploadHandler, customLinkMatchers, onEditorReady, extraPlugins, extraComponentPickerOptions, }: NotionLikeEditorProps): react_jsx_runtime.JSX.Element;

interface NotionLikeViewerProps {
    /**
     * エディタの初期値（EditorState JSON文字列）
     */
    initialViewerState?: string;
    /**
     * Shikiによるコードハイライトを有効化するかどうか
     */
    isCodeShiki?: boolean;
    /**
     * カスタムのAutoLink Matcher配列
     * URLやメールアドレスの基本Matcherに追加される
     */
    customLinkMatchers?: LinkMatcher[];
    /**
     * 検索語の配列（ハイライト用）
     * 指定するとマッチするテキストがハイライト表示される
     * クエリのパース処理は呼び出し側で行う
     */
    searchTerms?: string[];
}
declare function NotionLikeViewer({ initialViewerState, isCodeShiki, customLinkMatchers, searchTerms, }: NotionLikeViewerProps): react_jsx_runtime.JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
declare function Viewer(): react_jsx_runtime.JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare function useModal(): [
    JSX.Element | null,
    (title: string, showModal: (onClose: () => void) => JSX.Element) => void
];

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
declare function useReport(): (arg0: string) => ReturnType<typeof setTimeout>;

declare function FragmentLinkPlugin(): JSX.Element | null;

declare function HorizontalRulePlugin(): null;

declare function ImagesPlugin(): JSX.Element | null;
declare global {
    interface DragEvent {
        rangeOffset?: number;
        rangeParent?: Node;
    }
}

/**
 * InsertMarkdownPlugin
 *
 * 外部からMarkdownテキストをエディタに挿入するためのプラグイン。
 * カスタムコマンドを使用して、既存のコンテンツを保持したまま
 * Markdownをエディタの末尾に追記する。
 */

/**
 * Markdownを挿入するためのカスタムコマンド
 */
declare const INSERT_MARKDOWN_COMMAND: LexicalCommand<string>;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare const PLAYGROUND_TRANSFORMERS: Array<Transformer>;

/**
 * SearchHighlightPlugin
 *
 * 検索語にマッチするテキストをハイライト表示するプラグイン。
 * Viewer専用（editable: false）で使用することを想定。
 *
 * 検索語の配列を受け取り、各単語を個別にハイライトする。
 * クエリのパース処理は呼び出し側で行う。
 */
/** 検索ハイライト用のマークID */
declare const SEARCH_HIGHLIGHT_ID = "__search_highlight__";
interface SearchHighlightPluginProps {
    /** 検索語の配列（パース済み） */
    searchTerms?: string[];
}
declare function SearchHighlightPlugin({ searchTerms }: SearchHighlightPluginProps): null;

declare function TableContext({ children }: {
    children: JSX.Element;
}): react_jsx_runtime.JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare const theme$2: EditorThemeClasses;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare const theme$1: EditorThemeClasses;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare const theme: EditorThemeClasses;

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
interface EditorSettings {
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
interface EditorContext {
    /** 画像アップロードハンドラー */
    imageUploadHandler?: ImageUploadHandler;
}
/**
 * エディタ変更コールバック
 */
interface EditorChangeCallbacks {
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
interface CoreEditorProps extends EditorChangeCallbacks {
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
}
/**
 * Pecus固有エディタのProps
 * 現在はCoreEditorPropsと同じ（workspaceId等はハンドラー側で管理）
 */
type PecusEditorProps = CoreEditorProps;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare function Button({ 'data-test-id': dataTestId, children, className, onClick, disabled, small, title, }: {
    'data-test-id'?: string;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    onClick: () => void;
    small?: boolean;
    title?: string;
}): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

interface ColorPickerProps {
    color: string;
    onChange?: (value: string, skipHistoryStack: boolean, skipRefocus: boolean) => void;
}
declare function ColorPicker({ color, onChange }: Readonly<ColorPickerProps>): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type Props$5 = {
    className?: string;
    placeholderClassName?: string;
    placeholder: string;
};
declare function LexicalContentEditable({ className, placeholder, placeholderClassName }: Props$5): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type Props$4 = Readonly<{
    'data-test-id'?: string;
    children: ReactNode;
}>;
declare function DialogButtonsList({ children }: Props$4): JSX.Element;
declare function DialogActions({ 'data-test-id': dataTestId, children }: Props$4): JSX.Element;

declare function DropDownItem({ children, className, onClick, title, }: {
    children: react.ReactNode;
    className: string;
    onClick: (event: react.MouseEvent<HTMLButtonElement>) => void;
    title?: string;
}): react_jsx_runtime.JSX.Element;
declare function DropDown({ disabled, buttonLabel, buttonAriaLabel, buttonClassName, buttonIconClassName, children, stopCloseOnClickSelf, }: {
    disabled?: boolean;
    buttonAriaLabel?: string;
    buttonClassName: string;
    buttonIconClassName?: string;
    buttonLabel?: string;
    children: ReactNode;
    stopCloseOnClickSelf?: boolean;
}): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
type Props$3 = {
    disabled?: boolean;
    buttonAriaLabel?: string;
    buttonClassName: string;
    buttonIconClassName?: string;
    buttonLabel?: string;
    title?: string;
    stopCloseOnClickSelf?: boolean;
    color: string;
    onChange?: (color: string, skipHistoryStack: boolean, skipRefocus: boolean) => void;
};
declare function DropdownColorPicker({ disabled, stopCloseOnClickSelf, color, onChange, ...rest }: Props$3): react_jsx_runtime.JSX.Element;

type BaseEquationEditorProps = {
    equation: string;
    inline: boolean;
    setEquation: (equation: string) => void;
};
declare const _default$1: react.ForwardRefExoticComponent<BaseEquationEditorProps & react.RefAttributes<HTMLInputElement | HTMLTextAreaElement>>;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type Props$2 = Readonly<{
    'data-test-id'?: string;
    accept?: string;
    label: string;
    onChange: (files: FileList | null) => void;
}>;
declare function FileInput({ accept, label, onChange, 'data-test-id': dataTestId }: Props$2): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

interface FlashMessageProps {
    children: ReactNode;
}
declare function FlashMessage({ children }: FlashMessageProps): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare function ImageResizer({ onResizeStart, onResizeEnd, buttonRef, imageRef, maxWidth, editor, showCaption, setShowCaption, captionsEnabled, }: {
    editor: LexicalEditor;
    buttonRef: {
        current: null | HTMLButtonElement;
    };
    imageRef: {
        current: null | HTMLElement;
    };
    maxWidth?: number;
    onResizeEnd: (width: 'inherit' | number, height: 'inherit' | number) => void;
    onResizeStart: () => void;
    setShowCaption: (show: boolean) => void;
    showCaption: boolean;
    captionsEnabled: boolean;
}): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type Props$1 = {
    initialEquation?: string;
    onConfirm: (equation: string, inline: boolean) => void;
};
declare function KatexEquationAlterer({ onConfirm, initialEquation }: Props$1): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare function KatexRenderer({ equation, inline, onDoubleClick, }: Readonly<{
    equation: string;
    inline: boolean;
    onDoubleClick: () => void;
}>): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare function Modal({ onClose, children, title, closeOnClickOutside, }: {
    children: ReactNode;
    closeOnClickOutside?: boolean;
    onClose: () => void;
    title: string;
}): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SelectIntrinsicProps = JSX.IntrinsicElements['select'];
interface SelectProps extends SelectIntrinsicProps {
    label: string;
}
declare function Select({ children, label, className, ...other }: SelectProps): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare function Switch({ checked, onClick, text, id, }: Readonly<{
    checked: boolean;
    id?: string;
    onClick: (e: react.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    text: string;
}>): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type Props = Readonly<{
    'data-test-id'?: string;
    label: string;
    onChange: (val: string) => void;
    placeholder?: string;
    value: string;
    type?: HTMLInputTypeAttribute;
}>;
declare function TextInput({ label, value, onChange, placeholder, 'data-test-id': dataTestId, type, }: Props): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
declare const _default: ({
    description: string;
    emoji: string;
    category: string;
    aliases: string[];
    tags: string[];
    unicode_version: string;
    ios_version: string;
    skin_tones?: undefined;
} | {
    emoji: string;
    description: string;
    category: string;
    aliases: string[];
    tags: string[];
    unicode_version: string;
    ios_version: string;
    skin_tones: boolean;
})[];

declare function getSelectedNode(selection: RangeSelection): TextNode | ElementNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
declare function joinClasses(...args: Array<string | boolean | null | undefined>): string;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
declare function sanitizeUrl(url: string): string;
declare function validateUrl(url: string): boolean;

/**
 * @coati/editor - Coatiエディタパッケージ
 *
 * Lexical ベースのリッチテキストエディタコアコンポーネント
 */

declare const PACKAGE_VERSION = "0.1.0";

export { Button, ColorPicker, type ComponentPickerOptionConfig, ComponentPickerProvider, LexicalContentEditable as ContentEditable, type CoreEditorProps, DialogActions, DialogButtonsList, DropDown, DropDownItem, DropdownColorPicker, Editor, type EditorChangeCallbacks, type EditorContext, type EditorSettings, _default$1 as EquationEditor, type ExtraOptionsProvider, FileInput, FlashMessage, FlashMessageContext, FragmentLinkPlugin, FullscreenProvider, HorizontalRulePlugin, INSERT_MARKDOWN_COMMAND, ImageResizer, type ImageUploadHandler, ImageUploadProvider, type ImageUploadResult, ImagesPlugin, KatexEquationAlterer, KatexRenderer, Modal, NotionLikeEditor, type NotionLikeEditorProps, theme$2 as NotionLikeEditorTheme, NotionLikeViewer, type NotionLikeViewerProps, theme$1 as NotionLikeViewerTheme, PACKAGE_VERSION, PLAYGROUND_TRANSFORMERS, type PecusEditorProps, SEARCH_HIGHLIGHT_ID, SearchHighlightPlugin, Select, SettingsContext, SharedHistoryContext, type ShowFlashMessage, theme as StickyEditorTheme, Switch, TableContext, TextInput, ToolbarContext, Viewer, blockTypeToBlockName, _default as emojiList, getSelectedNode, joinClasses, sanitizeUrl, useComponentPickerContext, useFlashMessageContext, useFullscreen, useImageUpload, useModal, useReport, useSettings, useSharedHistoryContext, useToolbarState, validateUrl };
