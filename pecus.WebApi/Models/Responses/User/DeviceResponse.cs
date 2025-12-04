using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// デバイス情報レスポンス
/// </summary>
public class DeviceResponse
{
    /// <summary>
    /// 端末ID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// 表示用短ID
    /// </summary>
    public string PublicId { get; set; } = string.Empty;

    /// <summary>
    /// 表示名
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 端末の種類
    /// </summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>
    /// OS
    /// </summary>
    public string OS { get; set; } = string.Empty;

    /// <summary>
    /// クライアント情報
    /// </summary>
    public string? Client { get; set; }

    /// <summary>
    /// アプリバージョン
    /// </summary>
    public string? AppVersion { get; set; }

    /// <summary>
    /// 初回確認日時
    /// </summary>
    public DateTimeOffset FirstSeenAt { get; set; }

    /// <summary>
    /// 最終確認日時
    /// </summary>
    public DateTimeOffset LastSeenAt { get; set; }

    /// <summary>
    /// マスクされたIPアドレス
    /// </summary>
    public string? LastIpMasked { get; set; }

    /// <summary>
    /// 最終確認場所
    /// </summary>
    public string? LastSeenLocation { get; set; }

    /// <summary>
    /// タイムゾーン
    /// </summary>
    public string? Timezone { get; set; }

    /// <summary>
    /// 有効なリフレッシュトークン数
    /// </summary>
    public int RefreshTokenCount { get; set; }

    /// <summary>
    /// 無効化フラグ
    /// </summary>
    public bool IsRevoked { get; set; }
}