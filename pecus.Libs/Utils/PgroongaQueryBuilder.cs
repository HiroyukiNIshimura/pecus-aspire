namespace Pecus.Libs.Utils;

/// <summary>
/// ユーザー入力を pgroonga クエリ構文に変換するヘルパー
/// <para>
/// 入力パターン:
/// - スペース区切り → AND検索（例: "aaa bbb" → "aaa bbb"）
/// - パイプ(|)区切り → OR検索（例: "aaa|bbb" → "(aaa OR bbb)"）
/// - 混合 → AND + OR（例: "aaa bbb|ccc" → "aaa (bbb OR ccc)"）
/// - #数字 → アイテムコード前方一致検索（例: "#123" → "123*"）
/// </para>
/// </summary>
public static class PgroongaQueryBuilder
{
    /// <summary>
    /// ユーザー入力を pgroonga クエリに変換
    /// </summary>
    /// <param name="input">ユーザー入力（例: "aaa bbb|ccc" または "aaa bbb | ccc"）</param>
    /// <returns>pgroonga クエリ文字列</returns>
    public static string BuildQuery(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return string.Empty;
        }

        // パイプ前後のスペースを正規化（" | " → "|"）
        var normalized = NormalizePipeOperator(input);

        // スペースで分割（AND グループ）
        var andParts = normalized
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(ConvertOrGroup)
            .Where(p => !string.IsNullOrEmpty(p));

        return string.Join(" ", andParts);
    }

    /// <summary>
    /// パイプ演算子の前後のスペースを正規化
    /// "aaa | bbb" → "aaa|bbb"
    /// "aaa |bbb" → "aaa|bbb"
    /// "aaa| bbb" → "aaa|bbb"
    /// </summary>
    private static string NormalizePipeOperator(string input)
    {
        // パイプ前後の空白を除去: " | " → "|"
        return System.Text.RegularExpressions.Regex.Replace(input, @"\s*\|\s*", "|");
    }

    /// <summary>
    /// パイプ区切りを OR 構文に変換
    /// </summary>
    private static string ConvertOrGroup(string part)
    {
        var orKeywords = part
            .Split('|', StringSplitOptions.RemoveEmptyEntries)
            .Select(ConvertKeyword)
            .Where(k => !string.IsNullOrEmpty(k))
            .ToArray();

        if (orKeywords.Length == 0)
        {
            return string.Empty;
        }

        if (orKeywords.Length == 1)
        {
            return orKeywords[0];
        }

        // 複数キーワードは括弧で囲んで OR 結合
        return $"({string.Join(" OR ", orKeywords)})";
    }

    /// <summary>
    /// キーワードを pgroonga クエリに変換
    /// #xxx 形式のアイテムコード検索を前方一致に変換
    /// </summary>
    private static string ConvertKeyword(string keyword)
    {
        if (string.IsNullOrWhiteSpace(keyword))
        {
            return string.Empty;
        }

        var trimmed = keyword.Trim();

        // #xxx 形式（# + 数字のみ）をアイテムコード前方一致検索に変換
        if (trimmed.StartsWith('#') && trimmed.Length > 1 && trimmed[1..].All(char.IsDigit))
        {
            // # を除去して前方一致用ワイルドカード追加
            return trimmed[1..] + "*";
        }

        return EscapeKeyword(trimmed);
    }

    /// <summary>
    /// pgroonga の特殊文字をエスケープ
    /// </summary>
    /// <remarks>
    /// pgroonga クエリ構文の特殊文字:
    /// - \ : エスケープ文字
    /// - " : フレーズ検索
    /// - ( ) : グループ化
    /// - - : NOT演算子
    /// - * : 前方一致
    /// - : : フィールド指定
    /// 参考: https://pgroonga.github.io/reference/operators/query-v2.html
    /// </remarks>
    private static string EscapeKeyword(string keyword)
    {
        if (string.IsNullOrWhiteSpace(keyword))
        {
            return string.Empty;
        }

        return keyword
            .Replace("\\", "\\\\") // バックスラッシュ（エスケープ文字）
            .Replace("\"", "\\\"") // ダブルクォート（フレーズ検索）
            .Replace("(", "\\(") // 括弧（グループ化）
            .Replace(")", "\\)")
            .Replace("-", "\\-") // マイナス（NOT演算子）
            .Replace("*", "\\*") // アスタリスク（前方一致）
            .Replace(":", "\\:"); // コロン（フィールド指定）
    }
}