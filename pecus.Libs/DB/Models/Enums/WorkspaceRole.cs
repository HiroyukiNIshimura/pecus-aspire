using System.Text.Json.Serialization;

namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// ワークスペース内でのユーザーの役割を表す列挙型
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<WorkspaceRole>))]
public enum WorkspaceRole
{
    /// <summary>
    /// 閲覧者（読み取り専用）
    /// </summary>
    Viewer = 1,

    /// <summary>
    /// メンバー（編集可能）
    /// </summary>
    Member = 2,

    /// <summary>
    /// オーナー（すべての権限）
    /// </summary>
    Owner = 3,
}