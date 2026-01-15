namespace Pecus.Models.Config
{
    /// <summary>
    /// 制限設定
    /// </summary>
    public class LimitsSettings
    {
        /// <summary>
        /// 組織あたりの最大タグ数
        /// </summary>
        public int MaxTagsPerOrganization { get; set; } = 1000;

        /// <summary>
        /// 組織あたりの最大スキル数
        /// </summary>
        public int MaxSkillsPerOrganization { get; set; } = 100;

        /// <summary>
        /// ドキュメントモードのワークスペースあたりの最大アイテム数
        /// </summary>
        public int MaxDocumentsPerWorkspace { get; set; } = 500;
    }
}