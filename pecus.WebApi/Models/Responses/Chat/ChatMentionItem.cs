using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Chat;

/// <summary>
/// チャットメッセージのメンション項目
/// </summary>
public class ChatMentionItem
{
    /// <summary>
    /// メンションID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// メンション対象アクターID
    /// </summary>
    [Required]
    public required int MentionedActorId { get; set; }

    /// <summary>
    /// メンション対象ユーザーID（ボットの場合は null）
    /// </summary>
    public int? MentionedUserId { get; set; }

    /// <summary>
    /// メンション対象ボットID（ユーザーの場合は null）
    /// </summary>
    public int? MentionedBotId { get; set; }

    /// <summary>
    /// メンション表示名
    /// </summary>
    [Required]
    public required string DisplayName { get; set; }

    /// <summary>
    /// メンション対象アクター種別
    /// </summary>
    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter<ChatActorType>))]
    public required ChatActorType ActorType { get; set; }
}