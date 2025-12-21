using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Chat;

/// <summary>
/// 既読位置更新リクエスト
/// </summary>
public class UpdateReadPositionRequest
{
    /// <summary>
    /// 既読日時
    /// </summary>
    [Required(ErrorMessage = "既読日時は必須です。")]
    public required DateTimeOffset ReadAt { get; set; }

    /// <summary>
    /// 既読したメッセージID（省略可能）
    /// SignalR で他のメンバーに通知する際に使用
    /// </summary>
    public int? ReadMessageId { get; set; }
}