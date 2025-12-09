using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// デバイス情報レスポンス
/// </summary>
public class DeviceResponse
{
    /// <summary>
    /// 紐づく端末ID（端末情報が無い場合は null）
    /// </summary>
    public int? Id { get; set; }

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
}