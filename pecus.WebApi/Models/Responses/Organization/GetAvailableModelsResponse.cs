namespace Pecus.Models.Responses.Organization;

/// <summary>
/// 利用可能なAIモデル一覧取得レスポンス
/// </summary>
public sealed class GetAvailableModelsResponse
{
    /// <summary>
    /// 成功したかどうか
    /// </summary>
    public required bool Success { get; init; }

    /// <summary>
    /// 利用可能なモデルのリスト（成功時のみ）
    /// </summary>
    public IReadOnlyList<AvailableModelResponse>? Models { get; init; }

    /// <summary>
    /// エラーメッセージ（失敗時のみ）
    /// </summary>
    public string? ErrorMessage { get; init; }

    /// <summary>
    /// エラー詳細（開発用、失敗時のみ）
    /// </summary>
    public string? ErrorDetail { get; init; }
}