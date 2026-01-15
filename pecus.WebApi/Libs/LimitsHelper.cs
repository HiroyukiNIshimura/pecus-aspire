using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Config;

namespace Pecus.Libs;

/// <summary>
/// 制限設定ヘルパークラス
/// </summary>
public class LimitsHelper
{
    public static LimitsSettings GetLimitsSettingsForPlan(Limits limits, OrganizationPlan plan)
    {
        return plan switch
        {
            OrganizationPlan.Free => limits.Free,
            OrganizationPlan.Standard => limits.Standard,
            OrganizationPlan.Enterprise => limits.Enterprise,
            _ => limits.Free,
        };
    }
}
