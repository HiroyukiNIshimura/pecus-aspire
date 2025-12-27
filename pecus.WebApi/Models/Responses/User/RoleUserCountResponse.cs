using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ロールごとのユーザー数
/// </summary>
public class RoleUserCountResponse
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

    /// <summary>
    /// ユーザー数
    /// </summary>
    [Required]
    public required int Count { get; set; } = 0;
}