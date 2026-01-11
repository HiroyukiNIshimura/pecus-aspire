namespace Pecus.Libs.Achievements;

/// <summary>
/// 実績判定ロジックのインターフェース
/// </summary>
public interface IAchievementStrategy
{
    /// <summary>
    /// 対応する実績コード（AchievementMaster.Code と一致させる）
    /// </summary>
    string AchievementCode { get; }

    /// <summary>
    /// 判定を実行し、達成したユーザーIDのリストを返す
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="evaluationDate">判定基準日時</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>達成条件を満たしたユーザーIDのリスト</returns>
    Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default);
}
