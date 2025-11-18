namespace Pecus.Models.Config
{
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
}