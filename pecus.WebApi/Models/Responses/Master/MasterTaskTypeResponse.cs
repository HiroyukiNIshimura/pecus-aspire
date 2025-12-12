namespace Pecus.Models.Responses.Master;

/// <summary>
/// タスク種類マスタレスポンス
/// </summary>
public class MasterTaskTypeResponse
{
    /// <summary>
    /// タスク種類ID
    /// </summary>
    public required int Id { get; set; }

    /// <summary>
    /// タスク種類コード（例: "Bug", "Feature"）
    /// </summary>
    public required string Code { get; set; }

    /// <summary>
    /// タスク種類名（日本語表示名）
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// タスク種類説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// タスク種類アイコン（拡張子なしのファイル名）
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// 表示順
    /// </summary>
    public int DisplayOrder { get; set; }
}