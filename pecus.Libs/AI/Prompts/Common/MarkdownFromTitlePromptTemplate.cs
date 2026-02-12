namespace Pecus.Libs.AI.Prompts.Common;

/// <summary>
/// Markdown本文生成用のプロンプト入力
/// </summary>
/// <param name="Title">タイトル</param>
/// <param name="AdditionalContext">追加のコンテキスト情報</param>
public record MarkdownFromTitleInput(
    string Title,
    string? AdditionalContext
);

/// <summary>
/// タイトルからMarkdown本文を生成するプロンプトテンプレート
/// </summary>
public class MarkdownFromTitlePromptTemplate : IPromptTemplate<MarkdownFromTitleInput>
{
    /// <inheritdoc />
    public string BuildSystemPrompt(MarkdownFromTitleInput input)
    {
        return """
            あなたはビジネス文書作成のアシスタントです。
            与えられたタイトルと補足情報から、適切な本文テンプレートをMarkdown形式で作成してください。

            ルール:
            - 簡潔で分かりやすい文章を心がける
            - 必要に応じて見出し（##, ###）、箇条書き、表を使用する
            - 最初の行はタイトルの見出し（#）から始めない（タイトルは別途表示されるため）
            - 日本語で記述する
            - 補足情報が提供された場合は、その内容に特化した回答を行う
            - 最適解ではなく、あくまで参考例として提供する
            """;
    }

    /// <inheritdoc />
    public string BuildUserPrompt(MarkdownFromTitleInput input)
    {
        return string.IsNullOrEmpty(input.AdditionalContext)
            ? $"タイトル: {input.Title}"
            : $"タイトル: {input.Title}\n\n補足情報: {input.AdditionalContext}";
    }
}