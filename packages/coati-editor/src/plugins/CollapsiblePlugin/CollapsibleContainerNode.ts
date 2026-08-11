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
  $getSiblingCaret,
  $getState,
  $isElementNode,
  $rewindSiblingCaret,
  $setState,
  buildImportMap,
  createState,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  ElementNode,
  isHTMLElement,
  type LexicalEditor,
  type LexicalNode,
  type RangeSelection,
} from 'lexical';

import { setDomHiddenUntilFound } from './CollapsibleUtils';

const openState = createState('open', {
  parse: (v) => (typeof v === 'boolean' ? v : true),
});

export function $convertDetailsElement(domNode: HTMLDetailsElement): DOMConversionOutput | null {
  const isOpen = domNode.open !== undefined ? domNode.open : true;
  const node = $createCollapsibleContainerNode(isOpen);
  return {
    node,
  };
}

export class CollapsibleContainerNode extends ElementNode {
  $config() {
    return this.config('collapsible-container', {
      extends: ElementNode,
      importDOM: buildImportMap({
        details: () => ({
          conversion: $convertDetailsElement,
          priority: 1,
        }),
      }),
      stateConfigs: [{ flat: true, stateConfig: openState }],
    });
  }

  isShadowRoot(): boolean {
    return true;
  }

  collapseAtStart(_selection: RangeSelection): boolean {
    // Unwrap the CollapsibleContainerNode by replacing it with the children
    // of its children (CollapsibleTitleNode, CollapsibleContentNode)
    const nodesToInsert: LexicalNode[] = [];
    for (const child of this.getChildren()) {
      if ($isElementNode(child)) {
        nodesToInsert.push(...child.getChildren());
      }
    }
    const caret = $rewindSiblingCaret($getSiblingCaret(this, 'previous'));
    caret.splice(1, nodesToInsert);
    // Merge the first child of the CollapsibleTitleNode with the
    // previous sibling of the CollapsibleContainerNode
    const [firstChild] = nodesToInsert;
    if (firstChild) {
      firstChild.selectStart().deleteCharacter(true);
    }
    return true;
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor): HTMLElement {
    // details is not well supported in Chrome #5582
    let dom: HTMLElement;
    if (IS_CHROME) {
      dom = document.createElement('div');
      dom.setAttribute('open', '');
    } else {
      const detailsDom = document.createElement('details');
      detailsDom.open = this.getOpen();
      detailsDom.addEventListener('toggle', () => {
        const open = editor.getEditorState().read(() => this.getOpen());
        if (open !== detailsDom.open) {
          editor.update(() => this.toggleOpen());
        }
      });
      dom = detailsDom;
    }
    dom.classList.add('Collapsible__container');

    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLDetailsElement): boolean {
    const currentOpen = this.getOpen();
    if (prevNode.getOpen() !== currentOpen) {
      // details is not well supported in Chrome #5582
      if (IS_CHROME) {
        const contentDom = dom.children[1];
        if (!isHTMLElement(contentDom)) {
          throw new Error('Expected contentDom to be an HTMLElement');
        }
        if (currentOpen) {
          dom.setAttribute('open', '');
          contentDom.hidden = false;
        } else {
          dom.removeAttribute('open');
          setDomHiddenUntilFound(contentDom);
        }
      } else {
        dom.open = currentOpen;
      }
    }

    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('details');
    element.classList.add('Collapsible__container');
    element.setAttribute('open', this.getOpen().toString());
    return { element };
  }

  setOpen(open: boolean): void {
    $setState(this, openState, open);
  }

  getOpen(): boolean {
    return $getState(this, openState);
  }

  toggleOpen(): void {
    this.setOpen(!this.getOpen());
  }
}

export function $createCollapsibleContainerNode(isOpen: boolean): CollapsibleContainerNode {
  return $setState($create(CollapsibleContainerNode), openState, isOpen);
}

export function $isCollapsibleContainerNode(node: LexicalNode | null | undefined): node is CollapsibleContainerNode {
  return node instanceof CollapsibleContainerNode;
}
