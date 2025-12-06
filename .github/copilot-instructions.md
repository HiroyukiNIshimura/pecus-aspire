## Pecus Aspire — AI エージェント最小指示書

メタ情報
- 版: v1.2
- 更新日: 2025-12-06
- 文書責任: Pecus Aspire Maintainers

## 短い要約（エージェント向け / 20行以内・必読）

このプロジェクトのコードは全てエージェントが自律的に生成しています。 エージェントは以下の重要ポイントを必ず理解し、遵守してください。

- エントリ: `pecus.AppHost/AppHost.cs`（Aspire がサービスの起動順・依存を管理）
- 主要プロジェクト: `pecus.WebApi`, `pecus.BackFire`, `pecus.DbManager`, `pecus.Libs`, `pecus.Frontend`
- 全てのプロジェクトで、カレンダー、時間、通貨、言語などグローバリゼーションを考慮してください。（カレンダーと言語に関しては現在はjaのみをスコープとする）
- RowVersion は PostgreSQL の `xmin` を `uint RowVersion` として扱う（フロントは number） — 実装参照: `pecus.Libs/DB/ApplicationDbContext.cs`
- 競合処理はサービスで `DbUpdateConcurrencyException` を catch → `FindAsync()` で最新取り直し → `ConcurrencyException<T>` を投げる。`GlobalExceptionFilter` が 409 を返す。
- フロントは SSR-first。ミューテーションは `Server Actions`（`src/actions/`）を使い、直接フロントから `pecus.WebApi` を叩かない。
- フロント UI は Tailwind CSS と `FlyonUI` を利用しています。絶対にFlyonUIのデザインを壊さないでください。**daisyUIは使用しない。** **アイコンは"@iconify/tailwind4" https://iconify.design/ を使用する**
- セッション/トークン: ブラウザは Cookie に保存（httpOnly: false）。Middleware が期限前に自動リフレッシュし、必要に応じてサーバー側ユーティリティ（`src/libs/session.ts`）を併用する。
- 自動生成クライアント: `pecus.Frontend/src/connectors/api/PecusApiClient.generated.ts` は自動生成物 → 編集禁止。生成スクリプト: `pecus.Frontend/scripts/generate-pecus-api-client.js`。
- 主要コマンド（必ず確認）: `dotnet build pecus.sln` / `dotnet run --project pecus.AppHost`（バックエンド）、`npx tsc --noEmit` / `npm run dev`（フロント）
- 禁止事項（必守）: 横断変更の無断実施、フロントからの API 直叩き、自動生成物の手動編集、コントローラーでのトランザクション開始。
- C#: 原則「1ファイル=1クラス」。関連する複数の enum/record は1ファイル可。
- フロントエンドのAPIクライアントの生成はエージェントには実行を禁止する。**生成スクリプトの実行は人間の開発者のみが行うため必ず作業を中断すること。**
- バックエンド・フロントエンド共に修正が必要になった場合は、バックエンド→フロントエンドの順で修正を行い、バックエンドの変更が完了し動作確認が取れた後にフロントエンドの修正を行うこと。

## 統一方針（簡潔版）
- コントローラー/戻り値: MVC コントローラー＋`HttpResults`（`Ok<T>`, `Created<T>`, `NoContent`）。`IActionResult`/`ActionResult<T>`は不使用。複数成功のみ`Results<...>`を使用。エラーは例外→`GlobalExceptionFilter`。
- フロント API 呼び出し: 読取は SSR(Server Component)で、変更は Server Actions で、いずれも `createPecusApiClients()` 経由。ブラウザ直 fetch と SA/SSR からの WebApi 直 fetch は禁止（例外: リフレッシュ API のみ循環回避で直 fetch 可）。
- 競合制御: UPDATE 時の `DbUpdateConcurrencyException` を catch→`FindAsync()` で最新再取得→`ConcurrencyException<T>` 再スローで統一。DTO は `RowVersion: uint` 必須。
- 生成物/CI: 自動生成物は `.gitignore` 管理・手動編集禁止。CI は生成スクリプト未実行の検知を重視。
- 認証/トークン: ブラウザは Cookie（`httpOnly:false`, `sameSite:'strict'`）。SSR/SA は `SessionManager` で取得。自動更新は Axios、リフレッシュのみ直 `fetch` 例外。
- バージョン表記: 「.NET 10」「EF Core 10」「.NET Aspire x.y」を分離して記載。

## 参照ドキュメント

詳細な実装ガイドラインは以下のドキュメントを参照してください。

- **フロントエンド詳細**: `docs/frontend-guidelines.md`
  - アーキテクチャ、APIアクセスルール、SSR、バリデーション、エラーハンドリング等
- **バックエンド詳細**: `docs/backend-guidelines.md`
  - Aspire構成、DB設計、マイグレーション、コントローラ設計、EF Core最適化等
- **例外処理**: `docs/global-exception-handling.md`
- **DB同時実行制御**: `docs/db-concurrency.md`
- **その他**: 認証、権限、UI規定などの特定トピックは `docs/` ディレクトリ内のドキュメントを参照してください。

## 開発フロー／コマンド

- バックエンド: `dotnet format pecus.sln` → `dotnet build pecus.sln` → `dotnet run --project pecus.AppHost`
- フロントエンド: `npm run lint` → `npm run format` → `npx tsc --noEmit` → `npm run build` → `npm run dev`
- API クライアント生成: `npm run full:api`（自動フックあり）

## プロジェクト特有のルール（必ず守る）

- 横断変更禁止: 1 変更で複数プロジェクトを触る場合は目的・影響・差分を明記して承認を得る。
- フロントエンドから `pecus.WebApi` を直接叩かない（Server Actions / API Routes 経由）。
- DTO に検証属性（[Required] / [MaxLength] 等）を必ず付与し、API 互換性に注意する。
- Enum は nullable にする。`HasDefaultValue()` を使わない。
- トランザクションはサービス層で開始・管理する（コントローラーで開始しない）。

## すぐ参照すべきファイル（ショートリスト）

- `pecus.AppHost/AppHost.cs` — サービス起動順 / 依存解決（Aspire の登録例）
- `pecus.Libs/DB/ApplicationDbContext.cs` — `ConfigureRowVersionForAllEntities`（PostgreSQL `xmin` のマッピング）
- `pecus.WebApi/Filters/GlobalExceptionFilter.cs` — `HandleConcurrencyException`（IConcurrencyException → HTTP 409 へ変換）
- `pecus.WebApi/Exceptions/ConcurrencyException.cs` — `ConcurrencyException<T>` の定義（ConflictedModel を含む）
- `pecus.WebApi/Models/Requests/*` — リクエスト DTO 例（更新リクエストに `RowVersion` を含める）
- `pecus.Frontend/src/libs/session.ts` — `SessionManager`（server-side cookies を使ったセッション管理）
- `pecus.Frontend/scripts/generate-pecus-api-client.js` — API クライアント生成スクリプト（生成物は編集禁止）

## 作業時のチェックリスト（短い）

1. 変更が跨プロジェクトか？ → README に承認フローを記載。
2. DTO の検証属性は揃っているか？ → `dotnet build` 前に確認。
3. 型生成物は手動編集していないか？ → 自動生成ファイルは .gitignore へ。

## アンチパターン・禁止事項（**必ず遵守**）

- **サービス間の直接参照禁止**
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
