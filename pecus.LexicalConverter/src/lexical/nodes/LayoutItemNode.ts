/**
 * LayoutItemNode - ヘッドレス版
 * レイアウトアイテムノード
 */

import type { DOMExportOutput, LexicalNode, SerializedElementNode } from 'lexical';
import { ElementNode } from 'lexical';

export type SerializedLayoutItemNode = SerializedElementNode;

export class LayoutItemNode extends ElementNode {
  static getType(): string {
    return 'layout-item';
  }

  static clone(node: LayoutItemNode): LayoutItemNode {
    return new LayoutItemNode(node.__key);
  }

  static importJSON(serializedNode: SerializedLayoutItemNode): LayoutItemNode {
    return $createLayoutItemNode().updateFromJSON(serializedNode);
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-layout-item', 'true');
    return { element };
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.setAttribute('data-lexical-layout-item', 'true');
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  isShadowRoot(): boolean {
    return true;
  }
}

export function $createLayoutItemNode(): LayoutItemNode {
  return new LayoutItemNode();
}

export function $isLayoutItemNode(node: LexicalNode | null | undefined): node is LayoutItemNode {
  return node instanceof LayoutItemNode;
}
