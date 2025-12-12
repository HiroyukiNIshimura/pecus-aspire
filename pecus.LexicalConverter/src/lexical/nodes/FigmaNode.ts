/**
 * FigmaNode - ヘッドレス版
 * Figma埋め込みノード（リンクとして出力）
 */

import type { DOMConversionMap, DOMExportOutput, ElementFormatType, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import { DecoratorNode } from 'lexical';

export type SerializedFigmaNode = Spread<
  {
    documentID: string;
    format?: ElementFormatType;
  },
  SerializedLexicalNode
>;

export class FigmaNode extends DecoratorNode<null> {
  __id: string;
  __format: ElementFormatType;

  static getType(): string {
    return 'figma';
  }

  static clone(node: FigmaNode): FigmaNode {
    return new FigmaNode(node.__id, node.__format, node.__key);
  }

  constructor(id: string, format?: ElementFormatType, key?: NodeKey) {
    super(key);
    this.__id = id;
    this.__format = format || '';
  }

  static importJSON(serializedNode: SerializedFigmaNode): FigmaNode {
    return $createFigmaNode(serializedNode.documentID).updateFromJSON(serializedNode);
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportJSON(): SerializedFigmaNode {
    return {
      ...super.exportJSON(),
      documentID: this.__id,
      format: this.__format,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('a');
    element.href = `https://www.figma.com/file/${this.__id}`;
    element.textContent = 'Figma';
    element.setAttribute('target', '_blank');
    element.setAttribute('rel', 'noopener noreferrer');
    return { element };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    return div;
  }

  updateDOM(): false {
    return false;
  }

  getId(): string {
    return this.__id;
  }

  getTextContent(): string {
    return `https://www.figma.com/file/${this.__id}`;
  }

  decorate(): null {
    return null;
  }
}

export function $createFigmaNode(documentID: string): FigmaNode {
  return new FigmaNode(documentID);
}

export function $isFigmaNode(node: LexicalNode | null | undefined): node is FigmaNode {
  return node instanceof FigmaNode;
}
