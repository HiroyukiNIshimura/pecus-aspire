/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  EditorConfig,
  LexicalNode,
  SerializedTextNode,
  Spread,
  StateConfigValue,
  StateValueOrUpdater,
} from 'lexical';

import { $create, $getState, $setState, createState, TextNode } from 'lexical';

export type SerializedEmojiNode = Spread<
  {
    className: string;
  },
  SerializedTextNode
>;

const classNameState = createState('className', {
  parse: (v) => (typeof v === 'string' ? v : ''),
});

export class EmojiNode extends TextNode {
  $config() {
    return this.config('emoji', {
      extends: TextNode,
      stateConfigs: [{ flat: true, stateConfig: classNameState }],
    });
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('span');
    const inner = super.createDOM(config);
    dom.className = this.getClassName();
    inner.className = 'emoji-inner';
    dom.appendChild(inner);
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const inner = dom.firstChild;
    if (inner === null) {
      return true;
    }
    super.updateDOM(prevNode, inner as HTMLElement, config);
    return false;
  }

  getClassName(): StateConfigValue<typeof classNameState> {
    return $getState(this, classNameState);
  }

  setClassName(valueOrUpdater: StateValueOrUpdater<typeof classNameState>): this {
    return $setState(this, classNameState, valueOrUpdater);
  }
}

export function $isEmojiNode(node: LexicalNode | null | undefined): node is EmojiNode {
  return node instanceof EmojiNode;
}

export function $createEmojiNode(className: string, emojiText: string): EmojiNode {
  return $setState($create(EmojiNode).setTextContent(emojiText).setMode('token'), classNameState, className);
}
