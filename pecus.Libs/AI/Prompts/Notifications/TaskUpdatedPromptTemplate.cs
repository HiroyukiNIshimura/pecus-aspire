using Pecus.Libs.Hangfire.Tasks.Bot;

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
/// <param name="Changes">変更情報（オプション）</param>
public record TaskUpdatedPromptInput(
    string UserName,
    string TaskTypeName,
    string PriorityText,
    string DueDateText,
    int ProgressPercentage,
    bool IsCompleted,
    bool IsDiscarded,
    string? Content,
    TaskUpdateChanges? Changes = null
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
        var changeDetails = BuildChangeDetails(input.Changes);

        return $"""
            以下の更新されたタスクについて紹介メッセージを生成してください:

            タスク種類: {input.TaskTypeName}
            優先度: {input.PriorityText}
            期限: {input.DueDateText}
            進捗率: {input.ProgressPercentage}%
            完了: {(input.IsCompleted ? "はい" : "いいえ")}
            破棄: {(input.IsDiscarded ? "はい" : "いいえ")}
            内容: {input.Content ?? "（未記入）"}
            {changeDetails}
            """;
    }

    /// <summary>
    /// 変更内容の詳細テキストを生成する
    /// </summary>
    private static string BuildChangeDetails(TaskUpdateChanges? changes)
    {
        if (changes == null || !changes.HasAnyChanges)
        {
            return string.Empty;
        }

        var details = new List<string>();

        if (changes.PriorityChanged)
        {
            var prev = GetPriorityText(changes.PreviousPriority);
            var next = GetPriorityText(changes.NewPriority);
            details.Add($"優先度: {prev} → {next}");
        }

        if (changes.StartDateChanged)
        {
            var prev = changes.PreviousStartDate?.ToString("yyyy/MM/dd") ?? "未設定";
            var next = changes.NewStartDate?.ToString("yyyy/MM/dd") ?? "未設定";
            details.Add($"開始日: {prev} → {next}");
        }

        if (changes.DueDateChanged)
        {
            var prev = changes.PreviousDueDate.ToString("yyyy/MM/dd");
            var next = changes.NewDueDate.ToString("yyyy/MM/dd");
            details.Add($"期限: {prev} → {next}");
        }

        if (changes.EstimatedHoursChanged)
        {
            var prev = changes.PreviousEstimatedHours?.ToString("0.#") ?? "未設定";
            var next = changes.NewEstimatedHours?.ToString("0.#") ?? "未設定";
            details.Add($"予定工数: {prev}h → {next}h");
        }

        if (changes.ProgressPercentageChanged)
        {
            var prev = changes.PreviousProgressPercentage?.ToString() ?? "0";
            var next = changes.NewProgressPercentage?.ToString() ?? "0";
            details.Add($"進捗: {prev}% → {next}%");
        }

        if (changes.AssignedUserIdChanged)
        {
            details.Add("担当者が変更されました");
        }

        if (details.Count == 0)
        {
            return string.Empty;
        }

        return $"\n変更内容:\n{string.Join("\n", details)}";
    }

    /// <summary>
    /// 優先度のテキストを取得する
    /// </summary>
    private static string GetPriorityText(DB.Models.Enums.TaskPriority? priority)
    {
        return priority switch
        {
            DB.Models.Enums.TaskPriority.Low => "低",
            DB.Models.Enums.TaskPriority.Medium => "中",
            DB.Models.Enums.TaskPriority.High => "高",
            DB.Models.Enums.TaskPriority.Critical => "緊急",
            _ => "中"
        };
    }
}