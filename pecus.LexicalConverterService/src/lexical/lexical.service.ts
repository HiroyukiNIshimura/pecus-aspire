import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { createHeadlessEditor } from '@lexical/headless';
import { $generateHtmlFromNodes } from '@lexical/html';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { MarkNode } from '@lexical/mark';
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { OverflowNode } from '@lexical/overflow';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { Injectable } from '@nestjs/common';
import { $getRoot } from 'lexical';

@Injectable()
export class LexicalService {
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
        // カスタムノードは後で追加
      ],
      onError: (error) => {
        throw error;
      },
    });
  }

  toHtml(lexicalJson: string): string {
    const editor = this.createEditor();
    const editorState = editor.parseEditorState(lexicalJson);

    return editorState.read(() => {
      return $generateHtmlFromNodes(editor);
    });
  }

  toMarkdown(lexicalJson: string): string {
    const editor = this.createEditor();
    const editorState = editor.parseEditorState(lexicalJson);

    return editorState.read(() => {
      return $convertToMarkdownString(TRANSFORMERS);
    });
  }

  toPlainText(lexicalJson: string): string {
    const editor = this.createEditor();
    const editorState = editor.parseEditorState(lexicalJson);

    return editorState.read(() => {
      return $getRoot().getTextContent();
    });
  }
}
