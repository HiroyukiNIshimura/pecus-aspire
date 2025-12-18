using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.WebApi.Models.Responses;

/// <summary>
/// ワークスペースアイテム関連レスポンス
/// </summary>
public class WorkspaceItemDocRelationResponse
{
    /// <summary>
    /// 関連ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 関連元アイテムID
    /// </summary>
    public int FromItemId { get; set; }

    /// <summary>
    /// 関連先アイテムID
    /// </summary>
    public int ToItemId { get; set; }

    /// <summary>
    /// 関連タイプ
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<RelationType>))]
    public RelationType? RelationType { get; set; }
}

/// <summary>
/// ワークスペースアイテム関連一覧レスポンス（ドキュメントツリー用）
/// </summary>
public class WorkspaceDocRelationsResponse
{
    /// <summary>
    /// 関連リスト
    /// </summary>
    public List<WorkspaceItemDocRelationResponse> Relations { get; set; } = new();
}