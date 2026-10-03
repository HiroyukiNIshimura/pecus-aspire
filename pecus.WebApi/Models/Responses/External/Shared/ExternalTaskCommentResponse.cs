using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用タスクコメント
/// </summary>
public class ExternalTaskCommentResponse
{
    /// <summary>
    /// コメントID
    /// </summary>
    [Required]
    public int Id { get; set; }

    /// <summary>
    /// コメントしたユーザー
    /// </summary>
    [Required]
    public required ExternalUserRefResponse User { get; set; }

    /// <summary>
    /// コメント内容
    /// </summary>
    [Required]
    public required string Content { get; set; }

    /// <summary>
    /// コメントタイプ
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<TaskCommentType>))]
    public TaskCommentType? CommentType { get; set; }
}