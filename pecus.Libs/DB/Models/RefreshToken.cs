namespace Pecus.Libs.DB.Models;

/// <summary>
/// リフレッシュトークンエンティティ
/// </summary>
public class RefreshToken
{
    /// <summary>
    /// リフレッシュトークンID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// トークン文字列（GUID）
    /// </summary>
    public required string Token { get; set; }

    /// <summary>
    /// ユーザーID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// 有効期限
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 無効化フラグ
    /// </summary>
    public bool IsRevoked { get; set; }

    /// <summary>
    /// ユーザー（ナビゲーションプロパティ）
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// 紐づく端末ID（任意）
    /// </summary>
    public int? DeviceId { get; set; }

    /// <summary>
    /// 紐づく端末（ナビゲーションプロパティ）
    /// </summary>
    public Device? Device { get; set; }
}