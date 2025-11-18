using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// メールアドレス変更確認レスポンス
/// </summary>
public class EmailChangeVerifyResponse
{
    /// <summary>
    /// メッセージ
    /// </summary>
    [Required]
    public required string Message { get; set; }

    /// <summary>
    /// 変更後の新しいメールアドレス
    /// </summary>
    [Required]
    public required string NewEmail { get; set; }

    /// <summary>
    /// 変更日時（UTC）
    /// </summary>
    [Required]
    public required DateTime ChangedAt { get; set; }
}