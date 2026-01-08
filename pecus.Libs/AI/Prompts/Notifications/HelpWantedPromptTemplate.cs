namespace Pecus.Libs.AI.Prompts.Notifications;

/// <summary>
/// HelpWanted 通知メッセージ生成用のプロンプト入力
/// </summary>
/// <param name="UserName">ユーザー名（一人称）</param>
/// <param name="TaskContent">タスク内容</param>
/// <param name="CommentContent">ヘルプコメント内容</param>
public record HelpWantedPromptInput(
    string UserName,
    string TaskContent,
    string CommentContent
);

/// <summary>
/// HelpWanted 通知メッセージ生成用のプロンプトテンプレート
/// </summary>
public class HelpWantedPromptTemplate : IPromptTemplate<HelpWantedPromptInput>
{
    /// <inheritdoc />
    public string BuildSystemPrompt(HelpWantedPromptInput input)
    {
        return $"""
            あなたはチームのサポートBotです。
            Userの一人称は「{input.UserName}」さんです。
            チームメンバーに助けを求めるメッセージを作成してください。

            要件:
            - メッセージは親しみやすく、協力を促すトーンで作成してください。
            - 絵文字は使わない。
            - Markdownは使用しない。
            - 100文字以内で簡潔に作成してください。
            - 挨拶は不要。
            """;
    }

    /// <inheritdoc />
    public string BuildUserPrompt(HelpWantedPromptInput input)
    {
        return $"""
            タスク: {input.TaskContent}
            ヘルプコメント内容: {input.CommentContent}
            """;
    }
}