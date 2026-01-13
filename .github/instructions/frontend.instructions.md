---
applyTo: "pecus.Frontend/**/*.ts, pecus.Frontend/**/*.tsx"
---
## Pecus Aspire — AI エージェント最小指示書（フロントエンド用）

### 概要
この指示書は TypeScript/Next.js フロントエンドプロジェクト（`pecus.Frontend`）に適用されます。

### 最優先事項
- 日本的なダサいセキュリティ・排他・リトライ・UI/UX 禁止
- SSR-first。読み取りは Server Component、書き込みは Server Actions（`src/actions/`）

### 絶対禁止事項
- API クライアント生成（`npm run full:api`）の実行禁止
- フロントからの WebApi 直 fetch 禁止（Server Actions / API Routes 経由のみ許可）
- 自動生成ファイルの手動編集禁止（`PecusApiClient.generated.ts` 等）
- 横断変更の無断実施禁止
- リファクタリング時の業務ロジック変更禁止

### 重要パターン
- APIアクセス: SSR（Server Component）/SA（Server Actions）とも `createPecusApiClients()` 経由
- トークン: `ServerSessionManager.getValidAccessToken()` で自動リフレッシュ
- UI: Tailwind CSS + FlyonUI。daisyUI 禁止。アイコンは `@iconify/tailwind4`
- UI禁止事項: Tailwind任意値（`z-[10]`, `w-[200px]`）、`h-screen`/`min-h-screen`（`flex-1` を使用）
- SSR/Client Component使い分け: `useState`/`useEffect`/`onClick` 必要時のみ Client Component
- ページ全体を "use client" にしない

### 参照ドキュメント
- `docs/frontend-guidelines.md`
- `docs/ssr-design-guidelines.md`
- `docs/layout-template.md`
- `docs/tailwind-arbitrary-values.md`
- `docs/modal-dialog-template.md`

### 禁止事項まとめ
- API直叩き禁止（フロントエンドからWebApiへ直接fetch禁止）
- クライアント側でAPI呼び出し禁止
- DTO/型安全・検証属性の未設定禁止
- Enumはnullable推奨、HasDefaultValue禁止
- 複数プロジェクト横断変更は必ず目的・影響・差分を明示し、承認を得ること
- CSSセマンティックカラー: ❌-ghost, ✅-secondary

---

詳細は `docs/frontend-guidelines.md` 先頭のAI向け要約を必ず参照。
