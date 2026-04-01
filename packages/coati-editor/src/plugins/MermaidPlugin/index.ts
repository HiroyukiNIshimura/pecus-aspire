/*
 * MermaidPlugin
 * Provides INSERT_MERMAID_COMMAND for inserting Mermaid diagram nodes
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import {
  $addUpdateTag,
  $createParagraphNode,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
  SKIP_SELECTION_FOCUS_TAG,
} from 'lexical';
import type { JSX } from 'react';
import { useEffect } from 'react';

import { $createMermaidNode, MermaidNode } from '../../nodes/MermaidNode';

type CommandPayload = {
  source?: string;
};

export const INSERT_MERMAID_COMMAND: LexicalCommand<CommandPayload> = createCommand('INSERT_MERMAID_COMMAND');

const DEFAULT_MERMAID_SOURCE = [
  'flowchart TD',
  '  A[Start] --> B{Decision}',
  '  B -->|Yes| C[Done]',
  '  B -->|No| D[Retry]',
].join('\n');

export default function MermaidPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([MermaidNode])) {
      throw new Error('MermaidPlugin: MermaidNode not registered on editor');
    }

    return editor.registerCommand<CommandPayload>(
      INSERT_MERMAID_COMMAND,
      (payload) => {
        const source = payload?.source ?? DEFAULT_MERMAID_SOURCE;

        editor.update(() => {
          $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
          const mermaidNode = $createMermaidNode(source);
          $insertNodeToNearestRoot(mermaidNode);

          // Insert a paragraph after the Mermaid node for continued editing
          const parent = mermaidNode.getParent();
          if ($isRootOrShadowRoot(parent)) {
            const paragraphNode = $createParagraphNode();
            mermaidNode.insertAfter(paragraphNode);
            paragraphNode.select();
          }
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}

export { MermaidNode };
