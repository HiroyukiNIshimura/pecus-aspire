/**
 * KeywordNode - ヘッドレス版
 * キーワードノード
 */

import type { LexicalNode, SerializedTextNode } from 'lexical';
import { $applyNodeReplacement, TextNode } from 'lexical';

export type SerializedKeywordNode = SerializedTextNode;

export class KeywordNode extends TextNode {
  static getType(): string {
    return 'keyword';
  }

  static clone(node: KeywordNode): KeywordNode {
    return new KeywordNode(node.__text, node.__key);
  }

  static importJSON(serializedNode: SerializedKeywordNode): KeywordNode {
    return $createKeywordNode().updateFromJSON(serializedNode);
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'keyword';
    span.textContent = this.__text;
    return span;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  isTextEntity(): true {
    return true;
  }
}

export function $createKeywordNode(keyword = ''): KeywordNode {
  return $applyNodeReplacement(new KeywordNode(keyword));
}

export function $isKeywordNode(node: LexicalNode | null | undefined): boolean {
  return node instanceof KeywordNode;
}
