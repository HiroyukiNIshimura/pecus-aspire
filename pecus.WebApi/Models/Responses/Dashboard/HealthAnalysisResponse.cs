using Pecus.Models.Requests.Dashboard;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Dashboard;

/// <summary>
/// 健康診断レスポンス
/// </summary>
public class HealthAnalysisResponse
{
    /// <summary>
    /// 診断タイプ
    /// </summary>
    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter<HealthAnalysisType>))]
    public required HealthAnalysisType AnalysisType { get; set; }

    /// <summary>
    /// 診断スコープ
    /// </summary>
    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter<HealthAnalysisScope>))]
    public required HealthAnalysisScope Scope { get; set; }

    /// <summary>
    /// ワークスペースID（Scope が Workspace の場合）
    /// </summary>
    public int? WorkspaceId { get; set; }

    /// <summary>
    /// ワークスペース名（Scope が Workspace の場合）
    /// </summary>
    public string? WorkspaceName { get; set; }

    /// <summary>
    /// 生成AIによる診断結果
    /// </summary>
    [Required]
    public required string Analysis { get; set; }

    /// <summary>
    /// 診断生成日時
    /// </summary>
    [Required]
    public required DateTimeOffset GeneratedAt { get; set; }
}