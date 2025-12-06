using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザー設定レスポンス
/// </summary>
public class UserSettingResponse : IConflictModel
{
    /// <summary>
    /// メール受信の可否
    /// </summary>
    [Required]
    public bool CanReceiveEmail { get; set; } = true;

    /// <summary>
    /// ユーザー設定の楽観的ロック用 RowVersion
    /// </summary>
    public uint RowVersion { get; set; }
}