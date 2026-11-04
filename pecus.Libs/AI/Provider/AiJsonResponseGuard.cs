using Pecus.Libs.AI.Models;

namespace Pecus.Libs.AI.Provider;

/// <summary>
/// JSON レスポンス本文を取り出す際の共通検証
/// 拒否や打ち切りを汎用のパースエラーではなく原因の特定できる例外として扱う
/// </summary>
internal static class AiJsonResponseGuard
{
    /// <summary>
    /// Chat Completions 形式のレスポンスから JSON 本文を取り出す
    /// </summary>
    /// <param name="response">レスポンス</param>
    /// <param name="providerName">例外メッセージに含めるプロバイダー名</param>
    /// <returns>JSON 本文</returns>
    public static string GetContent(ChatCompletionResponse response, string providerName)
    {
        var choice = response.Choices.FirstOrDefault()
            ?? throw new InvalidOperationException($"{providerName} API returned no choices");

        if (!string.IsNullOrEmpty(choice.Message.Refusal))
        {
            throw new InvalidOperationException(
                $"{providerName} API refused the request: {choice.Message.Refusal}");
        }

        if (string.Equals(choice.FinishReason, "length", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"{providerName} API response was truncated by the token limit (finish_reason=length)");
        }

        if (string.Equals(choice.FinishReason, "content_filter", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"{providerName} API response was blocked by the content filter (finish_reason=content_filter)");
        }

        var content = choice.Message.Content;
        if (string.IsNullOrEmpty(content))
        {
            throw new InvalidOperationException($"{providerName} API returned empty content for JSON request");
        }

        return content;
    }
}
