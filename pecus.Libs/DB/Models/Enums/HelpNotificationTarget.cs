using System.Text.Json.Serialization;

namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// ヘルプコメントの通知先を表す列挙型
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<HelpNotificationTarget>))]
public enum HelpNotificationTarget
{
    /// <summary>
    /// 組織全体に通知
    /// </summary>
    Organization = 1,

    /// <summary>
    /// ワークスペースユーザーに通知
    /// </summary>
    WorkspaceUsers = 2,
}
