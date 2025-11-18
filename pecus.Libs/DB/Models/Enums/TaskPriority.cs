using System.Text.Json.Serialization;

namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// タスクの優先度を表す列挙型
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<TaskPriority>))]
public enum TaskPriority
{
    /// <summary>
    /// 低優先度
    /// </summary>
    Low = 1,

    /// <summary>
    /// 中優先度
    /// </summary>
    Medium = 2,

    /// <summary>
    /// 高優先度
    /// </summary>
    High = 3,

    /// <summary>
    /// 緊急
    /// </summary>
    Critical = 4,
}