import type {
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
  StateConfigValue,
} from 'lexical';
import {
  $applyNodeReplacement,
  $create,
  $getState,
  $setState,
  buildImportMap,
  createState,
  DecoratorNode,
} from 'lexical';
import type { JSX } from 'react';
import * as React from 'react';

const MermaidComponent = React.lazy(() => import('./MermaidComponent'));

export type SerializedMermaidNode = Spread<
  {
    code: string;
  },
  SerializedLexicalNode
>;

const codeState = createState('code', {
  parse: (v) => (typeof v === 'string' ? v : ''),
});

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
  $config() {
    return this.config('mermaid', {
      extends: DecoratorNode,
      importDOM: buildImportMap({
        div: (domNode) => {
          if (domNode.getAttribute('data-lexical-mermaid') !== 'true') {
            return null;
          }

          return {
            conversion: $convertMermaidElement,
            priority: 2,
          };
        },
      }),
      stateConfigs: [{ flat: true, stateConfig: codeState }],
    });
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-mermaid', 'true');

    const source = document.createElement('pre');
    source.setAttribute('data-lexical-mermaid-source', 'true');
    source.textContent = this.getCode();

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
    return this.getCode();
  }

  getCode(): StateConfigValue<typeof codeState> {
    return $getState(this, codeState);
  }

  setCode(code: string): this {
    return $setState(this, codeState, code);
  }

  decorate(): JSX.Element {
    return <MermaidComponent code={this.getCode()} nodeKey={this.__key} />;
  }

  isIsolated(): true {
    return true;
  }
}

export function $createMermaidNode(code = ''): MermaidNode {
  return $applyNodeReplacement($setState($create(MermaidNode), codeState, code));
}

export function $isMermaidNode(node: LexicalNode | null | undefined): node is MermaidNode {
  return node instanceof MermaidNode;
}
