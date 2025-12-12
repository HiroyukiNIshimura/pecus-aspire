namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// 組織の利用プラン
/// </summary>
public enum OrganizationPlan
{
    /// <summary>
    /// 不明または未設定
    /// </summary>
    Unknown = 0,

    /// <summary>
    /// 無料プラン
    /// </summary>
    Free = 1,

    /// <summary>
    /// 標準プラン
    /// </summary>
    Standard = 2,

    /// <summary>
    /// エンタープライズプラン
    /// </summary>
    Enterprise = 3,
}