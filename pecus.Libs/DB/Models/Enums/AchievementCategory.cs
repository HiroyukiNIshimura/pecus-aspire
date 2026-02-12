namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// 実績のカテゴリを表す列挙型
/// </summary>
public enum AchievementCategory
{
    /// <summary>
    /// 働き方（暁の開拓者、週末の聖域など）
    /// </summary>
    WorkStyle = 1,

    /// <summary>
    /// 生産性（Inbox Zero、タスク料理人など）
    /// </summary>
    Productivity = 2,

    /// <summary>
    /// AI活用（AI使いの弟子など）
    /// </summary>
    AI = 3,

    /// <summary>
    /// チームプレイ（沈黙の守護者、救世主など）
    /// </summary>
    TeamPlay = 4,

    /// <summary>
    /// 品質（一発完了、学習者など）
    /// </summary>
    Quality = 5,

    /// <summary>
    /// 信頼性（安定の担当者、約束の人、前倒しマスター、証拠を残す人など）
    /// </summary>
    Reliability = 6
}