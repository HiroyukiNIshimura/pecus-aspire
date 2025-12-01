using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Workspace;

/// <summary>
/// ワークスペースメンバーのロール変更リクエスト
/// </summary>
public class UpdateWorkspaceUserRoleRequest
{
    /// <summary>
    /// 新しいワークスペースロール
    /// </summary>
    [Required(ErrorMessage = "ワークスペースロールは必須です。")]
    public required WorkspaceRole WorkspaceRole { get; set; }
}