import { $convertToMarkdownString } from '@lexical/markdown';
import type { EditorState } from 'lexical';

import { PLAYGROUND_TRANSFORMERS } from '../plugins/MarkdownTransformers';

/**
 * Lexical EditorState を Coati 独自の Markdown 変換ルールで文字列化する
 *
 * @param editorState - Markdown 化したい EditorState
 * @returns Markdown 文字列
 */
export default function getMarkdownFromEditorState(editorState: EditorState): string {
  let markdown = '';

  editorState.read(() => {
    markdown = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);
  });

  return markdown;
}
