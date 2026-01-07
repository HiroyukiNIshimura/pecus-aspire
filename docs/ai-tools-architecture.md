# AI Tools アーキテクチャ

## AI エージェント向け要約（必読）

- **ツール追加時**: `IAiTool` を実装し、`AiToolsExtensions.cs` に DI 登録を追加
- **スコア計算**: `CalculateRelevanceScore()` で 0-100 のスコアを返す（50以上で実行対象）
- **結果マージ**: 複数ツールの結果は `---` 区切りでマージされる
- **Function Calling対応**: `GetDefinition()` で JSON Schema 形式の定義を返す

## 概要

AI Tools は MCP (Model Context Protocol) 的なデザインパターンを採用したツールベースのアーキテクチャです。
Bot がユーザーメッセージに応答する際、メッセージの感情分析結果に基づいて適切なツールを動的に選択・実行し、コンテキストを生成します。

## ディレクトリ構造

```
pecus.Libs/AI/
├── Extensions/
│   └── AiToolsExtensions.cs        # DI 登録拡張メソッド
└── Tools/
    ├── IAiTool.cs                  # ツールの共通インターフェース
    ├── AiToolContext.cs            # ツール実行コンテキスト
    ├── AiToolResult.cs             # ツール実行結果
    ├── AiToolDefinition.cs         # Function Calling 用定義
    ├── AiToolExecutor.cs           # ツール実行オーケストレーター
    └── Implementations/
        ├── GetUserTasksTool.cs     # タスク取得ツール
        └── SearchInformationTool.cs # 情報検索ツール
```

## 新しいツールの追加方法

### 1. IAiTool を実装するクラスを作成

```csharp
using Pecus.Libs.AI.Tools;

namespace Pecus.Libs.AI.Tools.Implementations;

public class MyNewTool : IAiTool
{
    private readonly IMyService _myService;

    // ツール名（一意識別子）
    public string Name => "my_new_tool";

    // ツールの説明（AI向け）
    public string Description => "このツールは○○を取得します。ユーザーが「○○」と尋ねた時に使用します。";

    // 基本優先度（同スコア時のタイブレーカー、高いほど優先）
    public int BasePriority => 80;

    public MyNewTool(IMyService myService)
    {
        _myService = myService;
    }

    // Function Calling 用の定義
    public AiToolDefinition GetDefinition() => new()
    {
        Name = Name,
        Description = Description,
        Parameters = new AiToolParameters
        {
            Properties =
            [
                new AiToolParameter
                {
                    Name = "query",
                    Type = "string",
                    Description = "検索クエリ"
                },
                new AiToolParameter
                {
                    Name = "limit",
                    Type = "integer",
                    Description = "取得件数（デフォルト: 5）"
                }
            ],
            Required = ["query"]
        }
    };

    // 関連度スコアを計算（0-100）
    public int CalculateRelevanceScore(AiToolContext context)
    {
        if (context.SentimentResult == null)
        {
            return 0;
        }

        // 例: InformationSeekingScore をベースにスコアを計算
        var baseScore = context.SentimentResult.InformationSeekingScore;

        // 特定のトピックが含まれている場合はスコアを上げる
        if (context.UserMessage?.Contains("○○") == true)
        {
            return Math.Min(100, baseScore + 20);
        }

        return baseScore;
    }

    // ツールを実行
    public async Task<AiToolResult> ExecuteAsync(
        AiToolContext context,
        CancellationToken cancellationToken = default)
    {
        // Function Calling からの引数を取得
        var query = context.FunctionArguments?.TryGetValue("query", out var q) == true
            ? q?.ToString()
            : context.SentimentResult?.InformationTopic;

        if (string.IsNullOrWhiteSpace(query))
        {
            return AiToolResult.Empty(Name);
        }

        // サービスを呼び出してデータを取得
        var result = await _myService.GetDataAsync(query, cancellationToken);

        if (result == null)
        {
            return AiToolResult.Empty(Name);
        }

        // コンテキストプロンプトを生成
        var prompt = BuildContextPrompt(result);

        return new AiToolResult
        {
            Success = true,
            ToolName = Name,
            ContextPrompt = prompt,
            SuggestedRole = RoleRandomizer.SecretaryRole,
            DebugInfo = $"Found {result.Count} items"
        };
    }

    private static string BuildContextPrompt(MyResult result)
    {
        var sb = new StringBuilder();
        sb.AppendLine("【参考情報】○○に関する情報:");
        // ... プロンプトを構築
        return sb.ToString();
    }
}
```

### 2. DI 登録を追加

`pecus.Libs/AI/Extensions/AiToolsExtensions.cs` に登録を追加：

```csharp
public static IServiceCollection AddAiTools(this IServiceCollection services)
{
    services.AddScoped<IAiTool, GetUserTasksTool>();
    services.AddScoped<IAiTool, SearchInformationTool>();
    services.AddScoped<IAiTool, MyNewTool>();  // 追加
    services.AddScoped<IAiToolExecutor, AiToolExecutor>();
    return services;
}
```

## 主要なインターフェース

### IAiTool

| メンバー | 説明 |
|---------|------|
| `Name` | ツールの一意識別子 |
| `Description` | AI向けのツール説明 |
| `BasePriority` | 基本優先度（0-100、高いほど優先） |
| `GetDefinition()` | Function Calling 用の JSON Schema 定義 |
| `CalculateRelevanceScore()` | 関連度スコアを計算（0-100） |
| `ExecuteAsync()` | ツールを実行 |

### AiToolContext

| プロパティ | 説明 |
|-----------|------|
| `UserId` | ユーザーID（必須） |
| `UserMessage` | ユーザーのメッセージ |
| `SentimentResult` | メッセージの感情分析結果 |
| `FunctionArguments` | Function Calling からの引数 |

### AiToolResult

| プロパティ | 説明 |
|-----------|------|
| `Success` | 実行成功フラグ |
| `ContextPrompt` | 生成されたコンテキストプロンプト |
| `SuggestedRole` | 推奨されるロール設定 |
| `ToolName` | ツール名 |
| `DebugInfo` | デバッグ情報 |

## ツール実行の流れ

```
1. ユーザーメッセージを受信
2. IMessageAnalyzer でメッセージを分析 → MessageSentimentResult
3. IAiToolExecutor.ExecuteAsync() を呼び出し
   a. 全ツールの CalculateRelevanceScore() を計算
   b. minRelevanceScore (デフォルト: 50) 以上のツールをフィルタ
   c. スコア降順 → BasePriority 降順でソート
   d. maxTools (デフォルト: 2) 件まで実行
   e. 結果をマージ
4. マージされたコンテキストを AI プロンプトに含める
```

## Function Calling 対応

将来的に AI が直接ツールを選択できるよう、JSON Schema 形式でツール定義をエクスポート可能：

```csharp
// 全ツールの定義を取得
var definitions = _toolExecutor.GetAllToolDefinitions();

// OpenAI 形式に変換
var openAiTools = definitions.Select(d => d.ToOpenAiFormat()).ToList();

// Anthropic 形式に変換
var anthropicTools = definitions.Select(d => d.ToAnthropicFormat()).ToList();
```

## 既存ツール

| ツール | 説明 | トリガー条件 |
|--------|------|-------------|
| `get_user_tasks` | ユーザーのタスク一覧を取得 | GuidanceSeekingScore >= 50 |
| `search_information` | ワークスペース内の情報を検索 | InformationSeekingScore >= 50 かつ InformationTopic あり |

## 注意事項

- ツールは Scoped で登録されるため、リクエストごとに新しいインスタンスが作成される
- `CalculateRelevanceScore()` は軽量に保つこと（DB アクセスなどは避ける）
- `ExecuteAsync()` 内で例外が発生しても、他のツールの実行には影響しない
- 複数ツールの結果は `---` 区切りでマージされる
