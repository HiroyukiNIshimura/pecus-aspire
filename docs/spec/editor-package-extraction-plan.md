# エディタパッケージ分離計画

## 概要

`pecus.Frontend/src/components/editor` を独立したパッケージ `@coati/editor` として切り出し、モノレポ構成で管理する計画。

**目的:**
- エディタコアの再利用性向上
- 関心の分離（汎用エディタ vs Pecus固有拡張）
- 将来的な外部公開の可能性
- 本番環境ビルドスピードの向上

---

## 現在の構成

```
pecus.Frontend/src/components/editor/
├── index.ts
├── core/           # 汎用エディタコア
├── nodes/          # カスタムノード
├── plugins/        # プラグイン
├── themes/         # テーマ
├── types/          # 型定義
├── ui/             # UIコンポーネント
├── utils/          # ユーティリティ
├── hooks/          # カスタムフック
├── images/         # 画像アセット
├── context/        # Context
└── pecus/          # Pecus固有の拡張
```

---

## 提案するモノレポ構成

### ディレクトリ構造

```
pecus-aspire/
├── package.json              # ルート（ワークスペース定義）
├── package-lock.json         # 新規生成
├── packages/
│   └── coati-editor/         # エディタパッケージ（新規）
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsup.config.ts
│       ├── src/
│       │   ├── index.ts
│       │   ├── core/
│       │   ├── nodes/
│       │   ├── plugins/
│       │   ├── themes/
│       │   ├── types/
│       │   ├── ui/
│       │   ├── utils/
│       │   ├── hooks/
│       │   ├── images/
│       │   └── context/
│       └── dist/             # ビルド済み（Gitにコミット）
├── pecus.Frontend/
│   ├── package.json
│   └── src/
│       └── components/
│           └── editor/       # Pecus固有の拡張のみ残す
│               └── pecus/
└── ...
```

### ルート `package.json`

```json
{
  "name": "pecus-aspire",
  "private": true,
  "workspaces": [
    "packages/*",
    "pecus.Frontend",
    "pecus.LexicalConverter"
  ],
  "dependencies": {
    "jsdom": "^27.0.1"
  },
  "devDependencies": {
    "@types/jsdom": "^27.0.0"
  }
}
```

### エディタパッケージ `packages/coati-editor/package.json`

```json
{
  "name": "@coati/editor",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles.css"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "@lexical/clipboard": "0.39.0",
    "@lexical/code": "0.39.0",
    "@lexical/code-shiki": "0.39.0",
    "@lexical/extension": "^0.39.0",
    "@lexical/file": "0.39.0",
    "@lexical/hashtag": "0.39.0",
    "@lexical/link": "0.39.0",
    "@lexical/list": "0.39.0",
    "@lexical/mark": "0.39.0",
    "@lexical/overflow": "0.39.0",
    "@lexical/plain-text": "0.39.0",
    "@lexical/react": "^0.39.0",
    "@lexical/rich-text": "0.39.0",
    "@lexical/selection": "0.39.0",
    "@lexical/table": "0.39.0",
    "@lexical/tailwind": "^0.39.0",
    "@lexical/utils": "0.39.0",
    "lexical": "^0.39.0",
    "katex": "^0.16.27"
  },
  "devDependencies": {
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "tsup": "^8.5.0",
    "typescript": "^5.8.3"
  }
}
```

---

## ビルド戦略

### 採用案：ビルド済み `dist/` をリポジトリにコミット

Docker ビルド時にパッケージのビルドを行わず、事前ビルド済みの `dist/` を使用する。

**理由:**
- Docker ビルド時間の短縮
- CI/CD パイプラインのシンプル化
- 本番環境でのビルド失敗リスク排除

### `.gitignore` 設定

```gitignore
# ビルド成果物は通常除外
dist/

# ただしエディタパッケージの dist はコミット対象
!packages/coati-editor/dist/
```

### 開発フロー

```
┌─────────────────────────────────────────────────────────────┐
│  開発者がエディタを変更した場合                              │
│                                                             │
│  1. packages/coati-editor/src/ を編集                       │
│  2. npm run build -w @coati/editor を実行                   │
│  3. dist/ の変更も一緒にコミット                            │
└─────────────────────────────────────────────────────────────┘
```

---

## フロントエンドからの参照方法

### `pecus.Frontend/package.json`

```json
{
  "dependencies": {
    "@coati/editor": "workspace:*"
  }
}
```

### インポート方法

**変更前:**
```tsx
import { PecusNotionLikeEditor } from '@/components/editor';
```

**変更後:**
```tsx
// 汎用エディタコア（パッケージから）
import { Editor, NotionLikeEditor, NotionLikeViewer } from '@coati/editor';
import '@coati/editor/styles';

// Pecus固有の拡張（ローカル）
import { PecusNotionLikeEditor } from '@/components/editor/pecus';
```

### `next.config.ts` 設定

```typescript
const nextConfig: NextConfig = {
  transpilePackages: ['@coati/editor'],
};
```

---

## Docker / デプロイへの影響

### 変更が必要なファイル

| ファイル | 変更内容 |
|----------|----------|
| `deploy/dockerfiles/Frontend.Dockerfile` | モノレポ構成に対応 |
| `package.json`（ルート） | `workspaces` 設定追加 |
| `package-lock.json`（ルート） | 新規生成 |
| `.gitignore` | `dist/` の例外設定 |

### 変更不要なファイル

| ファイル | 理由 |
|----------|------|
| `deploy-bluegreen/docker-compose.app-blue.yml` | 既に `context: ..` を使用 |
| `deploy-bluegreen/docker-compose.app-green.yml` | 既に `context: ..` を使用 |
| `deploy/docker-compose.yml` | 既に `context: ..` を使用 |

### 更新後の `Frontend.Dockerfile`

```dockerfile
# ============================================
# pecus.Frontend Dockerfile (Next.js) - モノレポ対応版（ビルド済みパッケージ使用）
# ============================================

FROM node:22-alpine AS base
WORKDIR /app

# ============================================
# Dependencies stage
# ============================================
FROM base AS deps
RUN apk add --no-cache libc6-compat

# ルートのワークスペース設定をコピー
COPY package.json package-lock.json ./

# エディタパッケージ（ビルド済み dist を含む）
COPY packages/coati-editor/package.json ./packages/coati-editor/
COPY packages/coati-editor/dist ./packages/coati-editor/dist

# フロントエンドの package.json をコピー
COPY pecus.Frontend/package.json ./pecus.Frontend/

# ワークスペース全体の依存関係をインストール
RUN npm ci --loglevel verbose

# ============================================
# Build stage
# ============================================
FROM base AS builder
WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/pecus.Frontend/node_modules ./pecus.Frontend/node_modules

# フロントエンドのソースをコピー
COPY pecus.Frontend/ ./pecus.Frontend/

# Build arguments for public env vars
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build-time dummy values for SSR pages that check env vars
ENV ConnectionStrings__redisFrontend="localhost:6379"
ENV PECUS_API_URL="http://localhost:5000"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="build-time-dummy-secret"

# Build Next.js application
WORKDIR /app/pecus.Frontend
RUN npm run build

# ============================================
# Production stage
# ============================================
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Set timezone to JST
ENV TZ=Asia/Tokyo
RUN apk add --no-cache tzdata && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/pecus.Frontend/public ./public

# Create .next directory with proper permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/pecus.Frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/pecus.Frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

## ビルド忘れ防止策

### 推奨：CI でのチェック

```yaml
# GitHub Actions 例
- name: Check editor build is up to date
  run: |
    npm run build -w @coati/editor
    git diff --exit-code packages/coati-editor/dist/
```

### 代替案：pre-commit フック

```bash
#!/bin/bash
# .husky/pre-commit

if git diff --cached --name-only | grep -q "^packages/coati-editor/src/"; then
  if ! git diff --cached --name-only | grep -q "^packages/coati-editor/dist/"; then
    echo "Error: packages/coati-editor/src/ が変更されていますが、dist/ が更新されていません。"
    echo "npm run build -w @coati/editor を実行してください。"
    exit 1
  fi
fi
```

---

## メリット・デメリット

### メリット

- **関心の分離**: 汎用エディタと Pecus 固有ロジックが明確に分離される
- **再利用性**: 将来的に他プロジェクトでエディタを再利用可能
- **Docker ビルド高速化**: ビルド済み dist を使用することで時間短縮
- **型安全性**: パッケージとして型定義が明確になる

### デメリット

- **Git リポジトリサイズ増加**: `dist/` をコミットするため
- **ビルド忘れリスク**: 開発者がビルドを忘れる可能性（CI チェックで軽減）
- **初期セットアップコスト**: モノレポ構成への移行作業が必要

---

## 移行手順（実施する場合）

1. **`packages/coati-editor/` ディレクトリを作成**
2. **`pecus.Frontend/src/components/editor` から汎用部分を移動**
   - `core/`, `nodes/`, `plugins/`, `themes/`, `types/`, `ui/`, `utils/`, `hooks/`, `images/`, `context/`
3. **`pecus/` ディレクトリは `pecus.Frontend` に残す**
4. **パッケージの `package.json`, `tsconfig.json`, `tsup.config.ts` を作成**
5. **ルート `package.json` に `workspaces` を追加**
6. **`npm install` を実行**（ワークスペースリンク作成）
7. **`npm run build -w @coati/editor`** でパッケージをビルド
8. **`dist/` をコミット**
9. **フロントエンドのインポートパスを更新**
10. **`next.config.ts` に `transpilePackages` を追加**
11. **Tailwind CSS の `content` 設定を更新**（後述）
12. **CSS インポート順を調整**（後述）
13. **Dockerfile を更新**
14. **CI にビルドチェックを追加**

---

## Tailwind CSS / FlyonUI 連携設定（必須）

### Tailwind CSS の `content` 設定

パッケージ側の Tailwind クラスがビルド時に含まれるよう、`pecus.Frontend/tailwind.config.ts` の `content` にパッケージのパスを追加する必要があります。

```typescript
// pecus.Frontend/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    // エディタパッケージのソースを追加
    '../packages/coati-editor/src/**/*.{ts,tsx}',
  ],
  // ...existing code...
};

export default config;
```

**注意:** `dist/` ではなく `src/` を指定してください。Tailwind はソースコードからクラス名を抽出します。

### CSS インポート順（FlyonUI との連携）

エディタのスタイルが FlyonUI に依存している場合、CSS のインポート順に注意が必要です。

**`pecus.Frontend/src/app/globals.css` または該当するレイアウトファイル:**

```css
/* 1. Tailwind ベース */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 2. FlyonUI スタイル（先に読み込む） */
@import 'flyonui/flyonui';

/* 3. エディタスタイル（FlyonUI の後に読み込む） */
@import '@coati/editor/styles';

/* 4. アプリ固有のカスタムスタイル */
```

**または、レイアウトコンポーネントで:**

```tsx
// pecus.Frontend/src/app/layout.tsx
import 'flyonui/flyonui.css';        // FlyonUI を先に
import '@coati/editor/styles';        // エディタスタイルを後に
import './globals.css';               // アプリ固有のスタイル
```

### エディタパッケージ内での注意事項

エディタパッケージ内では FlyonUI のクラスを直接使用しないでください。FlyonUI に依存するスタイリングは以下の方針で対応します：

1. **汎用的なスタイル**: Tailwind のユーティリティクラスのみ使用
2. **FlyonUI 依存のスタイル**: `pecus.Frontend/src/components/editor/pecus/` 側で適用
3. **CSS 変数の活用**: 色やサイズは CSS 変数で定義し、FlyonUI のテーマと統合

---

## `pecus.LexicalConverter` への影響と改善点

### 現状の問題：ノード定義の重複

現在、カスタムノードが2箇所で重複定義されています：

```
┌─────────────────────────────────────────────────────────────┐
│  現在の構成（ノード定義が重複）                              │
│                                                             │
│  pecus.Frontend/src/components/editor/nodes/               │
│    └── ImageNode.ts  （React コンポーネント付き）           │
│    └── MentionNode.ts                                      │
│    └── ...                                                 │
│                                                             │
│  pecus.LexicalConverter/src/lexical/nodes/                 │
│    └── ImageNode.ts  （ヘッドレス用、コピー＆簡略化）       │
│    └── MentionNode.ts                                      │
│    └── ...                                                 │
│                                                             │
│  問題：ノードのシリアライズ/デシリアライズロジックが        │
│        2箇所で維持され、同期が困難                          │
└─────────────────────────────────────────────────────────────┘
```

### 改善案：ノード定義を共有パッケージに

```
┌─────────────────────────────────────────────────────────────┐
│  改善後の構成                                               │
│                                                             │
│  packages/coati-editor/                                    │
│    └── src/                                                │
│        └── nodes/                                          │
│            └── ImageNode.ts      （コア定義）              │
│            └── MentionNode.ts                              │
│            └── index.ts          （ノードのみエクスポート）│
│        └── react/                                          │
│            └── ImageComponent.tsx （React UI のみ）        │
│                                                             │
│  pecus.Frontend/                                           │
│    └── @coati/editor からインポート                        │
│                                                             │
│  pecus.LexicalConverter/                                   │
│    └── @coati/editor からインポート（React 不要部分のみ）  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 具体的なメリット

| 項目 | 現状 | 改善後 |
|------|------|--------|
| **ノード定義の重複** | 2箇所で維持が必要 | 1箇所（`@coati/editor`） |
| **同期漏れリスク** | 高い | なし |
| **新ノード追加** | 2ファイル修正必要 | 1ファイルで完結 |
| **型の一貫性** | 手動で同期 | 自動的に一致 |
| **Markdown Transformer** | 別々に定義 | 共有可能 |

### パッケージ構成の拡張案

複数のエントリポイントを提供し、React 依存部分と非依存部分を分離：

```json
{
  "name": "@coati/editor",
  "version": "0.1.0",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./nodes": {
      "import": "./dist/nodes.mjs",
      "require": "./dist/nodes.js",
      "types": "./dist/nodes.d.ts"
    },
    "./transformers": {
      "import": "./dist/transformers.mjs",
      "require": "./dist/transformers.js",
      "types": "./dist/transformers.d.ts"
    },
    "./styles": "./dist/styles.css"
  }
}
```

### `pecus.LexicalConverter` からの利用

```typescript
// 現在: ローカルにコピーしたノード定義を使用
import { CustomNodes } from './nodes';
import { PLAYGROUND_TRANSFORMERS } from './transformers/markdown-transformers';

// 改善後: 共有パッケージから直接インポート
import { CustomNodes } from '@coati/editor/nodes';
import { PLAYGROUND_TRANSFORMERS } from '@coati/editor/transformers';
```

### `pecus.LexicalConverter/package.json` の更新

```json
{
  "dependencies": {
    "@coati/editor": "workspace:*"
  }
}
```

---

## `LexicalConverter.Dockerfile` への影響

`pecus.LexicalConverter` も同じパッケージを参照するため、Dockerfile の更新が必要です。

### 更新後の `deploy/dockerfiles/LexicalConverter.Dockerfile`

```dockerfile
# ============================================
# pecus.LexicalConverter Dockerfile - モノレポ対応版
# ============================================

FROM node:22-alpine AS base
WORKDIR /app

# ============================================
# Dependencies stage
# ============================================
FROM base AS deps
RUN apk add --no-cache libc6-compat

# ルートのワークスペース設定をコピー
COPY package.json package-lock.json ./

# エディタパッケージ（ビルド済み dist を含む）
COPY packages/coati-editor/package.json ./packages/coati-editor/
COPY packages/coati-editor/dist ./packages/coati-editor/dist

# LexicalConverter の package.json をコピー
COPY pecus.LexicalConverter/package.json ./pecus.LexicalConverter/

# ワークスペース全体の依存関係をインストール
RUN npm ci --workspace=pecus.LexicalConverter

# ============================================
# Build stage
# ============================================
FROM base AS builder
WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/pecus.LexicalConverter/node_modules ./pecus.LexicalConverter/node_modules

# LexicalConverter のソースをコピー
COPY pecus.LexicalConverter/ ./pecus.LexicalConverter/

# Build
WORKDIR /app/pecus.LexicalConverter
RUN npm run build

# ============================================
# Production stage
# ============================================
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# ...以下、既存の production stage と同様
```

---

## 変更が必要なファイル（更新版）

| ファイル | 変更内容 |
|----------|----------|
| `deploy/dockerfiles/Frontend.Dockerfile` | モノレポ構成に対応 |
| `deploy/dockerfiles/LexicalConverter.Dockerfile` | モノレポ構成に対応（追加） |
| `package.json`（ルート） | `workspaces` 設定追加 |
| `package-lock.json`（ルート） | 新規生成 |
| `pecus.LexicalConverter/package.json` | `@coati/editor` 依存追加（追加） |
| `pecus.LexicalConverter/src/lexical/nodes/` | 削除可能（追加） |
| `.gitignore` | `dist/` の例外設定 |

---

## 実装計画

### Phase 1: 準備（所要時間: 1時間）

#### 1.1 現状の依存関係を整理
- [ ] `pecus.Frontend/src/components/editor` の全ファイルをリストアップ
- [ ] 各ファイルの依存関係（FlyonUI、Pecus固有ロジック等）を特定
- [ ] `pecus.LexicalConverter/src/lexical/nodes` との差分を確認

#### 1.2 分類
以下の基準でファイルを分類：

| 分類 | 移動先 | 基準 |
|------|--------|------|
| **汎用コア** | `packages/coati-editor/src/` | Lexical コア、汎用ノード、汎用プラグイン |
| **Pecus 固有** | `pecus.Frontend/src/components/editor/pecus/` | 画像アップロード、AI機能、メンション等 |

---

### Phase 2: パッケージ作成（所要時間: 2時間）

#### 2.1 ディレクトリ構造の作成
```bash
mkdir -p packages/coati-editor/src/{core,nodes,plugins,themes,types,ui,utils,hooks,context,transformers}
```

#### 2.2 設定ファイルの作成
- [ ] `packages/coati-editor/package.json`
- [ ] `packages/coati-editor/tsconfig.json`
- [ ] `packages/coati-editor/tsup.config.ts`
- [ ] `packages/coati-editor/biome.json`（リンター設定）

#### 2.3 ルート `package.json` の更新
- [ ] `workspaces` 設定を追加

---

### Phase 3: コード移行（所要時間: 4-6時間）

#### 3.1 汎用コードの移行
以下を `packages/coati-editor/src/` に移動：

```
pecus.Frontend/src/components/editor/
├── core/           → packages/coati-editor/src/core/
├── nodes/          → packages/coati-editor/src/nodes/
├── plugins/        → packages/coati-editor/src/plugins/
├── themes/         → packages/coati-editor/src/themes/
├── types/          → packages/coati-editor/src/types/
├── ui/             → packages/coati-editor/src/ui/
├── utils/          → packages/coati-editor/src/utils/
├── hooks/          → packages/coati-editor/src/hooks/
├── context/        → packages/coati-editor/src/context/
└── images/         → packages/coati-editor/src/images/
```

#### 3.2 FlyonUI 依存の分離
- [ ] FlyonUI クラスを使用しているコンポーネントを特定
- [ ] CSS 変数またはプロップスで外部からスタイルを注入できるよう修正
- [ ] 必要に応じて `pecus/` 側にラッパーコンポーネントを作成

#### 3.3 エクスポートの整理
- [ ] `packages/coati-editor/src/index.ts` 作成（メインエントリ）
- [ ] `packages/coati-editor/src/nodes/index.ts` 作成（ノード専用エントリ）
- [ ] `packages/coati-editor/src/transformers/index.ts` 作成（Transformer専用エントリ）

---

### Phase 4: ビルド設定と検証（所要時間: 1-2時間）

#### 4.1 パッケージのビルド
```bash
cd packages/coati-editor
npm run build
```

#### 4.2 `dist/` の確認
- [ ] `dist/index.js`, `dist/index.mjs`, `dist/index.d.ts` が生成されること
- [ ] `dist/nodes.js`, `dist/transformers.js` が生成されること
- [ ] 型定義が正しくエクスポートされていること

#### 4.3 `dist/` をコミット
- [ ] `.gitignore` に例外設定を追加
- [ ] `git add packages/coati-editor/dist`

---

### Phase 5: フロントエンド統合（所要時間: 2-3時間）

#### 5.1 依存関係の更新
```bash
cd pecus.Frontend
npm install
```

#### 5.2 インポートパスの更新
- [ ] `@/components/editor` → `@coati/editor` に変更
- [ ] Pecus 固有のインポートは `@/components/editor/pecus` に変更

#### 5.3 設定ファイルの更新
- [ ] `next.config.ts` に `transpilePackages: ['@coati/editor']` を追加
- [ ] `tailwind.config.ts` の `content` に `../packages/coati-editor/src/**/*.{ts,tsx}` を追加

#### 5.4 CSS インポート順の調整
- [ ] `globals.css` または `layout.tsx` でインポート順を確認

#### 5.5 動作確認
```bash
npm run dev
# エディタの全機能をテスト
```

---

### Phase 6: LexicalConverter 統合（所要時間: 1-2時間）

#### 6.1 依存関係の更新
- [ ] `pecus.LexicalConverter/package.json` に `@coati/editor: workspace:*` を追加

#### 6.2 重複コードの削除
- [ ] `pecus.LexicalConverter/src/lexical/nodes/` を削除
- [ ] インポートを `@coati/editor/nodes` に変更

#### 6.3 動作確認
```bash
cd pecus.LexicalConverter
npm run build
npm run test  # テストがあれば実行
```

---

### Phase 7: Docker / デプロイ対応（所要時間: 1-2時間）

#### 7.1 Dockerfile の更新
- [ ] `deploy/dockerfiles/Frontend.Dockerfile` を更新
- [ ] `deploy/dockerfiles/LexicalConverter.Dockerfile` を更新

#### 7.2 ローカル Docker ビルドテスト
```bash
docker build -f deploy/dockerfiles/Frontend.Dockerfile -t pecus-frontend-test .
docker build -f deploy/dockerfiles/LexicalConverter.Dockerfile -t pecus-lexical-test .
```

#### 7.3 Blue-Green デプロイ設定の確認
- [ ] `deploy-bluegreen/` の設定に変更が不要なことを確認

---

### Phase 8: CI/CD 対応（所要時間: 30分）

#### 8.1 ビルドチェックの追加
GitHub Actions または CI に以下を追加：

```yaml
- name: Check editor build is up to date
  run: |
    npm run build -w @coati/editor
    git diff --exit-code packages/coati-editor/dist/
```

#### 8.2 ワークフローの更新
- [ ] 既存の CI ワークフローがモノレポ構成で動作することを確認

---

### Phase 9: クリーンアップと文書化（所要時間: 1時間）

#### 9.1 不要ファイルの削除
- [ ] 移行完了後、元の `pecus.Frontend/src/components/editor/` から移行済みファイルを削除
- [ ] `pecus.LexicalConverter` の重複ノード定義を削除

#### 9.2 README の更新
- [ ] `packages/coati-editor/README.md` 作成
- [ ] ルート `README.md` にモノレポ構成の説明を追加

#### 9.3 開発ガイドの更新
- [ ] `docs/frontend-guidelines.md` にエディタパッケージの使い方を追記

---

## 実装順序（推奨）

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9
  準備      作成      移行      ビルド    Frontend   Converter   Docker     CI       完了
  1h        2h       4-6h      1-2h      2-3h       1-2h        1-2h      30m       1h

                              合計: 14-20時間（2-3日）
```

---

## リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| **FlyonUI 依存の見落とし** | ビルドエラー、スタイル崩れ | Phase 3.2 で徹底的に分離 |
| **インポートパス変更漏れ** | ランタイムエラー | TypeScript の型チェックで検出 |
| **Docker ビルド失敗** | デプロイ不可 | Phase 7.2 でローカルテスト必須 |
| **LexicalConverter の互換性** | Markdown 変換の不具合 | Phase 6.3 でテスト実行 |

---

## ロールバック計画

問題が発生した場合：

1. **Git revert**: 全変更を1コミットにまとめ、必要に応じて revert
2. **ブランチ戦略**: `feature/editor-package-extraction` ブランチで作業し、完了後に main へマージ
3. **段階的リリース**: Phase 5 完了時点で一度デプロイし、問題がなければ Phase 6 以降を進める

---

## 決定事項（レビュー後に記載）

- [x] パッケージ分離を実施するか → **実施決定**
- [x] パッケージ名: `@coati/editor` で良いか → **承認**
- [x] ビルド戦略: ビルド済み dist をコミットする方式で良いか → **承認**
- [x] `pecus.LexicalConverter` のノード定義も共有化するか → **実施完了**（Lexical 0.39.0 にアップグレード）
- [x] 移行時期: いつ実施するか → **2026-01-01 開始**

---

## 実装状況

### 完了済みフェーズ

#### Phase 1: 準備 ✅
- [x] `pecus.Frontend/src/components/editor` の全ファイルをリストアップ
- [x] 各ファイルの依存関係（FlyonUI、Pecus固有ロジック等）を特定
- [x] `pecus.LexicalConverter/src/lexical/nodes` との差分を確認

#### Phase 2: パッケージ作成 ✅
- [x] `packages/coati-editor/package.json` 作成
- [x] `packages/coati-editor/tsconfig.json` 作成
- [x] `packages/coati-editor/tsup.config.ts` 作成
- [x] `packages/coati-editor/biome.json` 作成
- [x] ルート `package.json` に `workspaces` 設定追加

#### Phase 3: コード移行 ✅
- [x] core, nodes, plugins, themes, types, ui, utils, hooks, context, images を移行
- [x] AiAssistantPlugin を除外（Pecus固有）
- [x] インポートパスを相対パスに変更
- [x] CSS の url() パスを修正

#### Phase 4: ビルド検証 ✅
- [x] `npm run build` 成功
- [x] CJS, ESM, DTS すべて生成
- [x] 型定義ファイル生成確認
- [x] `dist/` を Git にコミット（Docker ビルド高速化のため）

#### Phase 5: Frontend 統合 ✅
- [x] `pecus.Frontend/package.json` に `@coati/editor: "*"` 追加
- [x] `pecus.Frontend/src/components/editor/index.ts` を `@coati/editor` からの再エクスポートに変更
- [x] `pecus.Frontend/src/components/editor/pecus/` のコンポーネントを `@coati/editor` を使用するよう更新
- [x] `pecus.Frontend/src/components/help/HelpContent.tsx` を `@coati/editor` からインポートするよう変更
- [x] 旧コード（core, nodes, plugins, themes, types, ui, utils, context, images）を削除
- [x] 型チェック成功
- [x] lint 成功

#### Phase 6: LexicalConverter 統合 ✅
- [x] Lexical バージョンを 0.39.0 にアップグレード
- [x] `pecus.LexicalConverter/package.json` に `@coati/editor: "*"` を追加
- [x] `pecus.LexicalConverter/src/lexical/nodes/index.ts` を `@coati/editor` からの再エクスポートに変更
- [x] `pecus.LexicalConverter/src/lexical/transformers/markdown-transformers.ts` のインポートを更新
- [x] 重複ノードファイル（18ファイル）を削除
- [x] ビルド成功確認

#### Phase 7: Docker / デプロイ対応 ✅
- [x] `deploy/dockerfiles/Frontend.Dockerfile` を更新（ビルド済み dist を使用）
- [x] `deploy/dockerfiles/LexicalConverter.Dockerfile` を更新（ビルド済み dist を使用）
- [x] `.gitignore` に `!packages/coati-editor/dist/` を追加
- [x] Blue-Green デプロイで動作確認完了（2026-01-02）

### 未実施フェーズ

#### Phase 8: CI/CD 対応
- [ ] ビルドチェックを追加（`npm run build -w @coati/editor && git diff --exit-code packages/coati-editor/dist/`）

#### Phase 9: クリーンアップと文書化
- [ ] `packages/coati-editor/README.md` 作成
- [ ] ルート `README.md` にモノレポ構成の説明を追加
- [ ] `docs/frontend-guidelines.md` にエディタパッケージの使い方を追記
