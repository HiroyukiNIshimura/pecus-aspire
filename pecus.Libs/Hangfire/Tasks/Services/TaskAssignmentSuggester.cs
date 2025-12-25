using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB;

namespace Pecus.Libs.Hangfire.Tasks.Services;

/// <summary>
/// 類似タスクの担当者推薦結果
/// </summary>
public record SuggestedAssignee(
    int UserId,
    string DisplayName,
    int CompletedSimilarTaskCount,
    string Reason
);

/// <summary>
/// LLMの類似タスク判定レスポンス
/// </summary>
internal class SimilarTasksAnalysisResponse
{
    /// <summary>
    /// 類似タスクの担当者リスト
    /// </summary>
    public List<SimilarAssigneeItem> SuggestedAssignees { get; set; } = [];
}

/// <summary>
/// 類似タスク担当者の個別項目
/// </summary>
internal class SimilarAssigneeItem
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// 類似タスクのインデックス番号リスト
    /// </summary>
    public List<int> SimilarTaskIndexes { get; set; } = [];

    /// <summary>
    /// 類似理由
    /// </summary>
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// タスクの類似性に基づく担当者推薦サービスのインターフェース
/// </summary>
public interface ITaskAssignmentSuggester
{
    /// <summary>
    /// 新しいタスクの内容に基づいて、類似タスクを完了した担当者を推薦します
    /// </summary>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="organizationId">組織ID</param>
    /// <param name="taskTypeId">タスク種類ID</param>
    /// <param name="newTaskContent">新しいタスクの内容</param>
    /// <param name="limit">推薦数の上限</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>推薦された担当者のリスト</returns>
    Task<IReadOnlyList<SuggestedAssignee>> SuggestAssigneesAsync(
        IAiClient aiClient,
        int organizationId,
        int taskTypeId,
        string newTaskContent,
        int limit = 5,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// タスクの類似性に基づく担当者推薦サービス
/// pgroongaで候補を絞り込み、LLMで類似性を判定します
/// </summary>
public class TaskAssignmentSuggester : ITaskAssignmentSuggester
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TaskAssignmentSuggester> _logger;

    private const int MaxCandidateTasks = 50;
    private const int MinCandidatesForFallback = 10;

    private const string SimilarityAnalysisPrompt = """
        あなたはタスク管理システムのアシスタントです。
        新しいタスクと過去のタスクを比較し、作業内容が類似しているものを判定してください。

        判定基準:
        - 作業の種類や目的が似ている
        - 対象となるシステムやドキュメントが同じ
        - 必要なスキルや知識が共通している
        - 作業のプロセスや手順が類似している

        判定対象外:
        - 単なる文言の一致（「確認」「対応」など一般的な言葉の一致は重視しない）
        - 関係のない識別番号やコード

        出力形式（JSON）:
        {
          "suggestedAssignees": [
            {
              "userId": 123,
              "similarTaskIndexes": [1, 3],
              "reason": "類似理由"
            }
          ]
        }

        類似するものがなければ suggestedAssignees を空配列にしてください:
        { "suggestedAssignees": [] }

        必ず有効なJSONオブジェクトのみを返してください。説明文は不要です。
        """;

    /// <summary>
    /// TaskAssignmentSuggester のコンストラクタ
    /// </summary>
    public TaskAssignmentSuggester(
        ApplicationDbContext context,
        ILogger<TaskAssignmentSuggester> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<SuggestedAssignee>> SuggestAssigneesAsync(
        IAiClient aiClient,
        int organizationId,
        int taskTypeId,
        string newTaskContent,
        int limit = 5,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(newTaskContent))
        {
            _logger.LogDebug("Empty task content provided, returning empty suggestions");
            return [];
        }

        var candidates = await GetCandidateTasksAsync(
            organizationId,
            taskTypeId,
            newTaskContent,
            cancellationToken);

        if (candidates.Count == 0)
        {
            _logger.LogDebug(
                "No candidate tasks found: OrganizationId={OrganizationId}, TaskTypeId={TaskTypeId}",
                organizationId,
                taskTypeId);
            return [];
        }

        _logger.LogDebug(
            "Found {CandidateCount} candidate tasks for similarity analysis",
            candidates.Count);

        return await AnalyzeSimilarityWithLlmAsync(
            aiClient,
            newTaskContent,
            candidates,
            limit,
            cancellationToken);
    }

    /// <summary>
    /// 候補タスクを取得します（pgroongaで絞り込み、不足時はフォールバック）
    /// </summary>
    private async Task<List<CandidateTask>> GetCandidateTasksAsync(
        int organizationId,
        int taskTypeId,
        string searchContent,
        CancellationToken cancellationToken)
    {
        var candidates = await GetCandidatesWithPgroongaAsync(
            organizationId,
            taskTypeId,
            searchContent,
            cancellationToken);

        if (candidates.Count >= MinCandidatesForFallback)
        {
            return candidates;
        }

        _logger.LogDebug(
            "pgroonga returned only {Count} candidates, using fallback query",
            candidates.Count);

        return await GetCandidatesWithFallbackAsync(
            organizationId,
            taskTypeId,
            cancellationToken);
    }

    /// <summary>
    /// pgroongaを使用して候補タスクを検索します
    /// </summary>
    private async Task<List<CandidateTask>> GetCandidatesWithPgroongaAsync(
        int organizationId,
        int taskTypeId,
        string searchContent,
        CancellationToken cancellationToken)
    {
        var keywords = ExtractKeywords(searchContent);

        if (string.IsNullOrWhiteSpace(keywords))
        {
            return [];
        }

        try
        {
            var candidates = await _context.WorkspaceTasks
                .FromSqlRaw(
                    """
                    SELECT wt.* FROM "WorkspaceTasks" wt
                    WHERE wt."OrganizationId" = {0}
                      AND wt."TaskTypeId" = {1}
                      AND wt."IsCompleted" = true
                      AND wt."Content" &@~ {2}
                    ORDER BY wt."CompletedAt" DESC
                    LIMIT {3}
                    """,
                    organizationId,
                    taskTypeId,
                    keywords,
                    MaxCandidateTasks)
                .Include(t => t.AssignedUser)
                .Select(t => new CandidateTask(
                    t.Id,
                    t.AssignedUserId,
                    t.AssignedUser.Username,
                    t.Content))
                .ToListAsync(cancellationToken);

            return candidates;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "pgroonga search failed, falling back to simple query");
            return [];
        }
    }

    /// <summary>
    /// pgroongaが使えない場合のフォールバッククエリ
    /// </summary>
    private async Task<List<CandidateTask>> GetCandidatesWithFallbackAsync(
        int organizationId,
        int taskTypeId,
        CancellationToken cancellationToken)
    {
        var candidates = await _context.WorkspaceTasks
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.TaskTypeId == taskTypeId)
            .Where(t => t.IsCompleted)
            .OrderByDescending(t => t.CompletedAt)
            .Take(MaxCandidateTasks)
            .Include(t => t.AssignedUser)
            .Select(t => new CandidateTask(
                t.Id,
                t.AssignedUserId,
                t.AssignedUser.Username,
                t.Content))
            .ToListAsync(cancellationToken);

        return candidates;
    }

    /// <summary>
    /// LLMを使用して類似性を判定します
    /// </summary>
    private async Task<IReadOnlyList<SuggestedAssignee>> AnalyzeSimilarityWithLlmAsync(
        IAiClient aiClient,
        string newTaskContent,
        List<CandidateTask> candidates,
        int limit,
        CancellationToken cancellationToken)
    {
        var taskListText = string.Join(
            "\n",
            candidates.Select((t, i) =>
                $"[{i + 1}] 担当: {t.AssignedUserName} (ID:{t.AssignedUserId}) / 内容: {TruncateContent(t.Content, 200)}"));

        var userPrompt = $"""
            新しいタスク:
            {TruncateContent(newTaskContent, 500)}

            過去の完了済みタスク候補:
            {taskListText}

            上記から、新しいタスクと作業内容が類似しているものを判定し、
            担当者ごとにグループ化して返してください。
            """;

        try
        {
            var response = await aiClient.GenerateJsonAsync<SimilarTasksAnalysisResponse>(
                SimilarityAnalysisPrompt,
                userPrompt,
                cancellationToken: cancellationToken);

            var suggestions = response.SuggestedAssignees
                .Select(item =>
                {
                    var candidate = candidates.FirstOrDefault(c => c.AssignedUserId == item.UserId);
                    return new SuggestedAssignee(
                        item.UserId,
                        candidate?.AssignedUserName ?? $"User {item.UserId}",
                        item.SimilarTaskIndexes.Count,
                        item.Reason);
                })
                .OrderByDescending(s => s.CompletedSimilarTaskCount)
                .Take(limit)
                .ToList();

            _logger.LogDebug(
                "LLM analysis completed: Found {SuggestionCount} suggested assignees",
                suggestions.Count);

            return suggestions;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "LLM similarity analysis failed");
            return [];
        }
    }

    /// <summary>
    /// 検索用のキーワードを抽出します
    /// </summary>
    private static string ExtractKeywords(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return string.Empty;
        }

        var cleaned = content
            .Replace("【", " ")
            .Replace("】", " ")
            .Replace("[", " ")
            .Replace("]", " ")
            .Replace("「", " ")
            .Replace("」", " ")
            .Replace("（", " ")
            .Replace("）", " ")
            .Replace("(", " ")
            .Replace(")", " ")
            .Replace("\r\n", " ")
            .Replace("\n", " ")
            .Replace("\t", " ");

        var words = cleaned
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length >= 2)
            .Where(w => !IsCommonWord(w))
            .Take(10)
            .ToList();

        return string.Join(" OR ", words);
    }

    /// <summary>
    /// 一般的すぎる単語かどうかを判定します
    /// </summary>
    private static bool IsCommonWord(string word)
    {
        var commonWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "お願い", "します", "ください", "対応", "確認", "作業", "完了",
            "the", "a", "an", "is", "are", "was", "were", "be", "been",
            "have", "has", "had", "do", "does", "did", "will", "would",
            "could", "should", "may", "might", "must", "shall", "can",
            "this", "that", "these", "those", "it", "its", "and", "or",
            "but", "if", "then", "else", "when", "where", "which", "who"
        };

        return commonWords.Contains(word);
    }

    /// <summary>
    /// コンテンツを指定文字数で切り詰めます
    /// </summary>
    private static string TruncateContent(string content, int maxLength)
    {
        if (string.IsNullOrEmpty(content))
        {
            return string.Empty;
        }

        if (content.Length <= maxLength)
        {
            return content;
        }

        return content[..maxLength] + "...";
    }

    /// <summary>
    /// 候補タスクの内部表現
    /// </summary>
    private record CandidateTask(
        int TaskId,
        int AssignedUserId,
        string AssignedUserName,
        string Content);
}
