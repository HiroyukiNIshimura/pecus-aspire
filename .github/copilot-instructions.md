---
applyTo: "*"
---
## Pecus Aspire — AI エージェント最小指示書

メタ情報
- 版: v1.4
- 更新日: 2026-03-16
- 文書責任: Pecus Aspire Maintainers

## 指示の優先順位（SSoT）

エージェントは、以下の順で指示を解釈・適用すること。

1. このファイル（`.github/copilot-instructions.md`）の**共通・絶対ルール**
2. `applyTo` が一致する `.github/instructions/*.instructions.md` の**スコープ別ルール**
3. `docs/*` の**実装詳細ガイド**（各ドキュメント先頭の「AI エージェント向け要約」を優先参照）

矛盾時は、上位レイヤーを優先する。判断が付かない場合は、推測実装せず確認を取ること。

## 短い要約（エージェント向け / 必読）

このプロジェクトのコードは全てエージェントが自律的に生成しています。以下のルールに反する変更は禁止です。できないことは正直に「できない」と回答してください。

### 最優先事項
このアプリは一般公開されグローバルに使用されます。以下を禁止します: (1) 楽観的排他制御を使わないポーリングによる再試行でユニークID衝突を回避する実装、(2) ロック取得によるスループット低下を招く排他制御、(3) 破壊的操作（削除等）以外の通常操作（保存・登録・画面遷移等）で都度確認ダイアログを挟むUIや、形式的で緩いセキュリティロジック。

### プロジェクト基本情報
- 開発コード: `pecus`、アプリケーション名: `Coati`
- エントリ: `pecus.AppHost/AppHost.cs`（Aspire がサービスの起動順・依存を管理）
- 主要プロジェクト: `pecus.WebApi`, `pecus.BackFire`, `pecus.DbManager`, `pecus.Libs`, `pecus.Frontend`, `pecus.LexicalConverter`, `pecus.Protos`
- 共有パッケージ: `packages/coati-editor`（Lexical ベースリッチテキストエディタ）
- 技術スタック: .NET 10 / EF Core 10 / .NET Aspire 13.2 / Next.js 16.2 / React 19.2 / Tailwind CSS 4.2 / FlyonUI 2.4
- テスト基盤: なし（テストプロジェクト・テストファイルは存在しない。エージェントはテスト作成を提案しないこと）

### 絶対禁止事項（SSoT ルール一覧）

すべての禁止事項および共通ルールは本表を一意の正（SSoT）として管理します。

| カテゴリ | 禁止事項 / ルール | 詳細・遵守手順 |
|---|---|---|
| **コマンド** | API クライアント生成（`npm run full:api`）の実行禁止 | 人間の開発者のみが実行。作業に必要な場合は中断し、報告時は (1) 何が必要か、(2) なぜ実行できないか、(3) 人間が実行すべきコマンド、を明記した上で、それ以外の作業を継続すること。 |
| **ファイル** | 自動生成ファイルの手動編集禁止 | [pecus.Frontend/src/connectors/api/PecusApiClient.generated.ts](pecus.Frontend/src/connectors/api/PecusApiClient.generated.ts) 等の自動生成ファイルを直接編集しない（.gitignore 対象）。 |
| **API / 通信** | フロントからの WebApi 直 fetch 禁止 | Server Actions / API Routes 経由のみ許可。クライアント側での API 呼び出し禁止（SSR で初期データ取得、CSR は UI のみ）。 |
| **トランザクション** | コントローラーでのトランザクション開始禁止 | トランザクションはサービス層で `BeginTransactionAsync` を使用し明示的に開始・管理する。 |
| **変更管理** | 複数プロジェクト横断変更の無断実施禁止 | 1 変更で複数プロジェクトを触る場合は、事前に目的・影響・差分を明記して承認を得る。 |
| **ロジック** | リファクタリング時の業務ロジック変更禁止 | コードや UI のリファクタリング時に業務ロジックを絶対に変更しない。変更が必要な場合は必ず報告し確認をとること。 |
| **アーキテクチャ** | サービス間の直接参照禁止 | C# 共通ライブラリは `pecus.Libs`、Node.js 共通ライブラリは `packages/` へ集約。 |
| **型 / DTO** | 型宣言の重複定義禁止 | DTO / リクエスト・レスポンス型は必ず単一ソースで管理。 |
| **型 / DTO** | DTO / 型安全・検証属性の未設定禁止 | 必須項目に `[Required]` / `[MaxLength]` 等を必ず付与し API 互換性に注意する。DB 変更時は DTO / 検証属性も必ず更新。 |
| **DB / 設計** | Enum の `HasDefaultValue()` 禁止 | Enum は nullable 推奨、`HasDefaultValue()` は使用しない。 |
| **ジョブ** | Hangfire 静的メソッド呼び出し禁止 | Hangfire タスクは `pecus.Libs` で DI 共有（`IBackgroundJobClient` / `IRecurringJobManager`）。 |
| **UI / レイアウト** | ページコンポーネントでの `h-screen` / `min-h-screen` 禁止 | `flex-1` を使用。レイアウト変更前に [docs/layout-template.md](docs/layout-template.md) を確認すること。 |
| **UI / a11y** | アクセシビリティ / HTML 属性の未設定禁止 | `button type`, `label for`, `alt`, `required`, `className` 等を必ず設定。 |
| **UI / スタイル** | CSS セマンティックカラーの誤用禁止 | ❌ `-ghost`、✅ `-secondary`。 |


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
- バックエンド: `dotnet format pecus.sln` → `dotnet clean pecus.sln`→ `dotnet build pecus.sln` → `dotnet run --project pecus.AppHost`（エージェントの実行禁止）
- フロントエンド: `cd pecus.Frontend` → `npm run lint` → `npm run format` → `npx tsc --noEmit` → `npm run build`（エージェントの実行禁止） → `npm run dev`（エージェントの実行禁止）
- 共有パッケージ: `cd packages/coati-editor && npm run build`（エディタ変更時）
- API クライアント生成: `npm run full:api`（エージェントの実行禁止）

## プロジェクト特有のルール（必ず守る）

本プロジェクトの共通ルール・禁止事項は `絶対禁止事項（SSoT ルール一覧）` を参照してください（重複を避けるため一元化されています）。

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

アンチパターンおよび禁止事項の詳細は `絶対禁止事項（SSoT ルール一覧）` を参照してください（本指示書の単一メンタルモデルとして一元管理されています）。

## 運用ポリシー（重複管理）

- このファイルは「共通ルールの SSOT（唯一の正）」として扱う
- `.github/instructions/frontend.instructions.md` / `backend.instructions.md` には、共通ルールを再掲せず、**差分ルールのみ**記載する
- 実装例・背景説明・詳細手順は `docs/` 側に集約し、instruction 側では参照を優先する
