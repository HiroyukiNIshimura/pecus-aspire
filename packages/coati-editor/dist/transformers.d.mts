import { TextMatchTransformer, ElementTransformer, Transformer } from '@lexical/markdown';

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare const HR: ElementTransformer;
declare const IMAGE: TextMatchTransformer;
declare const EMOJI: TextMatchTransformer;
declare const EQUATION: TextMatchTransformer;
declare const TWEET: ElementTransformer;
declare const TABLE: ElementTransformer;
declare const PLAYGROUND_TRANSFORMERS: Array<Transformer>;
/**
 * リスト行の2スペースインデントを4スペースに正規化
 * Lexicalのデフォルトは4スペース = 1インデントレベル
 * コードブロック内は変換しない
 *
 * ⚠️ 注意: この関数は以下のファイルにも同一実装が存在します。
 * 修正時は両方を同期してください:
 * - packages/coati-editor/src/transformers/markdown-transformers.ts（このファイル）
 * - pecus.LexicalConverter/src/lexical/transformers/markdown-transformers.ts
 *
 * @param markdown - 入力Markdown文字列
 * @returns リストインデントが正規化されたMarkdown文字列
 */
declare function normalizeListIndentation(markdown: string): string;

export { EMOJI, EQUATION, HR, IMAGE, PLAYGROUND_TRANSFORMERS, TABLE, TWEET, normalizeListIndentation };
