export { $createAutocompleteNode, $createCollapsibleContainerNode, $createCollapsibleContentNode, $createCollapsibleTitleNode, $createDateTimeNode, $createEmojiNode, $createEquationNode, $createFigmaNode, $createImageNode, $createKeywordNode, $createLayoutContainerNode, $createLayoutItemNode, $createMentionNode, $createPageBreakNode, $createSpecialTextNode, $createStickyNode, $createTweetNode, $createYouTubeNode, $isCollapsibleContainerNode, $isCollapsibleContentNode, $isCollapsibleTitleNode, $isDateTimeNode, $isEmojiNode, $isEquationNode, $isFigmaNode, $isImageNode, $isKeywordNode, $isLayoutContainerNode, $isLayoutItemNode, $isMentionNode, $isPageBreakNode, $isSpecialTextNode, $isStickyNode, $isTweetNode, $isYouTubeNode, AutocompleteNode, CollapsibleContainerNode, CollapsibleContentNode, CollapsibleTitleNode, DateTimeNode, EmojiNode, EquationNode, FigmaNode, ImageNode, ImagePayload, KeywordNode, LayoutContainerNode, LayoutItemNode, MentionNode, NotionLikeEditorNodes, PageBreakNode, SerializedImageNode, SpecialTextNode, StickyNode, TweetNode, YouTubeNode } from './nodes-headless.js';
import { NodeKey, LexicalEditor } from 'lexical';
import { JSX } from 'react';
import '@lexical/react/LexicalDecoratorBlockNode';

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type EquationComponentProps = {
    equation: string;
    inline: boolean;
    nodeKey: NodeKey;
};
declare function EquationComponent({ equation, inline, nodeKey }: EquationComponentProps): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare function ImageComponent({ src, altText, nodeKey, width, height, maxWidth, resizable, showCaption, caption, captionsEnabled, }: {
    altText: string;
    caption: LexicalEditor;
    height: 'inherit' | number;
    maxWidth: number;
    nodeKey: NodeKey;
    resizable: boolean;
    showCaption: boolean;
    src: string;
    width: 'inherit' | number;
    captionsEnabled: boolean;
}): JSX.Element;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare function StickyComponent({ x, y, nodeKey, color, caption, }: {
    caption: LexicalEditor;
    color: 'pink' | 'yellow';
    nodeKey: NodeKey;
    x: number;
    y: number;
}): JSX.Element | null;

export { EquationComponent, ImageComponent, StickyComponent };
