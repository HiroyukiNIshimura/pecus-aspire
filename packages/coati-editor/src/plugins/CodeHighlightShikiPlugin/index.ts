/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $isCodeNode } from '@lexical/code';
import { registerCodeHighlighting, ShikiTokenizer, type Tokenizer } from '@lexical/code-shiki';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $dfs } from '@lexical/utils';
import type { JSX } from 'react';
import { useEffect, useMemo, useRef } from 'react';

import { useSettings } from '../../context/SettingsContext';

export default function CodeHighlightShikiPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const {
    settings: { codeShikiTheme },
  } = useSettings();
  const prevThemeRef = useRef(codeShikiTheme);

  const tokenizer: Tokenizer = useMemo(
    () => ({
      ...ShikiTokenizer,
      defaultTheme: codeShikiTheme,
    }),
    [codeShikiTheme],
  );

  // テーマが変更されたら、すべての CodeNode のテーマを更新
  useEffect(() => {
    if (prevThemeRef.current !== codeShikiTheme) {
      prevThemeRef.current = codeShikiTheme;
      editor.update(() => {
        for (const { node } of $dfs()) {
          if ($isCodeNode(node)) {
            node.setTheme(codeShikiTheme);
          }
        }
      });
    }
  }, [editor, codeShikiTheme]);

  useEffect(() => {
    return registerCodeHighlighting(editor, tokenizer);
  }, [editor, tokenizer]);

  return null;
}
