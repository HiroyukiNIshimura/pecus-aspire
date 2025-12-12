using Pecus.Libs.DB.Models.Enums;
using System.Text.Json;

namespace Pecus.Libs;

/// <summary>
/// アクティビティの Details JSON を構築するヘルパー
/// UI表示を考慮し、IDではなく表示用の値（名前、ラベル等）を含める
/// </summary>
/// <remarks>
/// 責務の分離:
/// - このクラス: JSON生成のみ（サービス層で事前に必要なデータを取得して渡す）
/// - ActivityTasks: DBへのActivity INSERT のみ
/// </remarks>
public static class ActivityDetailsBuilder
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    /// <summary>
    /// ユーザー変更（担当者、コミッター）用の Details を生成
    /// </summary>
    /// <param name="oldUserName">変更前のユーザー名（null = 未割当）</param>
    /// <param name="newUserName">変更後のユーザー名（null = 未割当）</param>
    /// <returns>変更があればJSON文字列、変更がなければnull</returns>
    public static string? BuildUserChangeDetails(string? oldUserName, string? newUserName)
    {
        if (oldUserName == newUserName) return null;

        return JsonSerializer.Serialize(new
        {
            old = oldUserName,
            @new = newUserName
        }, JsonOptions);
    }

    /// <summary>
    /// 優先度変更用の Details を生成（日本語ラベル付き）
    /// </summary>
    public static string? BuildPriorityChangeDetails(TaskPriority? oldValue, TaskPriority? newValue)
    {
        if (oldValue == newValue) return null;

        return JsonSerializer.Serialize(new
        {
            old = GetPriorityLabel(oldValue),
            @new = GetPriorityLabel(newValue)
        }, JsonOptions);
    }

    /// <summary>
    /// 文字列変更用の Details を生成
    /// </summary>
    public static string? BuildStringChangeDetails(string? oldValue, string? newValue)
    {
        if (oldValue == newValue) return null;

        return JsonSerializer.Serialize(new
        {
            old = oldValue,
            @new = newValue
        }, JsonOptions);
    }

    /// <summary>
    /// 本文更新用（oldのみ保存してデータサイズ削減）
    /// </summary>
    public static string? BuildBodyChangeDetails(string? oldValue, string? newValue)
    {
        if (oldValue == newValue) return null;

        return JsonSerializer.Serialize(new { old = oldValue }, JsonOptions);
    }

    /// <summary>
    /// bool変更用の Details を生成
    /// </summary>
    public static string? BuildBoolChangeDetails(bool oldValue, bool newValue)
    {
        if (oldValue == newValue) return null;

        return JsonSerializer.Serialize(new
        {
            old = oldValue,
            @new = newValue
        }, JsonOptions);
    }

    /// <summary>
    /// 日時変更用の Details を生成
    /// </summary>
    public static string? BuildDateTimeChangeDetails(DateTimeOffset? oldValue, DateTimeOffset? newValue)
    {
        if (oldValue == newValue) return null;

        return JsonSerializer.Serialize(new
        {
            old = oldValue,
            @new = newValue
        }, JsonOptions);
    }

    /// <summary>
    /// ファイル追加用の Details を生成
    /// </summary>
    public static string BuildFileAddedDetails(string fileName, long fileSize)
    {
        return JsonSerializer.Serialize(new
        {
            fileName,
            fileSize
        }, JsonOptions);
    }

    /// <summary>
    /// ファイル削除用の Details を生成
    /// </summary>
    public static string BuildFileRemovedDetails(string fileName)
    {
        return JsonSerializer.Serialize(new { fileName }, JsonOptions);
    }

    /// <summary>
    /// 関連追加用の Details を生成
    /// </summary>
    /// <param name="relatedItemCode">関連先アイテムのコード（例: "123"）</param>
    /// <param name="relationType">関連タイプ（オプション）</param>
    public static string BuildRelationAddedDetails(string relatedItemCode, string? relationType)
    {
        return JsonSerializer.Serialize(new
        {
            relatedItemCode,
            relationType
        }, JsonOptions);
    }

    /// <summary>
    /// 関連削除用の Details を生成
    /// </summary>
    /// <param name="relatedItemCode">関連先アイテムのコード（例: "123"）</param>
    /// <param name="relationType">関連タイプ（オプション）</param>
    public static string BuildRelationRemovedDetails(string relatedItemCode, string? relationType)
    {
        return JsonSerializer.Serialize(new
        {
            relatedItemCode,
            relationType
        }, JsonOptions);
    }

    /// <summary>
    /// 優先度の日本語ラベルを取得
    /// </summary>
    private static string? GetPriorityLabel(TaskPriority? priority)
    {
        return priority switch
        {
            TaskPriority.Low => "低",
            TaskPriority.Medium => "中",
            TaskPriority.High => "高",
            TaskPriority.Critical => "緊急",
            null => null,
            _ => priority.ToString()
        };
    }
}