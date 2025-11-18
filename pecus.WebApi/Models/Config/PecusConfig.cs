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
}