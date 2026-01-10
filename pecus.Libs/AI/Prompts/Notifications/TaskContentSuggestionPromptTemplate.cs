using System.Text;

namespace Pecus.Libs.AI.Prompts.Notifications;

/// <summary>
/// タスク内容提案用のプロンプト入力
/// </summary>
/// <param name="ItemSubject">アイテム件名</param>
/// <param name="ItemBodyMarkdown">アイテム本文（Markdown 形式）</param>
/// <param name="TaskTypeName">タスクタイプ名</param>
/// <param name="WorkspaceContext">ワークスペースのコンテキスト情報</param>
public record TaskContentSuggestionInput(
    string ItemSubject,
    string? ItemBodyMarkdown,
    string TaskTypeName,
    string? WorkspaceContext
);

/// <summary>
/// タスク内容提案用のプロンプトテンプレート
/// </summary>
public class TaskContentSuggestionPromptTemplate : IPromptTemplate<TaskContentSuggestionInput>
{
    /// <inheritdoc />
    public string BuildSystemPrompt(TaskContentSuggestionInput input)
    {
        return """
            あなたはタスク管理のアシスタントです。
            与えられたアイテム情報（件名・本文）とタスクタイプから、具体的で実行可能なタスク内容を提案してください。

            ルール:
            - プレーンテキストで回答する（Markdownは使用しない）
            - 簡潔で具体的な内容にする（1〜3文程度）
            - タスクタイプに適した動詞で始める
            - 達成可能で測定可能な内容にする
            - 日本語で記述する
            - 最適解ではなく、あくまで参考例として提供する
            """;
    }

    /// <inheritdoc />
    public string BuildUserPrompt(TaskContentSuggestionInput input)
    {
        var content = new StringBuilder();
        content.AppendLine($"アイテム件名: {input.ItemSubject}");

        if (!string.IsNullOrWhiteSpace(input.ItemBodyMarkdown))
        {
            var truncatedBody = input.ItemBodyMarkdown.Length > 2000
                ? input.ItemBodyMarkdown[..2000] + "..."
                : input.ItemBodyMarkdown;
            content.AppendLine($"アイテム本文（Markdown）: {truncatedBody}");
        }

        content.AppendLine($"タスクタイプ: {input.TaskTypeName}");

        if (!string.IsNullOrWhiteSpace(input.WorkspaceContext))
        {
            content.AppendLine($"コンテキスト: {input.WorkspaceContext}");
        }

        return content.ToString();
    }
}
