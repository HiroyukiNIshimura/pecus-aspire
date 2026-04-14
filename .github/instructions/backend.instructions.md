---
applyTo: "pecus.WebApi/**/*.cs, pecus.BackFire/**/*.cs, pecus.DbManager/**/*.cs, pecus.Libs/**/*.cs"
---
## Pecus Aspire — バックエンド補助指示（差分のみ）

> 共通ルール・禁止事項は `.github/copilot-instructions.md` を最優先で参照。
> このファイルは C# バックエンド向けの**差分ルールのみ**を記載する。

### メタ情報
- Scope: `pecus.WebApi/**/*.cs, pecus.BackFire/**/*.cs, pecus.DbManager/**/*.cs, pecus.Libs/**/*.cs`
- Depends On: `.github/copilot-instructions.md`
- Details Source: `docs/backend-guidelines.md`

### バックエンド差分ルール（要点）
- 競合制御: `DbUpdateConcurrencyException` を捕捉し、`FindAsync` 後に `ConcurrencyException<T>` を使用
- コントローラーは MVC + `HttpResults` を使用し、例外は `GlobalExceptionFilter` に委譲
- DTO には検証属性（`[Required]`, `[MaxLength]` 等）を必ず付与
- Enum は nullable 推奨、`HasDefaultValue()` は使用しない
- トランザクションはサービス層で `BeginTransactionAsync` を使用（コントローラーで開始しない）
- レスポンス DTO の enum は `JsonStringEnumConverter<TEnum>` を明示する
- Hangfire は DI 経由（`IBackgroundJobClient` / `IRecurringJobManager`）を使用し、静的 API を使わない

### 実装時の参照先（必読）
- `docs/backend-guidelines.md`（先頭の「AI エージェント向け要約」）
- `docs/global-exception-handling.md`
- `docs/db-concurrency.md`
