---
applyTo: "*"
---

# Pecus Aspire — メイン AI エージェント指示書

## 1. この文書の役割

- 対象: Pecus Aspire リポジトリ全体
- アプリケーション名: **Coati**
- 開発コード: `pecus`
- この文書は、プロジェクト全体に適用する共通ルールの SSOT（唯一の正）である。
- `.github/instructions/*.instructions.md` は、この文書に記載しないスコープ固有の差分だけを定義する。
- 詳細な実装方法は `docs/` を参照する。ルールが衝突した場合は、次の順に優先する。

1. この文書
2. 対象ファイルに適用される `.github/instructions/*.instructions.md`
3. `docs/` の実装ガイド

判断できない場合は推測実装せず、必要な前提を明示して確認を求める。

## 2. プロジェクトの前提

- .NET 10 / EF Core 10 / .NET Aspire 13.2
- Next.js 16.2 / React 19.2 / Tailwind CSS 4.2 / FlyonUI 2.4
- PostgreSQL（pgroonga）、Redis、Hangfire、SignalR、Lexical
- 共有パッケージ: `packages/coati-editor`
- テストプロジェクト・テストファイルは現時点で存在しない。テスト作成を作業の前提にしない。

### サービス構成

```text
PostgreSQL ─┬─> dbmanager ─┐
Redis       ─┤              ├─> pecusapi <─ backfire <─ LexicalConverter
              └─────────────┘
Redis（frontend） ─> frontend（Next.js SSR）
```

- バックエンド用 Redis とフロントエンド用 Redis は別インスタンスである。
- サービスの起動順と依存関係は `pecus.AppHost/AppHost.cs` が管理する。
- サービス間の直接参照は禁止する。C# の共有コードは `pecus.Libs`、Node.js の共有コードは `packages/` に置く。

## 3. 絶対ルール

### 変更の安全性

- 業務ロジックを変更しないリファクタリングでは、振る舞いを変更しない。
- 複数プロジェクトを変更する場合は、変更前に目的・影響範囲・対象プロジェクト・差分方針を示す。協調変更の実施順は第5節に従う。
- ポーリングで一意 ID の衝突を回避しない。楽観的排他制御を使わない再試行も実装しない。
- スループットを下げるロック取得による排他制御を追加しない。
- 保存・登録・画面遷移などの通常操作に確認ダイアログを挟まない。削除など破壊的操作は例外とする。
- 形式的で緩いセキュリティ実装を追加しない。認証・認可・入力検証は実際の脅威モデルに基づいて実装する。

### 自動生成物と API

- API クライアント生成の実施条件・手順・失敗時の対応は第5節に従う。
- API クライアント生成後は、生成物を手編集せず、その生成結果を使ってフロントエンドを実装する。
- `pecus.Frontend/src/connectors/api/PecusApiClient.generated.ts` などの自動生成ファイルを手編集しない。
- フロントエンドから `pecus.WebApi` へ直接 `fetch` しない。Server Actions または Next.js API Routes 経由にする。
- クライアントコンポーネントから API を呼び出さない。初期データは SSR、操作は Server Actions を基本とする。
- DTO、リクエスト型、レスポンス型を重複定義しない。単一の型ソースを維持する。

### データベースとトランザクション

- 必須 DTO プロパティには `[Required]`、文字列には適切な `[MaxLength]` などの検証属性を付ける。
- DB スキーマを変更した場合は、DTO・検証属性・関連する型を同時に確認する。
- Enum の `HasDefaultValue()` は使用しない。Enum プロパティは原則 nullable とする。
- トランザクションはサービス層で `BeginTransactionAsync` を使って管理する。コントローラーで開始しない。
- 競合は `DbUpdateConcurrencyException` を捕捉し、対象を `FindAsync` で再取得して `ConcurrencyException<T>` を使用する。

### UI とアクセシビリティ

- ページコンポーネントで `h-screen` / `min-h-screen` を使わず、レイアウトの `flex-1` を使う。
- `button` の `type`、`label` の `htmlFor`、画像の `alt`、フォームの `required`、React の `className` など、必要な HTML 属性を省略しない。
- Tailwind と FlyonUI のセマンティックカラーを使う。`-ghost` は使わず `-secondary` を使う。
- レイアウトを変更する前に `docs/layout-template.md` を読む。

## 4. 実装ルール

### バックエンド

対象: `pecus.WebApi`、`pecus.BackFire`、`pecus.DbManager`、`pecus.Libs`

スコープ固有の実装規約と参照先は `.github/instructions/backend.instructions.md` に従う。

### フロントエンド

対象: `pecus.Frontend/**/*.ts`、`pecus.Frontend/**/*.tsx`

スコープ固有の実装規約と参照先は `.github/instructions/frontend.instructions.md` に従う。

### 共有エディター

- `packages/coati-editor` は共有パッケージであり、変更時はパッケージのビルドで確認する。
- Lexical JSON の変換や gRPC 連携を変更する場合は `.github/skills/lexical-converter-grpc/SKILL.md` を先に読む。

## 5. 変更前後のワークフロー

1. 対象ファイル、適用される指示書、関連ドキュメントを確認する。
2. 複数プロジェクトにまたがる場合は、目的・影響・差分を明示する。
3. 既存コードの責務・公開 API・エラー処理・排他制御を確認する。
4. バックエンドを先に修正し、診断・ビルドで修正完了を確認する。
5. バックエンドとフロントエンドを同一変更で扱う場合は、バックエンドの修正・検証後に API 契約が確定していることを確認し、`npm run full:api` を実行して API クライアントを生成する。API 契約に変更がない場合もこの順序を省略しない。生成に失敗した場合はエラー内容を報告し、フロントエンド実装を保留する。生成物は手編集しない。
6. フロントエンドのみの変更でバックエンドに変更がない場合は、既存の生成済み API クライアントをそのまま使用し、`npm run full:api` を再実行しない。
7. API クライアント生成後にフロントエンドを実装する。生成前にフロントエンド側で API 型を推測して実装しない。
8. 最小限の差分で実装する。無関係な整形や生成物の編集をしない。
9. 変更後に `get_errors` で診断を確認する。
10. 対象プロジェクトで利用可能な lint、型チェック、ビルドの CLI コマンドはすべて実行し、コマンドが利用できない場合または実行できなかった場合は理由を報告する。
11. 最終報告では、変更ファイル、実施順序、検証結果、未実行の検証、利用者が必要な手動操作を明記する。

## 6. エージェントが実行してはいけないコマンド

- `dotnet run --project pecus.AppHost`
- `npm run dev`（`pecus.Frontend`）

上記が必要な場合は、何が必要か・なぜ実行できないか・人間が実行するコマンドを報告し、それ以外の作業を継続する。

## 7. 参照先と主要ファイル

### 必読ドキュメント

- `docs/spec/PRODUCT_VISION_PERSONAS_JA.md`
- `docs/frontend-guidelines.md`
- `docs/ssr-design-guidelines.md`
- `docs/layout-template.md`
- `docs/backend-guidelines.md`
- `docs/global-exception-handling.md`
- `docs/db-concurrency.md`

### 主要ファイル

- `pecus.AppHost/AppHost.cs`: Aspire のサービス構成
- `pecus.Libs/DB/ApplicationDbContext.cs`: PostgreSQL と `xmin` のマッピング
- `pecus.WebApi/Filters/GlobalExceptionFilter.cs`: 例外と HTTP ステータスの変換
- `pecus.WebApi/Exceptions/ConcurrencyException.cs`: 競合例外
- `pecus.Frontend/src/libs/serverSession.ts`: Redis セッション管理
- `pecus.Frontend/src/actions/`: Server Actions の実装例

## 8. 返答と報告の原則

- 返答は日本語で簡潔に行う。
- 変更したファイルと変更理由を示す。
- 検証は実行結果に基づいて報告し、未実行のものを成功と書かない。
- 禁止事項に抵触する依頼は、代替案と人間が行うべき手順を示す。
- できないことは推測で埋めず、できない理由を明確にする。
