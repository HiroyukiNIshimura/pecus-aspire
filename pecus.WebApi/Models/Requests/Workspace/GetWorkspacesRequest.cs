using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Requests.Workspace;

/// <summary>
/// ワークスペース一覧取得リクエスト（一般ユーザー向け）
/// アクティブなワークスペースのみが返されるため、IsActiveフィルタは不要
/// </summary>
public class GetWorkspacesRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int? Page { get; set; } = 1;

    public int? GenreId { get; set; }

    [MaxLength(100, ErrorMessage = "検索名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter<WorkspaceMode>))]
    public WorkspaceMode? Mode { get; set; }
}

/// <summary>
/// ワークスペース一覧取得リクエスト（Admin向け）
/// IsActiveフィルタでアクティブ/非アクティブを切り替え可能
/// </summary>
public class AdminGetWorkspacesRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int? Page { get; set; } = 1;

    /// <summary>
    /// アクティブ状態でフィルタ（null: 全て、true: アクティブのみ、false: 非アクティブのみ）
    /// </summary>
    public bool? IsActive { get; set; }

    public int? GenreId { get; set; }

    [MaxLength(100, ErrorMessage = "検索名は100文字以内で入力してください。")]
    public string? Name { get; set; }
}