using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Workspace;

/// <summary>
/// ワークスペースにユーザーを参加させるリクエスト
/// </summary>
public class AddUserToWorkspaceRequest
{
    [Required(ErrorMessage = "ユーザーIDは必須です。")]
    [Range(1, int.MaxValue, ErrorMessage = "有効なユーザーIDを指定してください。")]
    public required int UserId { get; set; }

    /// <summary>
    /// ワークスペース内での役割（任意、未指定時は Member）
    /// </summary>
    public WorkspaceRole? WorkspaceRole { get; set; }
}