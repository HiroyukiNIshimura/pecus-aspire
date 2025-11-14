using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// ワークスペースにユーザーを参加させるリクエスト
/// </summary>
public class AddUserToWorkspaceRequest
{
    [Required(ErrorMessage = "ユーザーIDは必須です。")]
    [Range(1, int.MaxValue, ErrorMessage = "有効なユーザーIDを指定してください。")]
    public required int UserId { get; set; }

    [MaxLength(50, ErrorMessage = "役割は50文字以内で入力してください。")]
    public string? WorkspaceRole { get; set; }
}
