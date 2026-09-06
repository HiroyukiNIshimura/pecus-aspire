using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用アイテム情報レスポンス
/// </summary>
public class ExternalItemResponse
{
    /// <summary>
    /// ワークスペースコード
    /// </summary>
    [Required]
    public required string WorkspaceCode { get; set; }

    /// <summary>
    /// アイテム番号（ワークスペース内の連番）
    /// </summary>
    [Required]
    public int ItemNumber { get; set; }

    /// <summary>
    /// 件名
    /// </summary>
    [Required]
    public required string Subject { get; set; }

    /// <summary>
    /// 本文（Markdown変換データ）
    /// </summary>
    public string? Body { get; set; }

    /// <summary>
    /// タグ（タグ名一覧）
    /// </summary>
    [Required]
    public required IReadOnlyList<string> Tags { get; set; }
}
