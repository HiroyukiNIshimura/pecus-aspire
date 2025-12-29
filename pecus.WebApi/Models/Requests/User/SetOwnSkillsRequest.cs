using Pecus.Models.Validation;

namespace Pecus.Models.Requests.User;

/// <summary>
/// 自ユーザースキル設定リクエスト
/// </summary>
public class SetOwnSkillsRequest
{
    /// <summary>
    /// スキルIDのリスト。既存のすべてのスキルを置き換えます。
    /// 空のリストまたはnullの場合はすべてのスキルを削除します。
    /// </summary>
    [IntListRange(0, 50)]
    public List<int>? SkillIds { get; set; }

    /// <summary>
    /// ユーザーの楽観的ロック用RowVersion。
    /// 競合検出に使用されます。設定されている場合、ユーザーのRowVersionをチェックします。
    /// </summary>
    public uint? UserRowVersion { get; set; }
}