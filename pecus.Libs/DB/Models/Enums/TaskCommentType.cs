using System.Text.Json.Serialization;

namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// タスクコメントの種類を表す列挙型
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<TaskCommentType>))]
public enum TaskCommentType
{
    /// <summary>
    /// 通常コメント
    /// </summary>
    Normal = 1,

    /// <summary>
    /// メモ
    /// </summary>
    Memo = 2,

    /// <summary>
    /// 助けて
    /// </summary>
    HelpWanted = 3,

    /// <summary>
    /// 返事が欲しい
    /// </summary>
    NeedReply = 4,

    /// <summary>
    /// 催促
    /// </summary>
    Reminder = 5,

    /// <summary>
    /// 督促
    /// </summary>
    Urge = 6,
}
