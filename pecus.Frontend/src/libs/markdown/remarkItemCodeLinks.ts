/**
 * react-markdown 用の remark プラグイン
 * ワークスペースコード#アイテムコード、ワークスペースコード#アイテムコードTタスクシーケンス
 * を自動的にリンクに変換する
 *
 * @example
 * ```tsx
 * import Markdown from 'react-markdown';
 * import { remarkItemCodeLinks } from '@/libs/markdown/remarkItemCodeLinks';
 *
 * <Markdown remarkPlugins={[remarkItemCodeLinks]}>
 *   {`Check Oc76lxrXKmc0ifCo#1T1 and Oc76lxrXKmc0ifCo#2`}
 * </Markdown>
 * ```
 */

import type { Link, Parent, Text } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { patterns } from '@/libs/utils/autoLink';

const { WORKSPACE_CODE_PATTERN, ITEM_CODE_PATTERN, TASK_SEQUENCE_PATTERN } = patterns;

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

interface MatchInfo {
  index: number;
  length: number;
  text: string;
  url: string;
}

/**
 * テキストからすべてのマッチを収集
 */
function findAllMatches(text: string): MatchInfo[] {
  const matches: MatchInfo[] = [];

  // ワークスペース#アイテムTタスク（より具体的なパターンを先に）
  for (const match of text.matchAll(new RegExp(WORKSPACE_ITEM_TASK_REGEX.source, 'g'))) {
    const [fullMatch, wsCode, itemCode, taskSequence] = match;
    matches.push({
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: `/workspaces/${wsCode}?itemCode=${itemCode}&task=${taskSequence}`,
    });
  }

  // ワークスペース#アイテム
  for (const match of text.matchAll(new RegExp(WORKSPACE_ITEM_REGEX.source, 'g'))) {
    const [fullMatch, wsCode, itemCode] = match;
    matches.push({
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: `/workspaces/${wsCode}?itemCode=${itemCode}`,
    });
  }

  // 位置でソート
  matches.sort((a, b) => a.index - b.index);

  // 重複を除去（先にマッチしたものを優先、重なりがあるものは除外）
  const filtered: MatchInfo[] = [];
  let lastEnd = 0;
  for (const match of matches) {
    if (match.index >= lastEnd) {
      filtered.push(match);
      lastEnd = match.index + match.length;
    }
  }

  return filtered;
}

/**
 * remark プラグイン: ワークスペース参照をリンクに変換
 */
export const remarkItemCodeLinks: Plugin = () => {
  return (tree) => {
    visit(tree, 'text', (node: Text, index: number | undefined, parent: Parent | undefined) => {
      if (!parent || index === undefined) return;

      const text = node.value;
      const matches = findAllMatches(text);

      if (matches.length === 0) return;

      // テキストノードをリンクとテキストに分割
      const children: (Text | Link)[] = [];
      let lastIndex = 0;

      for (const match of matches) {
        // マッチ前のテキスト
        if (match.index > lastIndex) {
          children.push({
            type: 'text',
            value: text.slice(lastIndex, match.index),
          });
        }

        // リンクノード
        children.push({
          type: 'link',
          url: match.url,
          children: [{ type: 'text', value: match.text }],
        });

        lastIndex = match.index + match.length;
      }

      // 残りのテキスト
      if (lastIndex < text.length) {
        children.push({
          type: 'text',
          value: text.slice(lastIndex),
        });
      }

      // 親ノードの children を置き換え
      parent.children.splice(index, 1, ...children);
    });
  };
};
