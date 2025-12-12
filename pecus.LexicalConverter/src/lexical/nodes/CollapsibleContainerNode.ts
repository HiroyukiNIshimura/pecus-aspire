/**
 * CollapsibleContainerNode - ヘッドレス版
 * 折りたたみコンテナノード
 */

import type { DOMConversionMap, DOMExportOutput, LexicalNode, NodeKey, SerializedElementNode, Spread } from 'lexical';
import { ElementNode } from 'lexical';

export type SerializedCollapsibleContainerNode = Spread<
  {
    open: boolean;
  },
  SerializedElementNode
>;

export class CollapsibleContainerNode extends ElementNode {
  __open: boolean;

  constructor(open: boolean, key?: NodeKey) {
    super(key);
    this.__open = open;
  }

  static getType(): string {
    return 'collapsible-container';
  }

  static clone(node: CollapsibleContainerNode): CollapsibleContainerNode {
    return new CollapsibleContainerNode(node.__open, node.__key);
  }

  static importJSON(serializedNode: SerializedCollapsibleContainerNode): CollapsibleContainerNode {
    return $createCollapsibleContainerNode(serializedNode.open).updateFromJSON(serializedNode);
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportJSON(): SerializedCollapsibleContainerNode {
    return {
      ...super.exportJSON(),
      open: this.__open,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('details');
    element.setAttribute('class', 'Collapsible__container');
    if (this.__open) {
      element.setAttribute('open', '');
    }
    return { element };
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('details');
    dom.classList.add('Collapsible__container');
    if (this.__open) {
      dom.open = true;
    }
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLDetailsElement): boolean {
    if (prevNode.__open !== this.__open) {
      dom.open = this.__open;
    }
    return false;
  }

  isShadowRoot(): boolean {
    return true;
  }

  getOpen(): boolean {
    return this.__open;
  }

  setOpen(open: boolean): void {
    const writable = this.getWritable();
    writable.__open = open;
  }

  toggleOpen(): void {
    this.setOpen(!this.getOpen());
  }
}

export function $createCollapsibleContainerNode(isOpen = true): CollapsibleContainerNode {
  return new CollapsibleContainerNode(isOpen);
}

export function $isCollapsibleContainerNode(node: LexicalNode | null | undefined): node is CollapsibleContainerNode {
  return node instanceof CollapsibleContainerNode;
}
