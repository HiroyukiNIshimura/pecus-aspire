namespace Pecus.Libs.Lexical;

/// <summary>
/// Lexical JSON を各形式に変換するサービスのインターフェース
/// </summary>
public interface ILexicalConverterService
{
    /// <summary>
    /// Lexical JSON を HTML に変換する
    /// </summary>
    /// <param name="lexicalJson">Lexical EditorState JSON 文字列</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>変換結果</returns>
    Task<LexicalConvertResult> ToHtmlAsync(string lexicalJson, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lexical JSON を Markdown に変換する
    /// </summary>
    /// <param name="lexicalJson">Lexical EditorState JSON 文字列</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>変換結果</returns>
    Task<LexicalConvertResult> ToMarkdownAsync(string lexicalJson, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lexical JSON をプレーンテキストに変換する
    /// </summary>
    /// <param name="lexicalJson">Lexical EditorState JSON 文字列</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>変換結果</returns>
    Task<LexicalConvertResult> ToPlainTextAsync(string lexicalJson, CancellationToken cancellationToken = default);
}

/// <summary>
/// Lexical 変換結果
/// </summary>
public record LexicalConvertResult
{
    /// <summary>
    /// 変換成功フラグ
    /// </summary>
    public required bool Success { get; init; }

    /// <summary>
    /// 変換結果（HTML, Markdown, or PlainText）
    /// </summary>
    public required string Result { get; init; }

    /// <summary>
    /// エラー時のメッセージ（Success=false の場合のみ）
    /// </summary>
    public string? ErrorMessage { get; init; }

    /// <summary>
    /// 処理時間（ミリ秒）
    /// </summary>
    public int ProcessingTimeMs { get; init; }

    /// <summary>
    /// 未登録のノードタイプ一覧（変換時にスキップされたノード）
    /// </summary>
    public IReadOnlyList<string> UnknownNodes { get; init; } = [];
}
