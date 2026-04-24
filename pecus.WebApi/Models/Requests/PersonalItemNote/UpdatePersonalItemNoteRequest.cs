using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.PersonalItemNote;

/// <summary>
/// 個人メモ更新リクエスト
/// </summary>
public class UpdatePersonalItemNoteRequest
{
    /// <summary>
    /// メモ内容
    /// </summary>
    [Required(ErrorMessage = "メモ内容は必須です。")]
    [MaxLength(10000, ErrorMessage = "メモは10000文字以内で入力してください。")]
    public string Content { get; set; } = string.Empty;
}
