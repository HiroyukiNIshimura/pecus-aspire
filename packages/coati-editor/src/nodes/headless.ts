/**
 * @coati/editor/nodes/headless - ヘッドレス環境用ノード定義
 *
 * CSS や React コンポーネントを含まないノード定義のみをエクスポート
 * Node.js (ts-node, NestJS) などのサーバーサイド環境で使用
 */

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
// AutocompleteNode
export { $createAutocompleteNode, AutocompleteNode } from './AutocompleteNode';

// DateTimeNode (コンポーネントは除外)
export { $createDateTimeNode, $isDateTimeNode, DateTimeNode } from './DateTimeNode/DateTimeNode';

// EmojiNode
export { $createEmojiNode, $isEmojiNode, EmojiNode } from './EmojiNode';

// EquationNode (コンポーネントは除外)
export { $createEquationNode, $isEquationNode, EquationNode } from './EquationNode';

// FigmaNode
export { $createFigmaNode, $isFigmaNode, FigmaNode } from './FigmaNode';
export type { ImagePayload, SerializedImageNode } from './ImageNode';
// ImageNode (コンポーネントは除外)
export { $createImageNode, $isImageNode, ImageNode } from './ImageNode';

// KeywordNode
export { $createKeywordNode, $isKeywordNode, KeywordNode } from './KeywordNode';

// LayoutNode
export { $createLayoutContainerNode, $isLayoutContainerNode, LayoutContainerNode } from './LayoutContainerNode';
export { $createLayoutItemNode, $isLayoutItemNode, LayoutItemNode } from './LayoutItemNode';

// MermaidNode
export { $createMermaidNode, $isMermaidNode, MermaidNode } from './MermaidNode';
// NotionLikeEditorNodes（全ノードの配列）
export { default as NotionLikeEditorNodes } from './NotionLikeEditorNodes';
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
