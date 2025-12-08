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
import { useEffect, useMemo, useState } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import NotionLikeEditorNodes from '../nodes/NotionLikeEditorNodes';
import { TableContext } from '../plugins/TablePlugin';
import NotionLikeEditorTheme from '../themes/NotionLikeEditorTheme';
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
   * ワークスペースID
   * */
  workspaceId: number;
}

export default function NotionLikeViewer({
  initialViewerState,
  isCodeShiki = false,
  workspaceId,
}: NotionLikeViewerProps) {
  // Props から settings を構築
  const settings = useMemo(
    () => ({
      ...INITIAL_SETTINGS,
      isCodeShiki,
    }),
    [isCodeShiki],
  );

  const [baseUrl, setBaseUrl] = useState('');
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  // エディタコンテキスト設定
  const editorContext = useMemo(
    () => ({
      workspaceId: workspaceId,
      baseUrl,
    }),
    [workspaceId, baseUrl],
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
        //   HorizontalRuleExtension
        // ],
      }),
    [initialViewerState],
  );

  return (
    <div className="notion-like-editor">
      <SettingsContext initialSettings={settings} editorContext={editorContext}>
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
