namespace Pecus.Libs.AI.Prompts.Notifications;

/// <summary>
/// タスク完了祝福メッセージ生成用のプロンプト入力
/// </summary>
/// <param name="AssigneeName">担当者名</param>
/// <param name="TaskTypeName">タスク種類名</param>
/// <param name="ItemSubject">アイテムの件名</param>
/// <param name="WorkspaceName">ワークスペース名</param>
public record TaskCompletedPromptInput(
    string AssigneeName,
    string TaskTypeName,
    string ItemSubject,
    string WorkspaceName
);

/// <summary>
/// タスク完了祝福メッセージ生成用のプロンプトテンプレート
/// </summary>
public class TaskCompletedPromptTemplate : IPromptTemplate<TaskCompletedPromptInput>
{
    /// <inheritdoc />
    public string BuildSystemPrompt(TaskCompletedPromptInput input)
    {
        return $"""
            あなたはチームのアシスタントBotです。
            タスクを完了した担当者に対して、達成を祝福する簡潔なメッセージを生成してください。
            担当者の名前は「{input.AssigneeName}」さんです。

            要件:
            - 80文字以内で簡潔にまとめる
            - 温かみのある祝福のメッセージ
            - 絵文字は使わない
            - Markdownは使用しない
            - 挨拶は不要
            - 次のタスクへの意欲を削がないポジティブな内容

            例: 「お疲れ様でした！素晴らしい成果ですね。」
            """;
    }

    /// <inheritdoc />
    public string BuildUserPrompt(TaskCompletedPromptInput input)
    {
        return $"""
            以下のタスク完了に対する祝福メッセージを生成してください:

            担当者: {input.AssigneeName}さん
            タスク種類: {input.TaskTypeName}
            ワークスペース: {input.WorkspaceName}
            アイテム件名: {input.ItemSubject}
            """;
    }
}
