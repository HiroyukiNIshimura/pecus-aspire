using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペースアイテム統計情報レスポンス
/// </summary>
public class WorkspaceItemStatistics
{
    /// <summary>
    /// 検索結果に該当するワークスペース
    /// </summary>
    public List<SummaryWorkspaceResponse> Workspaces { get; set; } = new();

}

public class SummaryWorkspaceResponse
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    [Required]
    public required string Name { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public string? Code { get; set; }

    /// <summary>
    /// ジャンルID
    /// </summary>
    public int? GenreId { get; set; }

    /// <summary>
    /// ジャンル名
    /// </summary>
    public string? GenreName { get; set; }

    /// <summary>
    /// ジャンルのアイコン（例: FontAwesome のクラス名）
    /// </summary>
    public string? GenreIcon { get; set; }

    /// <summary>
    /// ワークスペースモード（Normal/Document）
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<WorkspaceMode>))]
    public WorkspaceMode? Mode { get; set; }
}