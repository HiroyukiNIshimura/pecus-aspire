using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Common;

/// <summary>
/// メッセージレスポンス
/// </summary>
public class MessageResponse
{
    /// <summary>
    /// メッセージ
    /// </summary>
    [Required]
    public required string Message { get; set; }
}