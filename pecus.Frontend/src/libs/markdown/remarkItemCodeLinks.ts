/**
 * react-markdown 用の remark プラグイン
 * アイテムコード、ワークスペースコード#アイテムコード、各形式のタスク参照
 * を自動的にリンクに変換する
 *
 * @example
 * ```tsx
 * import Markdown from 'react-markdown';
 * import { remarkItemCodeLinks } from '@/libs/markdown/remarkItemCodeLinks';
 *
 * <Markdown remarkPlugins={[remarkItemCodeLinks]}>
 *   {`Check #1T1, Oc76lxrXKmc0ifCo#1T1 and Oc76lxrXKmc0ifCo#2`}
 * </Markdown>
 * ```
 */

import type { Link, Parent, Root, Text } from 'mdast';
import { visit } from 'unist-util-visit';
import { findItemCodeLinkMatches } from '@/libs/utils/autoLink';

export interface RemarkItemCodeLinksOptions {
  workspaceCode?: string;
}

/**
 * remark プラグイン: ワークスペース参照をリンクに変換
 */
export function remarkItemCodeLinks({ workspaceCode }: RemarkItemCodeLinksOptions = {}) {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index: number | undefined, parent: Parent | undefined) => {
      if (!parent || index === undefined) return;

      const text = node.value;
      const matches = findItemCodeLinkMatches(text, workspaceCode);

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

        lastIndex = match.index + match.text.length;
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
}
