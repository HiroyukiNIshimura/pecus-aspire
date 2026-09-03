import { BaseStaticNodeConfig } from 'lexical';
import type { CSSProperties } from 'react';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';
import { DecoratorNode } from 'lexical';
import { DOMConversionMap } from 'lexical';
import { DOMConversionOutput } from 'lexical';
import { DOMExportOutput } from 'lexical';
import { EditorConfig } from 'lexical';
import type { EditorState } from 'lexical';
import type { EditorThemeClasses } from 'lexical';
import type { ElementFormatType } from 'lexical';
import { ElementNode } from 'lexical';
import { ForwardRefExoticComponent } from 'react';
import type { HistoryState } from '@lexical/react/LexicalHistoryPlugin';
import type { HTMLInputTypeAttribute } from 'react';
import { JSX } from 'react';
import type { Klass } from 'lexical';
import { LexicalCommand } from 'lexical';
import { LexicalEditor } from 'lexical';
import { LexicalNode } from 'lexical';
import type { LexicalUpdateJSON } from 'lexical';
import { LinkMatcher } from '@lexical/react/LexicalAutoLinkPlugin';
import type { NodeKey } from 'lexical';
import { RangeSelection } from 'lexical';
import * as React_2 from 'react';
import { ReactNode } from 'react';
import { RefAttributes } from 'react';
import type { SerializedEditor } from 'lexical';
import type { SerializedLexicalNode } from 'lexical';
import type { SerializedTextNode } from 'lexical';
import type { Spread } from 'lexical';
import { StateConfig } from 'lexical';
import { StateConfigValue } from 'lexical';
import { StateValueOrUpdater } from 'lexical';
import { StaticNodeConfigAccessor } from 'lexical';
import { StaticNodeTypeAccessor } from 'lexical';
import { TextNode } from 'lexical';
import { Transformer as Transformer_2 } from '@lexical/markdown';

export declare function $createAutocompleteNode(text: string, uuid: string): AutocompleteNode;

export declare function $createCollapsibleContainerNode(isOpen: boolean): CollapsibleContainerNode;

export declare function $createCollapsibleContentNode(): CollapsibleContentNode;

export declare function $createCollapsibleTitleNode(): CollapsibleTitleNode;

export declare function $createDateTimeNode(dateTime: Date): DateTimeNode;

export declare function $createEmojiNode(className: string, emojiText: string): EmojiNode;

export declare function $createEquationNode(equation?: string, inline?: boolean): EquationNode;

export declare function $createFigmaNode(documentID: string): FigmaNode;

export declare function $createImageNode({ altText, height, maxWidth, captionsEnabled, src, width, showCaption, caption, key, }: ImagePayload): ImageNode;

export declare function $createKeywordNode(keyword?: string): KeywordNode;

export declare function $createLayoutContainerNode(templateColumns?: string): LayoutContainerNode;

export declare function $createLayoutItemNode(): LayoutItemNode;

export declare function $createMermaidNode(code?: string): MermaidNode;

export declare function $createPageBreakNode(): PageBreakNode;

/**
 * Creates a SpecialTextNode with the given text.
 * @param text - Text content for the SpecialTextNode.
 * @returns A new SpecialTextNode instance.
 */
export declare function $createSpecialTextNode(text?: string): SpecialTextNode;

export declare function $createStickyNode(xOffset: number, yOffset: number): StickyNode;

export declare function $createTweetNode(tweetID: string): TweetNode;

export declare function $createYouTubeNode(videoID: string): YouTubeNode;

export declare function $isCollapsibleContainerNode(node: LexicalNode | null | undefined): node is CollapsibleContainerNode;

export declare function $isCollapsibleContentNode(node: LexicalNode | null | undefined): node is CollapsibleContentNode;

export declare function $isCollapsibleTitleNode(node: LexicalNode | null | undefined): node is CollapsibleTitleNode;

export declare function $isDateTimeNode(node: LexicalNode | null | undefined): node is DateTimeNode;

export declare function $isEmojiNode(node: LexicalNode | null | undefined): node is EmojiNode;

export declare function $isEquationNode(node: LexicalNode | null | undefined): node is EquationNode;

export declare function $isFigmaNode(node: FigmaNode | LexicalNode | null | undefined): node is FigmaNode;

export declare function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode;

export declare function $isKeywordNode(node: LexicalNode | null | undefined): boolean;

export declare function $isLayoutContainerNode(node: LexicalNode | null | undefined): node is LayoutContainerNode;

export declare function $isLayoutItemNode(node: LexicalNode | null | undefined): node is LayoutItemNode;

export declare function $isMermaidNode(node: LexicalNode | null | undefined): node is MermaidNode;

export declare function $isPageBreakNode(node: LexicalNode | null | undefined): node is PageBreakNode;

/**
 * Checks if a node is a SpecialTextNode.
 * @param node - Node to check.
 * @returns True if the node is a SpecialTextNode.
 */
export declare function $isSpecialTextNode(node: LexicalNode | null | undefined): node is SpecialTextNode;

export declare function $isStickyNode(node: LexicalNode | null | undefined): node is StickyNode;

export declare function $isTweetNode(node: TweetNode | LexicalNode | null | undefined): node is TweetNode;

export declare function $isYouTubeNode(node: YouTubeNode | LexicalNode | null | undefined): node is YouTubeNode;

declare const altTextState: StateConfig<"altText", string>;

export declare class AutocompleteNode extends TextNode {
    /**
     * A unique uuid is generated for each session and assigned to the instance.
     * This helps to:
     * - Ensures max one Autocomplete node per session.
     * - Ensure that when collaboration is enabled, this node is not shown in
     *   other sessions.
     * See https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/AutocompletePlugin/index.tsx
     */
    $config(): BaseStaticNodeConfig & {
        readonly text?: {
            readonly importDOM: {
                readonly '#text': () => {
                    conversion: (domNode: Node) => DOMConversionOutput;
                    priority: 0;
                };
                readonly b: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly code: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly em: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly i: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly mark: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly s: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly span: () => {
                    conversion: (domNode: HTMLSpanElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly strong: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly sub: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly sup: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly u: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
            };
        } | undefined;
    } & {
        readonly autocomplete?: {
            readonly extends: typeof TextNode;
            readonly stateConfigs: readonly [{
                readonly flat: true;
                readonly stateConfig: StateConfig<"uuid", string>;
            }];
        } | undefined;
    } & StaticNodeTypeAccessor<"autocomplete"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof TextNode;
    readonly stateConfigs: readonly [{
    readonly flat: true;
    readonly stateConfig: StateConfig<"uuid", string>;
    }];
    }>;
    exportJSON(): SerializedAutocompleteNode;
    updateDOM(_prevNode: this, _dom: HTMLElement, _config: EditorConfig): boolean;
    exportDOM(_: LexicalEditor): DOMExportOutput;
    excludeFromCopy(): boolean;
    createDOM(config: EditorConfig): HTMLElement;
    getUUID(): StateConfigValue<typeof uuidState>;
    setUUID(valueOrUpdater: StateValueOrUpdater<typeof uuidState>): this;
}

declare type BaseEquationEditorProps = {
    equation: string;
    inline: boolean;
    setEquation: (equation: string) => void;
};

export declare const blockTypeToBlockName: {
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

export declare function Button({ 'data-test-id': dataTestId, children, className, onClick, disabled, small, title, }: {
    'data-test-id'?: string;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    onClick: () => void;
    small?: boolean;
    title?: string;
}): JSX.Element;

declare const captionsEnabledState: StateConfig<"captionsEnabled", boolean>;

declare const classNameState: StateConfig<"className", string>;

declare const codeState: StateConfig<"code", string>;

export declare class CollapsibleContainerNode extends ElementNode {
    $config(): BaseStaticNodeConfig & {
        readonly "collapsible-container"?: {
            readonly extends: typeof ElementNode;
            readonly importDOM: DOMConversionMap<HTMLElement>;
            readonly stateConfigs: readonly [{
                readonly flat: true;
                readonly stateConfig: StateConfig<"open", boolean>;
            }];
        } | undefined;
    } & StaticNodeTypeAccessor<"collapsible-container"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof ElementNode;
    readonly importDOM: DOMConversionMap<HTMLElement>;
    readonly stateConfigs: readonly [{
    readonly flat: true;
    readonly stateConfig: StateConfig<"open", boolean>;
    }];
    }>;
    isShadowRoot(): boolean;
    collapseAtStart(_selection: RangeSelection): boolean;
    createDOM(_config: EditorConfig, editor: LexicalEditor): HTMLElement;
    updateDOM(prevNode: this, dom: HTMLDetailsElement): boolean;
    exportDOM(): DOMExportOutput;
    setOpen(open: boolean): void;
    getOpen(): boolean;
    toggleOpen(): void;
}

export declare class CollapsibleContentNode extends ElementNode {
    $config(): BaseStaticNodeConfig & {
        readonly "collapsible-content"?: {
            readonly extends: typeof ElementNode;
            readonly importDOM: DOMConversionMap<HTMLElement>;
        } | undefined;
    } & StaticNodeTypeAccessor<"collapsible-content"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof ElementNode;
    readonly importDOM: DOMConversionMap<HTMLElement>;
    }>;
    createDOM(_config: EditorConfig, editor: LexicalEditor): HTMLElement;
    updateDOM(_prevNode: this, _dom: HTMLElement): boolean;
    exportDOM(): DOMExportOutput;
    isShadowRoot(): boolean;
}

/** @noInheritDoc */
export declare class CollapsibleTitleNode extends ElementNode {
    /** @internal */
    $config(): BaseStaticNodeConfig & {
        readonly "collapsible-title"?: {
            readonly $transform: (node: CollapsibleTitleNode) => void;
            readonly extends: typeof ElementNode;
            readonly importDOM: DOMConversionMap<HTMLElement>;
        } | undefined;
    } & StaticNodeTypeAccessor<"collapsible-title"> & StaticNodeConfigAccessor<    {
    readonly $transform: (node: CollapsibleTitleNode) => void;
    readonly extends: typeof ElementNode;
    readonly importDOM: DOMConversionMap<HTMLElement>;
    }>;
    createDOM(_config: EditorConfig, editor: LexicalEditor): HTMLElement;
    updateDOM(_prevNode: this, _dom: HTMLElement): boolean;
    insertNewAfter(_: RangeSelection, restoreSelection?: boolean): ElementNode;
}

export declare function ColorPicker({ color, onChange }: Readonly<ColorPickerProps>): JSX.Element;

declare interface ColorPickerProps {
    color: string;
    onChange?: (value: string, skipHistoryStack: boolean, skipRefocus: boolean) => void;
}

declare const colorState: StateConfig<"color", "pink" | "yellow">;

declare interface ComponentPickerContextValue {
    extraOptions?: ExtraOptionsProvider;
}

export declare interface ComponentPickerOptionConfig {
    title: string;
    icon?: JSX.Element;
    keywords?: Array<string>;
    keyboardShortcut?: string;
    onSelect: (queryString: string) => void;
}

export declare function ComponentPickerProvider({ children, extraOptions, }: {
    children: ReactNode;
    extraOptions?: ExtraOptionsProvider;
}): JSX.Element;

export declare function ContentEditable({ className, placeholder, placeholderClassName }: Props): JSX.Element;

declare type ContextShape = {
    historyState?: HistoryState;
};

declare type ContextShape_2 = {
    toolbarState: ToolbarState;
    updateToolbarState<Key extends ToolbarStateKey>(key: Key, value: ToolbarStateValue<Key>): void;
};

/**
 * 汎用エディタのProps（コア機能のみ）
 */
export declare interface CoreEditorProps extends EditorChangeCallbacks {
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

export declare class DateTimeNode extends DecoratorNode<JSX.Element> {
    $config(): BaseStaticNodeConfig & {
        readonly datetime?: {
            readonly extends: typeof DecoratorNode;
            readonly importDOM: DOMConversionMap<HTMLElement>;
            readonly stateConfigs: readonly [{
                readonly flat: true;
                readonly stateConfig: StateConfig<"dateTime", Date>;
            }];
        } | undefined;
    } & StaticNodeTypeAccessor<"datetime"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof DecoratorNode;
    readonly importDOM: DOMConversionMap<HTMLElement>;
    readonly stateConfigs: readonly [{
    readonly flat: true;
    readonly stateConfig: StateConfig<"dateTime", Date>;
    }];
    }>;
    getDateTime(): StateConfigValue<typeof dateTimeState>;
    setDateTime(valueOrUpdater: StateValueOrUpdater<typeof dateTimeState>): this;
    getTextContent(): string;
    exportDOM(): DOMExportOutput;
    createDOM(): HTMLElement;
    updateDOM(): false;
    isInline(): boolean;
    decorate(): JSX.Element;
}

declare const dateTimeState: StateConfig<"dateTime", Date>;

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

export declare function DialogActions({ 'data-test-id': dataTestId, children }: Props_2): JSX.Element;

export declare function DialogButtonsList({ children }: Props_2): JSX.Element;

declare const documentIDState: StateConfig<"documentID", string>;

export declare function DropDown({ disabled, buttonLabel, buttonAriaLabel, buttonClassName, buttonIconClassName, children, stopCloseOnClickSelf, }: {
    disabled?: boolean;
    buttonAriaLabel?: string;
    buttonClassName: string;
    buttonIconClassName?: string;
    buttonLabel?: string;
    children: ReactNode;
    stopCloseOnClickSelf?: boolean;
}): JSX.Element;

export declare function DropdownColorPicker({ disabled, stopCloseOnClickSelf, color, onChange, ...rest }: Props_3): JSX;

export declare function DropDownItem({ children, className, onClick, title, }: {
    children: React_2.ReactNode;
    className: string;
    onClick: (event: React_2.MouseEvent<HTMLButtonElement>) => void;
    title?: string;
}): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export declare function Editor({ isFullscreen }: {
    isFullscreen?: boolean;
}): JSX;

/**
 * エディタ変更コールバック
 */
export declare interface EditorChangeCallbacks {
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
 * エディタコンテキスト（画像アップロードハンドラー等の注入用）
 */
export declare interface EditorContext {
    /** 画像アップロードハンドラー */
    imageUploadHandler?: ImageUploadHandler;
}

/**
 * エディタの基本設定
 */
export declare interface EditorSettings {
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
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export declare const emojiList: ({
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

export declare class EmojiNode extends TextNode {
    $config(): BaseStaticNodeConfig & {
        readonly text?: {
            readonly importDOM: {
                readonly '#text': () => {
                    conversion: (domNode: Node) => DOMConversionOutput;
                    priority: 0;
                };
                readonly b: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly code: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly em: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly i: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly mark: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly s: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly span: () => {
                    conversion: (domNode: HTMLSpanElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly strong: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly sub: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly sup: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly u: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
            };
        } | undefined;
    } & {
        readonly emoji?: {
            readonly extends: typeof TextNode;
            readonly stateConfigs: readonly [{
                readonly flat: true;
                readonly stateConfig: StateConfig<"className", string>;
            }];
        } | undefined;
    } & StaticNodeTypeAccessor<"emoji"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof TextNode;
    readonly stateConfigs: readonly [{
    readonly flat: true;
    readonly stateConfig: StateConfig<"className", string>;
    }];
    }>;
    createDOM(config: EditorConfig): HTMLElement;
    updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean;
    getClassName(): StateConfigValue<typeof classNameState>;
    setClassName(valueOrUpdater: StateValueOrUpdater<typeof classNameState>): this;
}

export declare const EquationEditor: ForwardRefExoticComponent<BaseEquationEditorProps & RefAttributes<HTMLInputElement | HTMLTextAreaElement>>;

export declare class EquationNode extends DecoratorNode<JSX.Element> {
    $config(): BaseStaticNodeConfig & {
        readonly equation?: {
            readonly extends: typeof DecoratorNode;
            readonly importDOM: DOMConversionMap<HTMLElement>;
            readonly stateConfigs: readonly [{
                readonly flat: true;
                readonly stateConfig: StateConfig<"equation", string>;
            }, {
                readonly flat: true;
                readonly stateConfig: StateConfig<"inline", boolean>;
            }];
        } | undefined;
    } & StaticNodeTypeAccessor<"equation"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof DecoratorNode;
    readonly importDOM: DOMConversionMap<HTMLElement>;
    readonly stateConfigs: readonly [{
    readonly flat: true;
    readonly stateConfig: StateConfig<"equation", string>;
    }, {
    readonly flat: true;
    readonly stateConfig: StateConfig<"inline", boolean>;
    }];
    }>;
    createDOM(_config: EditorConfig): HTMLElement;
    exportDOM(): DOMExportOutput;
    updateDOM(prevNode: this): boolean;
    getTextContent(): string;
    getEquation(): StateConfigValue<typeof equationState>;
    setEquation(equation: string): this;
    getInline(): StateConfigValue<typeof inlineState>;
    decorate(): JSX.Element;
}

declare const equationState: StateConfig<"equation", string>;

export declare type ExtraOptionsProvider = (editor: LexicalEditor) => ComponentPickerOptionConfig[];

export declare class FigmaNode extends DecoratorBlockNode {
    $config(): BaseStaticNodeConfig & {
        readonly figma?: {
            readonly extends: typeof DecoratorBlockNode;
            readonly stateConfigs: readonly [{
                readonly flat: true;
                readonly stateConfig: StateConfig<"documentID", string>;
            }];
        } | undefined;
    } & StaticNodeTypeAccessor<"figma"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof DecoratorBlockNode;
    readonly stateConfigs: readonly [{
    readonly flat: true;
    readonly stateConfig: StateConfig<"documentID", string>;
    }];
    }>;
    updateDOM(): false;
    getId(): StateConfigValue<typeof documentIDState>;
    getTextContent(_includeInert?: boolean | undefined, _includeDirectionless?: false | undefined): string;
    decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element;
}

export declare function FileInput({ accept, label, onChange, 'data-test-id': dataTestId }: Props_4): JSX.Element;

export declare function FlashMessage({ children }: FlashMessageProps): JSX.Element;

export declare const FlashMessageContext: ({ children }: {
    children: ReactNode;
}) => JSX.Element;

declare interface FlashMessageProps {
    children: ReactNode;
}

export declare function FragmentLinkPlugin(): JSX.Element | null;

declare interface FullscreenContextType {
    isFullscreen: boolean;
    toggleFullscreen: () => void;
    exitFullscreen: () => void;
}

export declare function FullscreenProvider({ children }: {
    children: ReactNode;
}): JSX;

/**
 * Lexical EditorState を Coati 独自の Markdown 変換ルールで文字列化する
 *
 * @param editorState - Markdown 化したい EditorState
 * @returns Markdown 文字列
 */
export declare function getMarkdownFromEditorState(editorState: EditorState): string;

export declare function getSelectedNode(selection: RangeSelection): TextNode | ElementNode;

declare const heightState: StateConfig<"height", number | "inherit">;

export declare function HorizontalRulePlugin(): null;

export declare class ImageNode extends DecoratorNode<JSX.Element> {
    __caption: LexicalEditor;
    $config(): BaseStaticNodeConfig & {
        readonly image?: {
            readonly extends: typeof DecoratorNode;
            readonly importDOM: DOMConversionMap<HTMLElement>;
            readonly stateConfigs: readonly [{
                readonly flat: true;
                readonly stateConfig: StateConfig<"src", string>;
            }, {
                readonly flat: true;
                readonly stateConfig: StateConfig<"altText", string>;
            }, {
                readonly flat: true;
                readonly stateConfig: StateConfig<"width", number | "inherit">;
            }, {
                readonly flat: true;
                readonly stateConfig: StateConfig<"height", number | "inherit">;
            }, {
                readonly flat: true;
                readonly stateConfig: StateConfig<"maxWidth", number>;
            }, {
                readonly flat: true;
                readonly stateConfig: StateConfig<"showCaption", boolean>;
            }, {
                readonly flat: true;
                readonly stateConfig: StateConfig<"captionsEnabled", boolean>;
            }];
        } | undefined;
    } & StaticNodeTypeAccessor<"image"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof DecoratorNode;
    readonly importDOM: DOMConversionMap<HTMLElement>;
    readonly stateConfigs: readonly [{
    readonly flat: true;
    readonly stateConfig: StateConfig<"src", string>;
    }, {
    readonly flat: true;
    readonly stateConfig: StateConfig<"altText", string>;
    }, {
    readonly flat: true;
    readonly stateConfig: StateConfig<"width", number | "inherit">;
    }, {
    readonly flat: true;
    readonly stateConfig: StateConfig<"height", number | "inherit">;
    }, {
    readonly flat: true;
    readonly stateConfig: StateConfig<"maxWidth", number>;
    }, {
    readonly flat: true;
    readonly stateConfig: StateConfig<"showCaption", boolean>;
    }, {
    readonly flat: true;
    readonly stateConfig: StateConfig<"captionsEnabled", boolean>;
    }];
    }>;
    constructor(key?: NodeKey | undefined);
    afterCloneFrom(prevNode: this): void;
    updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedImageNode>): this;
    exportDOM(): DOMExportOutput;
    exportJSON(): SerializedImageNode;
    setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void;
    setShowCaption(showCaption: boolean): void;
    createDOM(config: EditorConfig): HTMLElement;
    updateDOM(): false;
    getSrc(): StateConfigValue<typeof srcState>;
    getAltText(): StateConfigValue<typeof altTextState>;
    getWidth(): StateConfigValue<typeof widthState>;
    getHeight(): StateConfigValue<typeof heightState>;
    getMaxWidth(): StateConfigValue<typeof maxWidthState>;
    getShowCaption(): StateConfigValue<typeof showCaptionState>;
    getCaptionsEnabled(): StateConfigValue<typeof captionsEnabledState>;
    decorate(): JSX.Element;
}

declare interface ImagePayload {
    altText: string;
    caption?: LexicalEditor;
    height?: number;
    key?: NodeKey;
    maxWidth?: number;
    showCaption?: boolean;
    src: string;
    width?: number;
    captionsEnabled?: boolean;
}

export declare function ImageResizer({ onResizeStart, onResizeEnd, buttonRef, imageRef, maxWidth, editor, showCaption, setShowCaption, captionsEnabled, }: {
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

export declare function ImagesPlugin(): JSX.Element | null;

/**
 * 画像アップロードハンドラーの型
 */
export declare interface ImageUploadHandler {
    /**
     * 画像ファイルをアップロードする
     * @param file - アップロードするファイル
     * @returns アップロード結果（URL等）
     * @throws アップロード失敗時はエラーをスロー
     */
    uploadImage: (file: File) => Promise<ImageUploadResult>;
}

export declare function ImageUploadProvider({ children, handler }: ImageUploadProviderProps): JSX;

/**
 * 画像アップロードコンテキストのプロバイダー
 */
declare interface ImageUploadProviderProps {
    children: ReactNode;
    handler: ImageUploadHandler | null;
}

/**
 * 画像アップロード結果
 */
export declare interface ImageUploadResult {
    /** 画像のURL（表示用） */
    url: string;
    /** 画像の幅（取得できた場合） */
    width?: number;
    /** 画像の高さ（取得できた場合） */
    height?: number;
}

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

declare const inlineState: StateConfig<"inline", boolean>;

/**
 * Markdownを挿入するためのカスタムコマンド
 */
export declare const INSERT_MARKDOWN_COMMAND: LexicalCommand<string>;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export declare function joinClasses(...args: Array<string | boolean | null | undefined>): string;

export declare function KatexEquationAlterer({ onConfirm, initialEquation }: Props_5): JSX.Element;

export declare function KatexRenderer({ equation, inline, onDoubleClick, }: Readonly<{
    equation: string;
    inline: boolean;
    onDoubleClick: () => void;
}>): JSX.Element;

export declare class KeywordNode extends TextNode {
    $config(): BaseStaticNodeConfig & {
        readonly text?: {
            readonly importDOM: {
                readonly '#text': () => {
                    conversion: (domNode: Node) => DOMConversionOutput;
                    priority: 0;
                };
                readonly b: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly code: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly em: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly i: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly mark: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly s: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly span: () => {
                    conversion: (domNode: HTMLSpanElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly strong: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly sub: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly sup: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly u: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
            };
        } | undefined;
    } & {
        readonly keyword?: {
            readonly extends: typeof TextNode;
        } | undefined;
    } & StaticNodeTypeAccessor<"keyword"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof TextNode;
    }>;
    createDOM(config: EditorConfig): HTMLElement;
    canInsertTextBefore(): boolean;
    canInsertTextAfter(): boolean;
    isTextEntity(): true;
}

export declare class LayoutContainerNode extends ElementNode {
    $config(): BaseStaticNodeConfig & {
        readonly "layout-container"?: {
            readonly extends: typeof ElementNode;
            readonly importDOM: DOMConversionMap<HTMLElement>;
            readonly stateConfigs: readonly [{
                readonly flat: true;
                readonly stateConfig: StateConfig<"templateColumns", string>;
            }];
        } | undefined;
    } & StaticNodeTypeAccessor<"layout-container"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof ElementNode;
    readonly importDOM: DOMConversionMap<HTMLElement>;
    readonly stateConfigs: readonly [{
    readonly flat: true;
    readonly stateConfig: StateConfig<"templateColumns", string>;
    }];
    }>;
    createDOM(config: EditorConfig): HTMLElement;
    exportDOM(): DOMExportOutput;
    updateDOM(prevNode: this, dom: HTMLElement): boolean;
    isShadowRoot(): boolean;
    canBeEmpty(): boolean;
    getTemplateColumns(): StateConfigValue<typeof templateColumnsState>;
    setTemplateColumns(templateColumns: string): this;
}

export declare class LayoutItemNode extends ElementNode {
    $config(): BaseStaticNodeConfig & {
        readonly "layout-item"?: {
            readonly extends: typeof ElementNode;
            readonly importDOM: DOMConversionMap<HTMLElement>;
        } | undefined;
    } & StaticNodeTypeAccessor<"layout-item"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof ElementNode;
    readonly importDOM: DOMConversionMap<HTMLElement>;
    }>;
    createDOM(config: EditorConfig): HTMLElement;
    updateDOM(): boolean;
    collapseAtStart(): boolean;
    isShadowRoot(): boolean;
}

declare const maxWidthState: StateConfig<"maxWidth", number>;

export declare class MermaidNode extends DecoratorNode<JSX.Element> {
    $config(): BaseStaticNodeConfig & {
        readonly mermaid?: {
            readonly extends: typeof DecoratorNode;
            readonly importDOM: DOMConversionMap<HTMLElement>;
            readonly stateConfigs: readonly [{
                readonly flat: true;
                readonly stateConfig: StateConfig<"code", string>;
            }];
        } | undefined;
    } & StaticNodeTypeAccessor<"mermaid"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof DecoratorNode;
    readonly importDOM: DOMConversionMap<HTMLElement>;
    readonly stateConfigs: readonly [{
    readonly flat: true;
    readonly stateConfig: StateConfig<"code", string>;
    }];
    }>;
    exportDOM(): DOMExportOutput;
    createDOM(_config: EditorConfig): HTMLElement;
    updateDOM(): false;
    getTextContent(): string;
    getCode(): StateConfigValue<typeof codeState>;
    setCode(code: string): this;
    decorate(): JSX.Element;
    isIsolated(): true;
}

export declare function Modal({ onClose, children, title, closeOnClickOutside, contentStyle, }: {
    children: ReactNode;
    closeOnClickOutside?: boolean;
    contentStyle?: CSSProperties;
    onClose: () => void;
    title: string;
}): JSX.Element;

export declare function NotionLikeEditor({ showToolbar, autoFocus, measureTypingPerf, initialEditorState, initialMarkdown, onChange, onChangePlainText, onChangeHtml, onChangeMarkdown, debounceMs, isCodeShiki, imageUploadHandler, customLinkMatchers, onEditorReady, extraPlugins, extraComponentPickerOptions, onFullscreenChange, }: NotionLikeEditorProps): JSX;

export declare const NotionLikeEditorNodes: Array<Klass<LexicalNode>>;

export declare interface NotionLikeEditorProps {
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
    /**
     * 全画面モード変更時のコールバック
     * @param isFullscreen - 全画面モードかどうか
     */
    onFullscreenChange?: (isFullscreen: boolean) => void;
}

export declare const NotionLikeEditorTheme: EditorThemeClasses;

export declare function NotionLikeViewer({ initialViewerState, isCodeShiki, customLinkMatchers, searchTerms, }: NotionLikeViewerProps): JSX;

export declare interface NotionLikeViewerProps {
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

export declare const NotionLikeViewerTheme: EditorThemeClasses;

/**
 * Markdown プレビューを開くためのコマンド
 */
export declare const OPEN_MARKDOWN_PREVIEW_COMMAND: LexicalCommand<void>;

export declare const PACKAGE_VERSION = "0.1.0";

export declare class PageBreakNode extends DecoratorNode<JSX.Element> {
    $config(): BaseStaticNodeConfig & {
        readonly "page-break"?: {
            readonly extends: typeof DecoratorNode;
            readonly importDOM: DOMConversionMap<HTMLElement>;
        } | undefined;
    } & StaticNodeTypeAccessor<"page-break"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof DecoratorNode;
    readonly importDOM: DOMConversionMap<HTMLElement>;
    }>;
    createDOM(): HTMLElement;
    getTextContent(): string;
    isInline(): false;
    updateDOM(): boolean;
    decorate(): JSX.Element;
}

/**
 * Pecus固有エディタのProps
 * 現在はCoreEditorPropsと同じ（workspaceId等はハンドラー側で管理）
 */
export declare type PecusEditorProps = CoreEditorProps;

export declare const PLAYGROUND_TRANSFORMERS: Array<Transformer_2>;

declare type Props = {
    className?: string;
    placeholderClassName?: string;
    placeholder: string;
};

declare type Props_2 = Readonly<{
    'data-test-id'?: string;
    children: ReactNode;
}>;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
declare type Props_3 = {
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

declare type Props_4 = Readonly<{
    'data-test-id'?: string;
    accept?: string;
    label: string;
    onChange: (files: FileList | null) => void;
}>;

declare type Props_5 = {
    initialEquation?: string;
    onConfirm: (equation: string, inline: boolean) => void;
};

declare type Props_6 = Readonly<{
    'data-test-id'?: string;
    label: string;
    onChange: (val: string) => void;
    placeholder?: string;
    value: string;
    type?: HTMLInputTypeAttribute;
}>;

declare const rootTypeToRootName: {
    root: string;
    table: string;
};

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export declare function sanitizeUrl(url: string): string;

/** 検索ハイライト用のマークID */
export declare const SEARCH_HIGHLIGHT_ID = "__search_highlight__";

export declare function SearchHighlightPlugin({ searchTerms }: SearchHighlightPluginProps): null;

declare interface SearchHighlightPluginProps {
    /** 検索語の配列（パース済み） */
    searchTerms?: string[];
}

export declare function Select({ children, label, className, ...other }: SelectProps): JSX.Element;

declare type SelectIntrinsicProps = JSX.IntrinsicElements['select'];

declare interface SelectProps extends SelectIntrinsicProps {
    label: string;
}

declare type SerializedAutocompleteNode = Spread<{
    uuid: string;
}, SerializedTextNode>;

declare type SerializedImageNode = Spread<{
    altText: string;
    caption: SerializedEditor;
    height?: number;
    maxWidth: number;
    showCaption: boolean;
    src: string;
    width?: number;
}, SerializedLexicalNode>;

declare type SerializedStickyNode = Spread<{
    xOffset: number;
    yOffset: number;
    color: StickyNoteColor;
    caption: SerializedEditor;
}, SerializedLexicalNode>;

declare type SettingName = keyof typeof DEFAULT_SETTINGS;

declare type Settings = {
    -readonly [K in keyof typeof DEFAULT_SETTINGS]: (typeof DEFAULT_SETTINGS)[K] extends boolean ? boolean : (typeof DEFAULT_SETTINGS)[K] extends string ? string : (typeof DEFAULT_SETTINGS)[K];
};

export declare const SettingsContext: ({ children, initialSettings, }: {
    children: ReactNode;
    initialSettings?: Partial<Settings>;
}) => JSX.Element;

declare type SettingsContextShape = {
    setOption: <K extends SettingName>(name: K, value: SettingValue<K>) => void;
    settings: Settings;
};

declare type SettingValue<K extends SettingName> = Settings[K];

export declare const SharedHistoryContext: ({ children }: {
    children: ReactNode;
}) => JSX.Element;

declare const showCaptionState: StateConfig<"showCaption", boolean>;

export declare type ShowFlashMessage = (message?: React.ReactNode, duration?: number) => void;

/** @noInheritDoc */
export declare class SpecialTextNode extends TextNode {
    $config(): BaseStaticNodeConfig & {
        readonly text?: {
            readonly importDOM: {
                readonly '#text': () => {
                    conversion: (domNode: Node) => DOMConversionOutput;
                    priority: 0;
                };
                readonly b: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly code: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly em: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly i: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly mark: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly s: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly span: () => {
                    conversion: (domNode: HTMLSpanElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly strong: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly sub: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly sup: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
                readonly u: () => {
                    conversion: (domNode: HTMLElement) => DOMConversionOutput;
                    priority: 0;
                };
            };
        } | undefined;
    } & {
        readonly specialText?: {
            readonly extends: typeof TextNode;
        } | undefined;
    } & StaticNodeTypeAccessor<"specialText"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof TextNode;
    }>;
    createDOM(config: EditorConfig): HTMLElement;
    updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean;
    isTextEntity(): true;
    canInsertTextAfter(): boolean;
}

declare const srcState: StateConfig<"src", string>;

export declare const StickyEditorTheme: EditorThemeClasses;

export declare class StickyNode extends DecoratorNode<JSX.Element> {
    __caption: LexicalEditor;
    $config(): BaseStaticNodeConfig & {
        readonly sticky?: {
            readonly extends: typeof DecoratorNode;
            readonly stateConfigs: readonly [{
                readonly flat: true;
                readonly stateConfig: StateConfig<"xOffset", number>;
            }, {
                readonly flat: true;
                readonly stateConfig: StateConfig<"yOffset", number>;
            }, {
                readonly flat: true;
                readonly stateConfig: StateConfig<"color", "pink" | "yellow">;
            }];
        } | undefined;
    } & StaticNodeTypeAccessor<"sticky"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof DecoratorNode;
    readonly stateConfigs: readonly [{
    readonly flat: true;
    readonly stateConfig: StateConfig<"xOffset", number>;
    }, {
    readonly flat: true;
    readonly stateConfig: StateConfig<"yOffset", number>;
    }, {
    readonly flat: true;
    readonly stateConfig: StateConfig<"color", "pink" | "yellow">;
    }];
    }>;
    constructor(key?: NodeKey | undefined);
    afterCloneFrom(prevNode: this): void;
    updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedStickyNode>): this;
    exportJSON(): SerializedStickyNode;
    createDOM(_config: EditorConfig): HTMLElement;
    updateDOM(): false;
    setPosition(x: number, y: number): void;
    toggleColor(): void;
    getXOffset(): StateConfigValue<typeof xOffsetState>;
    getYOffset(): StateConfigValue<typeof yOffsetState>;
    getColor(): StateConfigValue<typeof colorState>;
    decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element;
    isIsolated(): true;
}

declare type StickyNoteColor = 'pink' | 'yellow';

export declare function Switch({ checked, onClick, text, id, }: Readonly<{
    checked: boolean;
    id?: string;
    onClick: (e: React_2.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    text: string;
}>): JSX.Element;

export declare function TableContext({ children }: {
    children: JSX.Element;
}): JSX.Element;

declare const templateColumnsState: StateConfig<"templateColumns", string>;

export declare function TextInput({ label, value, onChange, placeholder, 'data-test-id': dataTestId, type, }: Props_6): JSX.Element;

export declare const ToolbarContext: ({ children }: {
    children: ReactNode;
}) => JSX.Element;

declare type ToolbarState = typeof INITIAL_TOOLBAR_STATE;

declare type ToolbarStateKey = keyof ToolbarState;

declare type ToolbarStateValue<Key extends ToolbarStateKey> = ToolbarState[Key];

declare const tweetIDState: StateConfig<"id", string>;

export declare class TweetNode extends DecoratorBlockNode {
    $config(): BaseStaticNodeConfig & {
        readonly tweet?: {
            readonly extends: typeof DecoratorBlockNode;
            readonly importDOM: DOMConversionMap<HTMLElement>;
            readonly stateConfigs: readonly [{
                readonly flat: true;
                readonly stateConfig: StateConfig<"id", string>;
            }];
        } | undefined;
    } & StaticNodeTypeAccessor<"tweet"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof DecoratorBlockNode;
    readonly importDOM: DOMConversionMap<HTMLElement>;
    readonly stateConfigs: readonly [{
    readonly flat: true;
    readonly stateConfig: StateConfig<"id", string>;
    }];
    }>;
    exportDOM(): DOMExportOutput;
    getId(): StateConfigValue<typeof tweetIDState>;
    getTextContent(_includeInert?: boolean | undefined, _includeDirectionless?: false | undefined): string;
    decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element;
}

export declare function useComponentPickerContext(): ComponentPickerContextValue;

export declare const useFlashMessageContext: () => ShowFlashMessage;

export declare function useFullscreen(): FullscreenContextType;

/**
 * 画像アップロードハンドラーを取得するフック
 * @returns ハンドラー（未設定の場合はnull）
 */
export declare function useImageUpload(): ImageUploadHandler | null;

export declare function useModal(): [
JSX.Element | null,
(title: string, showModal: (onClose: () => void) => JSX.Element, closeOnClickOutside?: boolean, contentStyle?: CSSProperties) => void
];

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export declare function useReport(): (arg0: string) => ReturnType<typeof setTimeout>;

export declare const useSettings: () => SettingsContextShape;

export declare const useSharedHistoryContext: () => ContextShape;

export declare const useToolbarState: () => ContextShape_2;

declare const uuidState: StateConfig<"uuid", string>;

export declare function validateUrl(url: string): boolean;

declare const videoIDState: StateConfig<"videoID", string>;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export declare function Viewer(): JSX;

declare const widthState: StateConfig<"width", number | "inherit">;

declare const xOffsetState: StateConfig<"xOffset", number>;

declare const yOffsetState: StateConfig<"yOffset", number>;

export declare class YouTubeNode extends DecoratorBlockNode {
    $config(): BaseStaticNodeConfig & {
        readonly youtube?: {
            readonly extends: typeof DecoratorBlockNode;
            readonly importDOM: DOMConversionMap<HTMLElement>;
            readonly stateConfigs: readonly [{
                readonly flat: true;
                readonly stateConfig: StateConfig<"videoID", string>;
            }];
        } | undefined;
    } & StaticNodeTypeAccessor<"youtube"> & StaticNodeConfigAccessor<    {
    readonly extends: typeof DecoratorBlockNode;
    readonly importDOM: DOMConversionMap<HTMLElement>;
    readonly stateConfigs: readonly [{
    readonly flat: true;
    readonly stateConfig: StateConfig<"videoID", string>;
    }];
    }>;
    exportDOM(): DOMExportOutput;
    updateDOM(): false;
    getId(): StateConfigValue<typeof videoIDState>;
    getTextContent(_includeInert?: boolean | undefined, _includeDirectionless?: false | undefined): string;
    decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element;
}

export { }
