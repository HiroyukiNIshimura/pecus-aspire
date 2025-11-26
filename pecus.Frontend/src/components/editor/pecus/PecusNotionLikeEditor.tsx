/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use client';

import NotionLikeEditor from '../core/NotionLikeEditor';
import type { NotionLikeEditorProps } from '../core/NotionLikeEditor';

/**
 * Pecus固有のNotionLikeEditor
 *
 * core/NotionLikeEditor をそのまま再エクスポート。
 * 将来的にPecus固有の機能を追加する場合は、ここで拡張します。
 */
export default NotionLikeEditor;

export type { NotionLikeEditorProps };
