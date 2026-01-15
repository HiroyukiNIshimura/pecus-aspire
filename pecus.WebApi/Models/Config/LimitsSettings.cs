namespace Pecus.Models.Config
{
    /// <summary>
    ///
    /// </summary>
    public class Limits
    {
        /// <summary>
        /// 無料プランの制限設定
        /// </summary>
        public LimitsSettings Free { get; set; } = new();
        /// <summary>
        /// スタンダードプランの制限設定
        /// </summary>
        public LimitsSettings Standard { get; set; } = new();
        /// <summary>
        /// エンタープライズプランの制限設定
        /// </summary>
        public LimitsSettings Enterprise { get; set; } = new();
    }

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