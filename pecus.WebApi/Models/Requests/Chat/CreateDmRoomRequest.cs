using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Chat;

/// <summary>
/// DM ルーム作成リクエスト
/// </summary>
public class CreateDmRoomRequest
{
    /// <summary>
    /// 相手ユーザーID
    /// </summary>
    [Required(ErrorMessage = "相手ユーザーIDは必須です。")]
    public required int TargetUserId { get; set; }
}