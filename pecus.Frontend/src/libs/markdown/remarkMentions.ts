import type { Parent, Strong, Text } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

const MENTION_REGEX = /(^|\s)(@[^\s@]{1,100})(?=\s|$)/g;

/**
 * Markdown本文中のメンションを専用ノードに変換するremarkプラグイン。
 * react-markdown側で専用コンポーネントとして安全に描画する。
 */
export const remarkMentions: Plugin = () => {
  return (tree) => {
    visit(tree, 'text', (node: Text, index: number | undefined, parent: Parent | undefined) => {
      if (!parent || index === undefined) return;

      const children: Array<Text | Strong> = [];
      let lastIndex = 0;

      for (const match of node.value.matchAll(MENTION_REGEX)) {
        const prefix = match[1];
        const mention = match[2];
        const mentionIndex = match.index + prefix.length;

        if (mentionIndex > lastIndex) {
          children.push({ type: 'text', value: node.value.slice(lastIndex, mentionIndex) });
        }

        children.push({
          type: 'strong',
          children: [{ type: 'text', value: mention }],
          data: {
            hName: 'span',
            hProperties: { className: ['font-semibold', 'text-secondary-content'] },
          },
        });
        lastIndex = mentionIndex + mention.length;
      }

      if (children.length === 0) return;
      if (lastIndex < node.value.length) {
        children.push({ type: 'text', value: node.value.slice(lastIndex) });
      }

      parent.children.splice(index, 1, ...children);
    });
  };
};
