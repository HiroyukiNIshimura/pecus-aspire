/**
 * AutocompleteNode - ヘッドレス版
 * オートコンプリート用ノード。DOMにはエクスポートしない（セッション固有のため）
 */

import type { DOMExportOutput, LexicalEditor, NodeKey, SerializedTextNode, Spread } from 'lexical';
import { TextNode } from 'lexical';

export type SerializedAutocompleteNode = Spread<
  {
    uuid: string;
  },
  SerializedTextNode
>;

export class AutocompleteNode extends TextNode {
  __uuid: string;

  static getType(): string {
    return 'autocomplete';
  }

  static clone(node: AutocompleteNode): AutocompleteNode {
    return new AutocompleteNode(node.__text, node.__uuid, node.__key);
  }

  static importJSON(serializedNode: SerializedAutocompleteNode): AutocompleteNode {
    return $createAutocompleteNode(serializedNode.text, serializedNode.uuid).updateFromJSON(serializedNode);
  }

  constructor(text: string, uuid: string, key?: NodeKey) {
    super(text, key);
    this.__uuid = uuid;
  }

  exportJSON(): SerializedAutocompleteNode {
    return {
      ...super.exportJSON(),
      uuid: this.__uuid,
    };
  }

  // DOMにはエクスポートしない（セッション固有の一時的なノード）
  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    return { element: null };
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.textContent = this.__text;
    return span;
  }

  updateDOM(): boolean {
    return false;
  }
}

export function $createAutocompleteNode(text: string, uuid: string): AutocompleteNode {
  return new AutocompleteNode(text, uuid).setMode('token');
}
