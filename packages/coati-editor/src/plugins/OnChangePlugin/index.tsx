/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { EditorState, LexicalEditor } from 'lexical';
import { useEffect } from 'react';

export default function OnChangePlugin({
  onChange,
  ignoreHistoryMergeTagChange = true,
  ignoreSelectionChange = true,
}: {
  onChange: (editorState: EditorState, editor: LexicalEditor) => void;
  ignoreHistoryMergeTagChange?: boolean;
  ignoreSelectionChange?: boolean;
}): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves, tags }) => {
      if (
        (ignoreSelectionChange && dirtyElements.size === 0 && dirtyLeaves.size === 0) ||
        (ignoreHistoryMergeTagChange && tags.has('history-merge'))
      ) {
        return;
      }

      onChange(editorState, editor);
    });
  }, [editor, ignoreHistoryMergeTagChange, ignoreSelectionChange, onChange]);

  return null;
}
