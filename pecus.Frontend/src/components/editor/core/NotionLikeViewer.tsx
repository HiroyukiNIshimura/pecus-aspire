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
import { AutoLinkProvider, type AutoLinkSettings } from '../context/AutoLinkContext';
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
   * AutoLink設定（アイテムコードリンク生成用）
   * 省略した場合はアイテムコードのリンク変換は行われない
   */
  autoLinkSettings?: AutoLinkSettings;
}

export default function NotionLikeViewer({
  initialViewerState,
  isCodeShiki = false,
  autoLinkSettings,
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

  // AutoLink設定（外部から渡された設定にbaseUrlを補完）
  const resolvedAutoLinkSettings = useMemo<AutoLinkSettings>(
    () => ({
      ...autoLinkSettings,
      baseUrl: autoLinkSettings?.baseUrl ?? baseUrl,
    }),
    [autoLinkSettings, baseUrl],
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
      }),
    [initialViewerState],
  );

  return (
    <div className="notion-like-editor">
      <SettingsContext initialSettings={settings}>
        <AutoLinkProvider settings={resolvedAutoLinkSettings}>
          <LexicalExtensionComposer extension={app} contentEditable={null}>
            <TableContext>
              <div className="viewer-shell">
                <Viewer />
              </div>
            </TableContext>
          </LexicalExtensionComposer>
        </AutoLinkProvider>
      </SettingsContext>
    </div>
  );
}
