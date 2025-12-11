namespace Pecus.Models.Config
{
    /// <summary>
    /// ページネーション設定
    /// </summary>
    public class PaginationSettings
    {
        /// <summary>
        /// デフォルトページサイズ
        /// </summary>
        public int DefaultPageSize { get; set; } = 20;

        /// <summary>
        /// 最大ページサイズ
        /// </summary>
        public int MaxPageSize { get; set; } = 100;
    }
}