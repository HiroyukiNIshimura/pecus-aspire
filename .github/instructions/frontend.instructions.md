---
applyTo: "pecus.Frontend/**/*.ts, pecus.Frontend/**/*.tsx"
---
## Pecus Aspire — フロントエンド補助指示（差分のみ）

> 共通ルール・禁止事項は `.github/copilot-instructions.md` を最優先で参照。
> このファイルは `pecus.Frontend` 向けの**差分ルールのみ**を記載する。
> 参照先ドキュメントとこのファイルの内容が矛盾する場合は、`.github/copilot-instructions.md` を優先し、次にこのファイルの差分ルールに従う。

### メタ情報
- Scope: `pecus.Frontend/**/*.ts, pecus.Frontend/**/*.tsx`
- Depends On: `.github/copilot-instructions.md`
- Details Source: `docs/frontend-guidelines.md`

### フロントエンド差分ルール（要点）
- SSR-first。読み取りは Server Component、変更は Server Actions（`src/actions/`）
- API 呼び出しは `createPecusApiClients()` 経由（WebApi 直 fetch 禁止）
- トークン管理は `ServerSessionManager.getValidAccessToken()` を利用
- UI は Tailwind CSS + FlyonUI（daisyUI 禁止、アイコンは `@iconify/tailwind4`）
- レイアウトは `h-screen` / `min-h-screen` を避け、`flex-1` を使用
- Tailwind 任意値（例: `z-[10]`, `w-[200px]`）を使用しない
- 「use client」はインタラクティブなUI部分（イベントハンドラ、useState等を使う末端コンポーネント）にのみ付与し、ページ全体やレイアウトコンポーネントには付与しない。

### 実装時の参照先（必読）
- `docs/frontend-guidelines.md`（先頭の「AI エージェント向け要約」）
- `docs/ssr-design-guidelines.md`
- `docs/layout-template.md`
- `docs/tailwind-arbitrary-values.md`
- `docs/modal-dialog-template.md`

複数の参照ドキュメント間で内容が矛盾する場合は、`docs/frontend-guidelines.md` の記載を優先する。

## コード修正時のゴール
- [] 実装が SSR-first の原則に従っていること
- [] 型チェックで警告がないこと
- [] ビルドが成功すること
- [] 修正対象ページが正しく表示されること
- [] 型チェックまたはビルドが失敗した場合は、エラー内容を修正してから再実行し、解決できない場合はその旨を報告すること
- [] 必要に応じて `localhost-debug-browser` スキルを使用し、統合ブラウザでログイン後の画面表示と対象操作を確認すること。実施できない場合は、未実施の理由を報告すること

