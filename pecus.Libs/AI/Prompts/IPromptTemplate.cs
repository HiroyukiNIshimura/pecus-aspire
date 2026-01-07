namespace Pecus.Libs.AI.Prompts;

/// <summary>
/// プロンプトテンプレートの共通インターフェース
/// AI メッセージ生成時のシステムプロンプトとユーザープロンプトを構築する
/// </summary>
/// <typeparam name="TInput">プロンプト生成に必要な入力パラメータの型</typeparam>
public interface IPromptTemplate<in TInput>
{
    /// <summary>
    /// システムプロンプトを生成する
    /// </summary>
    /// <param name="input">入力パラメータ</param>
    /// <returns>システムプロンプト文字列</returns>
    string BuildSystemPrompt(TInput input);

    /// <summary>
    /// ユーザープロンプトを生成する
    /// </summary>
    /// <param name="input">入力パラメータ</param>
    /// <returns>ユーザープロンプト文字列</returns>
    string BuildUserPrompt(TInput input);
}

/// <summary>
/// プロンプトペア（システム + ユーザー）
/// </summary>
/// <param name="SystemPrompt">システムプロンプト</param>
/// <param name="UserPrompt">ユーザープロンプト</param>
public record PromptPair(string SystemPrompt, string UserPrompt);

/// <summary>
/// プロンプトテンプレートの拡張メソッド
/// </summary>
public static class PromptTemplateExtensions
{
    /// <summary>
    /// プロンプトペアを生成する
    /// </summary>
    public static PromptPair Build<TInput>(this IPromptTemplate<TInput> template, TInput input)
    {
        return new PromptPair(
            template.BuildSystemPrompt(input),
            template.BuildUserPrompt(input)
        );
    }
}
