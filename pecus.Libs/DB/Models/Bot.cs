using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// ボットエンティティ（グローバル、全組織共通）
/// AI動作の定義（ペルソナ・制約）を持つ
/// 組織ごとの表示情報はChatActorが持つ
/// </summary>
public class Bot
{
    /// <summary>
    /// ボットID（主キー）
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ボットの種類
    /// </summary>
    public BotType Type { get; set; } = BotType.SystemBot;

    /// <summary>
    /// ボット名（デフォルト値、ChatActorで上書き可能）
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// ペルソナ
    /// </summary>
    public string? Persona { get; set; }

    /// <summary>
    /// 行動指針（制約条件）
    /// </summary>
    public string? Constraint { get; set; }

    /// <summary>
    /// ボットのアイコンURL（デフォルト値、ChatActorで上書き可能）
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
    /// チャットアクター（ナビゲーションプロパティ）
    /// 各組織でこのBotを使用するChatActorのコレクション
    /// </summary>
    public ICollection<ChatActor> ChatActors { get; set; } = new List<ChatActor>();

    /// <summary>
    /// 楽観ロック用バージョン（PostgreSQL xmin）
    /// </summary>
    public uint RowVersion { get; set; }
}