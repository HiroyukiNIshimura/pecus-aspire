namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// メールアドレス変更確認メールテンプレート用のモデル
/// </summary>
public class EmailChangeConfirmationEmailModel
{
    /// <summary>
    /// ユーザー名
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// 現在のメールアドレス
    /// </summary>
    public string CurrentEmail { get; set; } = string.Empty;

    /// <summary>
    /// 新しいメールアドレス
    /// </summary>
    public string NewEmail { get; set; } = string.Empty;

    /// <summary>
    /// メールアドレス変更確認URL（トークンを含む）
    /// </summary>
    public string ConfirmationUrl { get; set; } = string.Empty;

    /// <summary>
    /// トークンの有効期限
    /// </summary>
    public DateTime TokenExpiresAt { get; set; }

    /// <summary>
    /// リクエスト日時
    /// </summary>
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
}