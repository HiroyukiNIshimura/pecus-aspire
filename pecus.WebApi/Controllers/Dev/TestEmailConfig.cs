namespace Pecus.Controllers.Dev;

/// <summary>
/// テスト用の静的な設定（送信先など）
/// </summary>
public static class TestEmailConfig
{
    /// <summary>
    /// テスト用の受信先メールアドレス（デフォルトはローカルの MailHog 等）
    /// </summary>
    public static string Recipient { get; set; } = "nishimura@bright-l.co.jp";
}
