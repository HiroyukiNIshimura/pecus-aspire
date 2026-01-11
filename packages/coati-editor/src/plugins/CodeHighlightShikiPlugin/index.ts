/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { registerCodeHighlighting, ShikiTokenizer, type Tokenizer } from '@lexical/code-shiki';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { JSX } from 'react';
import { useEffect, useRef } from 'react';

import { useSettings } from '../../context/SettingsContext';

/**
 * Shiki による構文ハイライトプラグイン
 *
 * 注意: テーマは初期化時に一度だけ適用されます。
 * CodeNode はテーマ情報を EditorState に保存するため、
 * 動的にテーマを切り替えるにはエディタを再マウントする必要があります。
 */
export default function CodeHighlightShikiPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const {
    settings: { codeShikiTheme },
  } = useSettings();

  // 初期テーマを固定（動的変更は無限ループを引き起こすため）
  const initialThemeRef = useRef(codeShikiTheme);

  useEffect(() => {
    const tokenizer: Tokenizer = {
      ...ShikiTokenizer,
      defaultTheme: initialThemeRef.current,
    };
    return registerCodeHighlighting(editor, tokenizer);
  }, [editor]);

  return null;
}
