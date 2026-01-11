/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { JSX } from 'react';
import { useEffect, useRef } from 'react';

import { registerCodeHighlighting, ShikiTokenizer } from './CodeHighlighterShiki';
import { preloadDualThemes } from './FacadeShiki';

// モジュールロード時にテーマのプリロードを開始（非ブロッキング）
if (typeof window !== 'undefined') {
  // requestIdleCallback でアイドル時にプリロード
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => preloadDualThemes());
  } else {
    // フォールバック: setTimeout で遅延実行
    setTimeout(() => preloadDualThemes(), 0);
  }
}

/**
 * Shiki による構文ハイライトプラグイン
 *
 * Dual themes（github-light / github-dark）を使用し、
 * CSS 変数（--shiki-dark）でテーマを切り替えます。
 * ダークモード切り替えは CSS で自動的に適用されます。
 */
export default function CodeHighlightShikiPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 初回レンダリング後に登録を遅延させてUIブロッキングを軽減
    const timeoutId = setTimeout(() => {
      cleanupRef.current = registerCodeHighlighting(editor, ShikiTokenizer);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      cleanupRef.current?.();
    };
  }, [editor]);

  return null;
}
