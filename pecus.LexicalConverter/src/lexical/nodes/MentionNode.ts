/**
 * MentionNode - ヘッドレス版
 * メンションノード
 */

import type { DOMConversionMap, DOMExportOutput, LexicalNode, NodeKey, SerializedTextNode, Spread } from 'lexical';
import { $applyNodeReplacement, TextNode } from 'lexical';

export type SerializedMentionNode = Spread<
  {
    mentionName: string;
  },
  SerializedTextNode
>;

export class MentionNode extends TextNode {
  __mention: string;

  static getType(): string {
    return 'mention';
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__mention, node.__text, node.__key);
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return $createMentionNode(serializedNode.mentionName).updateFromJSON(serializedNode);
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  constructor(mentionName: string, text?: string, key?: NodeKey) {
    super(text ?? mentionName, key);
    this.__mention = mentionName;
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      mentionName: this.__mention,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-mention', 'true');
    if (this.__text !== this.__mention) {
      element.setAttribute('data-lexical-mention-name', this.__mention);
    }
    element.textContent = this.__text;
    return { element };
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'mention';
    span.textContent = this.__text;
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  isTextEntity(): true {
    return true;
  }
}

export function $createMentionNode(mentionName: string, text?: string): MentionNode {
  return $applyNodeReplacement(new MentionNode(mentionName, text));
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
  return node instanceof MentionNode;
}
