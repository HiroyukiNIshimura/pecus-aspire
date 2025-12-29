using Pecus.Models.Validation;

namespace Pecus.Models.Requests.Workspace;

/// <summary>
/// ワークスペーススキル設定リクエスト
/// </summary>
public class SetWorkspaceSkillsRequest
{
    /// <summary>
    /// スキルIDのリスト。既存のすべてのスキルを置き換えます。
    /// 空のリストまたはnullの場合はすべてのスキルを削除します。
    /// </summary>
    [IntListRange(0, 50)]
    public List<int>? SkillIds { get; set; }

    /// <summary>
    /// ワークスペースの楽観的ロック用RowVersion。
    /// 競合検出に使用されます。
    /// </summary>
    public required uint RowVersion { get; set; }
}