/**
 * TweetNode - ヘッドレス版
 * Tweet埋め込みノード（リンクとして出力）
 */

import type { DOMConversionMap, DOMExportOutput, ElementFormatType, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import { DecoratorNode } from 'lexical';

export type SerializedTweetNode = Spread<
  {
    id: string;
    format?: ElementFormatType;
  },
  SerializedLexicalNode
>;

export class TweetNode extends DecoratorNode<null> {
  __id: string;
  __format: ElementFormatType;

  static getType(): string {
    return 'tweet';
  }

  static clone(node: TweetNode): TweetNode {
    return new TweetNode(node.__id, node.__format, node.__key);
  }

  constructor(id: string, format?: ElementFormatType, key?: NodeKey) {
    super(key);
    this.__id = id;
    this.__format = format || '';
  }

  static importJSON(serializedNode: SerializedTweetNode): TweetNode {
    return $createTweetNode(serializedNode.id).updateFromJSON(serializedNode);
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportJSON(): SerializedTweetNode {
    return {
      ...super.exportJSON(),
      id: this.__id,
      format: this.__format,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('a');
    element.href = `https://twitter.com/i/status/${this.__id}`;
    element.textContent = 'Tweet';
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
    return `https://twitter.com/i/status/${this.__id}`;
  }

  decorate(): null {
    return null;
  }
}

export function $createTweetNode(tweetID: string): TweetNode {
  return new TweetNode(tweetID);
}

export function $isTweetNode(node: LexicalNode | null | undefined): node is TweetNode {
  return node instanceof TweetNode;
}
