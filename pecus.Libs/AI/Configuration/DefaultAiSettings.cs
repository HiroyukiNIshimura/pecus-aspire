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
    public GenerativeApiVendor Provider { get; set; } = GenerativeApiVendor.DeepSeek;

    /// <summary>
    /// 使用するモデル名（省略時は各プロバイダーのデフォルトモデルを使用）
    /// </summary>
    public string? Model { get; set; }

    /// <summary>
    /// APIキー（省略時は各プロバイダーの設定を使用）
    /// </summary>
    public string? ApiKey { get; set; }
}
