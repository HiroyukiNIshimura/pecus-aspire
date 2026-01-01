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

## 決定事項（レビュー後に記載）

- [ ] パッケージ分離を実施するか
- [ ] パッケージ名: `@coati/editor` で良いか
- [ ] ビルド戦略: ビルド済み dist をコミットする方式で良いか
- [ ] 移行時期: いつ実施するか
