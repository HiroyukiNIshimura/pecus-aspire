## Pecus Aspire — AI エージェント最小指示書

メタ情報
- 版: v1.3
- 更新日: 2026-01-10
- 文書責任: Pecus Aspire Maintainers

## 短い要約（エージェント向け / 必読）

このプロジェクトのコードは全てエージェントが自律的に生成しています。以下のルールに反する変更は禁止です。できないことは正直に「できない」と回答してください。

### 最優先事項
このアプリは一般公開されグローバルに使用されます。日本の業務アプリ常識のようなダサいセキュリティロジック、リトライによる一意情報の生成、排他制御、UI/UX を絶対に提案・実装しないでください。

### プロジェクト基本情報
- 開発コード: `pecus`、アプリケーション名: `Coati`
- エントリ: `pecus.AppHost/AppHost.cs`（Aspire がサービスの起動順・依存を管理）
- 主要プロジェクト: `pecus.WebApi`, `pecus.BackFire`, `pecus.DbManager`, `pecus.Libs`, `pecus.Frontend`
- 技術スタック: .NET 10 / EF Core 10 / .NET Aspire 13.1 / Next.js 16.1 / React 19.2 / Tailwind CSS 4.1 / FlyonUI 2.4

### 絶対禁止事項
- **API クライアント生成（`npm run full:api`）の実行禁止** — 人間の開発者のみが実行。必ず作業を中断して報告
- **フロントからの WebApi 直 fetch 禁止** — Server Actions / API Routes 経由のみ許可
- **自動生成ファイルの手動編集禁止** — `PecusApiClient.generated.ts` 等
- **コントローラーでのトランザクション開始禁止** — サービス層で `BeginTransactionAsync` を使用
- **横断変更の無断実施禁止** — 複数プロジェクトを触る場合は承認を得る
- **リファクタリング時の業務ロジック変更禁止** — 変更が必要な場合は報告

### 重要なパターン
- **RowVersion**: PostgreSQL `xmin` → C# `uint` → フロント `number`。実装参照: `pecus.Libs/DB/ApplicationDbContext.cs`
- **競合処理**: `DbUpdateConcurrencyException` を catch → `FindAsync()` で再取得 → `ConcurrencyException<T>` をスロー
- **フロント**: SSR-first。読み取りは Server Component、書き込みは Server Actions（`src/actions/`）
- **UI**: Tailwind CSS + FlyonUI。**daisyUI は禁止**。アイコンは `@iconify/tailwind4`
- **セッション**: Cookie に `sessionId` のみ（`httpOnly: true`）。トークンは Redis。`ServerSessionManager` 経由で取得
- **C#**: 原則「1ファイル=1クラス」。関連する複数の enum/record は1ファイル可
- **修正順序**: バックエンド → フロントエンドの順。バックエンド完了後にフロントエンド修正
- **コードコメント**: 連番禁止（例: // 1. ～）
- **シェルスクリプト**: POSIX準拠、`/bin/sh` で実行可能

## 統一方針

### バックエンド (C# / .NET)
- **コントローラー**: MVC コントローラー + `HttpResults`（`Ok<T>`, `Created<T>`, `NoContent`）。`IActionResult`/`ActionResult<T>` は不使用
- **例外処理**: 例外をスローして `GlobalExceptionFilter` に任せる。コントローラーで try-catch しない
- **競合制御**: `DbUpdateConcurrencyException` → `FindAsync()` → `ConcurrencyException<T>`。DTO は `RowVersion: uint` 必須
- **トランザクション**: サービス層で `BeginTransactionAsync`。コントローラーでは禁止
- **DTO**: 検証属性（`[Required]`, `[MaxLength]`）必須。Enum は nullable 推奨、`HasDefaultValue()` 禁止
- **Hangfire**: DI 経由の `IBackgroundJobClient` を使用。静的 API（`BackgroundJob.Enqueue`）は禁止

### フロントエンド (Next.js / TypeScript)
- **API アクセス**: 読み取り → SSR（Server Component）、変更 → Server Actions。いずれも `createPecusApiClients()` 経由
- **禁止**: ブラウザから WebApi 直 fetch、SA/SSR から直 fetch（リフレッシュ API のみ例外）
- **トークン**: `ServerSessionManager.getValidAccessToken()` が自動リフレッシュを実行
- **UI 禁止事項**: Tailwind 任意値（`z-[10]`, `w-[200px]`）、`h-screen`/`min-h-screen`（`flex-1` を使用）
- **自動生成**: `PecusApiClient.generated.ts` は編集禁止。Git 管理外

### SSR / Client Component 使い分け
- **Server Component**: 静的UI、初期データ取得（マスタデータ）、レイアウト
- **Client Component**: `useState`/`useEffect`/`onClick` が必要な場合のみ。末端コンポーネントとして切り出す
- **アンチパターン**: `page.tsx` 全体を `"use client"` にすること、トランザクションデータを SSR で取得すること

## 参照ドキュメント

詳細な実装ガイドラインは以下のドキュメントを参照してください。
**各ドキュメントの冒頭にある「AI エージェント向け要約（必読）」を必ず確認し、ルールを遵守してください。**

| カテゴリ | ドキュメント | 重要度 |
|---------|-------------|--------|
| **ビジョン** | `docs/spec/PRODUCT_VISION_PERSONAS_JA.md` | 必読 |
| **フロントエンド** | `docs/frontend-guidelines.md`, `docs/ssr-design-guidelines.md` | 必読 |
| **レイアウト** | `docs/layout-template.md` | 必読（変更前に必ず確認） |
| **バックエンド** | `docs/backend-guidelines.md`, `docs/global-exception-handling.md` | 必読 |
| **DB** | `docs/db-concurrency.md` | 必読 |
| **UI** | `docs/tailwind-arbitrary-values.md`, `docs/modal-dialog-template.md` | 必読 |
| **設定** | `docs/app-settings-provider.md` | 参照 |

## 開発フロー／コマンド

- バックエンド: `dotnet format pecus.sln` → `dotnet clean pecus.sln`→ `dotnet build pecus.sln` → `dotnet run --project pecus.AppHost`（エージェントの実行禁止）
- フロントエンド: `cd pecus.Frontend` → `npm run lint` → `npm run format` → `npx tsc --noEmit` → `npm run build`（エージェントの実行禁止） → `npm run dev`（エージェントの実行禁止）
- API クライアント生成: `npm run full:api`（エージェントの実行禁止）

## プロジェクト特有のルール（必ず守る）

- 横断変更禁止: 1 変更で複数プロジェクトを触る場合は目的・影響・差分を明記して承認を得る。
- フロントエンドから `pecus.WebApi` を直接叩かない（Server Actions / API Routes 経由）。
- DTO に検証属性（[Required] / [MaxLength] 等）を必ず付与し、API 互換性に注意する。
- Enum は nullable にする。`HasDefaultValue()` を使わない。
- トランザクションはサービス層で開始・管理する（コントローラーで開始しない）。

## すぐ参照すべきファイル（ショートリスト）

| ファイル | 説明 |
|---------|------|
| `pecus.AppHost/AppHost.cs` | Aspire サービス起動順・依存解決 |
| `pecus.Libs/DB/ApplicationDbContext.cs` | PostgreSQL `xmin` → `uint` マッピング |
| `pecus.WebApi/Filters/GlobalExceptionFilter.cs` | 例外 → HTTP ステータス変換 |
| `pecus.WebApi/Exceptions/ConcurrencyException.cs` | 競合例外定義 |
| `pecus.Frontend/src/libs/serverSession.ts` | Redis セッション管理 |
| `pecus.Frontend/src/actions/` | Server Actions 実装例 |

## 作業時のチェックリスト（短い）

1. 変更が跨プロジェクトか？ → README に承認フローを記載。
2. DTO の検証属性は揃っているか？ → `dotnet build` 前に確認。
3. 型生成物は手動編集していないか？ → 自動生成ファイルは .gitignore へ。

## ログファイル
- バックエンド: `pecus.WebApi/logs/最新日付けのログ`（Serilog ログ）
- バックグラウンドジョブ: `pecus.BackFire/logs/最新日付けのログ`
- フロントエンド: ブラウザの DevTools コンソール
- マイグレーション: `pecus.DbManager/logs/最新日付けのログ`
- マイクロサービス: コンソールにもログは出していません。各サービスのログ設定を参照してください。

## アンチパターン・禁止事項（**必ず遵守**）
- **コードやUIのリファクタリング時に業務ロジックを絶対に変更しない**変更が必要な場合は必ず報告し確認をとること（実装プラン上の最優先）
- **ページコンポーネントで h-screen / min-h-screen 禁止**（`flex-1` を使用。詳細は `docs/layout-template.md` 参照）
- **レイアウト構造を変更する前に必ず `docs/layout-template.md` を確認すること**
- **サービス間の直接参照禁止**（C#：共通ライブラリはLibs、Nodejs共通ライブラリはpackagesへ）
- **型宣言の重複定義禁止**（DTO/リクエスト・レスポンス型は必ず単一ソースで管理）
- **API直叩き禁止**（フロントエンドからWebApiへ直接fetch禁止。Server Actions/Next.js API Routes経由のみ許可）
- **クライアント側でAPI呼び出し禁止**（SSRで初期データ取得、CSRはUIのみ）
- **DTO/型安全・検証属性の未設定禁止**（DB変更時はDTO/検証属性も必ず更新）
- **Enumはnullable推奨、HasDefaultValue禁止**
- **トランザクションはサービス層で明示的に開始**
- **Hangfireタスクはpecus.LibsでDI共有。静的メソッド禁止**
- **アクセシビリティ/HTML属性の未設定禁止**（button type, label for, alt, required, className等）
- **複数プロジェクト横断変更は必ず目的・影響・差分を明示し、承認を得ること**
- **型安全・検証属性の未設定禁止**（必須項目は必ず検証属性を付与）
