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
        /// 制限設定
        /// </summary>
        public LimitsSettings Limits { get; set; } = new();

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
        /// トークンの有効期限（分）
        /// </summary>
        public int ExpiresMinutes { get; set; } = 60;
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
    /// 制限設定
    /// </summary>
    public class LimitsSettings
    {
        /// <summary>
        /// 組織あたりの最大タグ数
        /// </summary>
        public int MaxTagsPerOrganization { get; set; } = 100;

        /// <summary>
        /// 組織あたりの最大スキル数
        /// </summary>
        public int MaxSkillsPerOrganization { get; set; } = 100;
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

        /// <summary>
        /// ワークスペースアイテム添付ファイルの最大ファイルサイズ（バイト）
        /// </summary>
        public long MaxAttachmentFileSize { get; set; } = 20 * 1024 * 1024; // 20MB

        /// <summary>
        /// ワークスペースアイテム添付ファイルで許可される拡張子
        /// </summary>
        public string[] AllowedAttachmentExtensions { get; set; } =
            new[]
            {
                ".jpg",
                ".jpeg",
                ".png",
                ".gif",
                ".webp",
                ".pdf",
                ".doc",
                ".docx",
                ".xls",
                ".xlsx",
                ".ppt",
                ".pptx",
                ".txt",
                ".csv",
                ".zip",
                ".rar",
            };

        /// <summary>
        /// ワークスペースアイテム添付ファイルで許可されるMIMEタイプ
        /// </summary>
        public string[] AllowedAttachmentMimeTypes { get; set; } =
            new[]
            {
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "text/plain",
                "text/csv",
                "application/zip",
                "application/x-rar-compressed",
            };

        /// <summary>
        /// サムネイル画像のMediumサイズ（px）
        /// </summary>
        public int ThumbnailMediumSize { get; set; } = 800;

        /// <summary>
        /// サムネイル画像のSmallサイズ（px）
        /// </summary>
        public int ThumbnailSmallSize { get; set; } = 200;
    }
}

