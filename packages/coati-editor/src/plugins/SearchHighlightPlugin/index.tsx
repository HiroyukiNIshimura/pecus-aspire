/**
 * SearchHighlightPlugin
 *
 * 検索クエリにマッチするテキストをハイライト表示するプラグイン。
 * Viewer専用（editable: false）で使用することを想定。
 */

'use client';

import { $isMarkNode, $wrapSelectionInMarkNode } from '@lexical/mark';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createRangeSelection, $getRoot, $isTextNode, $setSelection, type LexicalNode, type TextNode } from 'lexical';
import { useEffect, useRef } from 'react';

/** 検索ハイライト用のマークID */
const SEARCH_HIGHLIGHT_ID = '__search_highlight__';

interface SearchHighlightPluginProps {
  /** 検索クエリ */
  searchQuery?: string;
}

/**
 * TextNode内で検索クエリにマッチする位置を全て取得
 */
function findAllMatches(text: string, query: string): Array<{ start: number; end: number }> {
  const matches: Array<{ start: number; end: number }> = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let startIndex = 0;
  while (startIndex < lowerText.length) {
    const index = lowerText.indexOf(lowerQuery, startIndex);
    if (index === -1) break;
    matches.push({ start: index, end: index + query.length });
    startIndex = index + 1; // 重複を許可しない場合は index + query.length
  }

  return matches;
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
 * 検索クエリにマッチするテキストをハイライト
 */
function applySearchHighlights(searchQuery: string): void {
  if (!searchQuery.trim()) return;

  const root = $getRoot();
  const textNodes = getAllTextNodes(root);

  for (const textNode of textNodes) {
    // 既にMarkNode内にある場合はスキップ（検索ハイライトが二重にならないように）
    const parent = textNode.getParent();
    if ($isMarkNode(parent) && parent.getIDs().includes(SEARCH_HIGHLIGHT_ID)) {
      continue;
    }

    const text = textNode.getTextContent();
    const matches = findAllMatches(text, searchQuery);

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

export default function SearchHighlightPlugin({ searchQuery }: SearchHighlightPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const hasAppliedRef = useRef(false);

  // 初回マウント時にハイライトを適用（key で再マウントされるため、これで十分）
  useEffect(() => {
    if (hasAppliedRef.current || !searchQuery?.trim()) return;

    // EditorState が準備完了するのを待つ
    const unregister = editor.registerUpdateListener(() => {
      if (hasAppliedRef.current) return;
      hasAppliedRef.current = true;

      editor.update(
        () => {
          applySearchHighlights(searchQuery);
        },
        { discrete: true },
      );

      // 一度適用したらリスナーを解除
      unregister();
    });

    return () => {
      unregister();
    };
  }, [editor, searchQuery]);

  return null;
}

export { SEARCH_HIGHLIGHT_ID };
