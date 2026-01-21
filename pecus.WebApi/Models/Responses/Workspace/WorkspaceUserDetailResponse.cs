using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペースユーザー詳細レスポンス
/// </summary>
public class WorkspaceUserDetailResponse : UserIdentityResponse
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    [Required]
    public required int WorkspaceId { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    [Required]
    public required string Email { get; set; }

    /// <summary>
    /// ワークスペース内での役割
    /// </summary>
    public WorkspaceRole? WorkspaceRole { get; set; }

    /// <summary>
    /// 参加日時
    /// </summary>
    public DateTimeOffset JoinedAt { get; set; }

    /// <summary>
    /// 最終アクセス日時
    /// </summary>
    public DateTimeOffset? LastAccessedAt { get; set; }

}