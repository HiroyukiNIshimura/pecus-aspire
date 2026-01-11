/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use client';

import { type NotionLikeViewerProps as CoatiViewerProps, NotionLikeViewer } from '@coati/editor';

export interface NotionLikeViewerProps extends CoatiViewerProps {
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
 * @coati/editor のNotionLikeViewer をラップ。
 * Shikiコードハイライトはdual themes（github-light/github-dark）を使用し、
 * CSSでdata-themeに応じて自動的にテーマが切り替わります。
 */
export default function PecusNotionLikeViewer(props: NotionLikeViewerProps) {
  return <NotionLikeViewer {...props} />;
}
