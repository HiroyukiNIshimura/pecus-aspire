using Pecus.Models.Responses.Organization;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペース詳細情報レスポンス（管理者用）
/// </summary>
public class WorkspaceDetailResponse : WorkspaceBaseResponse
{
    /// <summary>
    /// 組織ID
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// 所属する組織情報
    /// </summary>
    public OrganizationInfoResponse? Organization { get; set; }

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    public int? CreatedByUserId { get; set; }

    /// <summary>
    /// 更新者ユーザーID
    /// </summary>
    public int? UpdatedByUserId { get; set; }
}

