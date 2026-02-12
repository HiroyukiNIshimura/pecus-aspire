using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// 複数ユーザーの負荷情報取得リクエスト
/// </summary>
public class GetUsersWorkloadRequest
{
    /// <summary>
    /// 取得対象のユーザーIDリスト（最大50件）
    /// </summary>
    [Required(ErrorMessage = "ユーザーIDリストは必須です。")]
    [MinLength(1, ErrorMessage = "少なくとも1件のユーザーIDを指定してください。")]
    [MaxLength(50, ErrorMessage = "一度に取得できるユーザーは50件までです。")]
    public int[] UserIds { get; set; } = [];
}