/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $insertGeneratedNodes } from '@lexical/clipboard';
import { HashtagNode } from '@lexical/hashtag';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { LinkNode } from '@lexical/link';
import type {
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
  RangeSelection,
  SerializedEditor,
  SerializedLexicalNode,
  Spread,
  StateConfigValue,
} from 'lexical';
import {
  $applyNodeReplacement,
  $createRangeSelection,
  $extendCaretToRange,
  $getChildCaret,
  $getEditor,
  $getRoot,
  $getState,
  $isElementNode,
  $isParagraphNode,
  $selectAll,
  $setSelection,
  $setState,
  buildImportMap,
  createEditor,
  createState,
  DecoratorNode,
  LineBreakNode,
  ParagraphNode,
  RootNode,
  SKIP_DOM_SELECTION_TAG,
  TextNode,
} from 'lexical';
import type { JSX } from 'react';
import * as React from 'react';

import { EmojiNode } from './EmojiNode';
import { KeywordNode } from './KeywordNode';

const ImageComponent = React.lazy(() => import('./ImageComponent'));

export interface ImagePayload {
  altText: string;
  caption?: LexicalEditor;
  height?: number;
  key?: NodeKey;
  maxWidth?: number;
  showCaption?: boolean;
  src: string;
  width?: number;
  captionsEnabled?: boolean;
}

function isGoogleDocCheckboxImg(img: HTMLImageElement): boolean {
  return (
    img.parentElement != null &&
    img.parentElement.tagName === 'LI' &&
    img.previousSibling === null &&
    img.getAttribute('aria-roledescription') === 'checkbox'
  );
}

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLImageElement;
  const src = img.getAttribute('src');
  if (!src || src.startsWith('file:///') || isGoogleDocCheckboxImg(img)) {
    return null;
  }
  const { alt: altText, width, height } = img;
  const node = $createImageNode({ altText, height, src, width });
  return { node };
}

export function $isCaptionEditorEmpty(): boolean {
  // Search the document for any non-element node
  // to determine if it's empty or not
  for (const { origin } of $extendCaretToRange($getChildCaret($getRoot(), 'next'))) {
    if (!$isElementNode(origin)) {
      return false;
    }
  }
  return true;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    caption: SerializedEditor;
    height?: number;
    maxWidth: number;
    showCaption: boolean;
    src: string;
    width?: number;
  },
  SerializedLexicalNode
>;

const srcState = createState('src', {
  parse: (v) => (typeof v === 'string' ? v : ''),
});

const altTextState = createState('altText', {
  parse: (v) => (typeof v === 'string' ? v : ''),
});

const widthState = createState('width', {
  parse: (v) => (v === undefined || v === null || v === 0 ? 'inherit' : typeof v === 'number' ? v : 'inherit'),
  unparse: (v) => (v === 'inherit' ? 0 : v),
});

const heightState = createState('height', {
  parse: (v) => (v === undefined || v === null || v === 0 ? 'inherit' : typeof v === 'number' ? v : 'inherit'),
  unparse: (v) => (v === 'inherit' ? 0 : v),
});

const maxWidthState = createState('maxWidth', {
  parse: (v) => (typeof v === 'number' ? v : 500),
});

const showCaptionState = createState('showCaption', {
  parse: (v) => (typeof v === 'boolean' ? v : false),
});

const captionsEnabledState = createState('captionsEnabled', {
  parse: (v) => (typeof v === 'boolean' ? v : true),
});

export class ImageNode extends DecoratorNode<JSX.Element> {
  // Captions cannot yet be used within editor cells
  __caption: LexicalEditor;

  $config() {
    return this.config('image', {
      extends: DecoratorNode,
      importDOM: buildImportMap({
        figcaption: () => ({
          conversion: () => ({ node: null }),
          priority: 0,
        }),
        figure: () => ({
          conversion: (node) => {
            return {
              after: (childNodes) => {
                const imageNodes = childNodes.filter($isImageNode);
                const figcaption = node.querySelector('figcaption');
                if (figcaption) {
                  for (const imgNode of imageNodes) {
                    imgNode.setShowCaption(true);
                    imgNode.__caption.update(
                      () => {
                        const editor = $getEditor();
                        $insertGeneratedNodes(editor, $generateNodesFromDOM(editor, figcaption), $selectAll());
                        $setSelection(null);
                      },
                      { tag: SKIP_DOM_SELECTION_TAG },
                    );
                  }
                }
                return imageNodes;
              },
              node: null,
            };
          },
          priority: 0,
        }),
        img: () => ({
          conversion: $convertImageElement,
          priority: 0,
        }),
      }),
      stateConfigs: [
        { flat: true, stateConfig: srcState },
        { flat: true, stateConfig: altTextState },
        { flat: true, stateConfig: widthState },
        { flat: true, stateConfig: heightState },
        { flat: true, stateConfig: maxWidthState },
        { flat: true, stateConfig: showCaptionState },
        { flat: true, stateConfig: captionsEnabledState },
      ],
    });
  }

  constructor(key: NodeKey | undefined = undefined) {
    super(key);
    this.__caption = createEditor({
      namespace: 'Playground/ImageNodeCaption',
      nodes: [RootNode, TextNode, LineBreakNode, ParagraphNode, LinkNode, EmojiNode, HashtagNode, KeywordNode],
    });
  }

  afterCloneFrom(prevNode: this): void {
    super.afterCloneFrom(prevNode);
    this.__caption = prevNode.__caption;
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedImageNode>): this {
    const node = super.updateFromJSON(serializedNode);
    const { caption } = serializedNode;

    const nestedEditor = node.__caption;
    const editorState = nestedEditor.parseEditorState(caption.editorState);
    if (!editorState.isEmpty()) {
      nestedEditor.setEditorState(editorState);
    }
    return node;
  }

  exportDOM(): DOMExportOutput {
    const imgElement = document.createElement('img');
    imgElement.setAttribute('src', this.getSrc());
    imgElement.setAttribute('alt', this.getAltText());
    imgElement.setAttribute('width', this.getWidth().toString());
    imgElement.setAttribute('height', this.getHeight().toString());

    if (this.getShowCaption() && this.__caption) {
      const captionEditor = this.__caption;
      const captionHtml = captionEditor.read(() => {
        if ($isCaptionEditorEmpty()) {
          return null;
        }
        // Don't serialize the wrapping paragraph if there is only one
        let selection: null | RangeSelection = null;
        const firstChild = $getRoot().getFirstChild();
        if ($isParagraphNode(firstChild) && firstChild.getNextSibling() === null) {
          selection = $createRangeSelection();
          selection.anchor.set(firstChild.getKey(), 0, 'element');
          selection.focus.set(firstChild.getKey(), firstChild.getChildrenSize(), 'element');
        }
        return $generateHtmlFromNodes(captionEditor, selection);
      });
      if (captionHtml) {
        const figureElement = document.createElement('figure');
        const figcaptionElement = document.createElement('figcaption');
        figcaptionElement.innerHTML = captionHtml;

        figureElement.appendChild(imgElement);
        figureElement.appendChild(figcaptionElement);

        return { element: figureElement };
      }
    }

    return { element: imgElement };
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      altText: this.getAltText(),
      caption: this.__caption.toJSON(),
      height: this.getHeight() === 'inherit' ? 0 : (this.getHeight() as number),
      maxWidth: this.getMaxWidth(),
      showCaption: this.getShowCaption(),
      src: this.getSrc(),
      width: this.getWidth() === 'inherit' ? 0 : (this.getWidth() as number),
    };
  }

  setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void {
    $setState(this, widthState, width);
    $setState(this, heightState, height);
  }

  setShowCaption(showCaption: boolean): void {
    $setState(this, showCaptionState, showCaption);
  }

  // View

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): StateConfigValue<typeof srcState> {
    return $getState(this, srcState);
  }

  getAltText(): StateConfigValue<typeof altTextState> {
    return $getState(this, altTextState);
  }

  getWidth(): StateConfigValue<typeof widthState> {
    return $getState(this, widthState);
  }

  getHeight(): StateConfigValue<typeof heightState> {
    return $getState(this, heightState);
  }

  getMaxWidth(): StateConfigValue<typeof maxWidthState> {
    return $getState(this, maxWidthState);
  }

  getShowCaption(): StateConfigValue<typeof showCaptionState> {
    return $getState(this, showCaptionState);
  }

  getCaptionsEnabled(): StateConfigValue<typeof captionsEnabledState> {
    return $getState(this, captionsEnabledState);
  }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        src={this.getSrc()}
        altText={this.getAltText()}
        width={this.getWidth()}
        height={this.getHeight()}
        maxWidth={this.getMaxWidth()}
        nodeKey={this.getKey()}
        showCaption={this.getShowCaption()}
        caption={this.__caption}
        captionsEnabled={this.getCaptionsEnabled()}
        resizable={true}
      />
    );
  }
}

export function $createImageNode({
  altText,
  height,
  maxWidth = 500,
  captionsEnabled,
  src,
  width,
  showCaption,
  caption,
  key,
}: ImagePayload): ImageNode {
  const node = $applyNodeReplacement(new ImageNode(key));
  $setState(node, srcState, src);
  $setState(node, altTextState, altText ?? '');
  $setState(node, widthState, width === undefined || width === 0 ? 'inherit' : width);
  $setState(node, heightState, height === undefined || height === 0 ? 'inherit' : height);
  $setState(node, maxWidthState, maxWidth);
  $setState(node, showCaptionState, showCaption ?? false);
  $setState(node, captionsEnabledState, captionsEnabled ?? true);
  if (caption) {
    node.__caption = caption;
  }
  return node;
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
