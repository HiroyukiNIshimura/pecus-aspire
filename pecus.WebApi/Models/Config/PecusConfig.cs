namespace Pecus.Models.Config
{
    /// <summary>
    /// Pecusアプリケーション固有の設定
    /// </summary>
    public class PecusConfig
    {
        /// <summary>
        /// JWT認証設定
        /// </summary>
        public JwtSettings Jwt { get; set; } = new();

        /// <summary>
        /// アプリケーション設定
        /// </summary>
        public ApplicationSettings Application { get; set; } = new();

        /// <summary>
        /// ページネーション設定
        /// </summary>
        public PaginationSettings Pagination { get; set; } = new();

        /// <summary>
        /// ファイルアップロード設定
        /// </summary>
        public FileUploadSettings FileUpload { get; set; } = new();
    }

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
        /// トークンの有効期限（時間）
        /// </summary>
        public int ExpiresHours { get; set; } = 1;
    }

    /// <summary>
    /// アプリケーション設定
    /// </summary>
    public class ApplicationSettings
    {
        /// <summary>
        /// アプリケーション名
        /// </summary>
        public string Name { get; set; } = "Pecus";

        /// <summary>
        /// アプリケーションバージョン
        /// </summary>
        public string Version { get; set; } = "1.0.0";

        /// <summary>
        /// デバッグモード
        /// </summary>
        public bool DebugMode { get; set; } = false;
    }

    /// <summary>
    /// ページネーション設定
    /// </summary>
    public class PaginationSettings
    {
        /// <summary>
        /// ページサイズ
        /// </summary>
        public int DefaultPageSize { get; set; } = 20;
    }

    /// <summary>
    /// ファイルアップロード設定
    /// </summary>
    public class FileUploadSettings
    {
        /// <summary>
        /// アップロードファイルの保存先ルートパス
        /// </summary>
        public string StoragePath { get; set; } = "uploads";

        /// <summary>
        /// 最大ファイルサイズ（バイト）
        /// </summary>
        public long MaxFileSize { get; set; } = 5 * 1024 * 1024; // 5MB

        /// <summary>
        /// 許可される画像形式
        /// </summary>
        public string[] AllowedImageExtensions { get; set; } =
            new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

        /// <summary>
        /// 許可されるMIMEタイプ
        /// </summary>
        public string[] AllowedMimeTypes { get; set; } =
            new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
    }
}
