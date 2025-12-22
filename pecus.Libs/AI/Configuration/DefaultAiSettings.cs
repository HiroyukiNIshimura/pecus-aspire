using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.AI.Configuration;

/// <summary>
/// システムデフォルトAIに関する設定
/// 任意のプロバイダー（Anthropic, DeepSeek, Gemini, OpenAI）を選択可能
/// </summary>
public class DefaultAiSettings
{
    /// <summary>
    /// 設定セクション名
    /// </summary>
    public const string SectionName = "DefaultAi";

    /// <summary>
    /// 使用するプロバイダー
    /// </summary>
    public GenerativeApiVendor Provider { get; set; } = GenerativeApiVendor.None;

    /// <summary>
    /// 使用するモデル名（必須）
    /// </summary>
    public string Model { get; set; } = string.Empty;

    /// <summary>
    /// APIキー（必須）
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;
}
