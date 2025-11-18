using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// メールアドレス変更リクエスト完了レスポンス
/// </summary>
public class EmailChangeRequestResponse
{
    /// <summary>
    /// メッセージ
    /// </summary>
    [Required]
    public required string Message { get; set; }

    /// <summary>
    /// 新しいメールアドレス（確認用）
    /// </summary>
    [Required]
    public required string NewEmail { get; set; }

    /// <summary>
    /// トークン有効期限（UTC）
    /// </summary>
    [Required]
    public required DateTime ExpiresAt { get; set; }

    /// <summary>
    /// 確認トークン（メール送信用、通常はフロントエンドには返さない）
    /// </summary>
    /// <remarks>
    /// このプロパティはメール送信のためにコントローラー内部でのみ使用されます。
    /// セキュリティ上の理由から、フロントエンドには送信しません。
    /// </remarks>
    [Required]
    public required string Token { get; set; }
}