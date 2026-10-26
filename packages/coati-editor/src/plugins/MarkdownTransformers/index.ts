/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $createHorizontalRuleNode, $isHorizontalRuleNode, HorizontalRuleNode } from '@lexical/extension';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  type ElementTransformer,
  MULTILINE_ELEMENT_TRANSFORMERS,
  type MultilineElementTransformer,
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
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';
import { $createTextNode, $isParagraphNode, $isTextNode, type LexicalNode } from 'lexical';
import { $createAlertNode, $isAlertNode, ALERT_TYPES, AlertNode } from '../../nodes/AlertNode';
import { $createEquationNode, $isEquationNode, EquationNode } from '../../nodes/EquationNode';
import { $createImageNode, $isImageNode, ImageNode } from '../../nodes/ImageNode';
import { $createMermaidNode, $isMermaidNode, MermaidNode } from '../../nodes/MermaidNode';
import { $createTweetNode, $isTweetNode, TweetNode } from '../../nodes/TweetNode';
import emojiList from '../../utils/emoji-list';

export const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: LexicalNode) => {
    return $isHorizontalRuleNode(node) ? '***' : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = $createHorizontalRuleNode();

    // TODO: Get rid of isImport flag
    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }

    line.selectNext();
  },
  type: 'element',
};

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
      altText,
      maxWidth: 800,
      src,
    });
    textNode.replace(imageNode);
  },
  trigger: ')',
  type: 'text-match',
};

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

export const ALERT: ElementTransformer = {
  dependencies: [AlertNode],
  export: (node, exportChildren) => {
    if (!$isAlertNode(node)) {
      return null;
    }

    const body = exportChildren(node).replace(/^\n/, '');
    const bodyLines = body.split('\n').map((line) => (line.length > 0 && line !== '>' ? `> ${line}` : '>'));
    return `> [!${node.getAlertType()}]${body ? `\n${bodyLines.join('\n')}` : ''}`;
  },
  regExp: new RegExp(`^>\\s*\\[!(${ALERT_TYPES.join('|')})\\]\\s*$`, 'i'),
  replace: (parentNode, children, match, isImport) => {
    const alertType = ALERT_TYPES.find((type) => type === match[1]?.toUpperCase());
    if (!alertType) {
      return false;
    }

    const alertNode = $createAlertNode(alertType);
    alertNode.append(...children);
    parentNode.replace(alertNode);
    if (!isImport) {
      alertNode.select(0, 0);
    }
  },
  type: 'element',
};

export const MERMAID: MultilineElementTransformer = {
  dependencies: [MermaidNode],
  export: (node: LexicalNode) => {
    const mermaidNode = $isMermaidNode(node)
      ? node
      : $isParagraphNode(node) && node.getChildrenSize() === 1 && $isMermaidNode(node.getFirstChild())
        ? node.getFirstChild()
        : null;
    if (!$isMermaidNode(mermaidNode)) {
      return null;
    }

    const code = mermaidNode.getCode();
    return `\`\`\`mermaid${code ? `\n${code}` : ''}\n\`\`\``;
  },
  regExpEnd: /^```$/,
  regExpStart: /^```mermaid\s*$/,
  replace: (rootNode, children, _startMatch, _endMatch, linesInBetween) => {
    const codeLines = linesInBetween ?? children?.map((child) => child.getTextContent()) ?? [];
    if (codeLines[0]?.trim().length === 0) {
      codeLines.shift();
    }
    while (codeLines.length > 0 && !codeLines[codeLines.length - 1]) {
      codeLines.pop();
    }
    const code = codeLines.join('\n');
    rootNode.append($createMermaidNode(code));
  },
  type: 'multiline-element',
};

// Very primitive table setup
const TABLE_ROW_REG_EXP = /^(?:\|)(.+)(?:\|)\s?$/;

function isTableRowDivider(text: string): boolean {
  let row = text;
  const lastCharacter = row.at(-1);
  if (lastCharacter !== undefined && lastCharacter.trim() === '') {
    row = row.slice(0, -1);
  }

  if (row.length < 2 || !row.startsWith('|') || !row.endsWith('|')) {
    return false;
  }

  return row
    .slice(1, -1)
    .split('|')
    .every((cell) => {
      let index = 0;
      if (cell[index] === ' ') {
        index++;
      }
      if (cell[index] === ':') {
        index++;
      }
      while (cell[index] === '-') {
        index++;
      }
      if (cell[index] === ':') {
        index++;
      }
      if (cell[index] === ' ') {
        index++;
      }
      return index === cell.length;
    });
}

export const TABLE: ElementTransformer = {
  dependencies: [TableNode, TableRowNode, TableCellNode],
  export: (node: LexicalNode) => {
    if (!$isTableNode(node)) {
      return null;
    }

    const output: string[] = [];

    for (const row of node.getChildren()) {
      const rowOutput = [];
      if (!$isTableRowNode(row)) {
        continue;
      }

      let isHeaderRow = false;
      for (const cell of row.getChildren()) {
        // It's TableCellNode so it's just to make flow happy
        if ($isTableCellNode(cell)) {
          rowOutput.push($convertToMarkdownString(PLAYGROUND_TRANSFORMERS, cell).replace(/\n/g, '\\n').trim());
          if (cell.__headerState === TableCellHeaderStates.ROW) {
            isHeaderRow = true;
          }
        }
      }

      output.push(`| ${rowOutput.join(' | ')} |`);
      if (isHeaderRow) {
        output.push(`| ${rowOutput.map((_) => '---').join(' | ')} |`);
      }
    }

    return output.join('\n');
  },
  regExp: TABLE_ROW_REG_EXP,
  replace: (parentNode, _1, match) => {
    // Header row
    if (isTableRowDivider(match[0])) {
      const table = parentNode.getPreviousSibling();
      if (!table || !$isTableNode(table)) {
        return;
      }

      const rows = table.getChildren();
      const lastRow = rows[rows.length - 1];
      if (!lastRow || !$isTableRowNode(lastRow)) {
        return;
      }

      // Add header state to row cells
      lastRow.getChildren().forEach((cell) => {
        if (!$isTableCellNode(cell)) {
          return;
        }
        cell.setHeaderStyles(TableCellHeaderStates.ROW, TableCellHeaderStates.ROW);
      });

      // Remove line
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

function getTableColumnsSize(table: TableNode) {
  const row = table.getFirstChild();
  return $isTableRowNode(row) ? row.getChildrenSize() : 0;
}

const $createTableCell = (textContent: string): TableCellNode => {
  textContent = textContent.replace(/\\n/g, '\n');
  const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
  $convertFromMarkdownString(textContent, PLAYGROUND_TRANSFORMERS, cell);
  return cell;
};

const mapToTableCells = (textContent: string): Array<TableCellNode> | null => {
  const match = textContent.match(TABLE_ROW_REG_EXP);
  if (!match?.[1]) {
    return null;
  }
  return match[1].split('|').map((text) => $createTableCell(text));
};

export const PLAYGROUND_TRANSFORMERS: Array<Transformer> = [
  ALERT,
  TABLE,
  HR,
  IMAGE,
  EMOJI,
  EQUATION,
  TWEET,
  MERMAID,
  CHECK_LIST,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];
