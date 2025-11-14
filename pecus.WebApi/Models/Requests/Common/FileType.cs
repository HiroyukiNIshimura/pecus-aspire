using System.Text.Json.Serialization;

namespace Pecus.Models.Requests.Common;

/// <summary>
/// ファイル種別
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FileType
{
    /// <summary>ユーザーアバター</summary>
    Avatar,

    /// <summary>ジャンル画像</summary>
    Genre
}

