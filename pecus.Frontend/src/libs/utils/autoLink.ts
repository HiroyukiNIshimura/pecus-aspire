/**
 * テキスト内のURL、ワークスペースコード#アイテムコード、
 * ワークスペースコード#アイテムコードTタスクシーケンスを自動的にリンクに変換するユーティリティ
 *
 * @example
 * ```ts
 * const html = convertToLinks('Check https://example.com and MrzCtr8P9vUYfnXb#123T1');
 * // => 'Check <a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a> and <a href="/workspaces/MrzCtr8P9vUYfnXb?itemCode=123&task=1">MrzCtr8P9vUYfnXb#123T1</a>'
 * ```
 */

/**
 * ワークスペースコード: 16文字の英数字
 */
const WORKSPACE_CODE_PATTERN = '[A-Za-z0-9]{16}';

/**
 * アイテムコード: 1-9で始まる数字（先頭ゼロは除外）
 */
const ITEM_CODE_PATTERN = '[1-9][0-9]*';

/**
 * タスクシーケンス: 1-9で始まる数字（先頭ゼロは除外）
 */
const TASK_SEQUENCE_PATTERN = '[1-9][0-9]*';

/**
 * URL正規表現（http:// または https:// で始まるもののみ）
 * - クエリパラメータ、フラグメント、ポート番号に対応
 * - 末尾の句読点は除外
 */
const URL_REGEX =
  /https?:\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}(?:\.[a-zA-Z0-9()]{1,6})?\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)(?<![-.+():%,;!?])/g;

/**
 * ワークスペースコード#アイテムコードTタスクシーケンス
 * 例: MrzCtr8P9vUYfnXb#123T1
 */
const WORKSPACE_ITEM_TASK_REGEX = new RegExp(
  `(${WORKSPACE_CODE_PATTERN})#(${ITEM_CODE_PATTERN})T(${TASK_SEQUENCE_PATTERN})`,
  'g',
);

/**
 * ワークスペースコード#アイテムコード（タスクなし）
 * 例: MrzCtr8P9vUYfnXb#123
 * ※ 後ろにTと数字が続かないものだけをマッチ（負の先読み）
 */
const WORKSPACE_ITEM_REGEX = new RegExp(
  `(${WORKSPACE_CODE_PATTERN})#(${ITEM_CODE_PATTERN})(?!T${TASK_SEQUENCE_PATTERN})`,
  'g',
);

/**
 * 既存の<a>タグを検出する正規表現
 */
const EXISTING_LINK_REGEX = /<a\s[^>]*>[\s\S]*?<\/a>/gi;

/**
 * Markdown形式のリンクを検出する正規表現
 * 例: [text](url)
 */
const MARKDOWN_LINK_REGEX = /\[[^\]]*\]\([^)]*\)/g;

interface LinkMatch {
  /** マッチした文字列 */
  match: string;
  /** マッチ開始位置 */
  index: number;
  /** 変換後のHTML */
  replacement: string;
}

/**
 * 既存のリンクとMarkdownリンクの位置を取得
 */
function getExcludedRanges(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];

  // 既存の<a>タグ
  for (const match of text.matchAll(EXISTING_LINK_REGEX)) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }

  // Markdownリンク
  for (const match of text.matchAll(MARKDOWN_LINK_REGEX)) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }

  return ranges;
}

/**
 * 指定位置が除外範囲内かどうかをチェック
 */
function isInExcludedRange(
  index: number,
  length: number,
  excludedRanges: Array<{ start: number; end: number }>,
): boolean {
  const end = index + length;
  return excludedRanges.some((range) => index >= range.start && end <= range.end);
}

/**
 * URLをリンクに変換
 */
function convertUrls(text: string, excludedRanges: Array<{ start: number; end: number }>): LinkMatch[] {
  const matches: LinkMatch[] = [];

  for (const match of text.matchAll(URL_REGEX)) {
    if (!isInExcludedRange(match.index, match[0].length, excludedRanges)) {
      matches.push({
        match: match[0],
        index: match.index,
        replacement: `<a href="${match[0]}" target="_blank" rel="noopener noreferrer" class="link link-hover">${match[0]}</a>`,
      });
    }
  }

  return matches;
}

/**
 * ワークスペースコード#アイテムコードTタスクシーケンスをリンクに変換
 */
function convertWorkspaceItemTask(text: string, excludedRanges: Array<{ start: number; end: number }>): LinkMatch[] {
  const matches: LinkMatch[] = [];

  for (const match of text.matchAll(WORKSPACE_ITEM_TASK_REGEX)) {
    if (!isInExcludedRange(match.index, match[0].length, excludedRanges)) {
      const [fullMatch, workspaceCode, itemCode, taskSequence] = match;
      matches.push({
        match: fullMatch,
        index: match.index,
        replacement: `<a href="/workspaces/${workspaceCode}?itemCode=${itemCode}&task=${taskSequence}" class="link link-hover">${fullMatch}</a>`,
      });
    }
  }

  return matches;
}

/**
 * ワークスペースコード#アイテムコードをリンクに変換
 */
function convertWorkspaceItem(text: string, excludedRanges: Array<{ start: number; end: number }>): LinkMatch[] {
  const matches: LinkMatch[] = [];

  for (const match of text.matchAll(WORKSPACE_ITEM_REGEX)) {
    if (!isInExcludedRange(match.index, match[0].length, excludedRanges)) {
      const [fullMatch, workspaceCode, itemCode] = match;
      matches.push({
        match: fullMatch,
        index: match.index,
        replacement: `<a href="/workspaces/${workspaceCode}?itemCode=${itemCode}" class="link link-hover">${fullMatch}</a>`,
      });
    }
  }

  return matches;
}

/**
 * マッチが他のマッチに含まれているかをチェック
 */
function isContainedInOtherMatch(target: LinkMatch, allMatches: LinkMatch[]): boolean {
  const targetEnd = target.index + target.match.length;
  return allMatches.some((other) => {
    if (other === target) return false;
    const otherEnd = other.index + other.match.length;
    // targetがotherに完全に含まれている場合
    return target.index >= other.index && targetEnd <= otherEnd && target.match !== other.match;
  });
}

/**
 * テキスト内のURL、ワークスペース参照を自動的にリンクに変換する
 *
 * @param text - 変換対象のテキスト
 * @returns リンクに変換されたHTML文字列
 *
 * @example
 * ```ts
 * // URL変換
 * convertToLinks('Visit https://example.com');
 * // => 'Visit <a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a>'
 *
 * // ワークスペース#アイテム変換
 * convertToLinks('See MrzCtr8P9vUYfnXb#123');
 * // => 'See <a href="/workspaces/MrzCtr8P9vUYfnXb?itemCode=123">MrzCtr8P9vUYfnXb#123</a>'
 *
 * // ワークスペース#アイテムTタスク変換
 * convertToLinks('Task MrzCtr8P9vUYfnXb#123T1');
 * // => 'Task <a href="/workspaces/MrzCtr8P9vUYfnXb?itemCode=123&task=1">MrzCtr8P9vUYfnXb#123T1</a>'
 *
 * // 既存リンクは無視
 * convertToLinks('<a href="/test">https://example.com</a>');
 * // => '<a href="/test">https://example.com</a>' (変換なし)
 * ```
 */
export function convertToLinks(text: string): string {
  if (!text) return text;

  // 除外範囲を取得
  const excludedRanges = getExcludedRanges(text);

  // 各パターンのマッチを収集
  const urlMatches = convertUrls(text, excludedRanges);
  const workspaceItemTaskMatches = convertWorkspaceItemTask(text, excludedRanges);
  const workspaceItemMatches = convertWorkspaceItem(text, excludedRanges);

  // 全マッチを結合
  let allMatches = [...urlMatches, ...workspaceItemTaskMatches, ...workspaceItemMatches];

  // 重複を除去（より具体的なマッチを優先）
  // URL内にワークスペースパターンが含まれる場合はURLを優先
  allMatches = allMatches.filter((match) => !isContainedInOtherMatch(match, allMatches));

  // 位置の重複チェック（同じ位置で複数マッチがある場合は長いものを優先）
  const positionMap = new Map<number, LinkMatch>();
  for (const match of allMatches) {
    const existing = positionMap.get(match.index);
    if (!existing || match.match.length > existing.match.length) {
      positionMap.set(match.index, match);
    }
  }
  allMatches = Array.from(positionMap.values());

  // 位置でソート（後ろから置換するため降順）
  allMatches.sort((a, b) => b.index - a.index);

  // 置換を実行
  let result = text;
  for (const linkMatch of allMatches) {
    result =
      result.slice(0, linkMatch.index) + linkMatch.replacement + result.slice(linkMatch.index + linkMatch.match.length);
  }

  return result;
}

/**
 * 正規表現パターンをエクスポート（テスト用）
 */
export const patterns = {
  URL_REGEX,
  WORKSPACE_ITEM_TASK_REGEX,
  WORKSPACE_ITEM_REGEX,
  WORKSPACE_CODE_PATTERN,
  ITEM_CODE_PATTERN,
  TASK_SEQUENCE_PATTERN,
} as const;
