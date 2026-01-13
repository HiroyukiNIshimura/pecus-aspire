---
applyTo: "pecus.WebApi/**/*.cs, pecus.BackFire/**/*.cs, pecus.DbManager/**/*.cs, pecus.Libs/**/*.cs"
---
## Pecus Aspire — AI エージェント最小指示書（バックエンド用）
---

### 概要
この指示書は C# (.NET) バックエンドプロジェクト（`pecus.WebApi`, `pecus.BackFire`, `pecus.DbManager`, `pecus.Libs` など）に適用されます。

### 最優先事項
- 日本的なダサいセキュリティ・排他・リトライ・UI/UX 禁止
- Aspire サービス起動順は `pecus.AppHost/AppHost.cs` で管理

### 絶対禁止事項
- API クライアント生成（`npm run full:api`）の実行禁止
- コントローラーでのトランザクション開始禁止（サービス層でのみ `BeginTransactionAsync`）
- 自動生成ファイルの手動編集禁止
- 横断変更の無断実施禁止
- リファクタリング時の業務ロジック変更禁止

### 重要パターン
- RowVersion: PostgreSQL `xmin` → C# `uint` → フロント `number`
- 競合処理: `DbUpdateConcurrencyException` → `FindAsync()` → `ConcurrencyException<T>`
- コントローラー: MVC + `HttpResults`（`Ok<T>`, `Created<T>`, `NoContent`）
- 例外処理: 例外はスローし `GlobalExceptionFilter` に任せる
- DTO: 検証属性（`[Required]`, `[MaxLength]`）必須。Enum は nullable 推奨、`HasDefaultValue()` 禁止
- トランザクション: サービス層で `BeginTransactionAsync`。コントローラーでは禁止
- レスポンスDTOのEnumフィールド:
```
[JsonConverter(typeof(JsonStringEnumConverter<ChatRoomType>))]
public required ChatRoomType Type { get; set; }
```
のようにJsonStringEnumConverterを必ず指定する。
- Hangfire: DI 経由の `IBackgroundJobClient` のみ使用

### 参照ドキュメント
- `docs/backend-guidelines.md`
- `docs/global-exception-handling.md`
- `docs/db-concurrency.md`

### 禁止事項まとめ
- サービス間の直接参照禁止（共通はLibsへ）
- 型宣言の重複定義禁止
- DTO/型安全・検証属性の未設定禁止
- Enumはnullable推奨、HasDefaultValue禁止
- トランザクションはサービス層で明示的に開始
- HangfireタスクはDI共有。静的メソッド禁止
- 複数プロジェクト横断変更は必ず目的・影響・差分を明示し、承認を得ること

---

詳細は `docs/backend-guidelines.md` 先頭のAI向け要約を必ず参照。
