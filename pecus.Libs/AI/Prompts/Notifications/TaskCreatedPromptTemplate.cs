namespace Pecus.Libs.AI.Prompts.Notifications;

/// <summary>
/// タスク作成通知メッセージ生成用のプロンプト入力
/// </summary>
/// <param name="UserName">ユーザー名（一人称）</param>
/// <param name="TaskTypeName">タスク種類名</param>
/// <param name="PriorityText">優先度テキスト（低/中/高/緊急）</param>
/// <param name="DueDateText">期限テキスト（残り日数を含む）</param>
/// <param name="Content">タスク内容</param>
public record TaskCreatedPromptInput(
    string UserName,
    string TaskTypeName,
    string PriorityText,
    string DueDateText,
    string? Content
);

/// <summary>
/// タスク作成通知メッセージ生成用のプロンプトテンプレート
/// </summary>
public class TaskCreatedPromptTemplate : IPromptTemplate<TaskCreatedPromptInput>
{
    /// <inheritdoc />
    public string BuildSystemPrompt(TaskCreatedPromptInput input)
    {
        return $"""
            あなたはチームのチャットルームに投稿するアシスタントです。
            新しく作成されたタスクの内容を確認し、チームメンバーに対して簡潔に紹介するメッセージを生成してください。
            Userの一人称は「{input.UserName}」さんです。

            要件:
            - 100文字以内で簡潔にまとめる
            - タスクの要点（種類、優先度、期限など）を伝える
            - 絵文字は使わない
            - Markdownは使用しない
            - 挨拶は不要

            例: 「新機能開発のバグ修正タスクです。優先度は高く、期限は12/25です。」
            """;
    }

    /// <inheritdoc />
    public string BuildUserPrompt(TaskCreatedPromptInput input)
    {
        return $"""
            以下の新しいタスクについて紹介メッセージを生成してください:

            タスク種類: {input.TaskTypeName}
            優先度: {input.PriorityText}
            期限: {input.DueDateText}
            内容: {input.Content ?? "（未記入）"}
            """;
    }
}