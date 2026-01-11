import * as lexical from 'lexical';
import { TextNode, Spread, SerializedTextNode, NodeKey, EditorConfig, LexicalEditor, DOMExportOutput, ElementNode, RangeSelection, DOMConversionMap, SerializedElementNode, LexicalNode, DecoratorNode, StateConfigValue, StateValueOrUpdater, SerializedLexicalNode, ElementFormatType, SerializedEditor, LexicalUpdateJSON, Klass } from 'lexical';
import { JSX } from 'react';
import { DecoratorBlockNode, SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SerializedAutocompleteNode = Spread<{
    uuid: string;
}, SerializedTextNode>;
declare class AutocompleteNode extends TextNode {
    /**
     * A unique uuid is generated for each session and assigned to the instance.
     * This helps to:
     * - Ensures max one Autocomplete node per session.
     * - Ensure that when collaboration is enabled, this node is not shown in
     *   other sessions.
     * See https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/AutocompletePlugin/index.tsx
     */
    __uuid: string;
    static clone(node: AutocompleteNode): AutocompleteNode;
    static getType(): 'autocomplete';
    static importDOM(): null;
    static importJSON(serializedNode: SerializedAutocompleteNode): AutocompleteNode;
    exportJSON(): SerializedAutocompleteNode;
    constructor(text: string, uuid: string, key?: NodeKey);
    updateDOM(_prevNode: this, _dom: HTMLElement, _config: EditorConfig): boolean;
    exportDOM(_: LexicalEditor): DOMExportOutput;
    excludeFromCopy(): boolean;
    createDOM(config: EditorConfig): HTMLElement;
}
declare function $createAutocompleteNode(text: string, uuid: string): AutocompleteNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SerializedCollapsibleContainerNode = Spread<{
    open: boolean;
}, SerializedElementNode>;
declare class CollapsibleContainerNode extends ElementNode {
    __open: boolean;
    constructor(open: boolean, key?: NodeKey);
    static getType(): string;
    static clone(node: CollapsibleContainerNode): CollapsibleContainerNode;
    isShadowRoot(): boolean;
    collapseAtStart(_selection: RangeSelection): boolean;
    createDOM(_config: EditorConfig, editor: LexicalEditor): HTMLElement;
    updateDOM(prevNode: this, dom: HTMLDetailsElement): boolean;
    static importDOM(): DOMConversionMap<HTMLDetailsElement> | null;
    static importJSON(serializedNode: SerializedCollapsibleContainerNode): CollapsibleContainerNode;
    exportDOM(): DOMExportOutput;
    exportJSON(): SerializedCollapsibleContainerNode;
    setOpen(open: boolean): void;
    getOpen(): boolean;
    toggleOpen(): void;
}
declare function $createCollapsibleContainerNode(isOpen: boolean): CollapsibleContainerNode;
declare function $isCollapsibleContainerNode(node: LexicalNode | null | undefined): node is CollapsibleContainerNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SerializedCollapsibleContentNode = SerializedElementNode;
declare class CollapsibleContentNode extends ElementNode {
    static getType(): string;
    static clone(node: CollapsibleContentNode): CollapsibleContentNode;
    createDOM(_config: EditorConfig, editor: LexicalEditor): HTMLElement;
    updateDOM(_prevNode: this, _dom: HTMLElement): boolean;
    static importDOM(): DOMConversionMap | null;
    exportDOM(): DOMExportOutput;
    static importJSON(serializedNode: SerializedCollapsibleContentNode): CollapsibleContentNode;
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

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SerializedEmojiNode = Spread<{
    className: string;
}, SerializedTextNode>;
declare class EmojiNode extends TextNode {
    __className: string;
    static getType(): string;
    static clone(node: EmojiNode): EmojiNode;
    constructor(className: string, text: string, key?: NodeKey);
    createDOM(config: EditorConfig): HTMLElement;
    updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean;
    static importJSON(serializedNode: SerializedEmojiNode): EmojiNode;
    exportJSON(): SerializedEmojiNode;
    getClassName(): string;
}
declare function $isEmojiNode(node: LexicalNode | null | undefined): node is EmojiNode;
declare function $createEmojiNode(className: string, emojiText: string): EmojiNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SerializedEquationNode = Spread<{
    equation: string;
    inline: boolean;
}, SerializedLexicalNode>;
declare class EquationNode extends DecoratorNode<JSX.Element> {
    __equation: string;
    __inline: boolean;
    static getType(): string;
    static clone(node: EquationNode): EquationNode;
    constructor(equation: string, inline?: boolean, key?: NodeKey);
    static importJSON(serializedNode: SerializedEquationNode): EquationNode;
    exportJSON(): SerializedEquationNode;
    createDOM(_config: EditorConfig): HTMLElement;
    exportDOM(): DOMExportOutput;
    static importDOM(): DOMConversionMap | null;
    updateDOM(prevNode: this): boolean;
    getTextContent(): string;
    getEquation(): string;
    setEquation(equation: string): void;
    decorate(): JSX.Element;
}
declare function $createEquationNode(equation?: string, inline?: boolean): EquationNode;
declare function $isEquationNode(node: LexicalNode | null | undefined): node is EquationNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SerializedFigmaNode = Spread<{
    documentID: string;
}, SerializedDecoratorBlockNode>;
declare class FigmaNode extends DecoratorBlockNode {
    __id: string;
    static getType(): string;
    static clone(node: FigmaNode): FigmaNode;
    static importJSON(serializedNode: SerializedFigmaNode): FigmaNode;
    exportJSON(): SerializedFigmaNode;
    constructor(id: string, format?: ElementFormatType, key?: NodeKey);
    updateDOM(): false;
    getId(): string;
    getTextContent(_includeInert?: boolean | undefined, _includeDirectionless?: false | undefined): string;
    decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element;
}
declare function $createFigmaNode(documentID: string): FigmaNode;
declare function $isFigmaNode(node: FigmaNode | LexicalNode | null | undefined): node is FigmaNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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
declare class ImageNode extends DecoratorNode<JSX.Element> {
    __src: string;
    __altText: string;
    __width: 'inherit' | number;
    __height: 'inherit' | number;
    __maxWidth: number;
    __showCaption: boolean;
    __caption: LexicalEditor;
    __captionsEnabled: boolean;
    static getType(): string;
    static clone(node: ImageNode): ImageNode;
    static importJSON(serializedNode: SerializedImageNode): ImageNode;
    updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedImageNode>): this;
    exportDOM(): DOMExportOutput;
    static importDOM(): DOMConversionMap | null;
    constructor(src: string, altText: string, maxWidth: number, width?: 'inherit' | number, height?: 'inherit' | number, showCaption?: boolean, caption?: LexicalEditor, captionsEnabled?: boolean, key?: NodeKey);
    exportJSON(): SerializedImageNode;
    setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void;
    setShowCaption(showCaption: boolean): void;
    createDOM(config: EditorConfig): HTMLElement;
    updateDOM(): false;
    getSrc(): string;
    getAltText(): string;
    decorate(): JSX.Element;
}
declare function $createImageNode({ altText, height, maxWidth, captionsEnabled, src, width, showCaption, caption, key, }: ImagePayload): ImageNode;
declare function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SerializedKeywordNode = SerializedTextNode;
declare class KeywordNode extends TextNode {
    static getType(): string;
    static clone(node: KeywordNode): KeywordNode;
    static importJSON(serializedNode: SerializedKeywordNode): KeywordNode;
    createDOM(config: EditorConfig): HTMLElement;
    canInsertTextBefore(): boolean;
    canInsertTextAfter(): boolean;
    isTextEntity(): true;
}
declare function $createKeywordNode(keyword?: string): KeywordNode;
declare function $isKeywordNode(node: LexicalNode | null | undefined): boolean;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SerializedLayoutContainerNode = Spread<{
    templateColumns: string;
}, SerializedElementNode>;
declare class LayoutContainerNode extends ElementNode {
    __templateColumns: string;
    constructor(templateColumns: string, key?: NodeKey);
    static getType(): string;
    static clone(node: LayoutContainerNode): LayoutContainerNode;
    createDOM(config: EditorConfig): HTMLElement;
    exportDOM(): DOMExportOutput;
    updateDOM(prevNode: this, dom: HTMLElement): boolean;
    static importDOM(): DOMConversionMap | null;
    static importJSON(json: SerializedLayoutContainerNode): LayoutContainerNode;
    updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedLayoutContainerNode>): this;
    isShadowRoot(): boolean;
    canBeEmpty(): boolean;
    exportJSON(): SerializedLayoutContainerNode;
    getTemplateColumns(): string;
    setTemplateColumns(templateColumns: string): this;
}
declare function $createLayoutContainerNode(templateColumns?: string): LayoutContainerNode;
declare function $isLayoutContainerNode(node: LexicalNode | null | undefined): node is LayoutContainerNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SerializedLayoutItemNode = SerializedElementNode;
declare class LayoutItemNode extends ElementNode {
    static getType(): string;
    static clone(node: LayoutItemNode): LayoutItemNode;
    createDOM(config: EditorConfig): HTMLElement;
    updateDOM(): boolean;
    collapseAtStart(): boolean;
    static importDOM(): DOMConversionMap | null;
    static importJSON(serializedNode: SerializedLayoutItemNode): LayoutItemNode;
    isShadowRoot(): boolean;
}
declare function $createLayoutItemNode(): LayoutItemNode;
declare function $isLayoutItemNode(node: LexicalNode | null | undefined): node is LayoutItemNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SerializedMentionNode = Spread<{
    mentionName: string;
}, SerializedTextNode>;
declare class MentionNode extends TextNode {
    __mention: string;
    static getType(): string;
    static clone(node: MentionNode): MentionNode;
    static importJSON(serializedNode: SerializedMentionNode): MentionNode;
    constructor(mentionName: string, text?: string, key?: NodeKey);
    exportJSON(): SerializedMentionNode;
    createDOM(config: EditorConfig): HTMLElement;
    exportDOM(): DOMExportOutput;
    static importDOM(): DOMConversionMap | null;
    isTextEntity(): true;
    canInsertTextBefore(): boolean;
    canInsertTextAfter(): boolean;
}
declare function $createMentionNode(mentionName: string, textContent?: string): MentionNode;
declare function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SerializedPageBreakNode = SerializedLexicalNode;
declare class PageBreakNode extends DecoratorNode<JSX.Element> {
    static getType(): string;
    static clone(node: PageBreakNode): PageBreakNode;
    static importJSON(serializedNode: SerializedPageBreakNode): PageBreakNode;
    static importDOM(): DOMConversionMap | null;
    createDOM(): HTMLElement;
    getTextContent(): string;
    isInline(): false;
    updateDOM(): boolean;
    decorate(): JSX.Element;
}
declare function $createPageBreakNode(): PageBreakNode;
declare function $isPageBreakNode(node: LexicalNode | null | undefined): node is PageBreakNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/** @noInheritDoc */
declare class SpecialTextNode extends TextNode {
    static getType(): string;
    static clone(node: SpecialTextNode): SpecialTextNode;
    createDOM(config: EditorConfig): HTMLElement;
    updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean;
    static importJSON(serializedNode: SerializedTextNode): SpecialTextNode;
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

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type StickyNoteColor = 'pink' | 'yellow';
type SerializedStickyNode = Spread<{
    xOffset: number;
    yOffset: number;
    color: StickyNoteColor;
    caption: SerializedEditor;
}, SerializedLexicalNode>;
declare class StickyNode extends DecoratorNode<JSX.Element> {
    __x: number;
    __y: number;
    __color: StickyNoteColor;
    __caption: LexicalEditor;
    static getType(): string;
    static clone(node: StickyNode): StickyNode;
    static importJSON(serializedNode: SerializedStickyNode): StickyNode;
    updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedStickyNode>): this;
    constructor(x: number, y: number, color: 'pink' | 'yellow', caption?: LexicalEditor, key?: NodeKey);
    exportJSON(): SerializedStickyNode;
    createDOM(_config: EditorConfig): HTMLElement;
    updateDOM(): false;
    setPosition(x: number, y: number): void;
    toggleColor(): void;
    decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element;
    isIsolated(): true;
}
declare function $isStickyNode(node: LexicalNode | null | undefined): node is StickyNode;
declare function $createStickyNode(xOffset: number, yOffset: number): StickyNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SerializedTweetNode = Spread<{
    id: string;
}, SerializedDecoratorBlockNode>;
declare class TweetNode extends DecoratorBlockNode {
    __id: string;
    static getType(): string;
    static clone(node: TweetNode): TweetNode;
    static importJSON(serializedNode: SerializedTweetNode): TweetNode;
    exportJSON(): SerializedTweetNode;
    static importDOM(): DOMConversionMap<HTMLDivElement> | null;
    exportDOM(): DOMExportOutput;
    constructor(id: string, format?: ElementFormatType, key?: NodeKey);
    getId(): string;
    getTextContent(_includeInert?: boolean | undefined, _includeDirectionless?: false | undefined): string;
    decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element;
}
declare function $createTweetNode(tweetID: string): TweetNode;
declare function $isTweetNode(node: TweetNode | LexicalNode | null | undefined): node is TweetNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type SerializedYouTubeNode = Spread<{
    videoID: string;
}, SerializedDecoratorBlockNode>;
declare class YouTubeNode extends DecoratorBlockNode {
    __id: string;
    static getType(): string;
    static clone(node: YouTubeNode): YouTubeNode;
    static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode;
    exportJSON(): SerializedYouTubeNode;
    constructor(id: string, format?: ElementFormatType, key?: NodeKey);
    exportDOM(): DOMExportOutput;
    static importDOM(): DOMConversionMap | null;
    updateDOM(): false;
    getId(): string;
    getTextContent(_includeInert?: boolean | undefined, _includeDirectionless?: false | undefined): string;
    decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element;
}
declare function $createYouTubeNode(videoID: string): YouTubeNode;
declare function $isYouTubeNode(node: YouTubeNode | LexicalNode | null | undefined): node is YouTubeNode;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare const NotionLikeEditorNodes: Array<Klass<LexicalNode>>;

export { $createAutocompleteNode, $createCollapsibleContainerNode, $createCollapsibleContentNode, $createCollapsibleTitleNode, $createDateTimeNode, $createEmojiNode, $createEquationNode, $createFigmaNode, $createImageNode, $createKeywordNode, $createLayoutContainerNode, $createLayoutItemNode, $createMentionNode, $createPageBreakNode, $createSpecialTextNode, $createStickyNode, $createTweetNode, $createYouTubeNode, $isCollapsibleContainerNode, $isCollapsibleContentNode, $isCollapsibleTitleNode, $isDateTimeNode, $isEmojiNode, $isEquationNode, $isFigmaNode, $isImageNode, $isKeywordNode, $isLayoutContainerNode, $isLayoutItemNode, $isMentionNode, $isPageBreakNode, $isSpecialTextNode, $isStickyNode, $isTweetNode, $isYouTubeNode, AutocompleteNode, CollapsibleContainerNode, CollapsibleContentNode, CollapsibleTitleNode, DateTimeNode, EmojiNode, EquationNode, FigmaNode, ImageNode, type ImagePayload, KeywordNode, LayoutContainerNode, LayoutItemNode, MentionNode, NotionLikeEditorNodes, PageBreakNode, type SerializedImageNode, SpecialTextNode, StickyNode, TweetNode, YouTubeNode };
