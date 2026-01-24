/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use client';

import './Editor.css';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { defineExtension } from 'lexical';
import { useMemo } from 'react';
import { AutoLinkProvider, type LinkMatcher } from '../context/AutoLinkContext';
import { SettingsContext } from '../context/SettingsContext';
import NotionLikeEditorNodes from '../nodes/NotionLikeEditorNodes';
import SearchHighlightPlugin from '../plugins/SearchHighlightPlugin';
import { TableContext } from '../plugins/TablePlugin';
import NotionLikeViewerTheme from '../themes/NotionLikeViewerTheme';
import { INITIAL_SETTINGS } from './appSettings';
import { buildHTMLConfig } from './buildHTMLConfig';
import Viewer from './Viewer';

export interface NotionLikeViewerProps {
  /**
   * エディタの初期値（EditorState JSON文字列）
   */
  initialViewerState?: string;

  /**
   * Shikiによるコードハイライトを有効化するかどうか
   */
  isCodeShiki?: boolean;

  /**
   * カスタムのAutoLink Matcher配列
   * URLやメールアドレスの基本Matcherに追加される
   */
  customLinkMatchers?: LinkMatcher[];

  /**
   * 検索語の配列（ハイライト用）
   * 指定するとマッチするテキストがハイライト表示される
   * クエリのパース処理は呼び出し側で行う
   */
  searchTerms?: string[];
}

export default function NotionLikeViewer({
  initialViewerState,
  isCodeShiki = true,
  customLinkMatchers,
  searchTerms,
}: NotionLikeViewerProps) {
  // Props から settings を構築
  const settings = useMemo(
    () => ({
      ...INITIAL_SETTINGS,
      isCodeShiki,
    }),
    [isCodeShiki],
  );

  const app = useMemo(
    () =>
      defineExtension({
        $initialEditorState: initialViewerState,
        html: buildHTMLConfig(),
        name: 'pecus/NotionLikeViewer',
        namespace: 'NotionLikeViewer',
        nodes: NotionLikeEditorNodes,
        theme: NotionLikeViewerTheme,
        editable: false,
      }),
    [initialViewerState],
  );

  return (
    <div className="notion-like-editor">
      <SettingsContext initialSettings={settings}>
        <AutoLinkProvider customMatchers={customLinkMatchers}>
          <LexicalExtensionComposer extension={app} contentEditable={null}>
            <TableContext>
              <div className="viewer-shell">
                <Viewer />
                <SearchHighlightPlugin searchTerms={searchTerms} />
              </div>
            </TableContext>
          </LexicalExtensionComposer>
        </AutoLinkProvider>
      </SettingsContext>
    </div>
  );
}
