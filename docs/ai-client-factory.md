# AIクライアントファクトリー 利用ガイド

## 概要

`IAiClientFactory` は、**組織ごとに設定された生成AIプロバイダー**へのアクセスを提供するファクトリーです。

- 対応プロバイダー: OpenAI / Anthropic / Google Gemini / DeepSeek / Kimi
- 使用するプロバイダー・APIキー・モデルは、すべて組織設定（`OrganizationSettings`）から取得する
- システム共通の「デフォルトAI」という概念は持たない（設定が無い組織ではAI機能を実行しない）

## 基本的な使い方

### 組織設定からクライアントを生成する

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
        // 組織設定を取得（ベンダー・APIキー・モデル名）
        var setting = await _context.OrganizationSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId, ct);

        if (setting == null ||
            setting.GenerativeApiVendor == GenerativeApiVendor.None ||
            string.IsNullOrEmpty(setting.GenerativeApiKey) ||
            string.IsNullOrEmpty(setting.GenerativeApiModel))
        {
            // 組織にAI設定がない場合は機能をスキップする
            return null;
        }

        var aiClient = _aiClientFactory.CreateClient(
            setting.GenerativeApiVendor,
            setting.GenerativeApiKey,
            setting.GenerativeApiModel);

        if (aiClient == null)
        {
            // 未対応ベンダー
            return null;
        }

        return await aiClient.GenerateTextAsync(
            systemPrompt: "あなたはアシスタントです。",
            userPrompt: prompt,
            ct);
    }
}
```

### 役割分担

- **ファクトリー**: ベンダー・APIキー・モデルからクライアントを生成する。DB にはアクセスしない
- **呼び出し側（サービス層・Hangfire タスク）**: 組織設定の取得、設定不足時のスキップ、警告ログの出力
- **クライアント**: HTTP リクエストの組み立てとレスポンスの検証。認証情報はプロバイダーの境界に閉じる

## IAiClient のメソッド

```csharp
public interface IAiClient
{
    // テキスト生成
    Task<string> GenerateTextAsync(
        string systemPrompt,
        string userPrompt,
        string? persona = null,
        CancellationToken cancellationToken = default);

    // system / user / assistant を任意の順序で指定してテキスト生成
    Task<string> GenerateTextWithMessagesAsync(
        IEnumerable<(MessageRole Role, string Content)> messages,
        string? persona = null,
        CancellationToken cancellationToken = default);

    // 構造化レスポンス（型から JSON Schema を生成して強制する）
    Task<T> GenerateJsonAsync<T>(
        string systemPrompt,
        string userPrompt,
        string? persona = null,
        CancellationToken cancellationToken = default) where T : class;

    // タイトルから Markdown 本文を生成
    Task<string> GenerateMarkdownFromTitleAsync(
        string title,
        string? additionalContext = null,
        string? persona = null,
        CancellationToken cancellationToken = default);

    // 利用可能なモデル一覧を取得
    Task<IReadOnlyList<AvailableModel>> GetAvailableModelsAsync(
        string apiKey,
        CancellationToken cancellationToken = default);
}
```

## 構造化出力（Structured Outputs）

### 仕組み

`GenerateJsonAsync<T>` は、**型 `T` から JSON Schema を自動生成してリクエストに含めます**。呼び出し側でスキーマを書く必要はありません。

```csharp
var result = await aiClient.GenerateJsonAsync<ConversationTargetResult>(
    systemPrompt, userPrompt, persona, ct);
```

スキーマ生成は [`AiJsonSchemaBuilder`](../pecus.Libs/AI/Schema/AiJsonSchemaBuilder.cs) が担当し、
.NET の `JsonSchemaExporter` で DTO を JSON Schema に変換したうえで、プロバイダーごとのサブセットへ正規化します。

### プロバイダー別の送信方法

| プロバイダー | スキーマ指定 | スキーマ生成に失敗した場合 |
|---|---|---|
| OpenAI | `response_format.json_schema`（`strict: true`） | `json_object` + プロンプト指示 |
| Anthropic | `output_config.format`（`json_schema`） | プロンプト指示のみ |
| Google Gemini | `generationConfig.responseJsonSchema` + `responseMimeType` | `application/json` + プロンプト指示 |
| Kimi | `response_format.json_schema`（`strict: true`） | `json_object` + プロンプト指示 |
| DeepSeek | 非対応（`json_object` のみ） | 常に `json_object` + プロンプト指示 |

スキーマを送らない場合でも「JSON のみを返す」プロンプト指示（[`JsonPromptHelper`](../pecus.Libs/AI/Prompts/Common/JsonPromptHelper.cs)）は付与されるため、
モデルがスキーマに対応していなくても従来どおり動作します。

### スキーマの正規化ルール

[`AiJsonSchemaProfile`](../pecus.Libs/AI/Schema/AiJsonSchemaProfile.cs) ごとに、送信前に以下を適用します。

| 正規化 | OpenAI | Anthropic | Gemini | Kimi |
|---|---|---|---|---|
| 全プロパティを `required` 化 | 必須 | − | − | − |
| `additionalProperties: false` | 必須 | 必須 | − | 付与 |
| 数値・文字列制約の除去 | − | 必須（未対応で 400） | 除去（サーバーが無視） | − |
| `minItems` / `maxItems` の調整 | − | `minItems` は 0/1 のみ、`maxItems` は除去 | − | − |
| 非対応キーワードの除去 | `allOf` / `not` / `if` 系 | `allOf` 等 | 長さ制約等 | `allOf` / `not` / `if` 系 |

また、スキーマ生成時に以下を自動補正します。

- **カスタム `JsonConverter` を持つプロパティ**: 型情報が失われるため、CLR 型から型を補完（参照型・`Nullable<T>` は `null` 許容に）
- **get-only の計算プロパティ**: デシリアライズできないためスキーマから除外（モデルに不要な値を生成させない）
- **型を特定できないプロパティが残った場合**: スキーマ生成を失敗させ、プロンプト方式へフォールバック

### 無効化（フォールバック制御）

プロバイダー設定の `EnableStructuredOutput`（既定 `true`）で、スキーマ送信を無効にできます。
モデルがスキーマを受け付けず 400 になる場合の回避手段です。

```jsonc
{
  "Gemini": {
    "EnableStructuredOutput": false
  }
}
```

設定値は [`config/settings.base.json`](../config/settings.base.json) の `_shared` に追加し、
`node scripts/generate-appsettings.js` で各サービスの `appsettings.json` へ反映します。

### レスポンス検証

スキーマを強制しても、拒否・打ち切り・ブロックは発生します。
各クライアントは JSON パース前に以下を検出し、原因の分かる例外を投げます。

| 検出内容 | OpenAI / Kimi / DeepSeek | Anthropic | Gemini |
|---|---|---|---|
| 拒否 | `message.refusal` | `stop_reason = "refusal"` | `finishReason = SAFETY` 等 |
| 打ち切り | `finish_reason = "length"` | `stop_reason = "max_tokens"` | `finishReason = MAX_TOKENS` |
| コンテンツフィルタ | `finish_reason = "content_filter"` | − | `promptFeedback.blockReason` |

### DTO 設計時の注意

- スキーマの対象は**設定可能（setter を持つ）プロパティのみ**
- 計算プロパティ（式形式のプロパティ）はスキーマ対象外。`[JsonIgnore]` の付与は不要
- `Dictionary<string, object>` や `object` など型を特定できないプロパティを含む型は、スキーマ生成に失敗してフォールバックする
- Anthropic を利用する場合、`anthropic-version`（`Anthropic:ApiVersion`）は構造化出力に対応したバージョン（`2026-10-21` 以降）が必要

## 設定

### プロバイダー接続設定（appsettings.json）

APIキーとモデルは組織設定テーブルで管理するため、`appsettings.json` には**接続先と生成パラメータのみ**を定義します。

```jsonc
{
  "OpenAI": {
    "BaseUrl": "https://api.openai.com/v1",
    "TimeoutSeconds": 60,
    "DefaultMaxTokens": 2048,
    "DefaultTemperature": 0.7,
    "ModelCreatedAfter": "2024-01-01",
    "EnableStructuredOutput": true,
    // temperature を送信しない推論モデルの判定（前方一致・部分一致、カンマ区切り）
    "ReasoningModelPrefixes": "o1,o3,gpt-5",
    "ReasoningModelContains": "-o1,-o3"
  },
  "Anthropic": {
    "BaseUrl": "https://api.anthropic.com/v1",
    "ApiVersion": "2026-10-21",
    "TimeoutSeconds": 60,
    "DefaultMaxTokens": 2048,
    "DefaultTemperature": 0.7,
    "EnableStructuredOutput": true
  },
  "Gemini": {
    "BaseUrl": "https://generativelanguage.googleapis.com/v1beta",
    "TimeoutSeconds": 60,
    "DefaultMaxTokens": 2048,
    "DefaultTemperature": 0.7,
    "EnableStructuredOutput": true
  },
  "DeepSeek": {
    "BaseUrl": "https://api.deepseek.com",
    "TimeoutSeconds": 60,
    "DefaultMaxTokens": 2048,
    "DefaultTemperature": 0.7
  },
  "Kimi": {
    "BaseUrl": "https://api.moonshot.ai/v1",
    "TimeoutSeconds": 120,
    "DefaultMaxTokens": 4096,
    "DefaultTemperature": 0.7,
    "EnableStructuredOutput": true
  }
}
```

### 組織設定テーブル

| カラム | 説明 |
|--------|------|
| `GenerativeApiVendor` | `None`, `OpenAi`, `Anthropic`, `GoogleGemini`, `DeepSeek`, `Kimi` |
| `GenerativeApiKey` | 組織が契約したAPIキー |
| `GenerativeApiModel` | 使用するモデル名 |

3つとも揃っていない場合、呼び出し側はAI機能を実行しません。

## 注意事項

- `CreateClient()` は `vendor` が `None`、または未対応のベンダーの場合 `null` を返します
- 組織設定の取得（DBアクセス）はサービス層の責務です。ファクトリーはDBにアクセスしません
- APIキーはクエリ文字列ではなくヘッダーで送信します（Gemini は `x-goog-api-key`）
- JSON を要求した際の拒否・打ち切りは `InvalidOperationException` として通知されます。呼び出し側でリトライする場合は原因（`refusal` / トークン上限）を判別してから行ってください
