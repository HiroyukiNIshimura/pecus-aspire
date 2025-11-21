/**
 * HTMLに NotionLikeEditorTheme のクラス名を適用するユーティリティ
 */

const THEME_CLASS_MAP: Record<string, string> = {
  h1: "NotionLikeEditorTheme__h1",
  h2: "NotionLikeEditorTheme__h2",
  h3: "NotionLikeEditorTheme__h3",
  p: "NotionLikeEditorTheme__paragraph",
  blockquote: "NotionLikeEditorTheme__quote",
  ul: "NotionLikeEditorTheme__ul",
  ol: "NotionLikeEditorTheme__ol",
  li: "NotionLikeEditorTheme__listItem",
  a: "NotionLikeEditorTheme__link",
  code: "NotionLikeEditorTheme__code",
  pre: "NotionLikeEditorTheme__code",
  table: "NotionLikeEditorTheme__table",
  td: "NotionLikeEditorTheme__tableCell",
  th: "NotionLikeEditorTheme__tableCellHeader",
  hr: "NotionLikeEditorTheme__hr",
};

const TEXT_CLASS_MAP: Record<string, string> = {
  strong: "NotionLikeEditorTheme__textBold",
  b: "NotionLikeEditorTheme__textBold",
  em: "NotionLikeEditorTheme__textItalic",
  i: "NotionLikeEditorTheme__textItalic",
  u: "NotionLikeEditorTheme__textUnderline",
  s: "NotionLikeEditorTheme__textStrikethrough",
  del: "NotionLikeEditorTheme__textStrikethrough",
  mark: "NotionLikeEditorTheme__mark",
};

/**
 * HTMLにNotionLikeEditorThemeのクラス名を適用
 * @param html - 元のHTML文字列
 * @returns クラス名が適用されたHTML文字列
 */
export function applyNotionTheme(html: string): string {
  if (typeof window === "undefined") {
    // サーバーサイドではそのまま返す
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // すべての要素を走査してクラス名を付与
  const allElements = doc.body.querySelectorAll("*");
  allElements.forEach((element) => {
    const tagName = element.tagName.toLowerCase();

    // 基本要素のクラス名を付与
    const themeClass = THEME_CLASS_MAP[tagName];
    if (themeClass) {
      element.classList.add(themeClass);
    }

    // テキスト装飾要素のクラス名を付与
    const textClass = TEXT_CLASS_MAP[tagName];
    if (textClass) {
      element.classList.add(textClass);
    }

    // インラインコードの特別処理（pre内のcodeは除外）
    if (tagName === "code" && element.parentElement?.tagName !== "PRE") {
      element.classList.add("NotionLikeEditorTheme__textCode");
      // pre内のcodeは別のスタイリング
    }
  });

  return doc.body.innerHTML;
}
