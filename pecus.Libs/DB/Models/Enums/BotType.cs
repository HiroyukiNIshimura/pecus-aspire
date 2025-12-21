using System.Text.Json.Serialization;

namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// ボットの種類を表す列挙型
/// </summary> <summary>
///
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<BotType>))]
public enum BotType
{
    /// <summary>
    /// チャットボット
    /// </summary>
    ChatBot = 1,

    /// <summary>
    /// システム通知ボット
    /// </summary>
    SystemBot = 2,

    /// <summary>
    /// タスク管理ボット(将来の拡張用)
    /// </summary>
    TaskBot = 3,

}