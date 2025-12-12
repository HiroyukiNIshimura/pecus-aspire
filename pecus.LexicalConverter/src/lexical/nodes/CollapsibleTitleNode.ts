/**
 * CollapsibleTitleNode - ヘッドレス版
 * 折りたたみタイトルノード
 */

import type { DOMConversionMap, DOMExportOutput, LexicalNode, SerializedElementNode } from 'lexical';
import { ElementNode } from 'lexical';

export type SerializedCollapsibleTitleNode = SerializedElementNode;

export class CollapsibleTitleNode extends ElementNode {
  static getType(): string {
    return 'collapsible-title';
  }

  static clone(node: CollapsibleTitleNode): CollapsibleTitleNode {
    return new CollapsibleTitleNode(node.__key);
  }

  static importJSON(serializedNode: SerializedCollapsibleTitleNode): CollapsibleTitleNode {
    return $createCollapsibleTitleNode().updateFromJSON(serializedNode);
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('summary');
    element.classList.add('Collapsible__title');
    return { element };
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('summary');
    dom.classList.add('Collapsible__title');
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }
}

export function $createCollapsibleTitleNode(): CollapsibleTitleNode {
  return new CollapsibleTitleNode();
}

export function $isCollapsibleTitleNode(node: LexicalNode | null | undefined): node is CollapsibleTitleNode {
  return node instanceof CollapsibleTitleNode;
}
