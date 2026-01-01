/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use client';

import { NotionLikeViewer } from '@coati/editor';

// NotionLikeViewerのPropsは@coati/editorからの型を再利用
// 現在のインターフェースは@coati/editor/src/core/NotionLikeViewer.tsxに定義
export interface NotionLikeViewerProps {
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
 * @coati/editor のNotionLikeViewer をそのまま再エクスポート。
 * 将来的にPecus固有の機能を追加する場合は、ここで拡張します。
 */
export default NotionLikeViewer;
