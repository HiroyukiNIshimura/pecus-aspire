/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import katex from 'katex';
import type {
  DOMConversionOutput,
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
  type DOMExportOutput,
} from 'lexical';
import type { JSX } from 'react';
import * as React from 'react';

const EquationComponent = React.lazy(() => import('./EquationComponent'));

export type SerializedEquationNode = Spread<
  {
    equation: string;
    inline: boolean;
  },
  SerializedLexicalNode
>;

const equationState = createState('equation', {
  parse: (v) => (typeof v === 'string' ? v : ''),
});

const inlineState = createState('inline', {
  parse: (v) => (typeof v === 'boolean' ? v : false),
});

function $convertEquationElement(domNode: HTMLElement): null | DOMConversionOutput {
  let equation = domNode.getAttribute('data-lexical-equation');
  const inline = domNode.getAttribute('data-lexical-inline') === 'true';
  // Decode the equation from base64
  equation = atob(equation || '');
  if (equation) {
    const node = $createEquationNode(equation, inline);
    return { node };
  }

  return null;
}

export class EquationNode extends DecoratorNode<JSX.Element> {
  $config() {
    return this.config('equation', {
      extends: DecoratorNode,
      importDOM: buildImportMap({
        div: (domNode) => {
          if (!domNode.hasAttribute('data-lexical-equation')) {
            return null;
          }
          return {
            conversion: $convertEquationElement,
            priority: 2,
          };
        },
        span: (domNode) => {
          if (!domNode.hasAttribute('data-lexical-equation')) {
            return null;
          }
          return {
            conversion: $convertEquationElement,
            priority: 1,
          };
        },
      }),
      stateConfigs: [
        { flat: true, stateConfig: equationState },
        { flat: true, stateConfig: inlineState },
      ],
    });
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const element = document.createElement(this.getInline() ? 'span' : 'div');
    // EquationNodes should implement `user-action:none` in their CSS to avoid issues with deletion on Android.
    element.className = 'editor-equation';
    return element;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement(this.getInline() ? 'span' : 'div');
    // Encode the equation as base64 to avoid issues with special characters
    const equation = btoa(this.getEquation());
    element.setAttribute('data-lexical-equation', equation);
    element.setAttribute('data-lexical-inline', `${this.getInline()}`);
    katex.render(this.getEquation(), element, {
      displayMode: !this.getInline(), // true === block display //
      errorColor: '#cc0000',
      output: 'html',
      strict: 'warn',
      throwOnError: false,
      trust: false,
    });
    return { element };
  }

  updateDOM(prevNode: this): boolean {
    // If the inline property changes, replace the element
    return this.getInline() !== prevNode.getInline();
  }

  getTextContent(): string {
    return this.getEquation();
  }

  getEquation(): StateConfigValue<typeof equationState> {
    return $getState(this, equationState);
  }

  setEquation(equation: string): this {
    return $setState(this, equationState, equation);
  }

  getInline(): StateConfigValue<typeof inlineState> {
    return $getState(this, inlineState);
  }

  decorate(): JSX.Element {
    return <EquationComponent equation={this.getEquation()} inline={this.getInline()} nodeKey={this.__key} />;
  }
}

export function $createEquationNode(equation = '', inline = false): EquationNode {
  return $applyNodeReplacement(
    $setState($setState($create(EquationNode), equationState, equation), inlineState, inline),
  );
}

export function $isEquationNode(node: LexicalNode | null | undefined): node is EquationNode {
  return node instanceof EquationNode;
}
