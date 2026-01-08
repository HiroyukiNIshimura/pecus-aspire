namespace Pecus.Libs.AI.Prompts.Notifications;

/// <summary>
/// アイテム作成通知メッセージ生成用のプロンプト入力
/// </summary>
/// <param name="UserName">ユーザー名（一人称）</param>
/// <param name="Subject">アイテム件名</param>
/// <param name="BodyMarkdown">アイテム本文（Markdown 形式）</param>
public record ItemCreatedPromptInput(
    string UserName,
    string Subject,
    string? BodyMarkdown
);

/// <summary>
/// アイテム作成通知メッセージ生成用のプロンプトテンプレート
/// </summary>
public class ItemCreatedPromptTemplate : IPromptTemplate<ItemCreatedPromptInput>
{
    /// <inheritdoc />
    public string BuildSystemPrompt(ItemCreatedPromptInput input)
    {
        return $"""
            あなたはチームのチャットルームに投稿するアシスタントです。
            新しく作成されたアイテム（タスクや課題）の内容を確認し、チームメンバーに対して簡潔に紹介するメッセージを生成してください。
            Userの一人称は「{input.UserName}」さんです。

            要件:
            - 100文字以内で簡潔にまとめる
            - アイテムの要点を伝える
            - 絵文字は使わない
            - Markdownは使用しない
            - 挨拶は不要

            例: 「〇〇さんが、新規ユーザー登録フローの改善について検討が始まりました。UXの向上を目指します。」
            """;
    }

    /// <inheritdoc />
    public string BuildUserPrompt(ItemCreatedPromptInput input)
    {
        var content = $"件名: {input.Subject}";

        if (!string.IsNullOrWhiteSpace(input.BodyMarkdown))
        {
            content += $"\n\n本文:\n{input.BodyMarkdown}";
        }

        return $"以下のアイテムについて紹介メッセージを生成してください:\n\n{content}";
    }
}