using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Responses.Common;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.BackOffice;

/// <summary>
/// BackOffice用 ボットレスポンス（Persona/Constraint編集用）
/// </summary>
public class BackOfficeBotResponse : IConflictModel
{
    /// <summary>
    /// ボットID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// ボット名
    /// </summary>
    [Required]
    public required string Name { get; set; }

    /// <summary>
    /// ボットの種類
    /// </summary>
    [Required]
    public required BotType Type { get; set; }

    /// <summary>
    /// ペルソナ（ボットの性格・役割設定）
    /// </summary>
    public string? Persona { get; set; }

    /// <summary>
    /// 行動指針（制約条件）
    /// </summary>
    public string? Constraint { get; set; }

    /// <summary>
    /// ボットのアイコンURL
    /// </summary>
    public string? IconUrl { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    [Required]
    public required DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    [Required]
    public required DateTimeOffset UpdatedAt { get; set; }

    /// <summary>
    /// 楽観ロック用 RowVersion
    /// </summary>
    [Required]
    public required uint RowVersion { get; set; }
}
