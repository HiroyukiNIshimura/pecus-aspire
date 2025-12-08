'use client';

import { createLinkMatcherWithRegExp, type LinkMatcher } from '@lexical/react/LexicalAutoLinkPlugin';
import { useEffect, useMemo, useState } from 'react';

/**
 * アイテムコードの正規表現
 * - # + 1-9で始まる数字（先頭ゼロは除外）
 * - 数字の後は空白文字または文字列末尾が必要
 * - URLパス内（/や=の後）の#にはマッチしない（無限ループ防止）
 *
 * 例:
 * - #36 → マッチ（後ろにスペースまたは末尾）
 * - #1 → マッチ
 * - #36abc → マッチしない（後ろに文字）
 * - #036 → マッチしない（先頭ゼロ）
 * - #0 → マッチしない（0のみ）
 * - /path#36, ?itemCode=36 → マッチしない
 */
const ITEM_CODE_REGEX = /(?<![/=])#[1-9][0-9]*(?=\s|$)/;

export interface ItemCodeLinkMatcherOptions {
  /** ワークスペースID */
  workspaceId: number;
  /** ベースURL（省略時はwindow.location.originを使用） */
  baseUrl?: string;
}

/**
 * アイテムコード（#123）をリンクに変換するMatcherを作成するフック
 *
 * @example
 * ```tsx
 * const itemCodeMatchers = useItemCodeLinkMatchers({
 *   workspaceId: workspace.id,
 * });
 *
 * <NotionLikeEditor customLinkMatchers={itemCodeMatchers} />
 * ```
 */
export function useItemCodeLinkMatchers(options: ItemCodeLinkMatcherOptions): LinkMatcher[] {
  const { workspaceId, baseUrl: providedBaseUrl } = options;

  const [baseUrl, setBaseUrl] = useState(providedBaseUrl ?? '');

  useEffect(() => {
    if (!providedBaseUrl) {
      setBaseUrl(window.location.origin);
    }
  }, [providedBaseUrl]);

  return useMemo(() => {
    if (!baseUrl || !workspaceId) {
      return [];
    }

    const itemCodeMatcher = createLinkMatcherWithRegExp(ITEM_CODE_REGEX, (text) => {
      const itemCode = text.replace('#', '');
      return `${baseUrl}/workspaces/${workspaceId}?itemCode=${itemCode}`;
    });

    return [itemCodeMatcher];
  }, [baseUrl, workspaceId]);
}

// 便利なユーティリティをエクスポート
export { createLinkMatcherWithRegExp, type LinkMatcher } from '@lexical/react/LexicalAutoLinkPlugin';
