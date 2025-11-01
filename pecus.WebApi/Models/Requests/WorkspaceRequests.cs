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
    [MaxLength(100, ErrorMessage = "ワークスペース名は100文字以内で入力してください。")]
    public required string Name { get; set; }

    /// <summary>
    /// ワークスペースの説明
    /// </summary>
    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
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
    [MaxLength(100, ErrorMessage = "ワークスペース名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    /// <summary>
    /// ワークスペースの説明
    /// </summary>
    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
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
    [MaxLength(50, ErrorMessage = "役割は50文字以内で入力してください。")]
    public string? WorkspaceRole { get; set; }
}

/// <summary>
/// ワークスペース一覧取得リクエスト
/// </summary>
public class GetWorkspacesRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int? Page { get; set; } = 1;

    /// <summary>
    /// アクティブなワークスペースのみ取得するか
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// ジャンルIDでフィルター（オプション）
    /// </summary>
    public int? GenreId { get; set; }
}

/// <summary>
/// ワークスペースメンバー一覧取得リクエスト
/// </summary>
public class GetWorkspaceMembersRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int? Page { get; set; } = 1;

    public bool? ActiveOnly { get; set; } = true;
}
