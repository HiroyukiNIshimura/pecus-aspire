namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors;

/// <summary>
/// ボットの振る舞いを定義するインターフェース
/// 新しい振る舞いを追加する場合は、このインターフェースを実装してDI登録する
/// </summary>
public interface IBotBehavior
{
    /// <summary>
    /// 振る舞いの識別名（ログ出力用）
    /// </summary>
    string Name { get; }

    /// <summary>
    /// この振る舞いが選択される重み（0-100）
    /// 全振る舞いの重みの合計に対する割合で選択確率が決まる
    /// </summary>
    int Weight { get; }

    /// <summary>
    /// この振る舞いが適用可能かどうかを判定する
    /// </summary>
    /// <param name="context">振る舞いコンテキスト</param>
    /// <returns>適用可能な場合は true</returns>
    Task<bool> CanExecuteAsync(BotBehaviorContext context);

    /// <summary>
    /// 振る舞いを実行してメッセージを生成する
    /// </summary>
    /// <param name="context">振る舞いコンテキスト</param>
    /// <returns>生成されたメッセージ。null の場合は送信しない</returns>
    Task<string?> ExecuteAsync(BotBehaviorContext context);
}