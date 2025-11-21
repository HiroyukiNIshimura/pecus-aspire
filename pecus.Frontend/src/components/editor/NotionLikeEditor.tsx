/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use client';

import './Editor.css';
import {LexicalExtensionComposer} from '@lexical/react/LexicalExtensionComposer';
import {
  defineExtension,
} from 'lexical';
import {useMemo} from 'react';

import {buildHTMLConfig} from './buildHTMLConfig';
import {useSettings} from './context/SettingsContext';
import {SharedHistoryContext} from './context/SharedHistoryContext';
import {ToolbarContext} from './context/ToolbarContext';
import Editor from './Editor';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import {TableContext} from './plugins/TablePlugin';
import TypingPerfPlugin from './plugins/TypingPerfPlugin';
import NotionLikeEditorTheme from './themes/NotionLikeEditorTheme';
import { FlashMessageContext } from './context/FlashMessageContext';

export default function NotionLikeEditor() {
  const {
    settings: {emptyEditor, measureTypingPerf},
  } = useSettings();

  const app = useMemo(
    () =>
      defineExtension({
        $initialEditorState: undefined,
        html: buildHTMLConfig(),
        name: 'pecus/NotionLikeEditor',
        namespace: 'NotionLikeEditor',
        nodes: PlaygroundNodes,
        theme: NotionLikeEditorTheme,
      }),
    [emptyEditor],
  );

    return (
    <div className="notion-like-editor">
      <FlashMessageContext>
        <LexicalExtensionComposer extension={app} contentEditable={null}>
            <SharedHistoryContext>
                <TableContext>
                    <ToolbarContext>
                    <div className="editor-shell">
                        <Editor />
                    </div>
                    {measureTypingPerf ? <TypingPerfPlugin /> : null}
                    </ToolbarContext>
                </TableContext>
            </SharedHistoryContext>
        </LexicalExtensionComposer>
      </FlashMessageContext>
    </div>
  );
}

