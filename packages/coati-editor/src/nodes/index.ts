/**
 * @coati/editor/nodes - カスタムノード定義
 *
 * Lexical カスタムノードのエクスポート
 */

// AutocompleteNode
export { $createAutocompleteNode, AutocompleteNode } from './AutocompleteNode';

// CollapsibleNode（プラグインディレクトリから）
export {
  $createCollapsibleContainerNode,
  $isCollapsibleContainerNode,
  CollapsibleContainerNode,
} from '../plugins/CollapsiblePlugin/CollapsibleContainerNode';
export {
  $createCollapsibleContentNode,
  $isCollapsibleContentNode,
  CollapsibleContentNode,
} from '../plugins/CollapsiblePlugin/CollapsibleContentNode';
export {
  $createCollapsibleTitleNode,
  $isCollapsibleTitleNode,
  CollapsibleTitleNode,
} from '../plugins/CollapsiblePlugin/CollapsibleTitleNode';

// DateTimeNode
export { $createDateTimeNode, $isDateTimeNode, DateTimeNode } from './DateTimeNode/DateTimeNode';

// EmojiNode
export { $createEmojiNode, $isEmojiNode, EmojiNode } from './EmojiNode';

// EquationNode
export { $createEquationNode, $isEquationNode, EquationNode } from './EquationNode';
export { default as EquationComponent } from './EquationComponent';

// FigmaNode
export { $createFigmaNode, $isFigmaNode, FigmaNode } from './FigmaNode';

// ImageNode
export { $createImageNode, $isImageNode, ImageNode } from './ImageNode';
export type { ImagePayload, SerializedImageNode } from './ImageNode';
export { default as ImageComponent } from './ImageComponent';

// KeywordNode
export { $createKeywordNode, $isKeywordNode, KeywordNode } from './KeywordNode';

// LayoutNode
export { $createLayoutContainerNode, $isLayoutContainerNode, LayoutContainerNode } from './LayoutContainerNode';
export { $createLayoutItemNode, $isLayoutItemNode, LayoutItemNode } from './LayoutItemNode';

// MentionNode
export { $createMentionNode, $isMentionNode, MentionNode } from './MentionNode';

// PageBreakNode
export { $createPageBreakNode, $isPageBreakNode, PageBreakNode } from './PageBreakNode';

// SpecialTextNode
export { $createSpecialTextNode, $isSpecialTextNode, SpecialTextNode } from './SpecialTextNode';

// StickyNode
export { $createStickyNode, $isStickyNode, StickyNode } from './StickyNode';
export { default as StickyComponent } from './StickyComponent';

// TweetNode
export { $createTweetNode, $isTweetNode, TweetNode } from './TweetNode';

// YouTubeNode
export { $createYouTubeNode, $isYouTubeNode, YouTubeNode } from './YouTubeNode';

// NotionLikeEditorNodes（全ノードの配列）
export { default as NotionLikeEditorNodes } from './NotionLikeEditorNodes';
