/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use client';

import type { NotionLikeViewerProps } from '../core/NotionLikeViewer';
import NotionLikeViewer from '../core/NotionLikeViewer';

/**
 * Pecus固有のNotionLikeViewer
 *
 * core/NotionLikeViewer をそのまま再エクスポート。
 * 将来的にPecus固有の機能を追加する場合は、ここで拡張します。
 */
export default NotionLikeViewer;

export type { NotionLikeViewerProps };
