namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors;

/// <summary>
/// ボットの振る舞いを選択するインターフェース
/// </summary>
public interface IBotBehaviorSelector
{
    /// <summary>
    /// 登録された振る舞いから1つを選択する
    /// </summary>
    /// <param name="context">振る舞いコンテキスト</param>
    /// <returns>選択された振る舞い。null の場合は何もしない</returns>
    Task<IBotBehavior?> SelectBehaviorAsync(BotBehaviorContext context);
}
