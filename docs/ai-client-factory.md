# AIクライアントファクトリー 利用ガイド

## 概要

`IAiClientFactory` は、AIプロバイダー（OpenAI、Gemini、DeepSeek）へのアクセスを提供するファクトリーです。

### 2つの利用パターン

| パターン | メソッド | APIキーの取得元 | 用途 |
|---------|---------|----------------|------|
| システムデフォルト | `GetDefaultClient()` | `appsettings.json` | Bot、通知、内部処理 |
| 組織設定 | `CreateClient(vendor, apiKey)` | 組織設定テーブル | ユーザー向けAI機能 |

## 基本的な使い方

### 1. システムデフォルトを使用する場合

Bot（タイプ: System） やシステム内部処理など、特定の組織に紐づかない処理で使用します。

```csharp
public class SomeBackgroundService
{
    private readonly IAiClientFactory _aiClientFactory;

    public SomeBackgroundService(IAiClientFactory aiClientFactory)
    {
        _aiClientFactory = aiClientFactory;
    }

    public async Task ProcessAsync(CancellationToken ct)
    {
        // システムデフォルトのAIクライアントを取得
        var aiClient = _aiClientFactory.GetDefaultClient();

        var result = await aiClient.GenerateTextAsync(
            systemPrompt: "あなたはアシスタントです。",
            userPrompt: "こんにちは",
            ct);
    }
}
```

### 2. 組織設定を使用する場合

組織ごとに設定されたAIプロバイダー・APIキーを使用します。

```csharp
public class DocumentService
{
    private readonly ApplicationDbContext _context;
    private readonly IAiClientFactory _aiClientFactory;

    public DocumentService(ApplicationDbContext context, IAiClientFactory aiClientFactory)
    {
        _context = context;
        _aiClientFactory = aiClientFactory;
    }

    public async Task<string?> GenerateContentAsync(int organizationId, string prompt, CancellationToken ct)
    {
        // 組織設定を取得
        var setting = await _context.OrganizationSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId, ct);

        if (setting == null)
        {
            return null;
        }

        // 組織設定のベンダー・APIキーでクライアントを生成
        var aiClient = _aiClientFactory.CreateClient(
            setting.GenerativeApiVendor,
            setting.GenerativeApiKey);

        if (aiClient == null)
        {
            // 組織にAI設定がない（None または APIキー未設定）
            return null;
        }

        return await aiClient.GenerateTextAsync(
            systemPrompt: "あなたはアシスタントです。",
            userPrompt: prompt,
            ct);
    }
}
```

## IAiClient のメソッド

```csharp
public interface IAiClient
{
    // テキスト生成
    Task<string> GenerateTextAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default);

    // JSON形式で構造化レスポンスを生成
    Task<T> GenerateJsonAsync<T>(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default) where T : class;

    // タイトルからMarkdown本文を生成
    Task<string> GenerateMarkdownFromTitleAsync(
        string title,
        string? additionalContext = null,
        CancellationToken cancellationToken = default);
}
```

## 設定

### appsettings.json（システムデフォルト用）

```jsonc
{
  "DeepSeek": {
    "ApiKey": "sk-xxx",           // 必須
    "BaseUrl": "https://api.deepseek.com",
    "DefaultModel": "deepseek-chat",
    "TimeoutSeconds": 60,
    "DefaultMaxTokens": 2048,
    "DefaultTemperature": 0.7
  }
}
```

### 組織設定テーブル

| カラム | 説明 |
|--------|------|
| `GenerativeApiVendor` | `None`, `OpenAi`, `GoogleGemini`, `DeepSeek` |
| `GenerativeApiKey` | 組織が契約したAPIキー |

## 注意事項

- `GetDefaultClient()` はシステムの `appsettings.json` に APIキーが設定されていない場合、`InvalidOperationException` をスローします
- `CreateClient()` は `vendor` が `None` または `apiKey` が空の場合、`null` を返します
- 組織設定の取得（DBアクセス）はサービス層の責務です。ファクトリーはDBにアクセスしません
