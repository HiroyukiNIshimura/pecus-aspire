/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { IS_CHROME } from '@lexical/utils';
import {
  $create,
  buildImportMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  ElementNode,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';

import { $isCollapsibleContainerNode } from './CollapsibleContainerNode';
import { domOnBeforeMatch, setDomHiddenUntilFound } from './CollapsibleUtils';

export function $convertCollapsibleContentElement(_domNode: HTMLElement): DOMConversionOutput | null {
  const node = $createCollapsibleContentNode();
  return {
    node,
  };
}

export class CollapsibleContentNode extends ElementNode {
  $config() {
    return this.config('collapsible-content', {
      extends: ElementNode,
      importDOM: buildImportMap({
        div: (domNode) => {
          if (!domNode.hasAttribute('data-lexical-collapsible-content')) {
            return null;
          }
          return {
            conversion: $convertCollapsibleContentElement,
            priority: 2,
          };
        },
      }),
    });
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('Collapsible__content');
    if (IS_CHROME) {
      editor.getEditorState().read(() => {
        const containerNode = this.getParentOrThrow();
        if (!$isCollapsibleContainerNode(containerNode)) {
          throw new Error('Expected parent node to be a CollapsibleContainerNode');
        }
        if (!containerNode.getOpen()) {
          setDomHiddenUntilFound(dom);
        }
      });
      domOnBeforeMatch(dom, () => {
        editor.update(() => {
          const containerNode = this.getParentOrThrow().getLatest();
          if (!$isCollapsibleContainerNode(containerNode)) {
            throw new Error('Expected parent node to be a CollapsibleContainerNode');
          }
          if (!containerNode.getOpen()) {
            containerNode.toggleOpen();
          }
        });
      });
    }
    return dom;
  }

  updateDOM(_prevNode: this, _dom: HTMLElement): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.classList.add('Collapsible__content');
    element.setAttribute('data-lexical-collapsible-content', 'true');
    return { element };
  }

  isShadowRoot(): boolean {
    return true;
  }
}

export function $createCollapsibleContentNode(): CollapsibleContentNode {
  return $create(CollapsibleContentNode);
}

export function $isCollapsibleContentNode(node: LexicalNode | null | undefined): node is CollapsibleContentNode {
  return node instanceof CollapsibleContentNode;
}
