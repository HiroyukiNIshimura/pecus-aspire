/**
 * EmojiNode - ヘッドレス版
 * 絵文字ノード
 */

import type { DOMConversionMap, DOMExportOutput, LexicalNode, NodeKey, SerializedTextNode, Spread } from 'lexical';
import { $applyNodeReplacement, TextNode } from 'lexical';

export type SerializedEmojiNode = Spread<
  {
    className: string;
  },
  SerializedTextNode
>;

export class EmojiNode extends TextNode {
  __className: string;

  static getType(): string {
    return 'emoji';
  }

  static clone(node: EmojiNode): EmojiNode {
    return new EmojiNode(node.__className, node.__text, node.__key);
  }

  constructor(className: string, text: string, key?: NodeKey) {
    super(text, key);
    this.__className = className;
  }

  static importJSON(serializedNode: SerializedEmojiNode): EmojiNode {
    return $createEmojiNode(serializedNode.className, serializedNode.text).updateFromJSON(serializedNode);
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportJSON(): SerializedEmojiNode {
    return {
      ...super.exportJSON(),
      className: this.__className,
    };
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span');
    span.className = this.__className;
    span.textContent = this.__text;
    return { element: span };
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = this.__className;
    span.textContent = this.__text;
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  getClassName(): string {
    return this.__className;
  }
}

export function $isEmojiNode(node: LexicalNode | null | undefined): node is EmojiNode {
  return node instanceof EmojiNode;
}

export function $createEmojiNode(className: string, emojiText: string): EmojiNode {
  const node = new EmojiNode(className, emojiText).setMode('token');
  return $applyNodeReplacement(node);
}
