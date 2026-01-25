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
    /// システムボット
    /// </summary>
    SystemBot = 2,

    /// <summary>
    /// 野生のCoatiボット
    /// </summary>
    WildBot = 3,

}