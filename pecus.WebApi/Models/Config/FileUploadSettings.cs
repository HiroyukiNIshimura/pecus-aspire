namespace Pecus.Models.Config
{
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
