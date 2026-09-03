/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import { DecoratorBlockNode, type SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';
import type {
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
  StateConfigValue,
} from 'lexical';
import { $create, $getState, $setState, createState } from 'lexical';
import type { JSX } from 'react';

type FigmaComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  documentID: string;
}>;

function FigmaComponent({ className, format, nodeKey, documentID }: FigmaComponentProps) {
  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <iframe
        title={`Figma Embed - ${documentID}`}
        width="560"
        height="315"
        src={`https://www.figma.com/embed?embed_host=lexical&url=\
        https://www.figma.com/file/${documentID}`}
        allowFullScreen={true}
      />
    </BlockWithAlignableContents>
  );
}

export type SerializedFigmaNode = Spread<
  {
    documentID: string;
  },
  SerializedDecoratorBlockNode
>;

const documentIDState = createState('documentID', {
  parse: (v) => (typeof v === 'string' ? v : ''),
});

export class FigmaNode extends DecoratorBlockNode {
  $config() {
    return this.config('figma', {
      extends: DecoratorBlockNode,
      stateConfigs: [{ flat: true, stateConfig: documentIDState }],
    });
  }

  updateDOM(): false {
    return false;
  }

  getId(): StateConfigValue<typeof documentIDState> {
    return $getState(this, documentIDState);
  }

  getTextContent(_includeInert?: boolean | undefined, _includeDirectionless?: false | undefined): string {
    return `https://www.figma.com/file/${this.getId()}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <FigmaComponent className={className} format={this.__format} nodeKey={this.getKey()} documentID={this.getId()} />
    );
  }
}

export function $createFigmaNode(documentID: string): FigmaNode {
  return $setState($create(FigmaNode), documentIDState, documentID);
}

export function $isFigmaNode(node: FigmaNode | LexicalNode | null | undefined): node is FigmaNode {
  return node instanceof FigmaNode;
}
