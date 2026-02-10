using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.ExternalApiKey;

/// <summary>
/// APIキー発行リクエスト
/// </summary>
public class CreateExternalApiKeyRequest
{
    /// <summary>
    /// キー名（用途識別用）
    /// </summary>
    [Required(ErrorMessage = "キー名は必須です。")]
    [MaxLength(100, ErrorMessage = "キー名は100文字以内で入力してください。")]
    public required string Name { get; set; }

    /// <summary>
    /// 有効期限（日数）。省略時は365日。
    /// </summary>
    [Range(1, 730, ErrorMessage = "有効期限は1〜730日の範囲で入力してください。")]
    public int? ExpirationDays { get; set; }
}
