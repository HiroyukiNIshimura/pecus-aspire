# ヘルプシステム実装計画

## AI エージェント向け要約（必読）

- ヘルプコンテンツは**フロントエンドに静的Markdownファイル**として配置する（MDXは使用しない）
- DBへのヒントワークスペースシードは**廃止**する
- レンダリングは**既存の `PLAYGROUND_TRANSFORMERS` を使用**し、Client ComponentでMarkdown→Lexical変換して表示
- 検索は**FlexSearch**を使用し、ビルド時にインデックス生成
- **MDXを使用しない理由**: Next.js 15 + Turbopackで remark-gfm が「serializable options」エラーを起こすため
- **画像**: Markdownの `![alt](src)` 構文で記述。既存の `IMAGE` Transformerがサポート

---

## 1. 背景と目的

### 1.1 現状の問題

「Coatiのヒント」ワークスペースを各組織にシードするアプローチには以下の問題がある：

| 問題 | 説明 |
|------|------|
| データの冗長性 | 同一コンテンツが全組織のDBに重複保存される |
| 削除可能 | ユーザーがワークスペースを削除するとヒントが消失する |
| 更新困難 | デプロイ後のコンテンツ更新ができない |

### 1.2 MDX断念の経緯

当初は @next/mdx + remark-gfm での実装を計画していたが、以下の問題により断念：

- **remark-gfm非互換**: Next.js 15 + Turbopackでは remark-gfm が「Must have serializable options」エラーを引き起こす
- **GFMテーブル未対応**: remark-gfm なしではMarkdownテーブル（`|`構文）がレンダリングされない
- **回避策の却下**: MDX内でHTMLテーブルを直書きするのはMarkdown採用の意味がない

### 1.3 新アプローチ（Lexical + PLAYGROUND_TRANSFORMERS）のメリット

| メリット | 説明 |
|----------|------|
| 冗長性ゼロ | フロントエンドの静的ファイルとして1箇所で管理 |
| 削除不可 | ユーザーが削除できない |
| 即時更新 | デプロイで自動的に最新化 |
| 検索可能 | FlexSearchによる高速全文検索 |
| **GFM完全対応** | 既存の `PLAYGROUND_TRANSFORMERS` にTABLE, IMAGE, EMOJI等が含まれる |
| **既存資産活用** | プロジェクト既存のLexicalインフラを完全に再利用 |
| i18n対応 | 将来的に多言語対応が容易 |

---

## 2. 技術スタック

| 技術 | 用途 |
|------|------|
| Markdown | 純粋なMarkdownファイル（MDXではない） |
| `PLAYGROUND_TRANSFORMERS` | GFM（テーブル、画像、絵文字等）の変換 |
| `$convertFromMarkdownString` | Markdown→Lexical EditorState変換 |
| PecusNotionLikeViewer | Lexical JSONをReadOnlyモードで表示 |
| FlexSearch | クライアントサイド全文検索エンジン |

---

## 3. ディレクトリ構成

```
pecus.Frontend/
├── public/
│   └── help/
│       └── images/
│           ├── dashboard.webp
│           ├── create-workspace.webp
│           └── ...
├── scripts/
│   └── generate-help-index.ts    # 検索インデックス生成スクリプト
├── src/
│   ├── content/
│   │   └── help/
│   │       ├── ja/
│   │       │   ├── 01-getting-started.md    # 純粋なMarkdown
│   │       │   ├── 02-workspace.md
│   │       │   ├── 03-tasks.md
│   │       │   ├── 04-focus-session.md
│   │       │   ├── 05-ai-assistant.md
│   │       │   └── ...
│   │       └── search-index.json  # 生成される検索インデックス
│   ├── app/
│   │   └── help/
│   │       ├── layout.tsx         # サイドナビ付きレイアウト
│   │       ├── page.tsx           # ヘルプ一覧（トップページ）
│   │       └── [slug]/
│   │           └── page.tsx       # 個別ヘルプページ
│   ├── components/
│   │   └── help/
│   │       ├── HelpSearch.tsx     # 検索コンポーネント
│   │       ├── HelpSearchModal.tsx # Cmd+K 検索モーダル
│   │       ├── HelpSidebar.tsx    # サイドナビゲーション
│   │       ├── Callout.tsx        # 注意・ヒント・警告ボックス（オプション）
│   │       ├── HelpContent.tsx    # Markdown→Lexical変換＋表示
│   │       └── KeyboardShortcut.tsx # ショートカットキー表示
│   └── libs/
│       └── help/
│           ├── search.ts          # FlexSearch ラッパー
│           ├── getHelpContent.ts  # Markdownコンテンツ取得（Server側）
│           └── types.ts           # 型定義
```

---

## 4. アーキテクチャ概要

### 4.1 データフロー

```
┌─────────────────────┐
│ .md ファイル        │  純粋なMarkdown（GFMテーブル対応）
│ src/content/help/ja │
└─────────┬───────────┘
          │
          ▼ Server Component で文字列として読み込み
┌─────────────────────┐
│ getHelpContent()    │  fs.readFile でMarkdown文字列取得
│ (Node.js実行)       │
└─────────┬───────────┘
          │
          ▼ Markdown文字列をpropsで渡す
┌─────────────────────────────────────────┐
│ HelpContent (Client Component)          │
│ $convertFromMarkdownString()            │
│ + PLAYGROUND_TRANSFORMERS               │
│ → Lexicalエディタ内でリアルタイム変換    │
└─────────┬───────────────────────────────┘
          │
          ▼ ReadOnlyモードで表示
┌─────────────────────┐
│ 既存のLexical Viewer │
│ (テーブル、画像対応) │
└─────────────────────┘
```

### 4.2 技術的ポイント

- **`PLAYGROUND_TRANSFORMERS`**: プロジェクト既存のカスタムトランスフォーマー
  - `TABLE`: GFMテーブル（`|`構文）対応
  - `IMAGE`: 画像（`![alt](src)`）対応
  - `EMOJI`: 絵文字（`:emoji:`）対応
  - `HR`: 水平線（`---`）対応
  - その他: CHECK_LIST, HEADING, QUOTE, CODE等
- **Client Componentで変換**: `$convertFromMarkdownString` はLexicalエディタコンテキスト内でのみ動作
- **ReadOnlyモード**: 既存のViewerを `editable: false` で使用

---

## 5. 実装タスク

### Phase 1: 基盤構築

#### 5.1 依存パッケージの確認

```bash
cd pecus.Frontend
npm install flexsearch
npm install -D @types/flexsearch
# @lexical/markdown, PLAYGROUND_TRANSFORMERS は既にプロジェクトにインストール済み
# 追加インストール不要
```

#### 5.2 ヘルプコンテンツ取得ユーティリティ（Server側）

`src/libs/help/getHelpContent.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';

interface HelpArticle {
  slug: string;
  title: string;
  markdown: string;  // Markdown文字列をそのまま渡す
  order: number;
}

export async function getHelpArticle(slug: string, locale = 'ja'): Promise<HelpArticle | null> {
  const helpDir = path.join(process.cwd(), 'src/content/help', locale);

  try {
    const files = await fs.readdir(helpDir);
    const file = files.find(f => f.endsWith('.md') && f.includes(slug));

    if (!file) return null;

    const filePath = path.join(helpDir, file);
    const markdown = await fs.readFile(filePath, 'utf-8');

    // 最初のh1をタイトルとして抽出
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : slug;

    // ファイル名から順序を取得
    const orderMatch = file.match(/^(\d+)-/);
    const order = orderMatch ? parseInt(orderMatch[1], 10) : 999;

    return { slug, title, markdown, order };
  } catch {
    return null;
  }
}

export async function getAllHelpArticles(locale = 'ja'): Promise<HelpArticle[]> {
  const helpDir = path.join(process.cwd(), 'src/content/help', locale);
  const files = await fs.readdir(helpDir);

  const articles: HelpArticle[] = [];

  for (const file of files.filter(f => f.endsWith('.md'))) {
    const slug = file.replace('.md', '');
    const article = await getHelpArticle(slug, locale);
    if (article) articles.push(article);
  }

  return articles.sort((a, b) => a.order - b.order);
}
```

---

### Phase 2: コンポーネント実装

#### 5.3 HelpContent コンポーネント（Client Component）

`src/components/help/HelpContent.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $convertFromMarkdownString } from '@lexical/markdown';
import { PLAYGROUND_TRANSFORMERS } from '@/components/editor/plugins/MarkdownTransformers';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import NotionLikeEditorNodes from '@/components/editor/nodes/NotionLikeEditorNodes';
import NotionLikeViewerTheme from '@/components/editor/themes/NotionLikeViewerTheme';
import { TableContext } from '@/components/editor/plugins/TablePlugin';

interface HelpContentProps {
  markdown: string;
}

function MarkdownLoader({ markdown }: { markdown: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      $convertFromMarkdownString(markdown, PLAYGROUND_TRANSFORMERS);
    });
  }, [editor, markdown]);

  return null;
}

export function HelpContent({ markdown }: HelpContentProps) {
  const initialConfig = {
    namespace: 'HelpContent',
    nodes: NotionLikeEditorNodes,
    theme: NotionLikeViewerTheme,
    editable: false,
    onError: (error: Error) => console.error('Lexical error:', error),
  };

  return (
    <div className="prose prose-slate max-w-none">
      <LexicalComposer initialConfig={initialConfig}>
        <TableContext>
          <MarkdownLoader markdown={markdown} />
          <RichTextPlugin
            contentEditable={<ContentEditable className="outline-none" />}
            placeholder={null}
          />
        </TableContext>
      </LexicalComposer>
    </div>
  );
}
```

#### 5.4 基本コンポーネント（必要に応じて）

| コンポーネント | 説明 | 優先度 |
|----------------|------|--------|
| `HelpContent.tsx` | Markdown→Lexical変換＋ReadOnly表示 | 高 |
| `HelpSidebar.tsx` | 左サイドバーのナビゲーション | 高 |
| `HelpSearch.tsx` | 検索入力とインクリメンタル検索 | 高 |

---

### Phase 3: 検索機能実装

#### 5.5 インデックス生成スクリプト

`scripts/generate-help-index.ts`:

```typescript
import fs from 'fs';
import path from 'path';

interface HelpIndexEntry {
  slug: string;
  title: string;
  description: string;
  content: string;
  headings: string[];
  order: number;
}

function generateHelpIndex() {
  const helpDir = path.join(process.cwd(), 'src/content/help/ja');
  const files = fs.readdirSync(helpDir).filter(f => f.endsWith('.md'));

  const index: HelpIndexEntry[] = files.map(file => {
    const content = fs.readFileSync(path.join(helpDir, file), 'utf-8');

    // プレーンテキスト化（検索用）
    const plainText = content
      .replace(/[#*`_~\[\]|]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    // 見出しを抽出
    const headings = content.match(/^#{1,3}\s+.+$/gm)?.map(h =>
      h.replace(/^#+\s+/, '')
    ) || [];

    // 最初のh1をタイトルとして使用
    const title = headings[0] || file.replace(/^\d+-/, '').replace('.md', '');

    // 2番目以降のh2をdescriptionとして使用
    const description = headings.slice(1, 3).join(' / ') || '';

    // ファイル名から順序を取得
    const orderMatch = file.match(/^(\d+)-/);
    const order = orderMatch ? parseInt(orderMatch[1], 10) : 999;

    return {
      slug: file.replace('.md', ''),
      title,
      description,
      content: plainText,
      headings,
      order,
    };
  });

  index.sort((a, b) => a.order - b.order);

  const outputPath = path.join(process.cwd(), 'src/content/help/search-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));

  console.log(`✅ Generated help search index: ${index.length} entries`);
}

generateHelpIndex();
```

#### 5.7 FlexSearchラッパー

`src/libs/help/search.ts`:

```typescript
import FlexSearch from 'flexsearch';

interface HelpDocument {
  slug: string;
  title: string;
  description: string;
  content: string;
  headings: string[];
}

let searchIndex: FlexSearch.Document<HelpDocument> | null = null;

export async function initHelpSearch(documents: HelpDocument[]) {
  searchIndex = new FlexSearch.Document<HelpDocument>({
    document: {
      id: 'slug',
      index: ['title', 'content', 'headings'],
      store: ['slug', 'title', 'description'],
    },
    tokenize: 'forward',
    context: true,
  });

  documents.forEach(doc => {
    searchIndex!.add({
      ...doc,
      headings: doc.headings.join(' '),
    });
  });
}

export function searchHelp(query: string, limit = 10): HelpDocument[] {
  if (!searchIndex || query.length < 2) return [];

  const results = searchIndex.search(query, { limit, enrich: true });

  const slugSet = new Set<string>();
  const items: HelpDocument[] = [];

  for (const field of results) {
    for (const result of field.result) {
      const doc = result.doc as HelpDocument;
      if (!slugSet.has(doc.slug)) {
        slugSet.add(doc.slug);
        items.push(doc);
      }
    }
  }

  return items;
}
```

#### 5.8 package.json スクリプト追加

```json
{
  "scripts": {
    "generate:help-index": "tsx scripts/generate-help-index.ts",
    "prebuild": "npm run generate:help-index"
  }
}
```

---

### Phase 4: ページ実装

#### 5.9 ヘルプレイアウト

`src/app/help/layout.tsx`:
- 左サイドバー: 目次ナビゲーション
- 上部: 検索バー
- メイン: コンテンツ表示領域

#### 5.10 ヘルプ一覧ページ

`src/app/help/page.tsx`:
- カード形式でヘルプ記事一覧を表示
- 検索入力フィールド

#### 5.11 個別ヘルプページ

`src/app/help/[slug]/page.tsx`:

```tsx
import { getHelpArticle, getAllHelpArticles } from '@/libs/help/getHelpContent';
import { HelpContent } from '@/components/help/HelpContent';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await getAllHelpArticles();
  return articles.map(article => ({ slug: article.slug }));
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getHelpArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="flex-1 overflow-y-auto p-6">
      <HelpContent markdown={article.markdown} />
    </article>
  );
}
```

---

### Phase 5: コンテンツ移行

#### 5.12 既存Markdownの移行

`pecus.Libs/DB/Seed/md/` から `pecus.Frontend/src/content/help/ja/` へ移行：

| 移行元 | 移行先 |
|--------|--------|
| `01.Getting Started.md` | `01-getting-started.md` |
| `02.Create Workspace Item.md` | `02-workspace-item.md` |
| `03.Create Task.md` | `03-task.md` |
| `04.Focus.md` | `04-focus-session.md` |

**注意**: ファイルは純粋なMarkdown（`.md`）のまま使用。MDX（`.mdx`）には変換しない。

#### 5.13 シードコード削除

`pecus.Libs/DB/Seed/Atoms/DemoAtoms.cs` から「Coatiのヒント」ワークスペース作成処理を削除。

---

### Phase 6: ナビゲーション統合

#### 5.14 ヘルプボタン追加

アプリ全体のヘッダーまたはサイドバーに「ヘルプ」リンクを追加。

---

## 6. Markdownコンテンツの書き方

### 6.1 基本構文

純粋なMarkdownを使用します。**フロントマターは不要**です。

```markdown
# ワークスペースの使い方

## 概要

ワークスペースはCoatiの基本単位です。

> 💡 **ヒント**: ワークスペースは目標やプロジェクトごとに作成すると管理しやすくなります。

## 新規作成

![ワークスペース作成画面](/help/images/create-workspace.webp)

### ワークスペースロール

| ロール | 説明 | 編集権限 |
|--------|------|----------|
| Owner | 所有者 | ✅ |
| Member | メンバー | ✅ |
| Viewer | 閲覧者 | ❌ |
```

### 6.2 サポートされるGFM機能

Lexicalの@lexical/markdownが対応する機能:

| 機能 | 構文 | 例 |
|------|------|-----|
| テーブル | `\| ... \|` | GFMテーブル |
| 取り消し線 | `~~text~~` | ~~削除~~された文字 |
| タスクリスト | `- [ ]` / `- [x]` | チェックボックス |
| リンク | `[text](url)` | 自動リンク化 |
| 画像 | `![alt](src)` | 画像埋め込み |
| コードブロック | ` ``` ` | シンタックスハイライト |
| 引用 | `>` | ブロッククォート |

### 6.3 注意書きの書き方（Callout代替）

MDXのCalloutコンポーネントの代わりに、引用ブロックと絵文字を使用:

```markdown
> 💡 **ヒント**: ワークスペースは目標やプロジェクトごとに作成すると管理しやすくなります。

> ⚠️ **注意**: この操作は取り消せません。

> ℹ️ **補足**: 詳しくは設定画面をご確認ください。
```

---

## 7. 画像ガイドライン

### 7.1 ファイル形式

- **WebP推奨**: 高圧縮・高品質
- 透過が必要な場合: PNG
- アニメーション: GIF または MP4

### 7.2 サイズ

- 幅: 最大1600px（表示は800px程度にリサイズ）
- ファイルサイズ: 200KB以下を目標

### 7.3 命名規則

```
/help/images/
├── dashboard-overview.webp      # 機能概要
├── create-workspace-step1.webp  # ステップ1
├── create-workspace-step2.webp  # ステップ2
└── error-message-example.webp   # エラー例
```

---

## 8. テスト項目

| テスト | 内容 |
|--------|------|
| 検索機能 | 日本語キーワードでの検索が正常に動作する |
| 画像表示 | 画像が最適化されて表示される |
| **テーブル** | GFMテーブルが正しくレンダリングされる |
| レスポンシブ | モバイルでも読みやすく表示される |
| ナビゲーション | 目次からの遷移が正常に動作する |
| キーボード | Cmd+K で検索モーダルが開く |
| Lexical変換 | Markdown→Lexical変換が正常に動作する |

---

## 9. 今後の拡張

| 機能 | 説明 | 優先度 |
|------|------|--------|
| 多言語対応 | `content/help/en/` ディレクトリ追加 | 中 |
| バージョン管理 | リリースノートの統合 | 低 |
| フィードバック | 「この記事は役に立ちましたか？」ボタン | 低 |
| 関連記事 | 記事末尾に関連ヘルプを自動表示 | 低 |

---

## 10. 移行チェックリスト

- [x] 依存パッケージの確認（flexsearch）
- [x] `getHelpContent.ts` ユーティリティ作成
- [x] `HelpContent.tsx` コンポーネント作成（Client Component）
- [x] 検索インデックス生成スクリプト作成
- [x] ヘルプページ（layout, page, [slug]）作成
- [x] 既存Markdownの移行（.mdx → .md にリネーム）
- [ ] シードコードの削除
- [ ] ナビゲーションへのヘルプリンク追加
- [x] GFMテーブルの動作確認
- [x] 動作確認テスト

---

## 11. トラブルシューティング

### 11.1 テーブルがレンダリングされない

`PLAYGROUND_TRANSFORMERS` に `TABLE` トランスフォーマーが含まれていることを確認。
ファイル: `src/components/editor/plugins/MarkdownTransformers/index.ts`

### 11.2 Client Componentでの変換エラー

`$convertFromMarkdownString` はLexicalエディタコンテキスト内（`LexicalComposer`の子コンポーネント）でのみ動作。
`useLexicalComposerContext` を使用してエディタインスタンスを取得し、`editor.update()` 内で呼び出すこと。

### 11.3 画像が表示されない

`PLAYGROUND_TRANSFORMERS` に `IMAGE` トランスフォーマーが含まれている。
Markdown構文: `![代替テキスト](/help/images/example.webp)`
画像ファイルは `public/help/images/` に配置すること。

### 11.4 スタイリングの調整

`HelpContent` コンポーネント内で `prose` クラスを適用してTypographyを調整。
Lexicalエディタのテーマは `NotionLikeViewerTheme` を使用。
