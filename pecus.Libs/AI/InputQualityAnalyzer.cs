using Microsoft.Extensions.Logging;
using Pecus.Libs.AI.Models;

namespace Pecus.Libs.AI;

/// <summary>
/// 入力テキストの品質を判定するアナライザー
/// AIを使用してキーボード乱打、意味不明な入力、特定ワードなどを検出する
/// </summary>
public class InputQualityAnalyzer : IInputQualityAnalyzer
{
    private readonly ILogger<InputQualityAnalyzer> _logger;

    /// <summary>
    /// InputQualityAnalyzer のコンストラクタ
    /// </summary>
    public InputQualityAnalyzer(ILogger<InputQualityAnalyzer> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// 入力品質分析用のシステムプロンプト
    /// </summary>
    private const string AnalysisSystemPrompt = """
        あなたは入力テキストの品質を判定する専門家です。
        ユーザーから送られたテキストを分析し、以下の判定を行ってください。

        判定カテゴリ:
        1. Normal: 正常な入力（意味のある文章・単語）
        2. EmptyOrWhitespace: 空または空白のみ
        3. SymbolsOnly: 記号のみの入力（例: 「！！！」「...」「???」）
        4. TooShortMeaningless: 1〜2文字の意味不明な入力（例: 「あ」「ん」「っ」）
           - ただし「OK」「はい」「うん」「いや」などの短い返事は Normal
        5. KeyboardMash: キーボード乱打（例: 「asdf」「jkl;」「qwert」）
        6. RepeatedCharacters: 同じ文字の連打（例: 「aaaaaaa」「っっっっ」「！！！！！」）
        7. ConsonantsOnly: 子音のみの入力（ローマ字入力ミス、例: 「sdfgh」「bcd」）
        8. JapaneseGibberish: 日本語Typo/意味不明（例: 「あsdfg」「こんいちあ」「ありがうと」「おはよおう」）
        9. ContainsSpecialKeyword: 特定ワードを含む（「コアティ」「ハナグマ」「チチチチ」「coati」のいずれか）

        評価項目:
        - Type: 上記カテゴリのいずれか
        - IsValid: 有効な入力かどうか（Normal または ContainsSpecialKeyword の場合 true）
        - Confidence: 判定の確信度（0-100）
        - Reason: 判定理由の簡潔な説明（20文字以内の日本語）
        - DetectedKeyword: ContainsSpecialKeyword の場合、検出されたキーワード。それ以外は null
        - CorrectedText: Typoの場合、正しいと思われるテキスト。不明または該当しない場合は null

        判定のヒント:
        - 「おはよう」「こんにちは」「ありがとう」は正常
        - 「おはよおう」「こんいちあ」「ありがうと」はTypo
        - 日本語とランダムなアルファベットの混在（「あsdfg」）は意味不明
        - 短くても意味のある返事（「OK」「はい」「うん」「いいえ」「了解」）は正常
        - 絵文字のみや顔文字のみは SymbolsOnly
        - 「コアティ」「ハナグマ」「チチチチ」「coati」を含む場合は ContainsSpecialKeyword（有効な入力）

        必ず有効なJSONのみを返してください。説明文は不要です。
        """;

    /// <inheritdoc />
    public async Task<InputQualityResult> AnalyzeAsync(
        IAiClient aiClient,
        string? message,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            _logger.LogDebug("Empty message provided, returning empty result");
            return CreateEmptyResult();
        }

        try
        {
            var result = await aiClient.GenerateJsonAsync<InputQualityResult>(
                AnalysisSystemPrompt,
                $"以下のテキストの品質を判定してください:\n\n{message}",
                cancellationToken: cancellationToken
            );

            _logger.LogDebug(
                "Input quality analysis completed: Type={Type}, IsValid={IsValid}, Confidence={Confidence}, Reason={Reason}",
                result.Type,
                result.IsValid,
                result.Confidence,
                result.Reason
            );

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Input quality analysis failed, returning unknown result");
            return CreateUnknownResult("分析に失敗しました");
        }
    }

    /// <inheritdoc />
    public async Task<bool> IsValidInputAsync(
        IAiClient aiClient,
        string? message,
        CancellationToken cancellationToken = default)
    {
        var result = await AnalyzeAsync(aiClient, message, cancellationToken);
        return result.IsValid;
    }

    /// <inheritdoc />
    public async Task<bool> ContainsSpecialKeywordAsync(
        IAiClient aiClient,
        string? message,
        CancellationToken cancellationToken = default)
    {
        var result = await AnalyzeAsync(aiClient, message, cancellationToken);
        return result.Type == InputQualityType.ContainsSpecialKeyword;
    }

    /// <inheritdoc />
    public async Task<bool> IsGibberishAsync(
        IAiClient aiClient,
        string? message,
        CancellationToken cancellationToken = default)
    {
        var result = await AnalyzeAsync(aiClient, message, cancellationToken);
        return result.Type is InputQualityType.JapaneseGibberish
            or InputQualityType.KeyboardMash
            or InputQualityType.ConsonantsOnly
            or InputQualityType.RepeatedCharacters;
    }

    /// <summary>
    /// 空入力のデフォルト結果を作成する
    /// </summary>
    private static InputQualityResult CreateEmptyResult()
    {
        return new InputQualityResult
        {
            Type = InputQualityType.EmptyOrWhitespace,
            IsValid = false,
            Confidence = 100,
            Reason = "入力が空です",
        };
    }

    /// <summary>
    /// 分析失敗時のデフォルト結果を作成する
    /// </summary>
    private static InputQualityResult CreateUnknownResult(string reason)
    {
        return new InputQualityResult
        {
            Type = InputQualityType.Normal,
            IsValid = true,
            Confidence = 0,
            Reason = reason,
        };
    }
}
