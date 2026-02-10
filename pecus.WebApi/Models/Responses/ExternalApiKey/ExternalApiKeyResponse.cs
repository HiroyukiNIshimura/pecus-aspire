using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.ExternalApiKey;

/// <summary>
/// APIキー一覧用レスポンス
/// </summary>
public class ExternalApiKeyResponse
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
    /// 有効期限
    /// </summary>
    [Required]
    public required DateTimeOffset ExpiresAt { get; set; }

    /// <summary>
    /// 失効済みフラグ
    /// </summary>
    [Required]
    public required bool IsRevoked { get; set; }

    /// <summary>
    /// 最終使用日時
    /// </summary>
    public DateTimeOffset? LastUsedAt { get; set; }

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    [Required]
    public required int CreatedByUserId { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    [Required]
    public required DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 有効期限切れかどうか
    /// </summary>
    [Required]
    public required bool IsExpired { get; set; }
}
