/**
 * StickyNode - ヘッドレス版
 * 付箋ノード（captionは無視、テキストとして出力）
 */

import type { DOMConversionMap, DOMExportOutput, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import { DecoratorNode } from 'lexical';

type StickyNoteColor = 'pink' | 'yellow';

export type SerializedStickyNode = Spread<
  {
    xOffset: number;
    yOffset: number;
    color: StickyNoteColor;
  },
  SerializedLexicalNode
>;

export class StickyNode extends DecoratorNode<null> {
  __x: number;
  __y: number;
  __color: StickyNoteColor;

  static getType(): string {
    return 'sticky';
  }

  static clone(node: StickyNode): StickyNode {
    return new StickyNode(node.__x, node.__y, node.__color, node.__key);
  }

  constructor(x: number, y: number, color: StickyNoteColor, key?: NodeKey) {
    super(key);
    this.__x = x;
    this.__y = y;
    this.__color = color;
  }

  static importJSON(serializedNode: SerializedStickyNode): StickyNode {
    return new StickyNode(serializedNode.xOffset, serializedNode.yOffset, serializedNode.color);
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportJSON(): SerializedStickyNode {
    return {
      ...super.exportJSON(),
      color: this.__color,
      xOffset: this.__x,
      yOffset: this.__y,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = `sticky-note sticky-note-${this.__color}`;
    element.setAttribute('data-sticky-color', this.__color);
    // captionは無視するため、空のdivとして出力
    return { element };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'contents';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  setPosition(x: number, y: number): void {
    const writable = this.getWritable();
    writable.__x = x;
    writable.__y = y;
  }

  getColor(): StickyNoteColor {
    return this.__color;
  }

  decorate(): null {
    return null;
  }
}

export function $createStickyNode(xOffset: number, yOffset: number, color: StickyNoteColor = 'yellow'): StickyNode {
  return new StickyNode(xOffset, yOffset, color);
}

export function $isStickyNode(node: LexicalNode | null | undefined): node is StickyNode {
  return node instanceof StickyNode;
}
