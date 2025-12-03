#!/usr/bin/env node
/**
 * Markdown to Lexical テストスクリプト
 *
 * このスクリプトは、Markdown 文字列を Lexical エディタのシリアライズ形式（JSON）に変換する
 * 実験的なテストです。
 *
 * 使い方:
 *   node scripts/test-markdown-to-lexical.js
 *
 * 目的:
 *   - エディタにマークダウンをペーストした際に、Lexical ノードに変換してインサートする
 *   - 現在の実装では、マークダウンは Code ブロックとして認識されてしまう
 *   - このテストで Lexical のヘッドレス環境での変換を検証する
 *
 * 参考: https://payloadcms.com/docs/rich-text/converting-markdown#markdown-to-richtext
 */

import { createHeadlessEditor } from '@lexical/headless';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from '@lexical/markdown';
import { HeadingNode, QuoteNode, registerRichText } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { $createHorizontalRuleNode, $isHorizontalRuleNode, HorizontalRuleNode } from '@lexical/extension';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';

/**
 * カスタム水平線トランスフォーマー
 * @lexical/markdown の TRANSFORMERS には HR が含まれていないため独自に定義
 */
const HR_TRANSFORMER = {
  dependencies: [HorizontalRuleNode],
  export: (node) => {
    return $isHorizontalRuleNode(node) ? '---' : null;
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
 * 拡張 TRANSFORMERS（水平線対応）
 */
const EXTENDED_TRANSFORMERS = [
  HR_TRANSFORMER,
  CHECK_LIST,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];

// テスト用のマークダウン文字列
const testMarkdowns = [
  {
    name: 'シンプルなテキスト',
    markdown: 'Hello World!',
  },
  {
    name: 'ヘッダー',
    markdown: `# 見出し1
## 見出し2
### 見出し3`,
  },
  {
    name: '段落と太字・イタリック',
    markdown: `これは**太字**のテストです。

これは*イタリック*のテストです。

これは***太字イタリック***のテストです。`,
  },
  {
    name: 'リスト',
    markdown: `- アイテム1
- アイテム2
  - ネストしたアイテム
- アイテム3

1. 番号付きアイテム1
2. 番号付きアイテム2
3. 番号付きアイテム3`,
  },
  {
    name: 'リンク',
    markdown: `[GitHub](https://github.com)

通常のテキストと[リンク](https://example.com)が混在。`,
  },
  {
    name: 'コードブロック',
    markdown: `インラインコード: \`console.log('hello')\`

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\``,
  },
  {
    name: '引用',
    markdown: `> これは引用です。
> 複数行の引用も可能です。`,
  },
  {
    name: '水平線',
    markdown: `上のセクション

---

下のセクション`,
  },
  {
    name: '複合的なマークダウン',
    markdown: `# プロジェクト README

## 概要

このプロジェクトは**Lexical エディタ**を使用しています。

## インストール

\`\`\`bash
npm install
\`\`\`

## 特徴

- *柔軟*なエディタ
- **拡張性**の高い設計
- [ドキュメント](https://lexical.dev)が充実

> 注意: この機能は実験的です。

---

詳細は公式サイトをご覧ください。`,
  },
];

/**
 * ヘッドレス Lexical エディタを作成
 * ブラウザ環境なしで Lexical を使用できる
 */
function createTestEditor() {
  const editor = createHeadlessEditor({
    nodes: [
      HeadingNode,
      QuoteNode,
      ListItemNode,
      ListNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
      CodeHighlightNode,
      HorizontalRuleNode,
      TableNode,
      TableCellNode,
      TableRowNode,
    ],
    onError: (error) => {
      console.error('Lexical Editor Error:', error);
    },
  });

  // リッチテキスト機能を登録
  registerRichText(editor);

  return editor;
}

/**
 * Markdown を Lexical JSON に変換
 */
async function convertMarkdownToLexical(markdown) {
  const editor = createTestEditor();

  return new Promise((resolve, reject) => {
    editor.update(
      () => {
        try {
          const root = $getRoot();
          // 既存のコンテンツをクリア
          root.clear();
          // Markdown をパースして Lexical ノードに変換（拡張 TRANSFORMERS を使用）
          $convertFromMarkdownString(markdown, EXTENDED_TRANSFORMERS, root, true);
        } catch (error) {
          reject(error);
        }
      },
      {
        onUpdate: () => {
          // 変換後の状態をシリアライズして取得
          const editorState = editor.getEditorState();
          const json = editorState.toJSON();
          resolve(json);
        },
      }
    );
  });
}

/**
 * Lexical JSON を Markdown に変換（逆変換テスト用）
 */
async function convertLexicalToMarkdown(lexicalJson) {
  const editor = createTestEditor();

  // エディタ状態をセット
  const editorState = editor.parseEditorState(lexicalJson);
  editor.setEditorState(editorState);

  return new Promise((resolve) => {
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const markdown = $convertToMarkdownString(EXTENDED_TRANSFORMERS, root, true);
      resolve(markdown);
    });
  });
}

/**
 * テスト実行
 */
async function runTests() {
  console.log('='.repeat(80));
  console.log('Markdown → Lexical 変換テスト');
  console.log('='.repeat(80));
  console.log('');

  for (const testCase of testMarkdowns) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📝 テストケース: ${testCase.name}`);
    console.log('─'.repeat(60));

    console.log('\n【入力 Markdown】');
    console.log(testCase.markdown);

    try {
      // Markdown → Lexical JSON
      const lexicalJson = await convertMarkdownToLexical(testCase.markdown);
      console.log('\n【Lexical JSON (概要)】');
      console.log(`ルートノード: ${lexicalJson.root.type}`);
      console.log(`子ノード数: ${lexicalJson.root.children.length}`);

      // 子ノードの種類をリスト
      const nodeTypes = lexicalJson.root.children.map((child) => child.type);
      console.log(`ノードタイプ: ${nodeTypes.join(', ')}`);

      // 詳細な JSON 出力
      console.log('\n【Lexical JSON (詳細)】');
      console.log(JSON.stringify(lexicalJson, null, 2));

      // 逆変換テスト: Lexical JSON → Markdown
      const backToMarkdown = await convertLexicalToMarkdown(lexicalJson);
      console.log('\n【逆変換 Markdown】');
      console.log(backToMarkdown);

      // 元のマークダウンと比較
      const isMatch = testCase.markdown.trim() === backToMarkdown.trim();
      console.log(`\n【往復変換結果】: ${isMatch ? '✅ 一致' : '⚠️ 差分あり'}`);
    } catch (error) {
      console.error('\n❌ エラー:', error.message);
      console.error(error.stack);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('テスト完了');
  console.log('='.repeat(80));
}

// 実行
runTests().catch(console.error);
