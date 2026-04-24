# Pecus Aspire — Claude Code 指示書

メタ情報
- 版: v1.0
- 更新日: 2026-04-24
- 文書責任: Pecus Aspire Maintainers

## 指示の優先順位（SSoT）

1. このファイル（`CLAUDE.md`）の**共通・絶対ルール**
2. サブディレクトリの `CLAUDE.md`（`pecus.Frontend/CLAUDE.md` 等）の**スコープ別ルール**
3. `docs/*` の**実装詳細ガイド**（各ドキュメント先頭の「AI エージェント向け要約」を優先参照）

矛盾時は、上位レイヤーを優先する。判断が付かない場合は、推測実装せず確認を取ること。

## 短い要約（必読）

このプロジェクトのコードは全てエージェントが自律的に生成しています。以下のルールに反する変更は禁止です。できないことは正直に「できない」と回答してください。

### 最優先事項
このアプリは一般公開されグローバルに使用されます。日本の業務アプリ常識のようなダサいセキュリティロジック、リトライによる一意情報の生成、排他制御、UI/UX を絶対に提案・実装しないでください。

### プロジェクト基本情報
- 開発コード: `pecus`、アプリケーション名: `Coati`
- エントリ: `pecus.AppHost/AppHost.cs`（Aspire がサービスの起動順・依存を管理）
- 主要プロジェクト: `pecus.WebApi`, `pecus.BackFire`, `pecus.DbManager`, `pecus.Libs`, `pecus.Frontend`, `pecus.LexicalConverter`, `pecus.Protos`
- 共有パッケージ: `packages/coati-editor`（Lexical ベースリッチテキストエディタ）
- 技術スタック: .NET 10 / EF Core 10 / .NET Aspire 13.2 / Next.js 16.2 / React 19.2 / Tailwind CSS 4.2 / FlyonUI 2.4
- テスト基盤: なし（テストプロジェクト・テストファイルは存在しない。テスト作成を提案しないこと）

### 絶対禁止事項
- **API クライアント生成（`npm run full:api`）の実行禁止** — 人間の開発者のみが実行。必ず作業を中断して報告
- **フロントからの WebApi 直 fetch 禁止** — Server Actions / API Routes 経由のみ許可
- **自動生成ファイルの手動編集禁止** — `PecusApiClient.generated.ts` 等
- **コントローラーでのトランザクション開始禁止** — サービス層で `BeginTransactionAsync` を使用
- **横断変更の無断実施禁止** — 複数プロジェクトを触る場合は承認を得る
- **リファクタリング時の業務ロジック変更禁止** — 変更が必要な場合は報告

## サービスアーキテクチャ（Aspire 依存関係）

```
PostgreSQL (pgroonga) ─┬─→ dbmanager (マイグレーション・シード)
Redis (バックエンド)   ─┤   ↓
LexicalConverter (gRPC)─┼─→ backfire (Hangfire バックグラウンドジョブ)
                        └─→ pecusapi (REST API) ←─ dbmanager, backfire
Redis (フロントエンド)  ──→ frontend (Next.js SSR) ←─ pecusapi
```

- **Redis は 2 インスタンス**: バックエンド用（キャッシュ・SignalR backplane）とフロントエンド用（セッション管理）
- 起動順・依存は `pecus.AppHost/AppHost.cs` で定義

## フロントエンド ルートグループ構造

```
src/app/
  (workspace-full)/   — ワークスペース関連ページ
  (dashboard)/        — ダッシュボード
  (admin-full)/       — 管理者ページ
  (profile)/          — プロフィール
  (entrance)/         — ログイン・サインアップ
  (backoffice-full)/  — バックオフィス
  api/                — API Routes
  help/               — ヘルプページ
```

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

- 環境セットアップ: `node scripts/generate-appsettings.js -D`（開発用設定ファイル生成。各プロジェクトの `appsettings.json` を生成）
- バックエンド: `dotnet format pecus.sln` → `dotnet clean pecus.sln` → `dotnet build pecus.sln` → `dotnet run --project pecus.AppHost`（エージェントの実行禁止）
- フロントエンド: `cd pecus.Frontend` → `npm run lint` → `npm run format` → `npx tsc --noEmit` → `npm run build`（エージェントの実行禁止） → `npm run dev`（エージェントの実行禁止）
- 共有パッケージ: `cd packages/coati-editor && npm run build`（エディタ変更時）
- API クライアント生成: `npm run full:api`（エージェントの実行禁止）

## バックエンド差分ルール（C# プロジェクト共通）

> 対象: `pecus.WebApi`, `pecus.BackFire`, `pecus.DbManager`, `pecus.Libs`
> 詳細: `docs/backend-guidelines.md`（先頭の「AI エージェント向け要約」）

- 競合制御: `DbUpdateConcurrencyException` を捕捉し、`FindAsync` 後に `ConcurrencyException<T>` を使用
- コントローラーは MVC + `HttpResults` を使用し、例外は `GlobalExceptionFilter` に委譲
- DTO には検証属性（`[Required]`, `[MaxLength]` 等）を必ず付与
- Enum は nullable 推奨、`HasDefaultValue()` は使用しない
- トランザクションはサービス層で `BeginTransactionAsync` を使用（コントローラーで開始しない）
- レスポンス DTO の enum は `JsonStringEnumConverter<TEnum>` を明示する
- Hangfire は DI 経由（`IBackgroundJobClient` / `IRecurringJobManager`）を使用し、静的 API を使わない

### バックエンド参照先（必読）
- `docs/backend-guidelines.md`（先頭の「AI エージェント向け要約」）
- `docs/global-exception-handling.md`
- `docs/db-concurrency.md`

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

## 作業時のチェックリスト

1. 変更が跨プロジェクトか？ → 承認フローを経る。
2. DTO の検証属性は揃っているか？ → `dotnet build` 前に確認。
3. 型生成物は手動編集していないか？ → 自動生成ファイルは .gitignore へ。

## ログファイル
- バックエンド: `pecus.WebApi/logs/最新日付けのログ`（Serilog ログ）
- バックグラウンドジョブ: `pecus.BackFire/logs/最新日付けのログ`
- フロントエンド: ブラウザの DevTools コンソール
- マイグレーション: `pecus.DbManager/logs/最新日付けのログ`

## アンチパターン・禁止事項（必ず遵守）
- **コードやUIのリファクタリング時に業務ロジックを絶対に変更しない**（変更が必要な場合は必ず報告し確認をとること）
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
- **CSSセマンティックカラー** ❌ `-ghost`  ✅ `-secondary`

## 運用ポリシー（重複管理）

- このファイルは「共通ルールの SSOT（唯一の正）」として扱う
- `pecus.Frontend/CLAUDE.md` には、共通ルールを再掲せず、**差分ルールのみ**記載する
- 実装例・背景説明・詳細手順は `docs/` 側に集約し、CLAUDE.md 側では参照を優先する
