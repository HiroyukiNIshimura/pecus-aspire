/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use client';

import type { CoreEditorProps, ExtraOptionsProvider } from '@coati/editor';
import { NotionLikeEditor } from '@coati/editor';
import { useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useIsAiEnabled } from '@/providers/AppSettingsProvider';
import AiAssistantPlugin, { INSERT_AI_ASSISTANT_COMMAND } from '../plugins/AiAssistantPlugin';

export type NotionLikeEditorProps = CoreEditorProps;

/**
 * Pecus固有のNotionLikeEditor
 *
 * @coati/editor のNotionLikeEditor にPecus固有のプラグインを追加。
 * AiAssistantPlugin: 組織設定でAIが有効な場合にのみ表示
 */
export default function PecusNotionLikeEditor(props: NotionLikeEditorProps) {
  const isAiEnabled = useIsAiEnabled();
  const { resolvedTheme } = useTheme();
  const codeShikiTheme = resolvedTheme === 'dark' ? 'github-dark' : 'github-light';

  const extraComponentPickerOptions: ExtraOptionsProvider = useCallback(
    (editor) => {
      if (!isAiEnabled) {
        return [];
      }
      return [
        {
          title: 'AI Assistant',
          icon: <i className="icon sparkles" />,
          keywords: ['ai', 'assistant', 'generate', 'write', '文章生成', 'アシスタント'],
          onSelect: () => {
            editor.dispatchCommand(INSERT_AI_ASSISTANT_COMMAND, undefined);
          },
        },
      ];
    },
    [isAiEnabled],
  );

  return (
    <NotionLikeEditor
      {...props}
      codeShikiTheme={codeShikiTheme}
      extraPlugins={isAiEnabled && <AiAssistantPlugin />}
      extraComponentPickerOptions={extraComponentPickerOptions}
    />
  );
}
