using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.External;

/// <summary>
/// 外部API経由でワークスペースアイテムを作成するためのリクエスト
/// </summary>
public class CreateExternalWorkspaceItemRequest
{
    /// <summary>
    /// アイテムの件名
    /// </summary>
    [Required(ErrorMessage = "件名は必須です。")]
    [MaxLength(200, ErrorMessage = "件名は200文字以内で入力してください。")]
    public required string Subject { get; init; }

    /// <summary>
    /// アイテムの本文（Markdown形式）
    /// </summary>
    [Required(ErrorMessage = "本文は必須です。")]
    [MaxLength(100000, ErrorMessage = "本文は100000文字以内で入力してください。")]
    public required string Body { get; init; }

    /// <summary>
    /// オーナーのログインID
    /// </summary>
    [Required(ErrorMessage = "オーナーのログインIDは必須です。")]
    [MaxLength(256, ErrorMessage = "ログインIDは256文字以内で入力してください。")]
    public required string OwnerLoginId { get; init; }
}