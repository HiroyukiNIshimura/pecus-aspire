using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.BackOffice;

/// <summary>
/// BackOffice用 ボットのPersona/Constraint更新リクエスト
/// </summary>
public class BackOfficeUpdateBotPersonaRequest
{
    /// <summary>
    /// ペルソナ（ボットの性格・役割設定）
    /// </summary>
    [MaxLength(4000)]
    public string? Persona { get; set; }

    /// <summary>
    /// 行動指針（制約条件）
    /// </summary>
    [MaxLength(4000)]
    public string? Constraint { get; set; }

    /// <summary>
    /// 楽観ロック用 RowVersion
    /// </summary>
    [Required]
    public required uint RowVersion { get; set; }
}