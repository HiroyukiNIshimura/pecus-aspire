using Microsoft.Extensions.Logging;

namespace Pecus.Libs.AI.Tools;

/// <summary>
/// AI ツールの実行を管理するオーケストレーター
/// </summary>
public interface IAiToolExecutor
{
    /// <summary>
    /// コンテキストに基づいて適切なツールを実行し、結果をマージ
    /// </summary>
    /// <param name="context">ツール実行コンテキスト</param>
    /// <param name="maxTools">実行する最大ツール数</param>
    /// <param name="minRelevanceScore">実行に必要な最低関連度スコア</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>ツール実行の集約結果</returns>
    Task<AiToolExecutorResult> ExecuteAsync(
        AiToolContext context,
        int maxTools = 2,
        int minRelevanceScore = 50,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 全ツールの定義を取得（Function Calling 用）
    /// </summary>
    /// <returns>ツール定義のリスト</returns>
    IReadOnlyList<AiToolDefinition> GetAllToolDefinitions();

    /// <summary>
    /// 指定されたツールを名前で実行（Function Calling 応答用）
    /// </summary>
    /// <param name="toolName">ツール名</param>
    /// <param name="context">ツール実行コンテキスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>ツール実行結果</returns>
    Task<AiToolResult> ExecuteByNameAsync(
        string toolName,
        AiToolContext context,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// ツール実行の集約結果
/// </summary>
public record AiToolExecutorResult
{
    /// <summary>
    /// マージされたコンテキストプロンプト
    /// </summary>
    public string? MergedContextPrompt { get; init; }

    /// <summary>
    /// 推奨されるロール（最初に成功したツールのロール）
    /// </summary>
    public RoleConfig? SuggestedRole { get; init; }

    /// <summary>
    /// 実行されたツールの結果リスト
    /// </summary>
    public IReadOnlyList<AiToolResult> ExecutedResults { get; init; } = [];

    /// <summary>
    /// コンテキストが取得できたかどうか
    /// </summary>
    public bool HasContext => !string.IsNullOrEmpty(MergedContextPrompt);
}

/// <summary>
/// AI ツールの実行を管理するオーケストレーター実装
/// </summary>
public class AiToolExecutor : IAiToolExecutor
{
    private readonly IEnumerable<IAiTool> _tools;
    private readonly ILogger<AiToolExecutor> _logger;

    /// <summary>
    /// AiToolExecutor のコンストラクタ
    /// </summary>
    /// <param name="tools">登録されているツールのコレクション</param>
    /// <param name="logger">ロガー</param>
    public AiToolExecutor(
        IEnumerable<IAiTool> tools,
        ILogger<AiToolExecutor> logger)
    {
        _tools = tools;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<AiToolExecutorResult> ExecuteAsync(
        AiToolContext context,
        int maxTools = 2,
        int minRelevanceScore = 50,
        CancellationToken cancellationToken = default)
    {
        var executedResults = new List<AiToolResult>();
        var contextPrompts = new List<string>();
        RoleConfig? suggestedRole = null;

        var rankedTools = _tools
            .Select(t => new { Tool = t, Score = t.CalculateRelevanceScore(context) })
            .Where(x => x.Score >= minRelevanceScore)
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.Tool.BasePriority)
            .Take(maxTools)
            .ToList();

        _logger.LogDebug(
            "Executing {Count} tools (filtered from {Total}): {Tools}",
            rankedTools.Count,
            _tools.Count(),
            string.Join(", ", rankedTools.Select(x => $"{x.Tool.Name}({x.Score})"))
        );

        foreach (var ranked in rankedTools)
        {
            try
            {
                var result = await ranked.Tool.ExecuteAsync(context, cancellationToken);
                executedResults.Add(result);

                if (result.Success && !string.IsNullOrEmpty(result.ContextPrompt))
                {
                    contextPrompts.Add(result.ContextPrompt);
                    suggestedRole ??= result.SuggestedRole;

                    _logger.LogDebug(
                        "Tool {ToolName} executed successfully: {DebugInfo}",
                        ranked.Tool.Name,
                        result.DebugInfo
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Tool {ToolName} failed", ranked.Tool.Name);
                executedResults.Add(AiToolResult.Failure(ranked.Tool.Name, ex.Message));
            }
        }

        return new AiToolExecutorResult
        {
            MergedContextPrompt = contextPrompts.Count > 0
                ? string.Join("\n\n---\n\n", contextPrompts)
                : null,
            SuggestedRole = suggestedRole,
            ExecutedResults = executedResults
        };
    }

    /// <inheritdoc />
    public IReadOnlyList<AiToolDefinition> GetAllToolDefinitions()
    {
        return _tools.Select(t => t.GetDefinition()).ToList();
    }

    /// <inheritdoc />
    public async Task<AiToolResult> ExecuteByNameAsync(
        string toolName,
        AiToolContext context,
        CancellationToken cancellationToken = default)
    {
        var tool = _tools.FirstOrDefault(t => t.Name == toolName);
        if (tool == null)
        {
            _logger.LogWarning("Tool not found: {ToolName}", toolName);
            return AiToolResult.Failure(toolName, $"Tool '{toolName}' not found");
        }

        return await tool.ExecuteAsync(context, cancellationToken);
    }
}
