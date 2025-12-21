namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// 利用する生成APIベンダーの種類
/// </summary>
public enum GenerativeApiVendor
{
    /// <summary>
    /// 未使用
    /// </summary>
    None = 0,

    /// <summary>
    /// OpenAI (api.openai.com)
    /// </summary>
    OpenAi = 1,

    /// <summary>
    /// Anthropic Claude
    /// </summary>
    Anthropic = 2,

    /// <summary>
    /// Google Gemini API
    /// </summary>
    GoogleGemini = 3,

    /// <summary>
    /// DeepSeek API
    /// </summary>
    DeepSeek = 4
}