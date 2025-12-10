/**
 * PageBreakNode - ヘッドレス版
 * ページブレークノード
 */

import type { DOMExportOutput, LexicalNode, SerializedLexicalNode } from 'lexical';
import { DecoratorNode } from 'lexical';

export type SerializedPageBreakNode = SerializedLexicalNode;

export class PageBreakNode extends DecoratorNode<null> {
  static getType(): string {
    return 'page-break';
  }

  static clone(node: PageBreakNode): PageBreakNode {
    return new PageBreakNode(node.__key);
  }

  static importJSON(serializedNode: SerializedPageBreakNode): PageBreakNode {
    return $createPageBreakNode().updateFromJSON(serializedNode);
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('figure');
    element.style.pageBreakAfter = 'always';
    element.setAttribute('type', this.getType());
    return { element };
  }

  createDOM(): HTMLElement {
    const el = document.createElement('figure');
    el.style.pageBreakAfter = 'always';
    el.setAttribute('type', this.getType());
    return el;
  }

  updateDOM(): false {
    return false;
  }

  getTextContent(): string {
    return '\n';
  }

  decorate(): null {
    return null;
  }
}

export function $createPageBreakNode(): PageBreakNode {
  return new PageBreakNode();
}

export function $isPageBreakNode(node: LexicalNode | null | undefined): node is PageBreakNode {
  return node instanceof PageBreakNode;
}
