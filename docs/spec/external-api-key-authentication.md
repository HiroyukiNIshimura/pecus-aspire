# 外部公開API — APIキー認証設計書

- 作成日: 2026-02-10
- ステータス: **設計中** 📝

---

## 背景と目的

現在 `pecus.WebApi` はフロントエンド（Next.js）専用のAPIとして稼働しており、認証はJWT Bearer（自前発行 + Redis失効リスト）で行われている。

一部APIを外部パートナーや連携システムに公開するため、既存のJWT認証とは独立した **APIキー認証方式** を導入する。

### 要件

| 項目 | 内容 |
|------|------|
| 認証方式 | APIキー（`X-API-KEY` ヘッダー） |
| キー管理 | DB管理（組織ごとに複数発行可能） |
| 有効期限 | デフォルト1年（発行時に指定可能） |
| 失効 | 明示的な失効操作（`IsRevoked` フラグ） |
| 保存方式 | SHA-256ハッシュのみDB保存（平文は発行時のみ返却） |
| 既存認証への影響 | なし（デフォルトスキームはJWT Bearerのまま） |

---

## アーキテクチャ概要

```
外部クライアント                              内部クライアント（Next.js）
     │                                              │
     │ X-API-KEY: pcs_xxxxxxxx...                    │ Authorization: Bearer <JWT>
     ▼                                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        pecus.WebApi                         │
│                                                             │
│  ┌──────────────────────┐   ┌────────────────────────────┐ │
│  │ ApiKey Scheme         │   │ JwtBearer Scheme (default) │ │
│  │ X-API-KEY ヘッダー検証 │   │ Authorization ヘッダー検証  │ │
│  └──────────┬───────────┘   └──────────┬─────────────────┘ │
│             │                          │                    │
│             ▼                          ▼                    │
│  ┌──────────────────────┐   ┌────────────────────────────┐ │
│  │ [Authorize(Schemes   │   │ [Authorize] ← デフォルト    │ │
│  │  = "ApiKey")]        │   │                            │ │
│  │ OpenController 等    │   │ 既存コントローラー群        │ │
│  └──────────────────────┘   └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│            PostgreSQL                    │
│  ┌─────────────────────────────────┐    │
│  │ external_api_keys テーブル       │    │
│  │  - key_hash (SHA-256)           │    │
│  │  - organization_id             │    │
│  │  - expires_at                  │    │
│  │  - is_revoked                  │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

## データモデル

### external_api_keys テーブル

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| `id` | `uuid` | PK | APIキーID（UUIDv7） |
| `organization_id` | `uuid` | FK, NOT NULL | 所属組織 |
| `name` | `varchar(100)` | NOT NULL | キー名（用途識別用） |
| `key_prefix` | `varchar(8)` | NOT NULL | キー先頭8文字（一覧表示・識別用） |
| `key_hash` | `varchar(64)` | UNIQUE, NOT NULL | SHA-256ハッシュ（Base64） |
| `expires_at` | `timestamp` | NOT NULL | 有効期限 |
| `is_revoked` | `boolean` | NOT NULL | 失効フラグ |
| `last_used_at` | `timestamp` | nullable | 最終使用日時 |
| `created_by` | `uuid` | NOT NULL | 作成者ユーザーID |
| `created_at` | `timestamp` | NOT NULL | 作成日時 |
| `xmin` | `uint` | RowVersion | 楽観的同時実行制御 |

### インデックス

| インデックス | カラム | 種類 |
|-------------|--------|------|
| `ix_external_api_keys_key_hash` | `key_hash` | UNIQUE |
| `ix_external_api_keys_org_revoked` | `organization_id, is_revoked` | 複合 |

### ER図

```
Organization 1 ──── * ExternalApiKey
```

---

## APIキーのフォーマット

```
pcs_<URL-safe Base64(32バイトランダム)>
```

- プレフィックス `pcs_` により、ログやコードレビューでAPIキーと識別しやすくする
- 例: `pcs_A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2`
- DB保存: `SHA256(平文キー)` のBase64表現のみ

---

## セキュリティ設計

### キー保存

| 保存場所 | 内容 |
|---------|------|
| DB | SHA-256ハッシュのみ（平文は保存しない） |
| レスポンス | 発行時のみ1回だけ平文を返却。以降は取得不可 |

### 照合

- リクエストの平文キー → SHA-256ハッシュ → DB検索（ハッシュ一致 + 未失効で照合）
- キーの長さが異なるためタイミング攻撃のリスクは低いが、ハッシュ比較はDB側で実施

### 有効期限

- デフォルト: 365日
- 発行時にカスタム指定可能
- 期限切れキーは認証時に拒否（自動削除はしない）

### 失効

- `RevokeAsync()` で `is_revoked = true` に更新
- 失効済みキーは認証時に即拒否

### 監査

- キー発行・失効時にログ出力
- 認証成功時に `last_used_at` を更新
- `api_key_id` と `organization_id` を Claims に含めるため、アクセスログで追跡可能

---

## 認証フロー

```
1. クライアントが X-API-KEY ヘッダー付きでリクエスト
2. ApiKeyAuthenticationHandler が起動
3. ヘッダーからキーを取得
4. SHA-256ハッシュを計算
5. DBで key_hash を検索（未失効のみ）
6. 見つからない → AuthenticateResult.Fail
7. expires_at < now → AuthenticateResult.Fail（期限切れ）
8. last_used_at を更新
9. ClaimsPrincipal を構築（api_key_id, organization_id, name）
10. AuthenticateResult.Success
```

---

## 実装ファイル一覧

| プロジェクト | ファイル | 操作 | 説明 |
|---|---|---|---|
| `pecus.Libs` | `DB/Entities/ExternalApiKey.cs` | 新規 | Entityクラス |
| `pecus.Libs` | `DB/ApplicationDbContext.cs` | 変更 | DbSet + Index追加 |
| `pecus.Libs` | `DB/Services/ExternalApiKeyService.cs` | 新規 | 発行・検証・失効・一覧 |
| `pecus.WebApi` | `Authentication/ApiKeyAuthenticationHandler.cs` | 新規 | 認証ハンドラー |
| `pecus.WebApi` | `Program.cs` | 変更 | スキーム登録 + Service登録 |
| `pecus.WebApi` | `Controllers/OpenController.cs` | 新規 | 外部公開APIコントローラー（例） |
| `pecus.DbManager` | マイグレーション | 要実行 | テーブル追加 |

---

## コントローラーでの適用方法

### パターン1: コントローラー全体をAPIキー認証

```csharp
[ApiController]
[Route("api/open")]
[Authorize(AuthenticationSchemes = ApiKeyAuthenticationOptions.SchemeName)]
public class OpenController : ControllerBase
{
    [HttpGet("items/{id:int}")]
    public IActionResult GetItem(int id)
    {
        var organizationId = User.FindFirst("organization_id")?.Value;
        return Ok(new { id, organizationId });
    }
}
```

### パターン2: アクション単位で混在

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize] // デフォルト = JWT
public class SomeController : ControllerBase
{
    [HttpGet("internal")]
    public IActionResult InternalAction() => Ok("JWT only");

    [HttpGet("external")]
    [Authorize(AuthenticationSchemes = ApiKeyAuthenticationOptions.SchemeName)]
    public IActionResult ExternalAction() => Ok("API Key only");

    [HttpGet("both")]
    [Authorize(AuthenticationSchemes = $"Bearer,{ApiKeyAuthenticationOptions.SchemeName}")]
    public IActionResult BothAction() => Ok("JWT or API Key");
}
```

---

## APIキー管理API（将来実装）

| メソッド | エンドポイント | 認証 | 説明 |
|---------|---------------|------|------|
| `POST` | `/api/organizations/{orgId}/api-keys` | JWT（管理者） | キー発行（平文を1回だけ返却） |
| `GET` | `/api/organizations/{orgId}/api-keys` | JWT（管理者） | キー一覧（prefix, name, expires_at, is_revoked） |
| `DELETE` | `/api/organizations/{orgId}/api-keys/{keyId}` | JWT（管理者） | キー失効 |

---

## 将来の拡張ポイント

| 項目 | 内容 |
|------|------|
| スコープ制御 | APIキーごとにアクセス可能なエンドポイントを制限 |
| レート制限 | APIキー単位でのリクエスト数制限 |
| IP制限 | APIキーに許可IPアドレスを紐付け |
| Webhook | APIキー発行・失効時の通知 |
| ローテーション | 新キー発行 → 旧キー猶予期限付き失効 |

---

## 関連ドキュメント

- [認証アーキテクチャ刷新設計書](auth-architecture-redesign.md)
- [バックエンドガイドライン](../backend-guidelines.md)
- [グローバル例外ハンドリング](../global-exception-handling.md)
