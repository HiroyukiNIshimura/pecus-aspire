/**
 * LayoutContainerNode - ヘッドレス版
 * レイアウトコンテナノード
 */

import type { DOMConversionMap, DOMExportOutput, LexicalNode, LexicalUpdateJSON, NodeKey, SerializedElementNode, Spread } from 'lexical';
import { ElementNode } from 'lexical';

export type SerializedLayoutContainerNode = Spread<
  {
    templateColumns: string;
  },
  SerializedElementNode
>;

export class LayoutContainerNode extends ElementNode {
  __templateColumns: string;

  constructor(templateColumns: string, key?: NodeKey) {
    super(key);
    this.__templateColumns = templateColumns;
  }

  static getType(): string {
    return 'layout-container';
  }

  static clone(node: LayoutContainerNode): LayoutContainerNode {
    return new LayoutContainerNode(node.__templateColumns, node.__key);
  }

  static importJSON(json: SerializedLayoutContainerNode): LayoutContainerNode {
    return $createLayoutContainerNode().updateFromJSON(json);
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedLayoutContainerNode>): this {
    return super.updateFromJSON(serializedNode).setTemplateColumns(serializedNode.templateColumns);
  }

  exportJSON(): SerializedLayoutContainerNode {
    return {
      ...super.exportJSON(),
      templateColumns: this.__templateColumns,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.style.gridTemplateColumns = this.__templateColumns;
    element.setAttribute('data-lexical-layout-container', 'true');
    return { element };
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.style.gridTemplateColumns = this.__templateColumns;
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.__templateColumns !== this.__templateColumns) {
      dom.style.gridTemplateColumns = this.__templateColumns;
    }
    return false;
  }

  setTemplateColumns(templateColumns: string): this {
    const self = this.getWritable();
    self.__templateColumns = templateColumns;
    return self;
  }

  getTemplateColumns(): string {
    return this.__templateColumns;
  }
}

export function $createLayoutContainerNode(templateColumns = '1fr 1fr'): LayoutContainerNode {
  return new LayoutContainerNode(templateColumns);
}

export function $isLayoutContainerNode(node: LexicalNode | null | undefined): node is LayoutContainerNode {
  return node instanceof LayoutContainerNode;
}
