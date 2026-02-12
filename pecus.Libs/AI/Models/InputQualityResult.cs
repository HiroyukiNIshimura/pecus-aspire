using System.Text.Json.Serialization;

namespace Pecus.Libs.AI.Models;

/// <summary>
/// 入力品質の判定タイプ
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum InputQualityType
{
    /// <summary>正常な入力</summary>
    Normal,

    /// <summary>空または空白のみ</summary>
    EmptyOrWhitespace,

    /// <summary>記号のみの入力</summary>
    SymbolsOnly,

    /// <summary>1〜2文字の意味不明な入力</summary>
    TooShortMeaningless,

    /// <summary>キーボード乱打</summary>
    KeyboardMash,

    /// <summary>同じ文字の連打</summary>
    RepeatedCharacters,

    /// <summary>子音のみ（ローマ字入力ミス）</summary>
    ConsonantsOnly,

    /// <summary>日本語Typo/意味不明</summary>
    JapaneseGibberish,

    /// <summary>特定ワードを含む（マスコット関連）</summary>
    ContainsSpecialKeyword,
}

/// <summary>
/// 入力品質の判定結果
/// </summary>
public class InputQualityResult
{
    /// <summary>
    /// 判定タイプ
    /// </summary>
    public InputQualityType Type { get; set; }

    /// <summary>
    /// 有効な入力かどうか
    /// Normal または ContainsSpecialKeyword の場合 true
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// 判定の確信度 (0-100)
    /// </summary>
    public int Confidence { get; set; }

    /// <summary>
    /// 判定理由の簡潔な説明（20文字以内）
    /// </summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// 検出された特定ワード（ContainsSpecialKeyword の場合のみ）
    /// </summary>
    public string? DetectedKeyword { get; set; }

    /// <summary>
    /// Typoの場合、正しいと思われるテキスト
    /// </summary>
    public string? CorrectedText { get; set; }

    /// <summary>
    /// 意味不明な入力かどうか
    /// </summary>
    [JsonIgnore]
    public bool IsGibberish => Type is InputQualityType.JapaneseGibberish
        or InputQualityType.KeyboardMash
        or InputQualityType.ConsonantsOnly
        or InputQualityType.RepeatedCharacters;

    /// <summary>
    /// 無効な入力かどうか（IsValid の逆）
    /// </summary>
    [JsonIgnore]
    public bool IsInvalid => !IsValid;
}