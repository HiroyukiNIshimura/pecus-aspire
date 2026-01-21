using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペースユーザー一覧用DTO（軽量）
/// </summary>
public class WorkspaceUserItem : UserIdentityResponse
{
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
    /// 最終ログイン日時
    /// </summary>
    public DateTimeOffset? LastLoginAt { get; set; }
}