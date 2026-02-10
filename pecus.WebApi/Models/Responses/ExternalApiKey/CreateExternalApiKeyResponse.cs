using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.ExternalApiKey;

/// <summary>
/// APIキー発行直後のレスポンス。
/// 平文キー（RawKey）はこの応答でのみ取得可能。
/// </summary>
public class CreateExternalApiKeyResponse
{
    /// <summary>
    /// APIキーID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// キー名（用途識別用）
    /// </summary>
    [Required]
    public required string Name { get; set; }

    /// <summary>
    /// キーの先頭8文字（識別用）
    /// </summary>
    [Required]
    public required string KeyPrefix { get; set; }

    /// <summary>
    /// 平文APIキー（この応答でのみ取得可能）
    /// </summary>
    [Required]
    public required string RawKey { get; set; }

    /// <summary>
    /// 有効期限
    /// </summary>
    [Required]
    public required DateTimeOffset ExpiresAt { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    [Required]
    public required DateTimeOffset CreatedAt { get; set; }
}
