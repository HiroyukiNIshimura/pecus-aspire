import { ElementTransformer } from '@lexical/markdown';
import { TextMatchTransformer } from '@lexical/markdown';
import { Transformer as Transformer_2 } from '@lexical/markdown';

export declare const EMOJI: TextMatchTransformer;

export declare const EQUATION: TextMatchTransformer;

export declare const HR: ElementTransformer;

export declare const IMAGE: TextMatchTransformer;

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
export declare function normalizeListIndentation(markdown: string): string;

export declare const PLAYGROUND_TRANSFORMERS: Array<Transformer_2>;

export declare const TABLE: ElementTransformer;

export declare const TWEET: ElementTransformer;

export { }
