/**
 * Markdown Transformers
 * @see packages/coati-editor/src/plugins/MarkdownTransformers/index.ts
 */

import {
  $createEquationNode,
  $createImageNode,
  $createTweetNode,
  $isEquationNode,
  $isImageNode,
  $isTweetNode,
  EquationNode,
  ImageNode,
  TweetNode,
} from '@coati/editor';
import { $createHorizontalRuleNode, $isHorizontalRuleNode, HorizontalRuleNode } from '@lexical/extension';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  type ElementTransformer,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  type TextMatchTransformer,
  type Transformer,
} from '@lexical/markdown';
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  type TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';
import { $createTextNode, $isParagraphNode, $isTextNode, type LexicalNode } from 'lexical';
import { emojiList } from './emoji-list';

/**
 * 水平線トランスフォーマー
 */
export const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: LexicalNode) => {
    return $isHorizontalRuleNode(node) ? '***' : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = $createHorizontalRuleNode();

    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }

    line.selectNext();
  },
  type: 'element',
};

/**
 * 画像トランスフォーマー
 */
export const IMAGE: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) {
      return null;
    }

    return `![${node.getAltText()}](${node.getSrc()})`;
  },
  importRegExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))/,
  regExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))$/,
  replace: (textNode, match) => {
    const [, altText, src] = match;
    const imageNode = $createImageNode({
      altText: altText || '',
      maxWidth: 800,
      src: src || '',
    });
    textNode.replace(imageNode);
  },
  trigger: ')',
  type: 'text-match',
};

/**
 * 絵文字トランスフォーマー
 */
export const EMOJI: TextMatchTransformer = {
  dependencies: [],
  export: () => null,
  importRegExp: /:([a-z0-9_]+):/,
  regExp: /:([a-z0-9_]+):$/,
  replace: (textNode, [, name]) => {
    const emoji = emojiList.find((e) => e.aliases.includes(name))?.emoji;
    if (emoji) {
      textNode.replace($createTextNode(emoji));
    }
  },
  trigger: ':',
  type: 'text-match',
};

/**
 * 数式トランスフォーマー
 */
export const EQUATION: TextMatchTransformer = {
  dependencies: [EquationNode],
  export: (node) => {
    if (!$isEquationNode(node)) {
      return null;
    }

    return `$${node.getEquation()}$`;
  },
  importRegExp: /\$([^$]+?)\$/,
  regExp: /\$([^$]+?)\$$/,
  replace: (textNode, match) => {
    const [, equation] = match;
    const equationNode = $createEquationNode(equation, true);
    textNode.replace(equationNode);
  },
  trigger: '$',
  type: 'text-match',
};

/**
 * ツイートトランスフォーマー
 */
export const TWEET: ElementTransformer = {
  dependencies: [TweetNode],
  export: (node) => {
    if (!$isTweetNode(node)) {
      return null;
    }

    return `<tweet id="${node.getId()}" />`;
  },
  regExp: /<tweet id="([^"]+?)"\s?\/>\s?$/,
  replace: (textNode, _1, match) => {
    const [, id] = match;
    const tweetNode = $createTweetNode(id);
    textNode.replace(tweetNode);
  },
  type: 'element',
};

// テーブル行の正規表現
const TABLE_ROW_REG_EXP = /^(?:\|)(.+)(?:\|)\s?$/;
const TABLE_ROW_DIVIDER_REG_EXP = /^(\| ?:?-*:? ?)+\|\s?$/;

/**
 * テーブルのセル作成
 */
const $createTableCell = (textContent: string): ReturnType<typeof $createTableCellNode> => {
  textContent = textContent.replace(/\\n/g, '\n');
  const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
  $convertFromMarkdownString(textContent, PLAYGROUND_TRANSFORMERS, cell);
  return cell;
};

/**
 * テキストをテーブルセル配列に変換
 */
const mapToTableCells = (textContent: string): Array<TableCellNode> | null => {
  const match = textContent.match(TABLE_ROW_REG_EXP);
  if (!match || !match[1]) {
    return null;
  }
  return match[1].split('|').map((text) => $createTableCell(text));
};

/**
 * テーブルの列数を取得
 */
function getTableColumnsSize(table: TableNode) {
  const row = table.getFirstChild();
  return $isTableRowNode(row) ? row.getChildrenSize() : 0;
}

/**
 * テーブルトランスフォーマー
 */
export const TABLE: ElementTransformer = {
  dependencies: [TableNode, TableRowNode],
  export: (node: LexicalNode) => {
    if (!$isTableNode(node)) {
      return null;
    }

    const output: string[] = [];
    let isFirstRow = true;

    for (const row of node.getChildren()) {
      const rowOutput = [];
      if (!$isTableRowNode(row)) {
        continue;
      }

      let isHeaderRow = false;
      for (const cell of row.getChildren()) {
        if ($isTableCellNode(cell)) {
          rowOutput.push($convertToMarkdownString(PLAYGROUND_TRANSFORMERS, cell).replace(/\n/g, '\\n').trim());
          if (cell.__headerState === TableCellHeaderStates.ROW) {
            isHeaderRow = true;
          }
        }
      }

      output.push(`| ${rowOutput.join(' | ')} |`);
      // ヘッダー状態がある場合 OR 最初の行の場合に区切り行を出力
      if (isHeaderRow || isFirstRow) {
        output.push(`| ${rowOutput.map((_) => '---').join(' | ')} |`);
        isFirstRow = false;
      }
    }

    return output.join('\n');
  },
  regExp: TABLE_ROW_REG_EXP,
  replace: (parentNode, _1, match) => {
    // ヘッダー行のチェック
    if (TABLE_ROW_DIVIDER_REG_EXP.test(match[0])) {
      const table = parentNode.getPreviousSibling();
      if (!table || !$isTableNode(table)) {
        return;
      }

      const rows = table.getChildren();
      const lastRow = rows[rows.length - 1];
      if (!lastRow || !$isTableRowNode(lastRow)) {
        return;
      }

      // ヘッダー状態をセルに追加
      lastRow.getChildren().forEach((cell) => {
        if (!$isTableCellNode(cell)) {
          return;
        }
        cell.setHeaderStyles(TableCellHeaderStates.ROW, TableCellHeaderStates.ROW);
      });

      // 行を削除
      parentNode.remove();
      return;
    }

    const matchCells = mapToTableCells(match[0]);

    if (matchCells == null) {
      return;
    }

    const rows = [matchCells];
    let sibling = parentNode.getPreviousSibling();
    let maxCells = matchCells.length;

    while (sibling) {
      if (!$isParagraphNode(sibling)) {
        break;
      }

      if (sibling.getChildrenSize() !== 1) {
        break;
      }

      const firstChild = sibling.getFirstChild();

      if (!$isTextNode(firstChild)) {
        break;
      }

      const cells = mapToTableCells(firstChild.getTextContent());

      if (cells == null) {
        break;
      }

      maxCells = Math.max(maxCells, cells.length);
      rows.unshift(cells);
      const previousSibling = sibling.getPreviousSibling();
      sibling.remove();
      sibling = previousSibling;
    }

    const table = $createTableNode();

    for (const cells of rows) {
      const tableRow = $createTableRowNode();
      table.append(tableRow);

      for (let i = 0; i < maxCells; i++) {
        tableRow.append(i < cells.length ? cells[i] : $createTableCell(''));
      }
    }

    const previousSibling = parentNode.getPreviousSibling();
    if ($isTableNode(previousSibling) && getTableColumnsSize(previousSibling) === maxCells) {
      previousSibling.append(...table.getChildren());
      parentNode.remove();
    } else {
      parentNode.replace(table);
    }

    table.selectEnd();
  },
  type: 'element',
};

/**
 * プレイグラウンドで使用するすべてのトランスフォーマー
 */
export const PLAYGROUND_TRANSFORMERS: Array<Transformer> = [
  TABLE,
  HR,
  IMAGE,
  EMOJI,
  EQUATION,
  TWEET,
  CHECK_LIST,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];

/**
 * リスト行の2スペースインデントを4スペースに正規化
 * Lexicalのデフォルトは4スペース = 1インデントレベル
 * コードブロック内は変換しない
 *
 * ⚠️ 注意: この関数は以下のファイルにも同一実装が存在します。
 * 修正時は両方を同期してください:
 * - packages/coati-editor/src/transformers/markdown-transformers.ts
 * - pecus.LexicalConverter/src/lexical/transformers/markdown-transformers.ts（このファイル）
 *
 * @param markdown - 入力Markdown文字列
 * @returns リストインデントが正規化されたMarkdown文字列
 */
export function normalizeListIndentation(markdown: string): string {
  // 改行コードを LF に統一 (CRLF → LF, CR → LF)
  const normalizedMarkdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const lines = normalizedMarkdown.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    // コードブロックの開始/終了を追跡
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    // コードブロック内は変換しない
    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // リスト行のみを対象（リストマーカーが必要）
    // - item, * item, + item, 1. item, - [ ] item, - [x] item
    const listMatch = line.match(/^(\s+)([-*+]|\d+\.)(\s+\[[ xX]?\])?\s/);
    if (listMatch) {
      const leadingSpaces = listMatch[1];
      // タブは除外してスペースのみカウント
      const spaceCount = (leadingSpaces.match(/ /g) || []).length;
      const tabCount = (leadingSpaces.match(/\t/g) || []).length;

      if (spaceCount > 0 && spaceCount % 2 === 0 && spaceCount % 4 !== 0) {
        // 2スペース単位（かつ4の倍数でない）→ 4スペース単位に変換
        const indentLevel = Math.ceil(spaceCount / 2);
        const newIndent = '\t'.repeat(tabCount) + '    '.repeat(indentLevel);
        result.push(newIndent + line.slice(leadingSpaces.length));
        continue;
      }
    }

    result.push(line);
  }

  return result.join('\n');
}
