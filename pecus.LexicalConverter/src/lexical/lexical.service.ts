import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { HorizontalRuleNode } from '@lexical/extension';
import { createHeadlessEditor } from '@lexical/headless';
import { $generateHtmlFromNodes } from '@lexical/html';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { MarkNode } from '@lexical/mark';
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
import { OverflowNode } from '@lexical/overflow';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { $getRoot, type Klass, type LexicalNode } from 'lexical';
import { initializeDomEnvironment } from './dom-environment';
import { CustomNodes } from './nodes';
import { normalizeListIndentation, PLAYGROUND_TRANSFORMERS } from './transformers/markdown-transformers';

/** 変換結果 */
export interface ConvertResult {
  result: string;
  unknownNodes: string[];
}

/** 登録済みノードタイプのセット */
const REGISTERED_NODE_TYPES: Set<string> = new Set([
  // Lexical標準ノード
  'root',
  'paragraph',
  'text',
  'linebreak',
  // @lexical/rich-text
  'heading',
  'quote',
  // @lexical/list
  'list',
  'listitem',
  // @lexical/code
  'code',
  'code-highlight',
  // @lexical/table
  'table',
  'tablecell',
  'tablerow',
  // @lexical/link
  'link',
  'autolink',
  // @lexical/overflow
  'overflow',
  // @lexical/mark
  'mark',
  // @lexical/extension
  'horizontalrule',
]);

// カスタムノードのタイプを追加
for (const NodeClass of CustomNodes) {
  REGISTERED_NODE_TYPES.add((NodeClass as Klass<LexicalNode> & { getType(): string }).getType());
}

@Injectable()
export class LexicalService implements OnModuleInit {
  onModuleInit() {
    // DOM環境を初期化（jsdomを使用）
    initializeDomEnvironment();
  }

  /**
   * JSONから未登録のノードタイプを検出する
   */
  private detectUnknownNodes(lexicalJson: string): string[] {
    const unknown: Set<string> = new Set();

    const checkNode = (node: Record<string, unknown>) => {
      const nodeType = node.type;
      if (typeof nodeType === 'string' && !REGISTERED_NODE_TYPES.has(nodeType)) {
        unknown.add(nodeType);
      }
      const children = node.children;
      if (Array.isArray(children)) {
        for (const child of children) {
          checkNode(child as Record<string, unknown>);
        }
      }
    };

    try {
      const parsed = JSON.parse(lexicalJson) as { root?: Record<string, unknown> };
      if (parsed.root) {
        checkNode(parsed.root);
      }
    } catch {
      // JSONパースエラーは無視（後続の変換処理でエラーになる）
    }

    return [...unknown];
  }

  private createEditor() {
    return createHeadlessEditor({
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        AutoLinkNode,
        LinkNode,
        OverflowNode,
        MarkNode,
        HorizontalRuleNode,
        // カスタムノード
        ...CustomNodes,
      ],
      onError: (error) => {
        throw error;
      },
    });
  }

  toHtml(lexicalJson: string): ConvertResult {
    const unknownNodes = this.detectUnknownNodes(lexicalJson);
    const editor = this.createEditor();
    const editorState = editor.parseEditorState(lexicalJson);

    const result = editorState.read(() => {
      return $generateHtmlFromNodes(editor);
    });

    return { result, unknownNodes };
  }

  toMarkdown(lexicalJson: string): ConvertResult {
    const unknownNodes = this.detectUnknownNodes(lexicalJson);
    const editor = this.createEditor();
    const editorState = editor.parseEditorState(lexicalJson);

    const result = editorState.read(() => {
      return $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);
    });

    return { result, unknownNodes };
  }

  toPlainText(lexicalJson: string): ConvertResult {
    const unknownNodes = this.detectUnknownNodes(lexicalJson);
    const editor = this.createEditor();
    const editorState = editor.parseEditorState(lexicalJson);

    const result = editorState.read(() => {
      return $getRoot().getTextContent();
    });

    return { result, unknownNodes };
  }

  /**
   * Markdown文字列をLexical EditorState JSONに変換
   * @param markdown Markdown文字列
   * @returns Lexical EditorState JSON
   */
  fromMarkdown(markdown: string): ConvertResult {
    const editor = this.createEditor();

    // 2スペースインデントを4スペースに正規化してからLexicalに変換
    const normalizedMarkdown = normalizeListIndentation(markdown);

    editor.update(
      () => {
        $convertFromMarkdownString(normalizedMarkdown, PLAYGROUND_TRANSFORMERS, undefined, true);
      },
      { discrete: true },
    );

    const editorState = editor.getEditorState();
    const result = JSON.stringify(editorState.toJSON());

    return { result, unknownNodes: [] };
  }
}
