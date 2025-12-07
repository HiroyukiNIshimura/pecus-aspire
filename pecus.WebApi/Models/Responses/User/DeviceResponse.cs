using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// デバイス情報レスポンス
/// </summary>
public class DeviceResponse
{
    /// <summary>
    /// リフレッシュトークンID（セッションID）
    /// </summary>
    [Required]
    public required int RefreshTokenId { get; set; }

    /// <summary>
    /// 紐づく端末ID（端末情報が無い場合は null）
    /// </summary>
    public int? DeviceId { get; set; }

    /// <summary>
    /// 表示用短ID（端末がある場合）
    /// </summary>
    public string? PublicId { get; set; }

    /// <summary>
    /// 表示名
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 端末の種類
    /// </summary>
    public string? DeviceType { get; set; }

    /// <summary>
    /// OS
    /// </summary>
    public string? OS { get; set; }

    /// <summary>
    /// クライアント情報
    /// </summary>
    public string? Client { get; set; }

    /// <summary>
    /// アプリバージョン
    /// </summary>
    public string? AppVersion { get; set; }

    /// <summary>
    /// トークン作成日時
    /// </summary>
    public DateTimeOffset TokenCreatedAt { get; set; }

    /// <summary>
    /// トークン有効期限
    /// </summary>
    public DateTimeOffset TokenExpiresAt { get; set; }

    /// <summary>
    /// トークンが無効化されているか
    /// </summary>
    public bool TokenIsRevoked { get; set; }

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
    /// 端末が無効化されているか
    /// </summary>
    public bool DeviceIsRevoked { get; set; }

    /// <summary>
    /// ハッシュ化されたデバイス識別子（現在の端末判定用）
    /// </summary>
    public string? HashedIdentifier { get; set; }
}