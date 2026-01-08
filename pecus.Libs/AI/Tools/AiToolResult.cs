namespace Pecus.Libs.AI.Tools;

/// <summary>
/// ツール実行結果
/// </summary>
public record AiToolResult
{
    /// <summary>
    /// 実行が成功したか
    /// </summary>
    public required bool Success { get; init; }

    /// <summary>
    /// 生成されたコンテキストプロンプト
    /// </summary>
    public string? ContextPrompt { get; init; }

    /// <summary>
    /// 推奨されるロール設定
    /// </summary>
    public RoleConfig? SuggestedRole { get; init; }

    /// <summary>
    /// ツール名（結果のマージ時に使用）
    /// </summary>
    public string? ToolName { get; init; }

    /// <summary>
    /// 実行時のログ/デバッグ情報
    /// </summary>
    public string? DebugInfo { get; init; }

    /// <summary>
    /// 空の成功結果を作成
    /// </summary>
    /// <param name="toolName">ツール名</param>
    /// <returns>コンテキストなしの成功結果</returns>
    public static AiToolResult Empty(string toolName) => new()
    {
        Success = true,
        ToolName = toolName,
        ContextPrompt = null
    };

    /// <summary>
    /// 失敗結果を作成
    /// </summary>
    /// <param name="toolName">ツール名</param>
    /// <param name="reason">失敗理由</param>
    /// <returns>失敗結果</returns>
    public static AiToolResult Failure(string toolName, string reason) => new()
    {
        Success = false,
        ToolName = toolName,
        DebugInfo = reason
    };
}