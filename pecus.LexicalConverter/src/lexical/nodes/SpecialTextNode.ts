/**
 * SpecialTextNode - ヘッドレス版
 * 特殊テキストノード
 */

import type { LexicalNode, SerializedTextNode } from 'lexical';
import { $applyNodeReplacement, TextNode } from 'lexical';

export class SpecialTextNode extends TextNode {
  static getType(): string {
    return 'specialText';
  }

  static clone(node: SpecialTextNode): SpecialTextNode {
    return new SpecialTextNode(node.__text, node.__key);
  }

  static importJSON(serializedNode: SerializedTextNode): SpecialTextNode {
    return $createSpecialTextNode().updateFromJSON(serializedNode);
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'special-text';
    span.textContent = this.__text;
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  isTextEntity(): true {
    return true;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

export function $createSpecialTextNode(text = ''): SpecialTextNode {
  return $applyNodeReplacement(new SpecialTextNode(text));
}

export function $isSpecialTextNode(node: LexicalNode | null | undefined): node is SpecialTextNode {
  return node instanceof SpecialTextNode;
}
