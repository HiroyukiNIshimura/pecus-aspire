using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Common;

/// <summary>
/// 成功メッセージレスポンス
/// </summary>
public class SuccessResponse
{
    /// <summary>
    /// HTTPステータスコード
    /// </summary>
    public int StatusCode { get; set; } = StatusCodes.Status200OK;

    /// <summary>
    /// 成功メッセージ
    /// </summary>
    [Required]
    public required string Message { get; set; }
}