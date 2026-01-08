namespace Pecus.Libs.AI.Tools;

/// <summary>
/// AIが使用可能なツールのインターフェース
/// MCP (Model Context Protocol) 的なデザインパターン
/// </summary>
public interface IAiTool
{
    /// <summary>
    /// ツール名（一意識別子、Function Calling用）
    /// </summary>
    string Name { get; }

    /// <summary>
    /// ツールの説明（AI向け）
    /// </summary>
    string Description { get; }

    /// <summary>
    /// ツールの基本優先度（高いほど先に評価される）
    /// 同スコアの場合のタイブレーカーとして使用
    /// </summary>
    int BasePriority { get; }

    /// <summary>
    /// Function Calling用のツール定義を取得
    /// </summary>
    AiToolDefinition GetDefinition();

    /// <summary>
    /// このツールの適用スコアを計算（0-100）
    /// MessageSentimentResult などのコンテキストから動的に計算
    /// </summary>
    /// <param name="context">ツール実行コンテキスト</param>
    /// <returns>関連度スコア（0-100、高いほど関連性が高い）</returns>
    int CalculateRelevanceScore(AiToolContext context);

    /// <summary>
    /// ツールを実行する
    /// </summary>
    /// <param name="context">ツール実行コンテキスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>ツール実行結果</returns>
    Task<AiToolResult> ExecuteAsync(AiToolContext context, CancellationToken cancellationToken = default);
}