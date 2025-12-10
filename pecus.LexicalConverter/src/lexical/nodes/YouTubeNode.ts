/**
 * YouTubeNode - ヘッドレス版
 * YouTube埋め込みノード（リンクとして出力）
 */

import type { DOMExportOutput, ElementFormatType, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import { DecoratorNode } from 'lexical';

export type SerializedYouTubeNode = Spread<
  {
    videoID: string;
    format?: ElementFormatType;
  },
  SerializedLexicalNode
>;

export class YouTubeNode extends DecoratorNode<null> {
  __id: string;
  __format: ElementFormatType;

  static getType(): string {
    return 'youtube';
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__id, node.__format, node.__key);
  }

  constructor(id: string, format?: ElementFormatType, key?: NodeKey) {
    super(key);
    this.__id = id;
    this.__format = format || '';
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    return $createYouTubeNode(serializedNode.videoID).updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      ...super.exportJSON(),
      videoID: this.__id,
      format: this.__format,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('a');
    element.href = `https://www.youtube.com/watch?v=${this.__id}`;
    element.textContent = 'YouTube';
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
    return `https://www.youtube.com/watch?v=${this.__id}`;
  }

  decorate(): null {
    return null;
  }
}

export function $createYouTubeNode(videoID: string): YouTubeNode {
  return new YouTubeNode(videoID);
}

export function $isYouTubeNode(node: LexicalNode | null | undefined): node is YouTubeNode {
  return node instanceof YouTubeNode;
}
