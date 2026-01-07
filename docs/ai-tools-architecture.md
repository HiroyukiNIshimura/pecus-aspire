# AI Tools アーキテクチャ

## AI エージェント向け要約（必読）

- **ツール追加時**: `IAiTool` を実装し、`AiToolsExtensions.cs` に DI 登録を追加
- **スコア計算**: `CalculateRelevanceScore()` で 0-100 のスコアを返す（50以上で実行対象）
- **結果マージ**: 複数ツールの結果は `---` 区切りでマージされる
- **Function Calling対応**: `GetDefinition()` で JSON Schema 形式の定義を返す

## AI 関連機能の分類

`pecus.Libs/AI` 配下の機能は以下の3つに分類されます：

| 分類 | 目的 | 配置場所 | 例 |
|------|------|----------|-----|
| **Tools** | AIに渡す情報を集める（コンテキスト収集） | `AI/Tools/` | `GetUserTasksTool`, `SearchInformationTool`, `SuggestSimilarTaskExpertsTool` |
| **Prompts** | AIに渡すプロンプトを構築 | `AI/Prompts/` | `ItemCreatedPromptTemplate`, `TaskUpdatedPromptTemplate`, `HelpWantedPromptTemplate` |
| **Services** | AIを使って判定/抽出/分析を行う | `Hangfire/Tasks/Services/` 等 | `TaskAssignmentSuggester`, `DateExtractor`, `MessageAnalyzer`, `BotSelector` |

### 判断基準

- **Tools**: 「AIに渡すコンテキストを集める」→ ✅ ツール化
- **Prompts**: 「AIに渡すプロンプトを構築する」→ ✅ テンプレート化
- **Services**: 「AIを使って何かを抽出/判定する」→ ❌ ツール化しない（専用サービスとして実装）

### 例: SuggestSimilarTaskExpertsTool の構成

```
SuggestSimilarTaskExpertsTool (Tool)
  └─ ITaskAssignmentSuggester (Service) を呼び出し
       └─ AIを使って類似タスク担当者を判定
  └─ 結果を「〇〇さんが経験してます」というコンテキストに変換
```

ツール自体の役割は「サービスの結果をAIに渡すコンテキスト（プロンプト文字列）に変換する」ことです。

## 概要

AI Tools は MCP (Model Context Protocol) 的なデザインパターンを採用したツールベースのアーキテクチャです。
Bot がユーザーメッセージに応答する際、メッセージの感情分析結果に基づいて適切なツールを動的に選択・実行し、コンテキストを生成します。

## ディレクトリ構造

```
pecus.Libs/AI/
├── Extensions/
│   └── AiToolsExtensions.cs           # DI 登録拡張メソッド
├── Prompts/                           # プロンプトテンプレート
│   ├── IPromptTemplate.cs             # 共通インターフェース
│   └── Notifications/                 # 通知系テンプレート
│       ├── ItemCreatedPromptTemplate.cs
│       ├── ItemUpdatedPromptTemplate.cs
│       ├── TaskCreatedPromptTemplate.cs
│       ├── TaskUpdatedPromptTemplate.cs
│       └── HelpWantedPromptTemplate.cs
└── Tools/                             # コンテキスト収集ツール
    ├── IAiTool.cs                     # ツールの共通インターフェース
    ├── AiToolContext.cs               # ツール実行コンテキスト
    ├── AiToolResult.cs                # ツール実行結果
    ├── AiToolDefinition.cs            # Function Calling 用定義
    ├── AiToolExecutor.cs              # ツール実行オーケストレーター
    └── Implementations/
        ├── GetUserTasksTool.cs        # タスク取得ツール
        ├── SearchInformationTool.cs   # 情報検索ツール
        └── SuggestSimilarTaskExpertsTool.cs  # 類似タスク経験者提案

pecus.Libs/Hangfire/Tasks/Services/    # AI活用サービス
├── TaskAssignmentSuggester.cs         # 類似タスク担当者の推薦
└── DateExtractor.cs                   # テキストからの日付抽出
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
| `suggest_similar_task_experts` | 類似タスク経験者を提案 | 明示的呼び出しのみ（スコア常に0） |

## 既存プロンプトテンプレート

| テンプレート | 用途 | 使用箇所 |
|-------------|------|----------|
| `ItemCreatedPromptTemplate` | アイテム作成通知メッセージ生成 | `CreateItemTask` |
| `ItemUpdatedPromptTemplate` | アイテム更新通知メッセージ生成 | `UpdateItemTask` |
| `TaskCreatedPromptTemplate` | タスク作成通知メッセージ生成 | `CreateTaskTask` |
| `TaskUpdatedPromptTemplate` | タスク更新通知メッセージ生成 | `UpdateTaskTask` |
| `HelpWantedPromptTemplate` | HelpWanted通知メッセージ生成 | `TaskCommentHelpWantedTask` |

## 既存 AI 活用サービス

| サービス | 説明 | 使用箇所 |
|----------|------|----------|
| `ITaskAssignmentSuggester` | AIを使って類似タスクの担当者を判定 | `SuggestSimilarTaskExpertsTool` |
| `IDateExtractor` | AIを使ってテキストから日付を抽出 | `TaskCommentReminderTask` |
| `IMessageAnalyzer` | メッセージの感情分析 | `AiChatReplyTask`, `GroupChatReplyTask` |
| `IBotSelector` | コンテンツに基づくBot選択 | 各通知タスク |

## 注意事項

- ツールは Scoped で登録されるため、リクエストごとに新しいインスタンスが作成される
- `CalculateRelevanceScore()` は軽量に保つこと（DB アクセスなどは避ける）
- `ExecuteAsync()` 内で例外が発生しても、他のツールの実行には影響しない
- 複数ツールの結果は `---` 区切りでマージされる

## 補足: なぜ MCP サーバーではなく内部実装か

現時点では MCP (Model Context Protocol) サーバーを独立して構築せず、`pecus.BackFire` 内の内部実装としています。

### 理由

| 観点 | 内部実装のメリット |
|------|-------------------|
| **オーバーヘッド** | プロセス間通信・JSON-RPC のオーバーヘッドが不要 |
| **インフラ** | 別サービスのデプロイ・監視が不要、Aspire 構成がシンプル |
| **セキュリティ** | 認証済みコンテキスト内でのみ動作（下記参照） |
| **将来対応** | `GetDefinition()` で JSON Schema をエクスポート可能、Function Calling 移行時も再利用可 |

### セキュリティ面の考慮

MCP サーバーを外部公開すると以下のリスクがある：

- **認証・認可の複雑化**: 誰がアクセスしているか、どの組織・ユーザーの権限かを別途管理する必要がある
- **データ漏洩リスク**: 組織を跨いだデータアクセス、プロンプトインジェクションによるデータ抽出
- **AI 自律実行リスク**: 意図しないツールの連続呼び出し、パラメータ改ざん

現在の内部実装では：

- ツールは Hangfire タスク内で呼ばれ、`UserId` / `OrganizationId` が既に確定
- ツール選択は C# 側の `CalculateRelevanceScore()` で制御（AI に選択権限なし）
- データアクセスは `IFocusTaskProvider` / `IInformationSearchProvider` が権限制御

### MCP サーバーが必要になるケース

将来的に以下の要件が出た場合は、MCP サーバー化を検討：

- Claude Desktop など外部クライアントからツールを使いたい
- 複数アプリケーションで同じツールを共有したい
- AI に自律的にツールを選択させたい（Function Calling 経由）
