import type { SerializedQuoteNode } from '@lexical/rich-text';
import { QuoteNode } from '@lexical/rich-text';
import type { DOMExportOutput, EditorConfig, LexicalEditor, LexicalNode, SerializedPartial, Spread } from 'lexical';
import { $applyNodeReplacement, $create, buildImportMap, isHTMLElement } from 'lexical';

export const ALERT_TYPES = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export type SerializedAlertNode = Spread<{ alertType: AlertType }, SerializedQuoteNode>;

function normalizeAlertType(value: unknown): AlertType | null {
  if (typeof value !== 'string') {
    return null;
  }
  return ALERT_TYPES.find((alertType) => alertType === value.toUpperCase()) ?? null;
}

function getAlertLabel(alertType: AlertType): string {
  return alertType[0] + alertType.slice(1).toLowerCase();
}

/** @noInheritDoc */
export class AlertNode extends QuoteNode {
  __alertType: AlertType = 'NOTE';

  $config() {
    return this.config('alert', {
      extends: QuoteNode,
      importDOM: buildImportMap({
        blockquote: (domNode) => {
          const alertType = normalizeAlertType(domNode.getAttribute('data-alert-type'));
          if (!alertType) {
            return null;
          }
          return {
            conversion: () => ({ node: $createAlertNode(alertType) }),
            priority: 2,
          };
        },
      }),
    });
  }

  static clone(node: AlertNode): AlertNode {
    const clone = new AlertNode(node.__key);
    clone.afterCloneFrom(node);
    return clone;
  }

  afterCloneFrom(prevNode: this): void {
    super.afterCloneFrom(prevNode);
    this.__alertType = prevNode.__alertType;
  }

  static importJSON(serializedNode: SerializedPartial<SerializedAlertNode>): AlertNode {
    return $createAlertNode(normalizeAlertType(serializedNode.alertType) ?? 'NOTE').updateFromJSON(serializedNode);
  }

  exportJSON(compact?: false): SerializedAlertNode;
  exportJSON(compact: boolean): SerializedPartial<SerializedAlertNode>;
  exportJSON(compact = false) {
    return {
      ...super.exportJSON(compact),
      alertType: this.getAlertType(),
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    this.updateAlertDOM(element);
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    if (super.updateDOM(prevNode, dom, config)) {
      return true;
    }
    this.updateAlertDOM(dom);
    return false;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor);
    if (isHTMLElement(output.element)) {
      this.updateAlertDOM(output.element);
    }
    return output;
  }

  getAlertType(): AlertType {
    return this.getLatest().__alertType;
  }

  setAlertType(alertType: AlertType): this {
    const writable = this.getWritable();
    writable.__alertType = alertType;
    return writable;
  }

  private updateAlertDOM(element: HTMLElement): void {
    const label = getAlertLabel(this.getAlertType());
    element.setAttribute('data-alert-type', this.getAlertType());
    element.setAttribute('role', 'note');
    element.setAttribute('aria-label', `${label} alert`);
  }
}

export function $createAlertNode(alertType: AlertType = 'NOTE'): AlertNode {
  return $applyNodeReplacement($create(AlertNode).setAlertType(alertType));
}

export function $isAlertNode(node: LexicalNode | null | undefined): node is AlertNode {
  return node?.getType() === 'alert';
}
