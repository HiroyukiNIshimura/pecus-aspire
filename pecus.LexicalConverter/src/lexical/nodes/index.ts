/**
 * ヘッドレス用ノード定義
 * @coati/editor パッケージから再エクスポート
 *
 * 注意: Node.js 環境では CSS インポートが失敗するため、
 * ignore-css.ts フックで CSS を無視している
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
  $createMentionNode,
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
  $isMentionNode,
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
  MentionNode,
  // NotionLikeEditorNodes（全ノードの配列）
  NotionLikeEditorNodes,
  NotionLikeEditorNodes as CustomNodes,
  PageBreakNode,
  SpecialTextNode,
  StickyNode,
  TweetNode,
  YouTubeNode,
} from '@coati/editor';
