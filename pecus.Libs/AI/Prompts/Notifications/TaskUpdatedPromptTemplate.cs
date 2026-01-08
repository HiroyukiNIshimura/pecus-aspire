namespace Pecus.Libs.AI.Prompts.Notifications;

/// <summary>
/// タスク更新通知メッセージ生成用のプロンプト入力
/// </summary>
/// <param name="UserName">ユーザー名（一人称）</param>
/// <param name="TaskTypeName">タスク種類名</param>
/// <param name="PriorityText">優先度テキスト（低/中/高/緊急）</param>
/// <param name="DueDateText">期限テキスト（残り日数を含む）</param>
/// <param name="ProgressPercentage">進捗率</param>
/// <param name="IsCompleted">完了フラグ</param>
/// <param name="IsDiscarded">破棄フラグ</param>
/// <param name="Content">タスク内容</param>
public record TaskUpdatedPromptInput(
    string UserName,
    string TaskTypeName,
    string PriorityText,
    string DueDateText,
    int ProgressPercentage,
    bool IsCompleted,
    bool IsDiscarded,
    string? Content
);

/// <summary>
/// タスク更新通知メッセージ生成用のプロンプトテンプレート
/// </summary>
public class TaskUpdatedPromptTemplate : IPromptTemplate<TaskUpdatedPromptInput>
{
    /// <inheritdoc />
    public string BuildSystemPrompt(TaskUpdatedPromptInput input)
    {
        return $"""
            あなたはチームのチャットルームに投稿するアシスタントです。
            【重要】これは既存タスクの「更新」通知です。新規作成ではありません。
            更新後のタスク内容を確認し、チームメンバーに対して簡潔に紹介するメッセージを生成してください。
            Userの一人称は「{input.UserName}」さんです。

            要件:
            - 100文字以内で簡潔にまとめる
            - 「更新」「変更」などの表現を使う（「作成」「新規」は使わない）
            - タスクの現在の状態（種類、優先度、期限、進捗など）を伝える
            - 絵文字は使わない
            - Markdownは使用しない
            - 挨拶は不要

            例: 「バグ修正タスクの優先度が高に更新されました。期限は12/25（残り3日）、進捗50%です。」
            """;
    }

    /// <inheritdoc />
    public string BuildUserPrompt(TaskUpdatedPromptInput input)
    {
        return $"""
            以下の更新されたタスクについて紹介メッセージを生成してください:

            タスク種類: {input.TaskTypeName}
            優先度: {input.PriorityText}
            期限: {input.DueDateText}
            進捗率: {input.ProgressPercentage}%
            完了: {(input.IsCompleted ? "はい" : "いいえ")}
            破棄: {(input.IsDiscarded ? "はい" : "いいえ")}
            内容: {input.Content ?? "（未記入）"}
            """;
    }
}