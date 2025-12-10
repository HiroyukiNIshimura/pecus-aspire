/**
 * DateTimeNode - ヘッドレス版
 * 日時ノード
 */

import type { DOMExportOutput, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import { DecoratorNode } from 'lexical';

export type SerializedDateTimeNode = Spread<
  {
    dateTime?: string;
  },
  SerializedLexicalNode
>;

export class DateTimeNode extends DecoratorNode<null> {
  __dateTime: Date | undefined;

  static getType(): string {
    return 'datetime';
  }

  static clone(node: DateTimeNode): DateTimeNode {
    return new DateTimeNode(node.__dateTime, node.__key);
  }

  constructor(dateTime?: Date, key?: NodeKey) {
    super(key);
    this.__dateTime = dateTime;
  }

  static importJSON(serializedNode: SerializedDateTimeNode): DateTimeNode {
    const dateTime = serializedNode.dateTime ? new Date(serializedNode.dateTime) : undefined;
    return $createDateTimeNode(dateTime);
  }

  exportJSON(): SerializedDateTimeNode {
    return {
      ...super.exportJSON(),
      dateTime: this.__dateTime?.toISOString(),
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    if (this.__dateTime) {
      element.setAttribute('data-lexical-datetime', this.__dateTime.toISOString());
      element.textContent = this.getTextContent();
    }
    return { element };
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.textContent = this.getTextContent();
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  getDateTime(): Date | undefined {
    return this.__dateTime;
  }

  setDateTime(dateTime: Date | undefined): this {
    const writable = this.getWritable();
    writable.__dateTime = dateTime;
    return writable;
  }

  getTextContent(): string {
    if (!this.__dateTime) {
      return '';
    }
    const hours = this.__dateTime.getHours();
    const minutes = this.__dateTime.getMinutes();
    return (
      this.__dateTime.toDateString() +
      (hours === 0 && minutes === 0
        ? ''
        : ` ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
    );
  }

  decorate(): null {
    return null;
  }
}

export function $createDateTimeNode(dateTime?: Date): DateTimeNode {
  return new DateTimeNode(dateTime);
}

export function $isDateTimeNode(node: LexicalNode | null | undefined): node is DateTimeNode {
  return node instanceof DateTimeNode;
}
