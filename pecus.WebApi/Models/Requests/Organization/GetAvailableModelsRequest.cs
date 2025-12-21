using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Organization;

/// <summary>
/// 利用可能なAIモデル一覧取得リクエスト
/// </summary>
public sealed class GetAvailableModelsRequest
{
    /// <summary>
    /// APIキー
    /// </summary>
    [Required]
    public required string ApiKey { get; init; }

    /// <summary>
    /// 生成AIベンダー
    /// </summary>
    [Required]
    public required GenerativeApiVendor Vendor { get; init; }
}