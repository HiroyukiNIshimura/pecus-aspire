# Pecus Aspire — フロントエンド補助指示（差分のみ）

> 共通ルール・禁止事項はルートの `CLAUDE.md` を最優先で参照。
> このファイルは `pecus.Frontend` 向けの**差分ルールのみ**を記載する。

### メタ情報
- Scope: `pecus.Frontend/**/*.ts, pecus.Frontend/**/*.tsx`
- Depends On: `CLAUDE.md`（ルート）
- Details Source: `docs/frontend-guidelines.md`

### フロントエンド差分ルール（要点）
- SSR-first。読み取りは Server Component、変更は Server Actions（`src/actions/`）
- API 呼び出しは `createPecusApiClients()` 経由（WebApi 直 fetch 禁止）
- トークン管理は `ServerSessionManager.getValidAccessToken()` を利用
- UI は Tailwind CSS + FlyonUI（daisyUI 禁止、アイコンは `@iconify/tailwind4`）
- レイアウトは `h-screen` / `min-h-screen` を避け、`flex-1` を使用
- Tailwind 任意値（例: `z-[10]`, `w-[200px]`）を使用しない
- ページ全体を不用意に `"use client"` にしない

### 実装時の参照先（必読）
- `docs/frontend-guidelines.md`（先頭の「AI エージェント向け要約」）
- `docs/ssr-design-guidelines.md`
- `docs/layout-template.md`
- `docs/tailwind-arbitrary-values.md`
- `docs/modal-dialog-template.md`
