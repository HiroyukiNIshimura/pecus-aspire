using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// 端末追加チケット
/// </summary>
/// <remarks>
/// ログイン済みの端末で発行し、別の端末のパスキー登録に使うワンタイムチケット。
/// </remarks>
public class WebAuthnDeviceTicketResponse
{
    /// <summary>
    /// 端末追加チケット（ワンタイム）
    /// </summary>
    [Required]
    public required string Ticket { get; set; }

    /// <summary>
    /// チケットの有効期限
    /// </summary>
    public DateTimeOffset ExpiresAt { get; set; }

    /// <summary>
    /// 別端末で開く登録用 URL（QR コードに埋め込む値）
    /// </summary>
    [Required]
    public required string SetupUrl { get; set; }
}
