import * as lexical from 'lexical';
import { ElementNode, RangeSelection, EditorConfig, LexicalEditor, DOMExportOutput, LexicalNode, TextNode, Spread, SerializedTextNode, StateConfigValue, StateValueOrUpdater, DecoratorNode, NodeKey, LexicalUpdateJSON, SerializedEditor, SerializedLexicalNode, Klass } from 'lexical';
import { JSX } from 'react';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';

declare class CollapsibleContainerNode extends ElementNode {
    $config(): lexical.StaticNodeConfigRecord<"collapsible-container", {
        extends: typeof ElementNode;
        importDOM: lexical.DOMConversionMap<HTMLElement>;
        stateConfigs: {
            flat: true;
            stateConfig: lexical.StateConfig<"open", boolean>;
        }[];
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
declare function $createCollapsibleContainerNode(isOpen: boolean): CollapsibleContainerNode;
declare function $isCollapsibleContainerNode(node: LexicalNode | null | undefined): node is CollapsibleContainerNode;

declare class CollapsibleContentNode extends ElementNode {
    $config(): lexical.StaticNodeConfigRecord<"collapsible-content", {
        extends: typeof ElementNode;
        importDOM: lexical.DOMConversionMap<HTMLElement>;
    }>;
    createDOM(_config: EditorConfig, editor: LexicalEditor): HTMLElement;
    updateDOM(_prevNode: this, _dom: HTMLElement): boolean;
    exportDOM(): DOMExportOutput;
    isShadowRoot(): boolean;
}
declare function $createCollapsibleContentNode(): CollapsibleContentNode;
declare function $isCollapsibleContentNode(node: LexicalNode | null | undefined): node is CollapsibleContentNode;

/** @noInheritDoc */
declare class CollapsibleTitleNode extends ElementNode {
    /** @internal */
    $config(): lexical.StaticNodeConfigRecord<"collapsible-title", {
        $transform(node: CollapsibleTitleNode): void;
        extends: typeof ElementNode;
        importDOM: lexical.DOMConversionMap<HTMLElement>;
    }>;
    createDOM(_config: EditorConfig, editor: LexicalEditor): HTMLElement;
    updateDOM(_prevNode: this, _dom: HTMLElement): boolean;
    insertNewAfter(_: RangeSelection, restoreSelection?: boolean): ElementNode;
}
declare function $createCollapsibleTitleNode(): CollapsibleTitleNode;
declare function $isCollapsibleTitleNode(node: LexicalNode | null | undefined): node is CollapsibleTitleNode;

type SerializedAutocompleteNode = Spread<{
    uuid: string;
}, SerializedTextNode>;
declare const uuidState: lexical.StateConfig<"uuid", string>;
declare class AutocompleteNode extends TextNode {
    /**
     * A unique uuid is generated for each session and assigned to the instance.
     * This helps to:
     * - Ensures max one Autocomplete node per session.
     * - Ensure that when collaboration is enabled, this node is not shown in
     *   other sessions.
     * See https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/AutocompletePlugin/index.tsx
     */
    $config(): lexical.StaticNodeConfigRecord<"autocomplete", {
        extends: typeof TextNode;
        stateConfigs: {
            flat: true;
            stateConfig: lexical.StateConfig<"uuid", string>;
        }[];
    }>;
    exportJSON(): SerializedAutocompleteNode;
    updateDOM(_prevNode: this, _dom: HTMLElement, _config: EditorConfig): boolean;
    exportDOM(_: LexicalEditor): DOMExportOutput;
    excludeFromCopy(): boolean;
    createDOM(config: EditorConfig): HTMLElement;
    getUUID(): StateConfigValue<typeof uuidState>;
    setUUID(valueOrUpdater: StateValueOrUpdater<typeof uuidState>): this;
}
declare function $createAutocompleteNode(text: string, uuid: string): AutocompleteNode;

declare const dateTimeState: lexical.StateConfig<"dateTime", Date>;
declare class DateTimeNode extends DecoratorNode<JSX.Element> {
    $config(): lexical.StaticNodeConfigRecord<"datetime", {
        extends: typeof DecoratorNode;
        importDOM: lexical.DOMConversionMap<HTMLElement>;
        stateConfigs: {
            flat: true;
            stateConfig: lexical.StateConfig<"dateTime", Date>;
        }[];
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
declare function $createDateTimeNode(dateTime: Date): DateTimeNode;
declare function $isDateTimeNode(node: LexicalNode | null | undefined): node is DateTimeNode;

declare const classNameState: lexical.StateConfig<"className", string>;
declare class EmojiNode extends TextNode {
    $config(): lexical.StaticNodeConfigRecord<"emoji", {
        extends: typeof TextNode;
        stateConfigs: {
            flat: true;
            stateConfig: lexical.StateConfig<"className", string>;
        }[];
    }>;
    createDOM(config: EditorConfig): HTMLElement;
    updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean;
    getClassName(): StateConfigValue<typeof classNameState>;
    setClassName(valueOrUpdater: StateValueOrUpdater<typeof classNameState>): this;
}
declare function $isEmojiNode(node: LexicalNode | null | undefined): node is EmojiNode;
declare function $createEmojiNode(className: string, emojiText: string): EmojiNode;

declare const equationState: lexical.StateConfig<"equation", string>;
declare const inlineState: lexical.StateConfig<"inline", boolean>;
declare class EquationNode extends DecoratorNode<JSX.Element> {
    $config(): lexical.StaticNodeConfigRecord<"equation", {
        extends: typeof DecoratorNode;
        importDOM: lexical.DOMConversionMap<HTMLElement>;
        stateConfigs: ({
            flat: true;
            stateConfig: lexical.StateConfig<"equation", string>;
        } | {
            flat: true;
            stateConfig: lexical.StateConfig<"inline", boolean>;
        })[];
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
declare function $createEquationNode(equation?: string, inline?: boolean): EquationNode;
declare function $isEquationNode(node: LexicalNode | null | undefined): node is EquationNode;

declare const documentIDState: lexical.StateConfig<"documentID", string>;
declare class FigmaNode extends DecoratorBlockNode {
    $config(): lexical.StaticNodeConfigRecord<"figma", {
        extends: typeof DecoratorBlockNode;
        stateConfigs: {
            flat: true;
            stateConfig: lexical.StateConfig<"documentID", string>;
        }[];
    }>;
    updateDOM(): false;
    getId(): StateConfigValue<typeof documentIDState>;
    getTextContent(_includeInert?: boolean | undefined, _includeDirectionless?: false | undefined): string;
    decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element;
}
declare function $createFigmaNode(documentID: string): FigmaNode;
declare function $isFigmaNode(node: FigmaNode | LexicalNode | null | undefined): node is FigmaNode;

interface ImagePayload {
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
type SerializedImageNode = Spread<{
    altText: string;
    caption: SerializedEditor;
    height?: number;
    maxWidth: number;
    showCaption: boolean;
    src: string;
    width?: number;
}, SerializedLexicalNode>;
declare const srcState: lexical.StateConfig<"src", string>;
declare const altTextState: lexical.StateConfig<"altText", string>;
declare const widthState: lexical.StateConfig<"width", number | "inherit">;
declare const heightState: lexical.StateConfig<"height", number | "inherit">;
declare const maxWidthState: lexical.StateConfig<"maxWidth", number>;
declare const showCaptionState: lexical.StateConfig<"showCaption", boolean>;
declare const captionsEnabledState: lexical.StateConfig<"captionsEnabled", boolean>;
declare class ImageNode extends DecoratorNode<JSX.Element> {
    __caption: LexicalEditor;
    $config(): lexical.StaticNodeConfigRecord<"image", {
        extends: typeof DecoratorNode;
        importDOM: lexical.DOMConversionMap<HTMLElement>;
        stateConfigs: ({
            flat: true;
            stateConfig: lexical.StateConfig<"src", string>;
        } | {
            flat: true;
            stateConfig: lexical.StateConfig<"altText", string>;
        } | {
            flat: true;
            stateConfig: lexical.StateConfig<"width", number | "inherit">;
        } | {
            flat: true;
            stateConfig: lexical.StateConfig<"height", number | "inherit">;
        } | {
            flat: true;
            stateConfig: lexical.StateConfig<"maxWidth", number>;
        } | {
            flat: true;
            stateConfig: lexical.StateConfig<"showCaption", boolean>;
        } | {
            flat: true;
            stateConfig: lexical.StateConfig<"captionsEnabled", boolean>;
        })[];
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
declare function $createImageNode({ altText, height, maxWidth, captionsEnabled, src, width, showCaption, caption, key, }: ImagePayload): ImageNode;
declare function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode;

declare class KeywordNode extends TextNode {
    $config(): lexical.StaticNodeConfigRecord<"keyword", {
        extends: typeof TextNode;
    }>;
    createDOM(config: EditorConfig): HTMLElement;
    canInsertTextBefore(): boolean;
    canInsertTextAfter(): boolean;
    isTextEntity(): true;
}
declare function $createKeywordNode(keyword?: string): KeywordNode;
declare function $isKeywordNode(node: LexicalNode | null | undefined): boolean;

declare const templateColumnsState: lexical.StateConfig<"templateColumns", string>;
declare class LayoutContainerNode extends ElementNode {
    $config(): lexical.StaticNodeConfigRecord<"layout-container", {
        extends: typeof ElementNode;
        importDOM: lexical.DOMConversionMap<HTMLElement>;
        stateConfigs: {
            flat: true;
            stateConfig: lexical.StateConfig<"templateColumns", string>;
        }[];
    }>;
    createDOM(config: EditorConfig): HTMLElement;
    exportDOM(): DOMExportOutput;
    updateDOM(prevNode: this, dom: HTMLElement): boolean;
    isShadowRoot(): boolean;
    canBeEmpty(): boolean;
    getTemplateColumns(): StateConfigValue<typeof templateColumnsState>;
    setTemplateColumns(templateColumns: string): this;
}
declare function $createLayoutContainerNode(templateColumns?: string): LayoutContainerNode;
declare function $isLayoutContainerNode(node: LexicalNode | null | undefined): node is LayoutContainerNode;

declare class LayoutItemNode extends ElementNode {
    $config(): lexical.StaticNodeConfigRecord<"layout-item", {
        extends: typeof ElementNode;
        importDOM: lexical.DOMConversionMap<HTMLElement>;
    }>;
    createDOM(config: EditorConfig): HTMLElement;
    updateDOM(): boolean;
    collapseAtStart(): boolean;
    isShadowRoot(): boolean;
}
declare function $createLayoutItemNode(): LayoutItemNode;
declare function $isLayoutItemNode(node: LexicalNode | null | undefined): node is LayoutItemNode;

declare const codeState: lexical.StateConfig<"code", string>;
declare class MermaidNode extends DecoratorNode<JSX.Element> {
    $config(): lexical.StaticNodeConfigRecord<"mermaid", {
        extends: typeof DecoratorNode;
        importDOM: lexical.DOMConversionMap<HTMLElement>;
        stateConfigs: {
            flat: true;
            stateConfig: lexical.StateConfig<"code", string>;
        }[];
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
declare function $createMermaidNode(code?: string): MermaidNode;
declare function $isMermaidNode(node: LexicalNode | null | undefined): node is MermaidNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare const NotionLikeEditorNodes: Array<Klass<LexicalNode>>;

declare class PageBreakNode extends DecoratorNode<JSX.Element> {
    $config(): lexical.StaticNodeConfigRecord<"page-break", {
        extends: typeof DecoratorNode;
        importDOM: lexical.DOMConversionMap<HTMLElement>;
    }>;
    createDOM(): HTMLElement;
    getTextContent(): string;
    isInline(): false;
    updateDOM(): boolean;
    decorate(): JSX.Element;
}
declare function $createPageBreakNode(): PageBreakNode;
declare function $isPageBreakNode(node: LexicalNode | null | undefined): node is PageBreakNode;

/** @noInheritDoc */
declare class SpecialTextNode extends TextNode {
    $config(): lexical.StaticNodeConfigRecord<"specialText", {
        extends: typeof TextNode;
    }>;
    createDOM(config: EditorConfig): HTMLElement;
    updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean;
    isTextEntity(): true;
    canInsertTextAfter(): boolean;
}
/**
 * Creates a SpecialTextNode with the given text.
 * @param text - Text content for the SpecialTextNode.
 * @returns A new SpecialTextNode instance.
 */
declare function $createSpecialTextNode(text?: string): SpecialTextNode;
/**
 * Checks if a node is a SpecialTextNode.
 * @param node - Node to check.
 * @returns True if the node is a SpecialTextNode.
 */
declare function $isSpecialTextNode(node: LexicalNode | null | undefined): node is SpecialTextNode;

type StickyNoteColor = 'pink' | 'yellow';
type SerializedStickyNode = Spread<{
    xOffset: number;
    yOffset: number;
    color: StickyNoteColor;
    caption: SerializedEditor;
}, SerializedLexicalNode>;
declare const xOffsetState: lexical.StateConfig<"xOffset", number>;
declare const yOffsetState: lexical.StateConfig<"yOffset", number>;
declare const colorState: lexical.StateConfig<"color", "pink" | "yellow">;
declare class StickyNode extends DecoratorNode<JSX.Element> {
    __caption: LexicalEditor;
    $config(): lexical.StaticNodeConfigRecord<"sticky", {
        extends: typeof DecoratorNode;
        stateConfigs: ({
            flat: true;
            stateConfig: lexical.StateConfig<"xOffset", number>;
        } | {
            flat: true;
            stateConfig: lexical.StateConfig<"yOffset", number>;
        } | {
            flat: true;
            stateConfig: lexical.StateConfig<"color", "pink" | "yellow">;
        })[];
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
declare function $isStickyNode(node: LexicalNode | null | undefined): node is StickyNode;
declare function $createStickyNode(xOffset: number, yOffset: number): StickyNode;

declare const tweetIDState: lexical.StateConfig<"id", string>;
declare class TweetNode extends DecoratorBlockNode {
    $config(): lexical.StaticNodeConfigRecord<"tweet", {
        extends: typeof DecoratorBlockNode;
        importDOM: lexical.DOMConversionMap<HTMLElement>;
        stateConfigs: {
            flat: true;
            stateConfig: lexical.StateConfig<"id", string>;
        }[];
    }>;
    exportDOM(): DOMExportOutput;
    getId(): StateConfigValue<typeof tweetIDState>;
    getTextContent(_includeInert?: boolean | undefined, _includeDirectionless?: false | undefined): string;
    decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element;
}
declare function $createTweetNode(tweetID: string): TweetNode;
declare function $isTweetNode(node: TweetNode | LexicalNode | null | undefined): node is TweetNode;

declare const videoIDState: lexical.StateConfig<"videoID", string>;
declare class YouTubeNode extends DecoratorBlockNode {
    $config(): lexical.StaticNodeConfigRecord<"youtube", {
        extends: typeof DecoratorBlockNode;
        importDOM: lexical.DOMConversionMap<HTMLElement>;
        stateConfigs: {
            flat: true;
            stateConfig: lexical.StateConfig<"videoID", string>;
        }[];
    }>;
    exportDOM(): DOMExportOutput;
    updateDOM(): false;
    getId(): StateConfigValue<typeof videoIDState>;
    getTextContent(_includeInert?: boolean | undefined, _includeDirectionless?: false | undefined): string;
    decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element;
}
declare function $createYouTubeNode(videoID: string): YouTubeNode;
declare function $isYouTubeNode(node: YouTubeNode | LexicalNode | null | undefined): node is YouTubeNode;

export { $createAutocompleteNode, $createCollapsibleContainerNode, $createCollapsibleContentNode, $createCollapsibleTitleNode, $createDateTimeNode, $createEmojiNode, $createEquationNode, $createFigmaNode, $createImageNode, $createKeywordNode, $createLayoutContainerNode, $createLayoutItemNode, $createMermaidNode, $createPageBreakNode, $createSpecialTextNode, $createStickyNode, $createTweetNode, $createYouTubeNode, $isCollapsibleContainerNode, $isCollapsibleContentNode, $isCollapsibleTitleNode, $isDateTimeNode, $isEmojiNode, $isEquationNode, $isFigmaNode, $isImageNode, $isKeywordNode, $isLayoutContainerNode, $isLayoutItemNode, $isMermaidNode, $isPageBreakNode, $isSpecialTextNode, $isStickyNode, $isTweetNode, $isYouTubeNode, AutocompleteNode, CollapsibleContainerNode, CollapsibleContentNode, CollapsibleTitleNode, DateTimeNode, EmojiNode, EquationNode, FigmaNode, ImageNode, type ImagePayload, KeywordNode, LayoutContainerNode, LayoutItemNode, MermaidNode, NotionLikeEditorNodes, PageBreakNode, type SerializedImageNode, SpecialTextNode, StickyNode, TweetNode, YouTubeNode };
