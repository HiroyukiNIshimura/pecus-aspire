# ヘルプシステム実装計画

## AI エージェント向け要約（必読）

- ヘルプコンテンツは**フロントエンドに静的MDXファイル**として配置する
- DBへのヒントワークスペースシードは**廃止**する
- 検索は**FlexSearch**を使用し、ビルド時にインデックスを生成する
- 画像は `public/help/images/` に配置し、Next.js `Image` コンポーネントで表示
- 既存の `pecus.Libs/DB/Seed/md/` のMarkdownファイルをMDXに移行する

---

## 1. 背景と目的

### 1.1 現状の問題

「Coatiのヒント」ワークスペースを各組織にシードするアプローチには以下の問題がある：

| 問題 | 説明 |
|------|------|
| データの冗長性 | 同一コンテンツが全組織のDBに重複保存される |
| 削除可能 | ユーザーがワークスペースを削除するとヒントが消失する |
| 更新困難 | デプロイ後のコンテンツ更新ができない |

### 1.2 新アプローチのメリット

| メリット | 説明 |
|----------|------|
| 冗長性ゼロ | フロントエンドの静的ファイルとして1箇所で管理 |
| 削除不可 | ユーザーが削除できない |
| 即時更新 | デプロイで自動的に最新化 |
| 検索可能 | FlexSearchによる高速全文検索 |
| リッチコンテンツ | 画像、テーブル、動画、インタラクティブ要素が利用可能 |
| i18n対応 | 将来的に多言語対応が容易 |

---

## 2. 技術スタック

| 技術 | 用途 |
|------|------|
| MDX | Markdownに React コンポーネントを埋め込み可能 |
| @next/mdx | Next.js の MDX サポート |
| FlexSearch | クライアントサイド全文検索エンジン |
| gray-matter | MDX フロントマター（メタデータ）のパース |
| Next.js Image | 画像の最適化・遅延読み込み |

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
│   │       │   ├── 01-getting-started.mdx
│   │       │   ├── 02-workspace.mdx
│   │       │   ├── 03-tasks.mdx
│   │       │   ├── 04-focus-session.mdx
│   │       │   ├── 05-ai-assistant.mdx
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
│   │       ├── MdxComponents.tsx  # MDXグローバルスタイル
│   │       ├── HelpSearch.tsx     # 検索コンポーネント
│   │       ├── HelpSearchModal.tsx # Cmd+K 検索モーダル
│   │       ├── HelpSidebar.tsx    # サイドナビゲーション
│   │       ├── Callout.tsx        # 注意・ヒント・警告ボックス
│   │       ├── ImageWithCaption.tsx # キャプション付き画像
│   │       ├── ZoomableImage.tsx  # クリックで拡大表示
│   │       ├── StepImage.tsx      # ステップバイステップ画像
│   │       ├── VideoDemo.tsx      # 動画デモ
│   │       └── KeyboardShortcut.tsx # ショートカットキー表示
│   └── libs/
│       └── help/
│           ├── search.ts          # FlexSearch ラッパー
│           └── getHelpContent.ts  # MDXコンテンツ取得
```

---

## 4. 実装タスク

### Phase 1: 基盤構築

#### 4.1 依存パッケージのインストール

```bash
cd pecus.Frontend
npm install @next/mdx @mdx-js/loader @mdx-js/react gray-matter flexsearch
npm install -D @types/mdx
```

#### 4.2 next.config.ts の更新

```typescript
import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  // ...existing config...
};

export default withMDX(nextConfig);
```

#### 4.3 MDXコンポーネントプロバイダー作成

`src/components/help/MdxComponents.tsx` にグローバルスタイルを定義。

---

### Phase 2: コンポーネント実装

#### 4.4 基本コンポーネント

| コンポーネント | 説明 | 優先度 |
|----------------|------|--------|
| `MdxComponents.tsx` | h1〜h6, p, table, ul, ol, blockquote等のスタイリング | 高 |
| `Callout.tsx` | info/warning/tip の注意書きボックス | 高 |
| `ImageWithCaption.tsx` | キャプション付き画像表示 | 高 |
| `HelpSidebar.tsx` | 左サイドバーのナビゲーション | 高 |
| `HelpSearch.tsx` | 検索入力とインクリメンタル検索 | 高 |

#### 4.5 拡張コンポーネント

| コンポーネント | 説明 | 優先度 |
|----------------|------|--------|
| `ZoomableImage.tsx` | クリックで拡大表示するモーダル | 中 |
| `StepImage.tsx` | ステップ番号付きチュートリアル用 | 中 |
| `HelpSearchModal.tsx` | Cmd+K で起動する検索モーダル | 中 |
| `VideoDemo.tsx` | 操作デモ動画の埋め込み | 低 |
| `KeyboardShortcut.tsx` | キーボードショートカット表示 | 低 |

---

### Phase 3: 検索機能実装

#### 4.6 インデックス生成スクリプト

`scripts/generate-help-index.ts`:

```typescript
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

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
  const files = fs.readdirSync(helpDir).filter(f => f.endsWith('.mdx'));

  const index: HelpIndexEntry[] = files.map(file => {
    const content = fs.readFileSync(path.join(helpDir, file), 'utf-8');
    const { data, content: body } = matter(content);

    // MDX/JSXタグを除去してプレーンテキスト化
    const plainText = body
      .replace(/<[^>]+>/g, '')
      .replace(/import .+$/gm, '')
      .replace(/export .+$/gm, '')
      .replace(/\{[^}]+\}/g, '')
      .replace(/[#*`_~\[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    // 見出しを抽出
    const headings = body.match(/^#{1,3}\s+.+$/gm)?.map(h =>
      h.replace(/^#+\s+/, '')
    ) || [];

    // ファイル名から順序を取得（例: 01-getting-started.mdx → 1）
    const orderMatch = file.match(/^(\d+)-/);
    const order = orderMatch ? parseInt(orderMatch[1], 10) : 999;

    return {
      slug: file.replace('.mdx', ''),
      title: data.title || headings[0] || file.replace(/^\d+-/, '').replace('.mdx', ''),
      description: data.description || '',
      content: plainText,
      headings,
      order,
    };
  });

  // 順序でソート
  index.sort((a, b) => a.order - b.order);

  const outputPath = path.join(process.cwd(), 'src/content/help/search-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));

  console.log(`✅ Generated help search index: ${index.length} entries`);
}

generateHelpIndex();
```

#### 4.7 FlexSearchラッパー

`src/libs/help/search.ts`:

```typescript
import FlexSearch from 'flexsearch';

// 型定義
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

#### 4.8 package.json スクリプト追加

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

#### 4.9 ヘルプレイアウト

`src/app/help/layout.tsx`:
- 左サイドバー: 目次ナビゲーション
- 上部: 検索バー
- メイン: コンテンツ表示領域

#### 4.10 ヘルプ一覧ページ

`src/app/help/page.tsx`:
- カード形式でヘルプ記事一覧を表示
- 検索入力フィールド

#### 4.11 個別ヘルプページ

`src/app/help/[slug]/page.tsx`:
- MDXコンテンツの動的読み込み
- 前後の記事へのナビゲーション

---

### Phase 5: コンテンツ移行

#### 4.12 既存Markdownの移行

`pecus.Libs/DB/Seed/md/` から `pecus.Frontend/src/content/help/ja/` へ移行：

| 移行元 | 移行先 |
|--------|--------|
| `01.Getting Started.md` | `01-getting-started.mdx` |
| `02.Create Workspace Item.md` | `02-workspace-item.mdx` |
| `03.Create Task.md` | `03-task.mdx` |
| `04.Focus.md` | `04-focus-session.mdx` |

#### 4.13 フロントマター追加

各MDXファイルの先頭にメタデータを追加：

```mdx
---
title: はじめての方へ
description: Coatiの基本的な使い方を学びましょう
---

# はじめての方へ

...
```

#### 4.14 シードコード削除

`pecus.Libs/DB/Seed/Atoms/DemoAtoms.cs` から「Coatiのヒント」ワークスペース作成処理を削除。

---

### Phase 6: ナビゲーション統合

#### 4.15 ヘルプボタン追加

アプリ全体のヘッダーまたはサイドバーに「ヘルプ」リンクを追加。

#### 4.16 コンテキストヘルプ（オプション）

各画面に関連ヘルプへのリンクを表示：

```tsx
<HelpLink slug="03-task" />
// → "タスクについて詳しく見る" リンクを表示
```

---

## 5. MDXコンテンツの書き方

### 5.1 基本構文

```mdx
---
title: ワークスペースの使い方
description: ワークスペースの作成・管理方法を解説します
---

import { Callout } from '@/components/help/Callout'
import { ImageWithCaption } from '@/components/help/ImageWithCaption'

# ワークスペースの使い方

## 概要

ワークスペースはCoatiの基本単位です。

<Callout type="tip">
  ワークスペースは目標やプロジェクトごとに作成すると管理しやすくなります。
</Callout>

## 新規作成

<ImageWithCaption
  src="/help/images/create-workspace.webp"
  alt="ワークスペース作成画面"
  caption="図1: 新規ワークスペースの作成"
/>

### ワークスペースロール

| ロール | 説明 | 編集権限 |
|--------|------|----------|
| Owner | 所有者 | ✅ |
| Member | メンバー | ✅ |
| Viewer | 閲覧者 | ❌ |
```

### 5.2 使用可能なコンポーネント

| コンポーネント | 用途 | 例 |
|----------------|------|-----|
| `<Callout type="info\|warning\|tip">` | 注意書き | 補足情報、警告、ヒント |
| `<ImageWithCaption>` | 画像 | スクリーンショット、図解 |
| `<ZoomableImage>` | 拡大画像 | 詳細なUI説明 |
| `<StepImage>` | ステップ画像 | チュートリアル |
| `<VideoDemo>` | 動画 | 操作デモ |
| `<KeyboardShortcut keys={['Cmd', 'K']}>` | ショートカット | キーボード操作説明 |

---

## 6. 画像ガイドライン

### 6.1 ファイル形式

- **WebP推奨**: 高圧縮・高品質
- 透過が必要な場合: PNG
- アニメーション: GIF または MP4

### 6.2 サイズ

- 幅: 最大1600px（表示は800px程度にリサイズ）
- ファイルサイズ: 200KB以下を目標

### 6.3 命名規則

```
/help/images/
├── dashboard-overview.webp      # 機能概要
├── create-workspace-step1.webp  # ステップ1
├── create-workspace-step2.webp  # ステップ2
└── error-message-example.webp   # エラー例
```

---

## 7. テスト項目

| テスト | 内容 |
|--------|------|
| 検索機能 | 日本語キーワードでの検索が正常に動作する |
| 画像表示 | 画像が最適化されて表示される |
| テーブル | テーブルが正しくスタイリングされる |
| レスポンシブ | モバイルでも読みやすく表示される |
| ナビゲーション | 目次からの遷移が正常に動作する |
| キーボード | Cmd+K で検索モーダルが開く |

---

## 8. 今後の拡張

| 機能 | 説明 | 優先度 |
|------|------|--------|
| 多言語対応 | `content/help/en/` ディレクトリ追加 | 中 |
| バージョン管理 | リリースノートの統合 | 低 |
| フィードバック | 「この記事は役に立ちましたか？」ボタン | 低 |
| 関連記事 | 記事末尾に関連ヘルプを自動表示 | 低 |

---

## 9. 移行チェックリスト

- [ ] 依存パッケージのインストール
- [ ] `next.config.ts` の更新
- [ ] MDXコンポーネント作成
- [ ] 検索インデックス生成スクリプト作成
- [ ] ヘルプページ（layout, page, [slug]）作成
- [ ] 既存Markdownの移行
- [ ] 画像ファイルの配置
- [ ] シードコードの削除
- [ ] ナビゲーションへのヘルプリンク追加
- [ ] 動作確認テスト
