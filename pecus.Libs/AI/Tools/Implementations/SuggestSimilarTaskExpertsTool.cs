using Microsoft.EntityFrameworkCore;
using Pecus.Libs.AI.Tools;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.Hangfire.Tasks.Services;

namespace Pecus.Libs.AI.Tools.Implementations;

/// <summary>
/// 類似タスク経験者を提案するツール
/// HelpWanted コメント時に、同じタスクタイプを完了した経験者を検索する
/// </summary>
public class SuggestSimilarTaskExpertsTool : IAiTool
{
    private readonly ApplicationDbContext _context;
    private readonly ITaskAssignmentSuggester _taskAssignmentSuggester;
    private readonly IAiClientFactory _aiClientFactory;

    /// <inheritdoc />
    public string Name => "suggest_similar_task_experts";

    /// <inheritdoc />
    public string Description => "類似タスクを完了した経験者を提案します。「誰に聞けばいい？」「経験者いる？」などの質問や、HelpWanted時に使用します。";

    /// <inheritdoc />
    public int BasePriority => 70;

    /// <summary>
    /// SuggestSimilarTaskExpertsTool のコンストラクタ
    /// </summary>
    public SuggestSimilarTaskExpertsTool(
        ApplicationDbContext context,
        ITaskAssignmentSuggester taskAssignmentSuggester,
        IAiClientFactory aiClientFactory)
    {
        _context = context;
        _taskAssignmentSuggester = taskAssignmentSuggester;
        _aiClientFactory = aiClientFactory;
    }

    /// <inheritdoc />
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
                    Name = "organizationId",
                    Type = "integer",
                    Description = "組織ID"
                },
                new AiToolParameter
                {
                    Name = "taskTypeId",
                    Type = "integer",
                    Description = "タスク種類ID"
                },
                new AiToolParameter
                {
                    Name = "taskContent",
                    Type = "string",
                    Description = "タスクの内容"
                },
                new AiToolParameter
                {
                    Name = "excludeUserId",
                    Type = "integer",
                    Description = "除外するユーザーID（タスク担当者自身）"
                }
            ],
            Required = ["organizationId", "taskTypeId", "taskContent"]
        }
    };

    /// <inheritdoc />
    public int CalculateRelevanceScore(AiToolContext context)
    {
        // このツールは明示的に呼び出す用途がメイン
        // AiChatReplyTask から自動選択される場合は MessageSentimentResult を使う
        // 現状は SentimentResult に「相談相手を求めている」スコアがないため 0 を返す
        return 0;
    }

    /// <inheritdoc />
    public async Task<AiToolResult> ExecuteAsync(
        AiToolContext context,
        CancellationToken cancellationToken = default)
    {
        if (context.FunctionArguments == null)
        {
            return AiToolResult.Failure(Name, "FunctionArguments is required");
        }

        if (!TryGetArgument<int>(context.FunctionArguments, "organizationId", out var organizationId))
        {
            return AiToolResult.Failure(Name, "organizationId is required");
        }

        if (!TryGetArgument<int>(context.FunctionArguments, "taskTypeId", out var taskTypeId)
            || taskTypeId <= 0)
        {
            // タスク種類が未設定の場合は提案不可
            return AiToolResult.Empty(Name);
        }

        if (!TryGetArgument<string>(context.FunctionArguments, "taskContent", out var taskContent)
            || string.IsNullOrWhiteSpace(taskContent))
        {
            return AiToolResult.Failure(Name, "taskContent is required");
        }

        TryGetArgument<int>(context.FunctionArguments, "excludeUserId", out var excludeUserId);

        var setting = await _context.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId, cancellationToken);

        if (setting == null ||
            setting.GenerativeApiVendor == DB.Models.Enums.GenerativeApiVendor.None ||
            string.IsNullOrEmpty(setting.GenerativeApiKey) ||
            string.IsNullOrEmpty(setting.GenerativeApiModel))
        {
            return AiToolResult.Empty(Name);
        }

        var aiClient = _aiClientFactory.CreateClient(
            setting.GenerativeApiVendor,
            setting.GenerativeApiKey,
            setting.GenerativeApiModel);

        if (aiClient == null)
        {
            return AiToolResult.Empty(Name);
        }

        var suggestions = await _taskAssignmentSuggester.SuggestAssigneesAsync(
            aiClient,
            organizationId,
            taskTypeId,
            taskContent,
            limit: 1,
            cancellationToken);

        if (suggestions.Count == 0)
        {
            return AiToolResult.Empty(Name);
        }

        var topSuggestion = suggestions[0];

        if (excludeUserId > 0 && topSuggestion.UserId == excludeUserId)
        {
            return AiToolResult.Empty(Name);
        }

        var suggestedTask = await GetMostRecentSimilarTaskAsync(
            organizationId,
            taskTypeId,
            topSuggestion.UserId,
            cancellationToken);

        if (suggestedTask == null)
        {
            return AiToolResult.Empty(Name);
        }

        var contextPrompt = BuildSuggestionMessage(
            topSuggestion.DisplayName,
            suggestedTask.Workspace?.Code ?? suggestedTask.Workspace?.Name ?? "Unknown",
            suggestedTask.WorkspaceItem?.Code ?? "0",
            suggestedTask.Sequence);

        return new AiToolResult
        {
            Success = true,
            ToolName = Name,
            ContextPrompt = contextPrompt,
            SuggestedRole = RoleRandomizer.SecretaryRole,
            DebugInfo = $"Suggested: {topSuggestion.DisplayName} (UserId={topSuggestion.UserId})"
        };
    }

    /// <summary>
    /// 指定ユーザーの最近の類似タスクを取得する
    /// </summary>
    private async Task<WorkspaceTask?> GetMostRecentSimilarTaskAsync(
        int organizationId,
        int taskTypeId,
        int userId,
        CancellationToken cancellationToken)
    {
        return await _context.WorkspaceTasks
            .Include(t => t.Workspace)
            .Include(t => t.WorkspaceItem)
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.TaskTypeId == taskTypeId)
            .Where(t => t.AssignedUserId == userId)
            .Where(t => t.IsCompleted)
            .OrderByDescending(t => t.CompletedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    /// <summary>
    /// 提案メッセージを生成する
    /// </summary>
    private static string BuildSuggestionMessage(
        string suggestedUserName,
        string workspaceCode,
        string itemCode,
        int taskSequence)
    {
        return $"過去に{suggestedUserName}さんが似たような作業[{workspaceCode}#{itemCode}T{taskSequence}]をしています。相談してみてはいかがでしょうか？";
    }

    /// <summary>
    /// FunctionArguments から引数を取得する
    /// </summary>
    private static bool TryGetArgument<T>(Dictionary<string, object> args, string key, out T value)
    {
        value = default!;

        if (!args.TryGetValue(key, out var obj) || obj == null)
        {
            return false;
        }

        if (obj is T typedValue)
        {
            value = typedValue;
            return true;
        }

        try
        {
            value = (T)Convert.ChangeType(obj, typeof(T));
            return true;
        }
        catch
        {
            return false;
        }
    }
}
