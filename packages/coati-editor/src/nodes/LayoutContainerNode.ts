/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { addClassNamesToElement } from '@lexical/utils';
import type {
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  SerializedElementNode,
  Spread,
  StateConfigValue,
} from 'lexical';
import { $create, $getState, $setState, buildImportMap, createState, ElementNode } from 'lexical';

export type SerializedLayoutContainerNode = Spread<
  {
    templateColumns: string;
  },
  SerializedElementNode
>;

const templateColumnsState = createState('templateColumns', {
  parse: (v) => (typeof v === 'string' ? v : ''),
});

function $convertLayoutContainerElement(domNode: HTMLElement): DOMConversionOutput | null {
  const styleAttributes = window.getComputedStyle(domNode);
  const templateColumns = styleAttributes.getPropertyValue('grid-template-columns');
  if (templateColumns) {
    const node = $createLayoutContainerNode(templateColumns);
    return { node };
  }
  return null;
}

export class LayoutContainerNode extends ElementNode {
  $config() {
    return this.config('layout-container', {
      extends: ElementNode,
      importDOM: buildImportMap({
        div: (domNode) => {
          if (!domNode.hasAttribute('data-lexical-layout-container')) {
            return null;
          }
          return {
            conversion: $convertLayoutContainerElement,
            priority: 2,
          };
        },
      }),
      stateConfigs: [{ flat: true, stateConfig: templateColumnsState }],
    });
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.style.gridTemplateColumns = this.getTemplateColumns();
    if (typeof config.theme.layoutContainer === 'string') {
      addClassNamesToElement(dom, config.theme.layoutContainer);
    }
    return dom;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.style.gridTemplateColumns = this.getTemplateColumns();
    element.setAttribute('data-lexical-layout-container', 'true');
    return { element };
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.getTemplateColumns() !== this.getTemplateColumns()) {
      dom.style.gridTemplateColumns = this.getTemplateColumns();
    }
    return false;
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  getTemplateColumns(): StateConfigValue<typeof templateColumnsState> {
    return $getState(this, templateColumnsState);
  }

  setTemplateColumns(templateColumns: string): this {
    return $setState(this, templateColumnsState, templateColumns);
  }
}

export function $createLayoutContainerNode(templateColumns: string = ''): LayoutContainerNode {
  return $setState($create(LayoutContainerNode), templateColumnsState, templateColumns);
}

export function $isLayoutContainerNode(node: LexicalNode | null | undefined): node is LayoutContainerNode {
  return node instanceof LayoutContainerNode;
}
