using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

public class GetDeviceRequest
{
    /// <summary>
    /// クライアントから送られるリフレッシュトークン
    /// </summary>
    [Required(ErrorMessage = "リフレッシュトークンは必須です。")]
    [MaxLength(512, ErrorMessage = "リフレッシュトークンは512文字以内で指定してください。")]
    public required string RefreshToken { get; set; }

}