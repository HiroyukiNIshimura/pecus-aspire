using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペースリストアイテムレスポンス
/// </summary>
public class WorkspaceListItemResponse
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    [Required]
    public required string Name { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public string? Code { get; set; }

    /// <summary>
    /// ワークスペースの説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 組織ID
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// 組織名
    /// </summary>
    public string? OrganizationName { get; set; }

    /// <summary>
    /// ジャンルID
    /// </summary>
    public int? GenreId { get; set; }

    /// <summary>
    /// ジャンル名
    /// </summary>
    public string? GenreName { get; set; }

    /// <summary>
    /// ジャンルのアイコン（例: FontAwesome のクラス名）
    /// </summary>
    public string? GenreIcon { get; set; }

    /// <summary>
    /// アクティブなアイテム数
    /// </summary>
    public int ActiveItemCount { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 参加者数（アクティブなワークスペースユーザーの数）
    /// </summary>
    public int MemberCount { get; set; }

    /// <summary>
    /// 参加しているユーザー一覧
    /// </summary>
    public List<WorkspaceUserItem>? Members { get; set; }

    /// <summary>
    /// オーナー情報
    /// </summary>
    /// <value></value>
    public WorkspaceUserItem? Owner { get; set; }
}