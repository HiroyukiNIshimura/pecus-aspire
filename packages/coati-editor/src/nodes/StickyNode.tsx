/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
  SerializedEditor,
  SerializedLexicalNode,
  Spread,
  StateConfigValue,
} from 'lexical';
import {
  $applyNodeReplacement,
  $create,
  $getState,
  $setSelection,
  $setState,
  createEditor,
  createState,
  DecoratorNode,
} from 'lexical';
import type { JSX } from 'react';
import * as React from 'react';

const StickyComponent = React.lazy(() => import('./StickyComponent'));

type StickyNoteColor = 'pink' | 'yellow';

export type SerializedStickyNode = Spread<
  {
    xOffset: number;
    yOffset: number;
    color: StickyNoteColor;
    caption: SerializedEditor;
  },
  SerializedLexicalNode
>;

const xOffsetState = createState('xOffset', {
  parse: (v) => (typeof v === 'number' ? v : 0),
});

const yOffsetState = createState('yOffset', {
  parse: (v) => (typeof v === 'number' ? v : 0),
});

const colorState = createState('color', {
  parse: (v) => (v === 'pink' || v === 'yellow' ? v : 'yellow'),
});

export class StickyNode extends DecoratorNode<JSX.Element> {
  __caption: LexicalEditor;

  $config() {
    return this.config('sticky', {
      extends: DecoratorNode,
      stateConfigs: [
        { flat: true, stateConfig: xOffsetState },
        { flat: true, stateConfig: yOffsetState },
        { flat: true, stateConfig: colorState },
      ],
    });
  }

  constructor(key: NodeKey | undefined = undefined) {
    super(key);
    this.__caption = createEditor();
  }

  afterCloneFrom(prevNode: this): void {
    super.afterCloneFrom(prevNode);
    this.__caption = prevNode.__caption;
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedStickyNode>): this {
    const stickyNode = super.updateFromJSON(serializedNode);
    const caption = serializedNode.caption;
    const nestedEditor = stickyNode.__caption;
    const editorState = nestedEditor.parseEditorState(caption.editorState);
    if (!editorState.isEmpty()) {
      nestedEditor.setEditorState(editorState);
    }
    return stickyNode;
  }

  exportJSON(): SerializedStickyNode {
    return {
      ...super.exportJSON(),
      caption: this.__caption.toJSON(),
      color: this.getColor(),
      xOffset: this.getXOffset(),
      yOffset: this.getYOffset(),
    };
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'contents';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  setPosition(x: number, y: number): void {
    $setState(this, xOffsetState, x);
    $setState(this, yOffsetState, y);
    $setSelection(null);
  }

  toggleColor(): void {
    $setState(this, colorState, (prev) => (prev === 'pink' ? 'yellow' : 'pink'));
  }

  getXOffset(): StateConfigValue<typeof xOffsetState> {
    return $getState(this, xOffsetState);
  }

  getYOffset(): StateConfigValue<typeof yOffsetState> {
    return $getState(this, yOffsetState);
  }

  getColor(): StateConfigValue<typeof colorState> {
    return $getState(this, colorState);
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      <StickyComponent
        color={this.getColor()}
        x={this.getXOffset()}
        y={this.getYOffset()}
        nodeKey={this.getKey()}
        caption={this.__caption}
      />
    );
  }

  isIsolated(): true {
    return true;
  }
}

export function $isStickyNode(node: LexicalNode | null | undefined): node is StickyNode {
  return node instanceof StickyNode;
}

export function $createStickyNode(xOffset: number, yOffset: number): StickyNode {
  const node = $applyNodeReplacement($create(StickyNode));
  $setState(node, xOffsetState, xOffset);
  $setState(node, yOffsetState, yOffset);
  $setState(node, colorState, 'yellow');
  return node;
}
