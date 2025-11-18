namespace Pecus.Libs.DB.Models;

/// <summary>
/// メールアドレス変更トークン
/// メールアドレス変更時の確認トークンを管理する
/// </summary>
public class EmailChangeToken
{
    /// <summary>
    /// トークンID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ユーザーID
    /// </summary>
    public required int UserId { get; set; }

    /// <summary>
    /// 新しいメールアドレス
    /// </summary>
    public required string NewEmail { get; set; }

    /// <summary>
    /// 確認トークン（GUID）
    /// </summary>
    public required string Token { get; set; }

    /// <summary>
    /// トークン有効期限
    /// </summary>
    public required DateTime ExpiresAt { get; set; }

    /// <summary>
    /// トークン使用済みフラグ
    /// </summary>
    public bool IsUsed { get; set; }

    /// <summary>
    /// トークン使用日時
    /// </summary>
    public DateTime? UsedAt { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    // ナビゲーションプロパティ
    /// <summary>
    /// ユーザー
    /// </summary>
    public User User { get; set; } = null!;
}