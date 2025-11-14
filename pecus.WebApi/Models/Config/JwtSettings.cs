namespace Pecus.Models.Config
{
    /// <summary>
    /// JWT認証設定
    /// </summary>
    public class JwtSettings
    {
        /// <summary>
        /// 署名キー
        /// </summary>
        public string IssuerSigningKey { get; set; } = string.Empty;

        /// <summary>
        /// 発行者
        /// </summary>
        public string ValidIssuer { get; set; } = string.Empty;

        /// <summary>
        /// 対象者
        /// </summary>
        public string ValidAudience { get; set; } = string.Empty;

        /// <summary>
        /// トークンの有効期限（分）
        /// </summary>
        public int ExpiresMinutes { get; set; } = 60;
    }
}
