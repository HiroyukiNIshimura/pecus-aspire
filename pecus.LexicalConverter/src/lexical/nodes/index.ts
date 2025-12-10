/**
 * ヘッドレス用ノード定義
 * フロントエンドのカスタムノードからReactコンポーネント・CSSを除去した軽量版
 */

// TextNode系
export { $createAutocompleteNode, AutocompleteNode } from './AutocompleteNode';
// Collapsible系
export {
  $createCollapsibleContainerNode,
  $isCollapsibleContainerNode,
  CollapsibleContainerNode,
} from './CollapsibleContainerNode';
export {
  $createCollapsibleContentNode,
  $isCollapsibleContentNode,
  CollapsibleContentNode,
} from './CollapsibleContentNode';
export { $createCollapsibleTitleNode, $isCollapsibleTitleNode, CollapsibleTitleNode } from './CollapsibleTitleNode';
// DecoratorNode系
export { $createDateTimeNode, $isDateTimeNode, DateTimeNode } from './DateTimeNode';
export { $createEmojiNode, $isEmojiNode, EmojiNode } from './EmojiNode';
export { $createEquationNode, $isEquationNode, EquationNode } from './EquationNode';
export { $createFigmaNode, $isFigmaNode, FigmaNode } from './FigmaNode';
export { $createImageNode, $isImageNode, ImageNode } from './ImageNode';
export { $createKeywordNode, $isKeywordNode, KeywordNode } from './KeywordNode';
// ElementNode系
export { $createLayoutContainerNode, $isLayoutContainerNode, LayoutContainerNode } from './LayoutContainerNode';
export { $createLayoutItemNode, $isLayoutItemNode, LayoutItemNode } from './LayoutItemNode';
export { $createMentionNode, $isMentionNode, MentionNode } from './MentionNode';
export { $createPageBreakNode, $isPageBreakNode, PageBreakNode } from './PageBreakNode';
export { $createSpecialTextNode, $isSpecialTextNode, SpecialTextNode } from './SpecialTextNode';
export { $createStickyNode, $isStickyNode, StickyNode } from './StickyNode';
export { $createTweetNode, $isTweetNode, TweetNode } from './TweetNode';
export { $createYouTubeNode, $isYouTubeNode, YouTubeNode } from './YouTubeNode';

import type { Klass, LexicalNode } from 'lexical';
// すべてのカスタムノードを配列でエクスポート
import { AutocompleteNode } from './AutocompleteNode';
import { CollapsibleContainerNode } from './CollapsibleContainerNode';
import { CollapsibleContentNode } from './CollapsibleContentNode';
import { CollapsibleTitleNode } from './CollapsibleTitleNode';
import { DateTimeNode } from './DateTimeNode';
import { EmojiNode } from './EmojiNode';
import { EquationNode } from './EquationNode';
import { FigmaNode } from './FigmaNode';
import { ImageNode } from './ImageNode';
import { KeywordNode } from './KeywordNode';
import { LayoutContainerNode } from './LayoutContainerNode';
import { LayoutItemNode } from './LayoutItemNode';
import { MentionNode } from './MentionNode';
import { PageBreakNode } from './PageBreakNode';
import { SpecialTextNode } from './SpecialTextNode';
import { StickyNode } from './StickyNode';
import { TweetNode } from './TweetNode';
import { YouTubeNode } from './YouTubeNode';

export const CustomNodes: Klass<LexicalNode>[] = [
  AutocompleteNode,
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
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
];
