'use client';

import { createLinkMatcherWithRegExp, type LinkMatcher } from '@lexical/react/LexicalAutoLinkPlugin';
import { useMemo } from 'react';
import { createItemCodeUrl, patterns } from '@/libs/utils/autoLink';

const { WORKSPACE_ITEM_TASK_REGEX, WORKSPACE_ITEM_REGEX, ITEM_CODE_ONLY_REGEX, ITEM_CODE_TASK_ONLY_REGEX } = patterns;

/**
 * ワークスペースコード#アイテムコードTタスクシーケンス
 * 例: MrzCtr8P9vUYfnXb#123T1
 * ※ gフラグなし（Lexicalは単一マッチで処理）
 */
const workspaceItemTaskMatcherRegex = new RegExp(WORKSPACE_ITEM_TASK_REGEX.source);
const workspaceItemMatcherRegex = new RegExp(WORKSPACE_ITEM_REGEX.source);
const itemCodeOnlyMatcherRegex = new RegExp(ITEM_CODE_ONLY_REGEX.source);
const itemCodeTaskOnlyMatcherRegex = new RegExp(ITEM_CODE_TASK_ONLY_REGEX.source);

export interface ItemCodeLinkMatcherOptions {
  /** ワークスペースコード（16文字の文字列） */
  workspaceCode: string;
}

/**
 * ワークスペース参照（#アイテム、ワークスペース#アイテム、ワークスペース#アイテムTタスク）
 * をリンクに変換するMatcherを作成するフック
 *
 * @example
 * ```tsx
 * const itemCodeMatchers = useItemCodeLinkMatchers({
 *   workspaceCode: workspace.code,
 * });
 *
 * <NotionLikeEditor customLinkMatchers={itemCodeMatchers} />
 * ```
 *
 * サポートするパターン:
 * - `#123` → 現在のワークスペース内のアイテム123へのリンク
 * - `#123T1` → 現在のワークスペース内のアイテム123、タスク1へのリンク
 * - `MrzCtr8P9vUYfnXb#123` → 指定ワークスペースのアイテム123へのリンク
 * - `MrzCtr8P9vUYfnXb#123T1` → 指定ワークスペースのアイテム123、タスク1へのリンク
 */
export function useItemCodeLinkMatchers(options: ItemCodeLinkMatcherOptions): LinkMatcher[] {
  const { workspaceCode } = options;

  return useMemo(() => {
    if (!workspaceCode) {
      return [];
    }

    // ワークスペース#アイテムTタスク（最も具体的なパターンを先に）
    const workspaceItemTaskMatcher = createLinkMatcherWithRegExp(workspaceItemTaskMatcherRegex, (text) => {
      const match = text.match(workspaceItemTaskMatcherRegex);
      if (!match) return text;
      const [, wsCode, itemCode, taskSequence] = match;
      return createItemCodeUrl(wsCode, itemCode, taskSequence);
    });

    // ワークスペース#アイテム
    const workspaceItemMatcher = createLinkMatcherWithRegExp(workspaceItemMatcherRegex, (text) => {
      const match = text.match(workspaceItemMatcherRegex);
      if (!match) return text;
      const [, wsCode, itemCode] = match;
      return createItemCodeUrl(wsCode, itemCode);
    });

    // #アイテムTタスク（現在のワークスペース内）
    const itemCodeTaskOnlyMatcher = createLinkMatcherWithRegExp(itemCodeTaskOnlyMatcherRegex, (text) => {
      const match = text.match(itemCodeTaskOnlyMatcherRegex);
      if (!match) return text;
      const [, itemCode, taskSequence] = match;
      return createItemCodeUrl(workspaceCode, itemCode, taskSequence);
    });

    // #アイテムコードのみ（現在のワークスペース内）
    const itemCodeOnlyMatcher = createLinkMatcherWithRegExp(itemCodeOnlyMatcherRegex, (text) => {
      const match = text.match(itemCodeOnlyMatcherRegex);
      if (!match) return text;
      const itemCode = match[1];
      return createItemCodeUrl(workspaceCode, itemCode);
    });

    // 順序重要: 具体的なパターンを先に
    return [workspaceItemTaskMatcher, workspaceItemMatcher, itemCodeTaskOnlyMatcher, itemCodeOnlyMatcher];
  }, [workspaceCode]);
}

// 便利なユーティリティをエクスポート
export { createLinkMatcherWithRegExp, type LinkMatcher } from '@lexical/react/LexicalAutoLinkPlugin';
