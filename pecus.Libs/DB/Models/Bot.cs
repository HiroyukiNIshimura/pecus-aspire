using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// ボットエンティティ
/// </summary>
public class Bot
{
    /// <summary>
    /// ボットID（主キー）
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 組織ID（外部キー、必須）
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// ボットの種類
    /// </summary>
    public BotType Type { get; set; } = BotType.SystemBot;

    /// <summary>
    /// ボット名
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// ペルソナ
    /// </summary>
    public string? Persona { get; set; }

    /// <summary>
    /// ボットのアイコンURL
    /// </summary>
    public string? IconUrl { get; set; }

    /// <summary>
    /// 作成日時（UTC）
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 更新日時（UTC）
    /// </summary>
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation Properties

    /// <summary>
    /// 組織（ナビゲーションプロパティ）
    /// </summary>
    public Organization? Organization { get; set; }

    /// <summary>
    /// チャットアクター（ナビゲーションプロパティ）
    /// ボット作成時に自動生成される
    /// </summary>
    public ChatActor? ChatActor { get; set; }
}