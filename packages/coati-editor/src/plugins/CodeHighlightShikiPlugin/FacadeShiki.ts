/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CodeNode } from '@lexical/code';
import { $createCodeHighlightNode, $isCodeNode } from '@lexical/code';
import { createHighlighterCoreSync, isSpecialLang, isSpecialTheme } from '@shikijs/core';
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript';
import type { ThemedToken } from '@shikijs/types';
import type { LexicalEditor, LexicalNode, NodeKey } from 'lexical';
import { $createLineBreakNode, $createTabNode, $getNodeByKey } from 'lexical';
import { bundledLanguagesInfo } from 'shiki/langs';
import { bundledThemesInfo } from 'shiki/themes';

/**
 * Dual theme 設定
 * light/dark 両方のテーマを同時に出力し、CSS 変数で切り替える
 */
export const DUAL_THEMES = {
  light: 'github-light',
  dark: 'github-dark-dimmed',
} as const;

const shiki = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  langs: [],
  themes: [],
});

function getDiffedLanguage(language: string) {
  const DIFF_LANGUAGE_REGEX = /^diff-([\w-]+)/i;
  const diffLanguageMatch = DIFF_LANGUAGE_REGEX.exec(language);
  return diffLanguageMatch ? diffLanguageMatch[1] : null;
}

export function isCodeLanguageLoaded(language: string) {
  const diffedLanguage = getDiffedLanguage(language);
  const langId = diffedLanguage || language;

  // handle shiki Hard-coded languages ['ansi', '', 'plaintext', 'txt', 'text', 'plain']
  if (isSpecialLang(langId)) {
    return true;
  }

  // note: getLoadedLanguages() also returns aliases
  return shiki.getLoadedLanguages().includes(langId);
}

export function loadCodeLanguage(language: string, editor?: LexicalEditor, codeNodeKey?: NodeKey) {
  const diffedLanguage = getDiffedLanguage(language);
  const langId = diffedLanguage ? diffedLanguage : language;
  if (!isCodeLanguageLoaded(langId)) {
    const languageInfo = bundledLanguagesInfo.find((desc) => desc.id === langId || desc.aliases?.includes(langId));
    if (languageInfo) {
      // in case we arrive here concurrently (not yet loaded language is loaded twice)
      // shiki's synchronous checks make sure to load it only once
      return shiki.loadLanguage(languageInfo.import()).then(() => {
        // here we know that the language is loaded
        // make sure the code is highlighed with the correct language
        if (editor && codeNodeKey) {
          editor.update(() => {
            const codeNode = $getNodeByKey(codeNodeKey);
            if (
              $isCodeNode(codeNode) &&
              codeNode.getLanguage() === language &&
              !codeNode.getIsSyntaxHighlightSupported()
            ) {
              codeNode.setIsSyntaxHighlightSupported(true);
            }
          });
        }
      });
    }
  }
}

export function isCodeThemeLoaded(theme: string) {
  const themeId = theme;

  // handle shiki special theme ['none']
  if (isSpecialTheme(themeId)) {
    return true;
  }

  return shiki.getLoadedThemes().includes(themeId);
}

/**
 * Dual themes が両方ロードされているか確認
 */
export function areDualThemesLoaded() {
  return isCodeThemeLoaded(DUAL_THEMES.light) && isCodeThemeLoaded(DUAL_THEMES.dark);
}

// プリロード済みフラグ
let dualThemesPreloaded = false;
let dualThemesPreloadPromise: Promise<void> | null = null;

/**
 * Dual themes を事前にプリロード（アイドル時に実行）
 * エディタマウント前に呼び出すことで、初回ロード時のブロッキングを軽減
 */
export function preloadDualThemes(): Promise<void> {
  if (dualThemesPreloaded) {
    return Promise.resolve();
  }

  if (dualThemesPreloadPromise) {
    return dualThemesPreloadPromise;
  }

  dualThemesPreloadPromise = (async () => {
    const promises: Promise<void>[] = [];

    for (const theme of [DUAL_THEMES.light, DUAL_THEMES.dark]) {
      if (!isCodeThemeLoaded(theme)) {
        const themeInfo = bundledThemesInfo.find((info) => info.id === theme);
        if (themeInfo) {
          promises.push(shiki.loadTheme(themeInfo.import()));
        }
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
    dualThemesPreloaded = true;
  })();

  return dualThemesPreloadPromise;
}

/**
 * Dual themes をロード
 */
export async function loadDualThemes(editor?: LexicalEditor, codeNodeKey?: NodeKey) {
  const promises: Promise<void>[] = [];

  for (const theme of [DUAL_THEMES.light, DUAL_THEMES.dark]) {
    if (!isCodeThemeLoaded(theme)) {
      const themeInfo = bundledThemesInfo.find((info) => info.id === theme);
      if (themeInfo) {
        promises.push(shiki.loadTheme(themeInfo.import()));
      }
    }
  }

  if (promises.length > 0) {
    await Promise.all(promises);
    if (editor && codeNodeKey) {
      editor.update(() => {
        const codeNode = $getNodeByKey(codeNodeKey);
        if ($isCodeNode(codeNode)) {
          codeNode.markDirty();
        }
      });
    }
  }
}

export function loadCodeTheme(theme: string, editor?: LexicalEditor, codeNodeKey?: NodeKey) {
  if (!isCodeThemeLoaded(theme)) {
    const themeInfo = bundledThemesInfo.find((info) => info.id === theme);
    if (themeInfo) {
      return shiki.loadTheme(themeInfo.import()).then(() => {
        if (editor && codeNodeKey) {
          editor.update(() => {
            const codeNode = $getNodeByKey(codeNodeKey);
            if ($isCodeNode(codeNode)) {
              codeNode.markDirty();
            }
          });
        }
      });
    }
  }
}

export function getCodeLanguageOptions(): [string, string][] {
  return bundledLanguagesInfo.map((i) => [i.id, i.name]);
}
export function getCodeThemeOptions(): [string, string][] {
  return bundledThemesInfo.map((i) => [i.id, i.displayName]);
}

export function normalizeCodeLanguage(language: string): string {
  const langId = language;
  const languageInfo = bundledLanguagesInfo.find((desc) => desc.id === langId || desc.aliases?.includes(langId));
  if (languageInfo) {
    return languageInfo.id;
  }
  return language;
}

/**
 * Dual themes を使用してハイライトノードを生成
 * CSS 変数 --shiki-dark を出力し、CSS でテーマ切り替えが可能
 */
export function $getHighlightNodes(codeNode: CodeNode, language: string): LexicalNode[] {
  const DIFF_LANGUAGE_REGEX = /^diff-([\w-]+)/i;
  const diffLanguageMatch = DIFF_LANGUAGE_REGEX.exec(language);
  const code: string = codeNode.getTextContent();

  // Dual themes を使用（light/dark 両方の色情報を CSS 変数として出力）
  const tokensResult = shiki.codeToTokens(code, {
    lang: diffLanguageMatch ? diffLanguageMatch[1] : language,
    themes: DUAL_THEMES,
    defaultColor: 'light', // light をデフォルトカラーとして出力
    cssVariablePrefix: '--shiki-',
  });

  const { tokens, bg, fg } = tokensResult;

  // 背景色とテキスト色を設定
  // dual themes の場合、bg/fg は light テーマの値
  // dark テーマの値は各トークンの style に --shiki-dark として含まれる
  let style = '';
  if (bg) {
    style += `background-color: ${bg};`;
  }
  if (fg) {
    style += `color: ${fg};`;
  }

  if (codeNode.getStyle() !== style) {
    codeNode.setStyle(style);
  }
  return mapTokensToLexicalStructure(tokens, !!diffLanguageMatch);
}

/**
 * トークンのスタイルを CSS 変数付きの文字列に変換
 * dual themes の場合: color に light の色、htmlStyle に --shiki-dark が含まれる
 */
function getTokenStyle(token: ThemedToken): string {
  const styles: string[] = [];

  // デフォルトカラー（light テーマ）
  if (token.color) {
    styles.push(`color: ${token.color}`);
  }

  // htmlStyle に dark テーマの CSS 変数が含まれる
  if (token.htmlStyle) {
    if (typeof token.htmlStyle === 'string') {
      styles.push(token.htmlStyle);
    } else {
      // オブジェクト形式の場合
      for (const [key, value] of Object.entries(token.htmlStyle)) {
        styles.push(`${key}: ${value}`);
      }
    }
  }

  return styles.join(';');
}

function mapTokensToLexicalStructure(tokens: ThemedToken[][], diff: boolean): LexicalNode[] {
  const nodes: LexicalNode[] = [];

  tokens.forEach((line, idx) => {
    if (idx) {
      nodes.push($createLineBreakNode());
    }
    line.forEach((token, tidx) => {
      let text = token.content;

      // implement diff-xxxx languages
      if (diff && tidx === 0 && text.length > 0) {
        const prefixes = ['+', '-', '>', '<', ' '];
        const prefixTypes = ['inserted', 'deleted', 'inserted', 'deleted', 'unchanged'];
        const prefixIndex = prefixes.indexOf(text[0]);
        if (prefixIndex !== -1) {
          nodes.push($createCodeHighlightNode(prefixes[prefixIndex], prefixTypes[prefixIndex]));
          text = text.slice(1);
        }
      }

      const parts = text.split('\t');
      parts.forEach((part: string, pidx: number) => {
        if (pidx) {
          nodes.push($createTabNode());
        }
        if (part !== '') {
          const node = $createCodeHighlightNode(part);
          const style = getTokenStyle(token);
          node.setStyle(style);
          nodes.push(node);
        }
      });
    });
  });

  return nodes;
}
