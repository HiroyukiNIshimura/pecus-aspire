using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using System.Text.Json.Serialization;

namespace Pecus.Libs.Hangfire.Tasks.Services;

/// <summary>
/// AIが解析した日付情報を表すレスポンスモデル
/// </summary>
public class ExtractedDateResult
{
    /// <summary>
    /// 年（省略可能、nullの場合は未来として成り立つ年を推定）
    /// </summary>
    [JsonPropertyName("year")]
    public int? Year { get; set; }

    /// <summary>
    /// 月（1-12）
    /// </summary>
    [JsonPropertyName("month")]
    public int? Month { get; set; }

    /// <summary>
    /// 日（1-31）
    /// </summary>
    [JsonPropertyName("day")]
    public int? Day { get; set; }
}

/// <summary>
/// テキストから日付を抽出するサービスのインターフェース
/// </summary>
public interface IDateExtractor
{
    /// <summary>
    /// テキストから日付情報を抽出する
    /// </summary>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="text">解析対象のテキスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>抽出された日付情報、抽出できない場合はnull</returns>
    Task<ExtractedDateResult?> ExtractDateAsync(
        IAiClient aiClient,
        string text,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 抽出された日付情報を有効な未来の日付に解決する
    /// </summary>
    /// <param name="extractedDate">抽出された日付情報</param>
    /// <param name="timeZone">タイムゾーン</param>
    /// <returns>有効な未来の日付、解決できない場合はnull</returns>
    DateOnly? ResolveFutureDate(ExtractedDateResult extractedDate, TimeZoneInfo timeZone);
}

/// <summary>
/// AIを使用してテキストから日付を抽出するサービス
/// </summary>
public class DateExtractor : IDateExtractor
{
    private const string DateExtractionPrompt = """
        あなたはテキストから日付情報を抽出するアシスタントです。
        ユーザーが入力したテキストから、リマインダーとして設定したい日付を抽出してください。

        ルール:
        - 日付情報が見つかった場合は、year, month, day をJSON形式で返してください
        - 年が明示されていない場合は year を null にしてください
        - 日付情報が見つからない場合や、日付として解釈できない場合は、month と day を null にしてください
        - 「明日」「来週」などの相対的な表現は、具体的な日付に変換しないでください（null を返す）
        - 必ず指定されたJSON形式で返してください
        """;

    private readonly ILogger<DateExtractor> _logger;

    /// <summary>
    /// DateExtractor のコンストラクタ
    /// </summary>
    public DateExtractor(ILogger<DateExtractor> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ExtractedDateResult?> ExtractDateAsync(
        IAiClient aiClient,
        string text,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        try
        {
            var response = await aiClient.GenerateJsonAsync<ExtractedDateResult>(
                DateExtractionPrompt,
                text);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Failed to extract date from text using AI");
            return null;
        }
    }

    /// <inheritdoc />
    public DateOnly? ResolveFutureDate(ExtractedDateResult extractedDate, TimeZoneInfo timeZone)
    {
        if (!extractedDate.Month.HasValue || !extractedDate.Day.HasValue)
        {
            return null;
        }

        var month = extractedDate.Month.Value;
        var day = extractedDate.Day.Value;

        if (month < 1 || month > 12 || day < 1 || day > 31)
        {
            return null;
        }

        var nowInTimeZone = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);
        var todayInTimeZone = DateOnly.FromDateTime(nowInTimeZone);

        int year;
        if (extractedDate.Year.HasValue)
        {
            year = extractedDate.Year.Value;
        }
        else
        {
            year = todayInTimeZone.Year;
            var candidateDate = CreateValidDate(year, month, day);
            if (candidateDate == null || candidateDate.Value <= todayInTimeZone)
            {
                year = todayInTimeZone.Year + 1;
            }
        }

        var resolvedDate = CreateValidDate(year, month, day);
        if (resolvedDate == null)
        {
            return null;
        }

        if (resolvedDate.Value <= todayInTimeZone)
        {
            return null;
        }

        return resolvedDate;
    }

    /// <summary>
    /// 有効な日付を作成する（無効な日付の場合はnull）
    /// </summary>
    private static DateOnly? CreateValidDate(int year, int month, int day)
    {
        try
        {
            var daysInMonth = DateTime.DaysInMonth(year, month);
            if (day > daysInMonth)
            {
                return null;
            }
            return new DateOnly(year, month, day);
        }
        catch
        {
            return null;
        }
    }
}