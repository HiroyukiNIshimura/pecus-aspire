/**
 * SearchHighlightPlugin
 *
 * 検索語にマッチするテキストをハイライト表示するプラグイン。
 * Viewer専用（editable: false）で使用することを想定。
 *
 * 検索語の配列を受け取り、各単語を個別にハイライトする。
 * クエリのパース処理は呼び出し側で行う。
 */

'use client';

import { $isMarkNode, $wrapSelectionInMarkNode } from '@lexical/mark';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createRangeSelection, $getRoot, $isTextNode, $setSelection, type LexicalNode, type TextNode } from 'lexical';
import { useEffect, useRef } from 'react';

/** 検索ハイライト用のマークID */
const SEARCH_HIGHLIGHT_ID = '__search_highlight__';

interface SearchHighlightPluginProps {
  /** 検索語の配列（パース済み） */
  searchTerms?: string[];
}

/**
 * TextNode内で検索語にマッチする位置を全て取得
 */
function findAllMatches(text: string, terms: string[]): Array<{ start: number; end: number }> {
  const matches: Array<{ start: number; end: number }> = [];
  const lowerText = text.toLowerCase();

  for (const term of terms) {
    if (!term.trim()) continue;
    const lowerTerm = term.toLowerCase();

    let startIndex = 0;
    while (startIndex < lowerText.length) {
      const index = lowerText.indexOf(lowerTerm, startIndex);
      if (index === -1) break;
      matches.push({ start: index, end: index + term.length });
      startIndex = index + 1;
    }
  }

  // 開始位置でソートし、重複を除去
  matches.sort((a, b) => a.start - b.start);

  // 重複範囲をマージ
  const merged: Array<{ start: number; end: number }> = [];
  for (const match of matches) {
    if (merged.length === 0) {
      merged.push(match);
    } else {
      const last = merged[merged.length - 1];
      if (match.start <= last.end) {
        // 重複または隣接 → マージ
        last.end = Math.max(last.end, match.end);
      } else {
        merged.push(match);
      }
    }
  }

  return merged;
}

/**
 * 全てのTextNodeを再帰的に取得
 */
function getAllTextNodes(node: LexicalNode): TextNode[] {
  const textNodes: TextNode[] = [];

  if ($isTextNode(node)) {
    textNodes.push(node);
  } else {
    const children = 'getChildren' in node ? (node as { getChildren: () => LexicalNode[] }).getChildren() : [];
    for (const child of children) {
      textNodes.push(...getAllTextNodes(child));
    }
  }

  return textNodes;
}

/**
 * 検索語にマッチするテキストをハイライト
 */
function applySearchHighlights(searchTerms: string[]): void {
  if (searchTerms.length === 0) return;

  const root = $getRoot();
  const textNodes = getAllTextNodes(root);

  for (const textNode of textNodes) {
    // 既にMarkNode内にある場合はスキップ（検索ハイライトが二重にならないように）
    const parent = textNode.getParent();
    if ($isMarkNode(parent) && parent.getIDs().includes(SEARCH_HIGHLIGHT_ID)) {
      continue;
    }

    const text = textNode.getTextContent();
    const matches = findAllMatches(text, searchTerms);

    if (matches.length === 0) continue;

    // マッチを後ろから処理（インデックスがずれないように）
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];

      // RangeSelectionを作成してMarkNodeでラップ
      const selection = $createRangeSelection();
      selection.anchor.set(textNode.getKey(), match.start, 'text');
      selection.focus.set(textNode.getKey(), match.end, 'text');

      $setSelection(selection);
      $wrapSelectionInMarkNode(selection, false, SEARCH_HIGHLIGHT_ID);
    }
  }

  // 選択を解除
  $setSelection(null);
}

export default function SearchHighlightPlugin({ searchTerms }: SearchHighlightPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const hasAppliedRef = useRef(false);

  // 初回マウント時にハイライトを適用（key で再マウントされるため、これで十分）
  useEffect(() => {
    if (hasAppliedRef.current || !searchTerms || searchTerms.length === 0) return;

    // EditorState が準備完了するのを待つ
    const unregister = editor.registerUpdateListener(() => {
      if (hasAppliedRef.current) return;
      hasAppliedRef.current = true;

      editor.update(
        () => {
          applySearchHighlights(searchTerms);
        },
        { discrete: true },
      );

      // 一度適用したらリスナーを解除
      unregister();
    });

    return () => {
      unregister();
    };
  }, [editor, searchTerms]);

  return null;
}

export { SEARCH_HIGHLIGHT_ID };
