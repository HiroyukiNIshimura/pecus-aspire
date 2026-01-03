namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors;

/// <summary>
/// 振る舞いごとの観点を時刻ベースハッシュで選択するサービス
/// </summary>
public interface IPerspectiveRotator
{
    /// <summary>
    /// 観点を取得する（スコープID + 時刻のハッシュで選択）
    /// </summary>
    /// <param name="behaviorName">振る舞い名</param>
    /// <param name="scopeId">スコープID（WorkspaceId または OrganizationId）</param>
    /// <param name="perspectives">観点リスト</param>
    /// <returns>選択された観点文字列</returns>
    string GetNext(string behaviorName, int scopeId, string[] perspectives);
}

/// <summary>
/// 時刻ベースハッシュで観点を選択する実装
/// 同じスコープでも時間が経てば異なる観点、同じ時刻でも異なるスコープなら異なる観点が選ばれる
/// 状態を保存しないためプロセス間で共有不要
/// </summary>
public class PerspectiveRotator : IPerspectiveRotator
{
    /// <inheritdoc />
    public string GetNext(string behaviorName, int scopeId, string[] perspectives)
    {
        if (perspectives.Length == 0)
        {
            throw new ArgumentException("perspectives cannot be empty", nameof(perspectives));
        }

        var minutesSinceEpoch = DateTime.UtcNow.Ticks / TimeSpan.TicksPerMinute;
        var seed = HashCode.Combine(behaviorName, scopeId, minutesSinceEpoch);
        var index = Math.Abs(seed) % perspectives.Length;

        return perspectives[index];
    }
}