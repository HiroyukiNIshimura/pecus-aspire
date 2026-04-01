import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { $applyNodeReplacement, DecoratorNode } from 'lexical';
import type { JSX } from 'react';
import * as React from 'react';

const MermaidComponent = React.lazy(() => import('./MermaidComponent'));

export type SerializedMermaidNode = Spread<
  {
    code: string;
  },
  SerializedLexicalNode
>;

function $convertMermaidElement(domNode: HTMLElement): DOMConversionOutput | null {
  if (domNode.getAttribute('data-lexical-mermaid') !== 'true') {
    return null;
  }

  const codeElement = domNode.querySelector('pre[data-lexical-mermaid-source="true"]');
  const code = codeElement?.textContent ?? domNode.textContent ?? '';
  const node = $createMermaidNode(code);
  return { node };
}

export class MermaidNode extends DecoratorNode<JSX.Element> {
  __code: string;

  static getType(): string {
    return 'mermaid';
  }

  static clone(node: MermaidNode): MermaidNode {
    return new MermaidNode(node.__code, node.__key);
  }

  constructor(code: string, key?: NodeKey) {
    super(key);
    this.__code = code;
  }

  static importJSON(serializedNode: SerializedMermaidNode): MermaidNode {
    return $createMermaidNode(serializedNode.code).updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedMermaidNode {
    return {
      ...super.exportJSON(),
      code: this.getCode(),
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.getAttribute('data-lexical-mermaid') !== 'true') {
          return null;
        }

        return {
          conversion: $convertMermaidElement,
          priority: 2,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-mermaid', 'true');

    const source = document.createElement('pre');
    source.setAttribute('data-lexical-mermaid-source', 'true');
    source.textContent = this.__code;

    element.appendChild(source);
    return { element };
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const element = document.createElement('div');
    element.className = 'editor-mermaid';
    return element;
  }

  updateDOM(): false {
    return false;
  }

  getTextContent(): string {
    return this.__code;
  }

  getCode(): string {
    return this.__code;
  }

  setCode(code: string): void {
    const writable = this.getWritable();
    writable.__code = code;
  }

  decorate(): JSX.Element {
    return <MermaidComponent code={this.__code} nodeKey={this.__key} />;
  }

  isIsolated(): true {
    return true;
  }
}

export function $createMermaidNode(code = ''): MermaidNode {
  return $applyNodeReplacement(new MermaidNode(code));
}

export function $isMermaidNode(node: LexicalNode | null | undefined): node is MermaidNode {
  return node instanceof MermaidNode;
}
