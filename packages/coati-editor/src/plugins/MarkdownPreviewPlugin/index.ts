import { createCommand, type LexicalCommand } from 'lexical';

/**
 * Markdown プレビューを開くためのコマンド
 */
export const OPEN_MARKDOWN_PREVIEW_COMMAND: LexicalCommand<void> = createCommand('OPEN_MARKDOWN_PREVIEW_COMMAND');
