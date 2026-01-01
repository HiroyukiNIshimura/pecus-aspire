/**
 * @coati/editor/nodes/headless - ヘッドレス環境用ノード定義
 *
 * CSS や React コンポーネントを含まないノード定義のみをエクスポート
 * Node.js (ts-node, NestJS) などのサーバーサイド環境で使用
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

// DateTimeNode (コンポーネントは除外)
export { $createDateTimeNode, $isDateTimeNode, DateTimeNode } from './DateTimeNode/DateTimeNode';

// EmojiNode
export { $createEmojiNode, $isEmojiNode, EmojiNode } from './EmojiNode';

// EquationNode (コンポーネントは除外)
export { $createEquationNode, $isEquationNode, EquationNode } from './EquationNode';

// FigmaNode
export { $createFigmaNode, $isFigmaNode, FigmaNode } from './FigmaNode';

// ImageNode (コンポーネントは除外)
export { $createImageNode, $isImageNode, ImageNode } from './ImageNode';
export type { ImagePayload, SerializedImageNode } from './ImageNode';

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

// StickyNode (コンポーネントは除外)
export { $createStickyNode, $isStickyNode, StickyNode } from './StickyNode';

// TweetNode
export { $createTweetNode, $isTweetNode, TweetNode } from './TweetNode';

// YouTubeNode
export { $createYouTubeNode, $isYouTubeNode, YouTubeNode } from './YouTubeNode';

// NotionLikeEditorNodes（全ノードの配列）
export { default as NotionLikeEditorNodes } from './NotionLikeEditorNodes';
