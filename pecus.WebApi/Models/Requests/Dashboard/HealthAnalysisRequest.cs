using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Requests.Dashboard;

/// <summary>
/// 健康診断のスコープ
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<HealthAnalysisScope>))]
public enum HealthAnalysisScope
{
    /// <summary>
    /// 組織全体
    /// </summary>
    Organization,

    /// <summary>
    /// 特定のワークスペース
    /// </summary>
    Workspace,
}

/// <summary>
/// 健康診断の種類
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<HealthAnalysisType>))]
public enum HealthAnalysisType
{
    /// <summary>
    /// 現在の健康状態
    /// </summary>
    CurrentHealth,

    /// <summary>
    /// 問題点ピックアップ
    /// </summary>
    ProblemPickup,

    /// <summary>
    /// 今後の予測
    /// </summary>
    FuturePrediction,

    /// <summary>
    /// 改善提案
    /// </summary>
    Recommendation,

    /// <summary>
    /// 前週比較
    /// </summary>
    Comparison,

    /// <summary>
    /// 総合レポート
    /// </summary>
    Summary,
}

/// <summary>
/// 健康診断リクエスト
/// </summary>
public class HealthAnalysisRequest
{
    /// <summary>
    /// 診断スコープ（Organization または Workspace）
    /// </summary>
    [Required]
    public HealthAnalysisScope Scope { get; set; }

    /// <summary>
    /// ワークスペースID（Scope が Workspace の場合に必須）
    /// </summary>
    public int? WorkspaceId { get; set; }

    /// <summary>
    /// 診断タイプ
    /// </summary>
    [Required]
    public HealthAnalysisType AnalysisType { get; set; }
}