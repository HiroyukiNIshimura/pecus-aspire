'use client';

import { createLinkMatcherWithRegExp, type LinkMatcher } from '@lexical/react/LexicalAutoLinkPlugin';
import { useMemo } from 'react';
import { patterns } from '@/libs/utils/autoLink';

const { WORKSPACE_CODE_PATTERN, ITEM_CODE_PATTERN, TASK_SEQUENCE_PATTERN } = patterns;

/**
 * ワークスペースコード#アイテムコードTタスクシーケンス
 * 例: MrzCtr8P9vUYfnXb#123T1
 * ※ gフラグなし（Lexicalは単一マッチで処理）
 */
const WORKSPACE_ITEM_TASK_REGEX = new RegExp(
  `(${WORKSPACE_CODE_PATTERN})#(${ITEM_CODE_PATTERN})T(${TASK_SEQUENCE_PATTERN})`,
);

/**
 * ワークスペースコード#アイテムコード（タスクなし）
 * 例: MrzCtr8P9vUYfnXb#123
 * ※ 後ろにTと数字が続かないものだけをマッチ（負の先読み）
 * ※ gフラグなし（Lexicalは単一マッチで処理）
 */
const WORKSPACE_ITEM_REGEX = new RegExp(
  `(${WORKSPACE_CODE_PATTERN})#(${ITEM_CODE_PATTERN})(?!T${TASK_SEQUENCE_PATTERN})`,
);

/**
 * アイテムコードのみ（現在のワークスペース内リンク用）
 * - # + 1-9で始まる数字（先頭ゼロは除外）
 * - 数字の後は空白文字または文字列末尾が必要
 * - URLパス内（/や=の後）の#にはマッチしない（無限ループ防止）
 * - ワークスペースコードの直後の場合はマッチしない
 *
 * 例:
 * - #36 → マッチ
 * - MrzCtr8P9vUYfnXb#36 → マッチしない（ワークスペースコード付きは別パターン）
 */
const ITEM_CODE_ONLY_REGEX = /(?<![/=A-Za-z0-9_-])#([1-9][0-9]*)(?=\s|$)/;

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
    const workspaceItemTaskMatcher = createLinkMatcherWithRegExp(WORKSPACE_ITEM_TASK_REGEX, (text) => {
      const match = text.match(WORKSPACE_ITEM_TASK_REGEX);
      if (!match) return text;
      const [, wsCode, itemCode, taskSequence] = match;
      return `/workspaces/${wsCode}?itemCode=${itemCode}&task=${taskSequence}`;
    });

    // ワークスペース#アイテム
    const workspaceItemMatcher = createLinkMatcherWithRegExp(WORKSPACE_ITEM_REGEX, (text) => {
      const match = text.match(WORKSPACE_ITEM_REGEX);
      if (!match) return text;
      const [, wsCode, itemCode] = match;
      return `/workspaces/${wsCode}?itemCode=${itemCode}`;
    });

    // #アイテムコードのみ（現在のワークスペース内）
    const itemCodeOnlyMatcher = createLinkMatcherWithRegExp(ITEM_CODE_ONLY_REGEX, (text) => {
      const match = text.match(ITEM_CODE_ONLY_REGEX);
      if (!match) return text;
      const itemCode = match[1];
      return `/workspaces/${workspaceCode}?itemCode=${itemCode}`;
    });

    // 順序重要: 具体的なパターンを先に
    return [workspaceItemTaskMatcher, workspaceItemMatcher, itemCodeOnlyMatcher];
  }, [workspaceCode]);
}

// 便利なユーティリティをエクスポート
export { createLinkMatcherWithRegExp, type LinkMatcher } from '@lexical/react/LexicalAutoLinkPlugin';
