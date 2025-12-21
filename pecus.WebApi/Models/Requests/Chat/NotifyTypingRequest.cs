using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Chat;

/// <summary>
/// 入力中通知リクエスト
/// </summary>
public class NotifyTypingRequest
{
    /// <summary>
    /// 入力中かどうか
    /// true: 入力開始, false: 入力終了
    /// </summary>
    [Required(ErrorMessage = "入力状態は必須です。")]
    public required bool IsTyping { get; set; }
}