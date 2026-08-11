import { BaseStaticNodeConfig } from 'lexical';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';
import { DecoratorNode } from 'lexical';
import { DOMConversionMap } from 'lexical';
import { DOMConversionOutput } from 'lexical';
import { DOMExportOutput } from 'lexical';
import { EditorConfig } from 'lexical';
import { ElementNode } from 'lexical';
import type { JSX } from 'react';
import type { Klass } from 'lexical';
import { LexicalEditor } from 'lexical';
import { LexicalNode } from 'lexical';
import type { LexicalUpdateJSON } from 'lexical';
import type { NodeKey } from 'lexical';
import { RangeSelection } from 'lexical';
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

declare const colorState: StateConfig<"color", "pink" | "yellow">;

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

declare const documentIDState: StateConfig<"documentID", string>;

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

declare const heightState: StateConfig<"height", number | "inherit">;

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

export declare interface ImagePayload {
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

declare const inlineState: StateConfig<"inline", boolean>;

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

export declare const NotionLikeEditorNodes: Array<Klass<LexicalNode>>;

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

declare type SerializedAutocompleteNode = Spread<{
    uuid: string;
}, SerializedTextNode>;

export declare type SerializedImageNode = Spread<{
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

declare const showCaptionState: StateConfig<"showCaption", boolean>;

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

declare const templateColumnsState: StateConfig<"templateColumns", string>;

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

declare const uuidState: StateConfig<"uuid", string>;

declare const videoIDState: StateConfig<"videoID", string>;

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
