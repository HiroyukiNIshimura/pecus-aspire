namespace Pecus.Libs.AI.Models;

/// <summary>
/// 利用可能なAIモデル情報
/// </summary>
public class AvailableModel
{
    /// <summary>
    /// モデルID（API呼び出しに使用する識別子）
    /// </summary>
    public required string Id { get; set; }

    /// <summary>
    /// モデル名（表示用）
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// モデルの説明（オプション）
    /// </summary>
    public string? Description { get; set; }
}