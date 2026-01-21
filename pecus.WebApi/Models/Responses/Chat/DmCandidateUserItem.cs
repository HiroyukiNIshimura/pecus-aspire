using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Chat;

/// <summary>
/// DM候補ユーザー項目（既存DMがないアクティブユーザー）
/// </summary>
public class DmCandidateUserItem : UserIdentityResponse
{
    /// <summary>
    /// 最終アクティブ日時（最終ログイン日時）
    /// </summary>
    public DateTimeOffset? LastActiveAt { get; set; }
}