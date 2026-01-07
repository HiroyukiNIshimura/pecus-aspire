namespace Pecus.Libs.AI.Prompts.Notifications;

/// <summary>
/// アイテム更新通知メッセージ生成用のプロンプト入力
/// </summary>
/// <param name="UserName">ユーザー名（一人称）</param>
/// <param name="NewContent">更新後のコンテンツ</param>
/// <param name="OldContent">更新前のコンテンツ（差分表示用）</param>
/// <param name="IsSubjectChange">件名変更かどうか</param>
/// <param name="DiffSummary">差分サマリー（オプション）</param>
public record ItemUpdatedPromptInput(
    string UserName,
    string NewContent,
    string? OldContent,
    bool IsSubjectChange,
    string? DiffSummary = null
);

/// <summary>
/// アイテム更新通知メッセージ生成用のプロンプトテンプレート
/// </summary>
public class ItemUpdatedPromptTemplate : IPromptTemplate<ItemUpdatedPromptInput>
{
    /// <inheritdoc />
    public string BuildSystemPrompt(ItemUpdatedPromptInput input)
    {
        return $"""
            あなたはチームのチャットルームに投稿するアシスタントです。
            アイテム（タスクや課題）の変更内容を確認し、チームメンバーに対して変更点を簡潔に紹介するメッセージを生成してください。
            Userの一人称は「{input.UserName}」さんです。

            要件:
            - 100文字以内で簡潔にまとめる
            - 差分情報（追加・削除）から変更の要点を伝える
            - 絵文字は使わない
            - Markdownは使用しない
            - 挨拶は不要

            例: 「件名が『初期設計』から『詳細設計』に変更されました。フェーズが進んだようです。」
            例: 「本文が更新され、実装方針の詳細が追記されました。」
            例: 「期限と担当者に関する記述が追加されました。」
            """;
    }

    /// <inheritdoc />
    public string BuildUserPrompt(ItemUpdatedPromptInput input)
    {
        if (input.IsSubjectChange)
        {
            var prompt = $"以下のアイテムの件名が変更されました:\n\n新しい{input.NewContent}";

            if (!string.IsNullOrWhiteSpace(input.OldContent))
            {
                prompt += $"\n旧{input.OldContent}";
            }

            return prompt;
        }

        var bodyPrompt = $"以下のアイテムの本文が更新されました:\n\n更新後の内容:\n{input.NewContent}";

        if (!string.IsNullOrWhiteSpace(input.DiffSummary))
        {
            bodyPrompt += $"\n\n変更差分:\n{input.DiffSummary}";
        }
        else if (!string.IsNullOrWhiteSpace(input.OldContent))
        {
            bodyPrompt += $"\n\n更新前の内容:\n{input.OldContent}";
        }

        return bodyPrompt;
    }
}
