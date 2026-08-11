/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  SerializedTextNode,
  Spread,
  StateConfigValue,
  StateValueOrUpdater,
} from 'lexical';

import { $create, $getState, $setState, createState, TextNode } from 'lexical';

import { uuid as UUID } from '../plugins/AutocompletePlugin';

export type SerializedAutocompleteNode = Spread<
  {
    uuid: string;
  },
  SerializedTextNode
>;

const uuidState = createState('uuid', {
  parse: (v) => (typeof v === 'string' ? v : ''),
});

export class AutocompleteNode extends TextNode {
  /**
   * A unique uuid is generated for each session and assigned to the instance.
   * This helps to:
   * - Ensures max one Autocomplete node per session.
   * - Ensure that when collaboration is enabled, this node is not shown in
   *   other sessions.
   * See https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/AutocompletePlugin/index.tsx
   */
  $config() {
    return this.config('autocomplete', {
      extends: TextNode,
      stateConfigs: [{ flat: true, stateConfig: uuidState }],
    });
  }

  exportJSON(): SerializedAutocompleteNode {
    return {
      ...super.exportJSON(),
      uuid: this.getUUID(),
    };
  }

  updateDOM(_prevNode: this, _dom: HTMLElement, _config: EditorConfig): boolean {
    return false;
  }

  exportDOM(_: LexicalEditor): DOMExportOutput {
    return { element: null };
  }

  excludeFromCopy() {
    return true;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add(config.theme.autocomplete);
    if (this.getUUID() !== UUID) {
      dom.style.display = 'none';
    }
    return dom;
  }

  getUUID(): StateConfigValue<typeof uuidState> {
    return $getState(this, uuidState);
  }

  setUUID(valueOrUpdater: StateValueOrUpdater<typeof uuidState>): this {
    return $setState(this, uuidState, valueOrUpdater);
  }
}

export function $createAutocompleteNode(text: string, uuid: string): AutocompleteNode {
  return $setState($create(AutocompleteNode).setTextContent(text).setMode('token'), uuidState, uuid);
}
