namespace Pecus.Libs.DB.Models;

/// <summary>
/// ユーザー設定
/// </summary>
public class UserSetting
{
    /// <summary>
    /// 設定ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ユーザーID（1:1）
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// ユーザー
    /// </summary>
    public User? User { get; set; }

    /// <summary>
    /// メール受信の可否
    /// </summary>
    public bool CanReceiveEmail { get; set; } = true;

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>
    /// 更新者ユーザーID
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号
    /// </summary>
    public uint RowVersion { get; set; }
}
