using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pecus.Libs.AI;

/// <summary>
/// AI が返す JSON レスポンスを DTO へデシリアライズするための共通設定
/// </summary>
internal static class AiJsonSerializer
{
    /// <summary>
    /// AI レスポンス用のシリアライザ設定
    /// プロパティ名の大文字小文字を無視し、enum は文字列として受け取る
    /// </summary>
    public static readonly JsonSerializerOptions ResponseOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };
}
