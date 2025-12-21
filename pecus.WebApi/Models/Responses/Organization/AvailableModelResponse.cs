namespace Pecus.Models.Responses.Organization;

/// <summary>
/// 利用可能なAIモデルレスポンス
/// </summary>
public sealed class AvailableModelResponse
{
    /// <summary>
    /// モデルID（API呼び出し時に使用）
    /// </summary>
    public required string Id { get; init; }

    /// <summary>
    /// 表示名
    /// </summary>
    public required string Name { get; init; }

    /// <summary>
    /// 説明
    /// </summary>
    public string? Description { get; init; }
}