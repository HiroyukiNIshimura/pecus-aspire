using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Requests.User;

/// <summary>
/// ランディングページ推奨への応答リクエスト
/// </summary>
public class RespondToLandingPageRecommendationRequest
{
    /// <summary>
    /// 応答アクション
    /// </summary>
    [Required(ErrorMessage = "アクションは必須です。")]
    [JsonConverter(typeof(JsonStringEnumConverter<LandingPageRecommendationAction>))]
    public required LandingPageRecommendationAction Action { get; set; }
}

/// <summary>
/// ランディングページ推奨への応答アクション
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<LandingPageRecommendationAction>))]
public enum LandingPageRecommendationAction
{
    /// <summary>
    /// 推奨を受け入れる（ランディングページを変更）
    /// </summary>
    Accept,

    /// <summary>
    /// 推奨を拒否する（現在の設定を維持）
    /// </summary>
    Reject
}