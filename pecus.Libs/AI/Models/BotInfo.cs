namespace Pecus.Libs.AI.Models;

/// <summary>
/// 利用可能なBot情報
/// </summary>
public class BotInfo
{
    /// <summary>
    /// Bot の ChatActorId
    /// </summary>
    public required int ChatActorId { get; init; }

    /// <summary>
    /// Bot の名前
    /// </summary>
    public required string Name { get; init; }

    /// <summary>
    /// Bot の役割説明
    /// </summary>
    public string? RoleDescription { get; init; }
}