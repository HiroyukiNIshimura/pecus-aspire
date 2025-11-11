# フロントエンドURL検証（セキュリティ強化）

## 概要

メール送信時のフロントエンドURLをOriginヘッダーとホワイトリスト検証することで、フィッシング攻撃やオープンリダイレクト攻撃を防止します。

## 実装日

2025年1月27日

## セキュリティ上の問題点（修正前）

### 問題1: リクエストから直接URLを受け取る脆弱性

```csharp
// ❌ 危険: リクエストボディからURLを受け取る
var resetUrl = $"{request.FrontendUrl}/reset?token={token}";
```

**リスク**:
- 攻撃者が任意のURLを指定できる
- フィッシングサイトへのリンクをメールで送信可能
- ユーザーが正規のメールと区別できない

### 問題2: 動的に取得したURLをそのまま使用

```csharp
// ⚠️ 問題: Request.SchemeとRequest.Hostをそのまま信頼
var baseUrl = $"{Request.Scheme}://{Request.Host}";
```

**リスク**:
- Hostヘッダーインジェクション攻撃に脆弱
- リバースプロキシ経由で改ざん可能
- 検証なしで任意のドメインが使用される

### 問題3: 設定ファイルの固定URL

```csharp
// △ 制限的: 単一URLのみ対応
var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
```

**問題点**:
- 開発環境、ステージング、本番で同じURLしか使えない
- 複数のフロントエンドドメインに対応できない
- 環境ごとに再デプロイが必要

## 解決策: Origin ヘッダー + ホワイトリスト検証

### 設計方針

1. **Originヘッダーを優先**: ブラウザが自動設定するため信頼できる
2. **ホワイトリスト検証**: 許可されたドメインのみ受け入れ
3. **環境別設定**: 開発/ステージング/本番で異なるホワイトリスト
4. **フォールバック機構**: Originがない場合はRefererまたはデフォルトURL

### アーキテクチャ図

```
┌─────────────┐
│  Browser    │
│ (Frontend)  │
└──────┬──────┘
       │ HTTP Request
       │ Origin: https://app.example.com
       ▼
┌─────────────────────────────────────┐
│  FrontendUrlResolver                │
│  ┌───────────────────────────────┐  │
│  │ 1. Extract Origin Header      │  │
│  │ 2. Validate against Whitelist │  │
│  │ 3. Return validated URL       │  │
│  └───────────────────────────────┘  │
│         │                            │
│         ▼                            │
│  Allowed URLs:                       │
│  - https://app.example.com           │
│  - https://staging.example.com       │
│  - http://localhost:3000             │
└─────────────────────────────────────┘
       │
       ▼ Validated URL
┌─────────────┐
│  Email      │
│  Template   │
└─────────────┘
```

## 実装内容

### 1. FrontendUrlResolver（新規作成）

**ファイル**: `pecus.Libs/Security/FrontendUrlResolver.cs`

```csharp
public class FrontendUrlResolver
{
    /// <summary>
    /// リクエストのOriginヘッダーを検証し、ホワイトリストに含まれる場合はそのURLを返す
    /// </summary>
    public string GetValidatedFrontendUrl(HttpContext httpContext)
    {
        // 1. Originヘッダーを取得
        var origin = httpContext.Request.Headers.Origin.FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(origin) && _allowedOrigins.Contains(origin))
        {
            return origin;
        }

        // 2. Refererヘッダーをフォールバック
        var referer = httpContext.Request.Headers.Referer.FirstOrDefault();

        // 3. デフォルトURLを返す
        return GetDefaultFrontendUrl();
    }
}
```

**主な機能**:
- Originヘッダーの抽出と検証
- ホワイトリストとの照合
- Refererフォールバック
- 構造化ログ出力

### 2. 設定ファイル（appsettings.json）

**本番環境** (`appsettings.json`):
```json
{
  "Security": {
    "AllowedFrontendUrls": [
      "https://your-production-domain.com"
    ]
  }
}
```

**開発環境** (`appsettings.Development.json`):
```json
{
  "Security": {
    "AllowedFrontendUrls": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://localhost:3000",
      "https://localhost:3001"
    ]
  }
}
```

**ステージング環境** (`appsettings.Staging.json`):
```json
{
  "Security": {
    "AllowedFrontendUrls": [
      "https://staging.your-domain.com",
      "https://dev.your-domain.com"
    ]
  }
}
```

### 3. DI登録（AppHost.cs）

```csharp
// セキュリティ関連サービスの登録
builder.Services.AddSingleton<FrontendUrlResolver>();
```

### 4. コントローラーの更新

#### 4.1 EmailChangeController

**変更箇所**: `pecus.WebApi/Controllers/Profile/EmailChangeController.cs`

```csharp
// Before
var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";

// After
var frontendUrl = _frontendUrlResolver.GetValidatedFrontendUrl(HttpContext);
```

#### 4.2 EntrancePasswordController

**変更箇所**: `pecus.WebApi/Controllers/Entrance/EntrancePasswordController.cs`

```csharp
// Before
var requestContext = _httpContextAccessor.HttpContext?.Request;
var baseUrl = requestContext != null
    ? $"{requestContext.Scheme}://{requestContext.Host}"
    : "https://localhost";

// After
var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl(HttpContext);
```

#### 4.3 AdminUserController

**変更箇所**: `pecus.WebApi/Controllers/Admin/AdminUserController.cs`

```csharp
// Before
var requestContext = _httpContextAccessor.HttpContext?.Request;
var baseUrl = requestContext != null
    ? $"{requestContext.Scheme}://{requestContext.Host}"
    : "https://localhost";

// After
var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl(HttpContext);
```

#### 4.4 TestEmailController（開発用）

**変更箇所**: `pecus.WebApi/Controllers/Dev/TestEmailController.cs`

```csharp
// Before
var request = _httpContextAccessor.HttpContext?.Request;
var baseUrl = request != null
    ? $"{request.Scheme}://{request.Host}"
    : "https://localhost";

// After
var baseUrl = _frontendUrlResolver.GetDefaultFrontendUrl();
```

**開発用の特別扱い**:
- Origin検証をスキップ
- ホワイトリストの最初のURLを使用
- テスト送信時の利便性を優先

## セキュリティ上の利点

### 1. フィッシング攻撃の防止

**攻撃シナリオ**:
```
攻撃者 → POST /api/entrance/password/forgot
        Body: { email: "victim@example.com", frontendUrl: "https://evil.com" }
        ↓
システム → メール送信
        To: victim@example.com
        Body: パスワードリセット: https://evil.com/reset?token=xyz
        ↓
ユーザー → evil.comにアクセス
        → トークンとパスワードを入力
        → 攻撃者がトークンを窃取
```

**防御メカニズム**:
```
攻撃者 → POST /api/entrance/password/forgot
        Origin: https://evil.com
        ↓
FrontendUrlResolver → ホワイトリスト検証
        → "https://evil.com" is NOT in whitelist
        → UnauthorizedAccessException
        ↓
システム → 403 Forbidden（メール送信なし）
```

### 2. Hostヘッダーインジェクション対策

**攻撃シナリオ**:
```
攻撃者 → POST /api/entrance/password/forgot
        Host: evil.com
        ↓
システム → Request.Hostを信頼
        → https://evil.com/reset?token=xyz を生成
```

**防御メカニズム**:
- Hostヘッダーは使用しない
- Originヘッダー（ブラウザが自動設定）のみ信頼
- ホワイトリストで厳密に検証

### 3. オープンリダイレクト対策

**攻撃シナリオ**:
```
正規メール → https://app.example.com/reset?token=xyz&redirect=https://evil.com
        ↓
ユーザー → パスワードリセット完了
        → evil.comにリダイレクト
```

**防御メカニズム**:
- リダイレクトパラメータを受け付けない
- ホワイトリストURLのみ使用
- アプリケーション内のルーティングで制御

## 運用上の注意点

### 1. ホワイトリストの管理

**追加が必要なケース**:
- 新しいフロントエンドドメインを追加
- サブドメインを変更
- ステージング環境を追加

**設定ファイルの更新**:
```json
{
  "Security": {
    "AllowedFrontendUrls": [
      "https://app.example.com",
      "https://www.example.com",        // 新規追加
      "https://staging.example.com"
    ]
  }
}
```

### 2. Originヘッダーがない場合

**シナリオ**:
- 直接APIを叩く（Postmanなど）
- メールのリンクからアクセス（Refererなし）
- 古いブラウザ

**対応**:
1. Refererヘッダーをチェック
2. デフォルトURL（ホワイトリストの最初）を返す
3. ログに警告を出力

### 3. ログ監視

**重要なログ**:
```
[Warning] Rejected Origin header (not in whitelist): https://evil.com
[Warning] Neither Origin nor Referer header found. Using default frontend URL.
[Information] Origin header validated: https://app.example.com
```

**監視ポイント**:
- Rejectedログが頻発 → 攻撃の可能性
- デフォルトURL使用が多い → クライアント実装の問題
- 特定IPからの連続Rejected → IPブロック検討

## テスト方法

### 1. 正常系テスト

```bash
# 開発環境（localhost:3000）
curl -X POST http://localhost:5000/api/entrance/password/forgot \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"email": "test@example.com"}'

# 期待結果: 200 OK、メール送信（http://localhost:3000/reset?token=...）
```

### 2. 異常系テスト（不正なOrigin）

```bash
curl -X POST http://localhost:5000/api/entrance/password/forgot \
  -H "Content-Type: application/json" \
  -H "Origin: https://evil.com" \
  -d '{"email": "test@example.com"}'

# 期待結果: 401 Unauthorized
# レスポンス: { "message": "フロントエンドURL 'https://evil.com' は許可されていません。" }
```

### 3. Originヘッダーなし（デフォルトURL使用）

```bash
curl -X POST http://localhost:5000/api/entrance/password/forgot \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 期待結果: 200 OK、メール送信（デフォルトURL使用）
```

### 4. 複数フロントエンドドメインのテスト

```bash
# ステージング環境
curl -X POST https://api.staging.example.com/api/entrance/password/forgot \
  -H "Content-Type: application/json" \
  -H "Origin: https://staging.example.com" \
  -d '{"email": "test@example.com"}'

# 本番環境
curl -X POST https://api.example.com/api/entrance/password/forgot \
  -H "Content-Type: application/json" \
  -H "Origin: https://app.example.com" \
  -d '{"email": "test@example.com"}'
```

## 将来の拡張

### 1. 動的ホワイトリスト（データベース管理）

```csharp
public class FrontendUrlResolver
{
    private readonly ApplicationDbContext _context;

    public async Task<string> GetValidatedFrontendUrlAsync(HttpContext httpContext)
    {
        var allowedUrls = await _context.AllowedFrontendUrls
            .Where(u => u.IsActive)
            .Select(u => u.Url)
            .ToListAsync();

        // 検証ロジック
    }
}
```

### 2. ドメインごとのレート制限

```csharp
// Redis等でOriginごとのリクエスト数を記録
var key = $"rate-limit:{origin}";
var count = await _cache.IncrementAsync(key);

if (count > 100) // 1時間あたり100リクエスト
{
    throw new TooManyRequestsException();
}
```

### 3. Originヘッダーのログ分析

```sql
-- 不正なOriginヘッダーの集計
SELECT origin, COUNT(*) as attempts
FROM security_logs
WHERE event_type = 'REJECTED_ORIGIN'
  AND created_at >= NOW() - INTERVAL '1 day'
GROUP BY origin
ORDER BY attempts DESC;
```

## 関連ドキュメント

- [Global Exception Handling](./global-exception-handling.md)
- [API認証クライアント](./api-auth-client.md)
- [Redis トークンストア](./redis-token-store.md)

## 変更履歴

| 日付 | 変更内容 | 担当者 |
|------|----------|--------|
| 2025-01-27 | 初版作成、FrontendUrlResolver実装 | - |

## 参考資料

- [OWASP: Open Redirect](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
- [OWASP: Host Header Injection](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/17-Testing_for_Host_Header_Injection)
- [MDN: Origin Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin)
