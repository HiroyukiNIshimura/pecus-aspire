namespace Pecus.Libs.DB.Models;

/// <summary>
/// パスキーを失った場合に使用する使い捨てのリカバリーコード
/// </summary>
/// <remarks>
/// 平文は保存せず、サーバー側の鍵（pepper）を用いた HMAC-SHA256 のハッシュのみを保持する。
/// </remarks>
public class UserRecoveryCode
{
    /// <summary>
    /// リカバリーコードID（PK）
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ユーザーID（FK）
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// ユーザー（ナビゲーションプロパティ）
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// コードのハッシュ（HMAC-SHA256 の16進文字列）
    /// </summary>
    public required string CodeHash { get; set; }

    /// <summary>
    /// 使用日時（未使用の場合は null）
    /// </summary>
    public DateTimeOffset? UsedAt { get; set; }

    /// <summary>
    /// 発行日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
