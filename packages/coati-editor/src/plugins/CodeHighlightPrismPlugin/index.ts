/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { registerCodeHighlighting } from '@lexical/code';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { JSX } from 'react';
import { useEffect, useRef } from 'react';

export default function CodeHighlightPrismPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 初回レンダリング後に登録を遅延させてUIブロッキングを軽減
    const timeoutId = setTimeout(() => {
      cleanupRef.current = registerCodeHighlighting(editor);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      cleanupRef.current?.();
    };
  }, [editor]);

  return null;
}
