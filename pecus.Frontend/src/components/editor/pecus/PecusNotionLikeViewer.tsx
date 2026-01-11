/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use client';

import { type NotionLikeViewerProps as CoatiViewerProps, NotionLikeViewer } from '@coati/editor';
import { useTheme } from '@/hooks/useTheme';

export interface NotionLikeViewerProps extends Omit<CoatiViewerProps, 'codeShikiTheme'> {
  /** エディタに読み込む初期マークダウン */
  initialMarkdown?: string;
  /** AIアシスタントを有効にするか */
  isAiEnabled?: boolean;
  /** 組織ID（AI機能用） */
  organizationId?: number;
}

/**
 * Pecus固有のNotionLikeViewer
 *
 * @coati/editor のNotionLikeViewer にアプリテーマ連動のコードハイライトテーマを追加。
 */
export default function PecusNotionLikeViewer(props: NotionLikeViewerProps) {
  const { resolvedTheme } = useTheme();
  const codeShikiTheme = resolvedTheme === 'dark' ? 'github-dark' : 'github-light';

  return <NotionLikeViewer {...props} codeShikiTheme={codeShikiTheme} />;
}
