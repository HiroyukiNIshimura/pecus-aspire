using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用ユーザー参照
/// </summary>
public class ExternalUserRefResponse
{
    /// <summary>
    /// ログインID
    /// </summary>
    [Required]
    public required string LoginId { get; set; }

    /// <summary>
    /// ユーザー名
    /// </summary>
    [Required]
    public required string Username { get; set; }
}