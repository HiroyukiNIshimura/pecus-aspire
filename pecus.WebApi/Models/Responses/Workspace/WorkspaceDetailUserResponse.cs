using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペース詳細取得用ユーザー情報
/// </summary>
public class WorkspaceDetailUserResponse
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ユーザー名
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// メールアドレス
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// アイデンティティアイコン URL
    /// </summary>
    public string? IdentityIconUrl { get; set; }

    /// <summary>
    /// ワークスペースロール（メンバー一覧の場合に設定）
    /// </summary>
    public WorkspaceRole? WorkspaceRole { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 最終ログイン日時
    /// </summary>
    public DateTime? LastLoginAt { get; set; }
}