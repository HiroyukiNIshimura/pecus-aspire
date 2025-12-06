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
    /// Azure OpenAI Service
    /// </summary>
    AzureOpenAi = 2,

    /// <summary>
    /// Anthropic Claude
    /// </summary>
    Anthropic = 3,

    /// <summary>
    /// Google Gemini API
    /// </summary>
    GoogleGemini = 4,
}
