using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Role;

/// <summary>
/// ロール情報レスポンス（簡易版）
/// </summary>
public class RoleInfoResponse
{
    /// <summary>
    /// ロールID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// ロール名
    /// </summary>
    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter<SystemRole>))]
    public required SystemRole Name { get; set; }
}