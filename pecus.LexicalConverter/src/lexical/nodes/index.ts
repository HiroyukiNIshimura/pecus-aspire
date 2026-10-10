/**
 * ヘッドレス用ノード定義
 * @coati/editor パッケージから再エクスポート
 *
 * Node.js では ESM ローダーで CSS の副作用を無視して利用する。
 */

// @coati/editor からすべてのノードを再エクスポート
// CustomNodes として NotionLikeEditorNodes をエクスポート（後方互換性のため）
export {
  // AutocompleteNode
  $createAutocompleteNode,
  // CollapsibleNode
  $createCollapsibleContainerNode,
  $createCollapsibleContentNode,
  $createCollapsibleTitleNode,
  // DateTimeNode
  $createDateTimeNode,
  // EmojiNode
  $createEmojiNode,
  // EquationNode
  $createEquationNode,
  // FigmaNode
  $createFigmaNode,
  // ImageNode
  $createImageNode,
  // KeywordNode
  $createKeywordNode,
  // LayoutNode
  $createLayoutContainerNode,
  $createLayoutItemNode,
  // MentionNode
  // PageBreakNode
  $createPageBreakNode,
  // SpecialTextNode
  $createSpecialTextNode,
  // StickyNode
  $createStickyNode,
  // TweetNode
  $createTweetNode,
  // YouTubeNode
  $createYouTubeNode,
  $isCollapsibleContainerNode,
  $isCollapsibleContentNode,
  $isCollapsibleTitleNode,
  $isDateTimeNode,
  $isEmojiNode,
  $isEquationNode,
  $isFigmaNode,
  $isImageNode,
  $isKeywordNode,
  $isLayoutContainerNode,
  $isLayoutItemNode,
  $isPageBreakNode,
  $isSpecialTextNode,
  $isStickyNode,
  $isTweetNode,
  $isYouTubeNode,
  AutocompleteNode,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
  DateTimeNode,
  EmojiNode,
  EquationNode,
  FigmaNode,
  ImageNode,
  KeywordNode,
  LayoutContainerNode,
  LayoutItemNode,
  // NotionLikeEditorNodes（全ノードの配列）
  NotionLikeEditorNodes,
  NotionLikeEditorNodes as CustomNodes,
  PageBreakNode,
  SpecialTextNode,
  StickyNode,
  TweetNode,
  YouTubeNode,
} from '@coati/editor/nodes-headless';
