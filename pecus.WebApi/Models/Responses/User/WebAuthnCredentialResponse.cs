namespace Pecus.Models.Responses.User;

/// <summary>
/// 登録済みパスキー情報
/// </summary>
public class WebAuthnCredentialResponse
{
    /// <summary>
    /// パスキーID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 表示名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// 登録日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 最終使用日時
    /// </summary>
    public DateTimeOffset? LastUsedAt { get; set; }

    /// <summary>
    /// バックアップ対象になり得る認証器か（同期パスキー）
    /// </summary>
    public bool IsBackupEligible { get; set; }

    /// <summary>
    /// バックアップ済みの認証器か
    /// </summary>
    public bool IsBackedUp { get; set; }

    /// <summary>
    /// 紐づく端末ID
    /// </summary>
    public int? DeviceId { get; set; }

    /// <summary>
    /// 紐づく端末名
    /// </summary>
    public string? DeviceName { get; set; }

    /// <summary>
    /// 認証器が申告したトランスポート
    /// </summary>
    public List<string> Transports { get; set; } = new();
}
