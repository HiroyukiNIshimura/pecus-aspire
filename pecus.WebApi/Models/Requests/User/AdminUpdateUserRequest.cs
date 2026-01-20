using Pecus.Models.Validation;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// 管理者によるユーザー更新リクエスト
/// </summary>
/// <remarks>
/// 管理者がユーザー情報を一括更新するためのリクエスト。
/// 1トランザクションで全項目を更新します。
/// </remarks>
public class AdminUpdateUserRequest
{
    /// <summary>
    /// ユーザー名
    /// </summary>
    [Required(ErrorMessage = "ユーザー名は必須です。")]
    [MaxLength(50, ErrorMessage = "ユーザー名は50文字以内で入力してください。")]
    public required string Username { get; set; }

    /// <summary>
    /// アクティブ状態
    /// </summary>
    [Required(ErrorMessage = "アクティブ状態は必須です。")]
    public required bool IsActive { get; set; }

    /// <summary>
    /// スキルIDのリスト
    /// </summary>
    public List<int> SkillIds { get; set; } = [];

    /// <summary>
    /// ロールIDのリスト
    /// </summary>
    [IntListRange(1, 5)]
    public List<int> RoleIds { get; set; } = [];

    /// <summary>
    /// 楽観的ロック用のRowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}
