/**
 * EquationNode - ヘッドレス版
 * 数式ノード（KaTeX変換なし、テキストとして出力）
 */

import type { DOMExportOutput, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import { $applyNodeReplacement, DecoratorNode } from 'lexical';

export type SerializedEquationNode = Spread<
  {
    equation: string;
    inline: boolean;
  },
  SerializedLexicalNode
>;

export class EquationNode extends DecoratorNode<null> {
  __equation: string;
  __inline: boolean;

  static getType(): string {
    return 'equation';
  }

  static clone(node: EquationNode): EquationNode {
    return new EquationNode(node.__equation, node.__inline, node.__key);
  }

  constructor(equation: string, inline?: boolean, key?: NodeKey) {
    super(key);
    this.__equation = equation;
    this.__inline = inline ?? false;
  }

  static importJSON(serializedNode: SerializedEquationNode): EquationNode {
    return $createEquationNode(serializedNode.equation, serializedNode.inline).updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedEquationNode {
    return {
      ...super.exportJSON(),
      equation: this.__equation,
      inline: this.__inline,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement(this.__inline ? 'span' : 'div');
    element.setAttribute('data-lexical-equation', 'true');
    element.textContent = this.__equation;
    return { element };
  }

  createDOM(): HTMLElement {
    const element = document.createElement(this.__inline ? 'span' : 'div');
    element.className = 'editor-equation';
    return element;
  }

  updateDOM(prevNode: this): boolean {
    return this.__inline !== prevNode.__inline;
  }

  getTextContent(): string {
    return this.__equation;
  }

  getEquation(): string {
    return this.__equation;
  }

  setEquation(equation: string): void {
    const writable = this.getWritable();
    writable.__equation = equation;
  }

  decorate(): null {
    return null;
  }
}

export function $createEquationNode(equation = '', inline = false): EquationNode {
  return $applyNodeReplacement(new EquationNode(equation, inline));
}

export function $isEquationNode(node: LexicalNode | null | undefined): node is EquationNode {
  return node instanceof EquationNode;
}
