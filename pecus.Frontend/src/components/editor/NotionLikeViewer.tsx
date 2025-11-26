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
import { INITIAL_SETTINGS } from './appSettings';
import { buildHTMLConfig } from './buildHTMLConfig';
import { SettingsContext } from './context/SettingsContext';
import NotionLikeEditorNodes from './nodes/NotionLikeEditorNodes';
import { TableContext } from './plugins/TablePlugin';
import NotionLikeEditorTheme from './themes/NotionLikeEditorTheme';
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
}

export default function NotionLikeViewer({ initialViewerState, isCodeShiki = false }: NotionLikeViewerProps) {
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
        theme: NotionLikeEditorTheme,
        editable: false,
        // dependencies: [
        // ],
      }),
    [initialViewerState],
  );

  return (
    <div className="notion-like-editor">
      <SettingsContext initialSettings={settings}>
        <LexicalExtensionComposer extension={app} contentEditable={null}>
          <TableContext>
            <div className="viewer-shell">
              <Viewer />
            </div>
          </TableContext>
        </LexicalExtensionComposer>
      </SettingsContext>
    </div>
  );
}
