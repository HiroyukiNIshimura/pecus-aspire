using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// ワークスペース登録リクエスト
/// </summary>
public class CreateWorkspaceRequest
{
    /// <summary>
    /// ワークスペース名
    /// </summary>
    [Required(ErrorMessage = "ワークスペース名は必須です。")]
    [StringLength(100, ErrorMessage = "ワークスペース名は100文字以内で入力してください。")]
    public required string Name { get; set; }

    /// <summary>
    /// ワークスペースの説明
    /// </summary>
    [StringLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }
}

/// <summary>
/// ワークスペース更新リクエスト
/// </summary>
public class UpdateWorkspaceRequest
{
    /// <summary>
    /// ワークスペース名
    /// </summary>
    [StringLength(100, ErrorMessage = "ワークスペース名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    /// <summary>
    /// ワークスペースの説明
    /// </summary>
    [StringLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }
}

/// <summary>
/// ワークスペースにユーザーを参加させるリクエスト
/// </summary>
public class AddUserToWorkspaceRequest
{
    /// <summary>
    /// 参加させるユーザーID
    /// </summary>
    [Required(ErrorMessage = "ユーザーIDは必須です。")]
    [Range(1, int.MaxValue, ErrorMessage = "有効なユーザーIDを指定してください。")]
    public required int UserId { get; set; }

    /// <summary>
    /// ワークスペース内での役割（例: Owner, Member, Guest）
    /// </summary>
    [StringLength(50, ErrorMessage = "役割は50文字以内で入力してください。")]
    public string? WorkspaceRole { get; set; }
}
