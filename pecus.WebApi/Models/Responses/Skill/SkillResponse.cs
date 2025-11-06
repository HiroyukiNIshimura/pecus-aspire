namespace Pecus.Models.Responses.Skill;

/// <summary>
/// スキル詳細レスポンス
/// </summary>
public class SkillDetailResponse
{
    /// <summary>
    /// スキルID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// スキル名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// スキルの説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 組織ID
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    public int? CreatedByUserId { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 更新者ユーザーID
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// スキルのアクティブ/非アクティブ状態
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// ユーザー数
    /// </summary>
    public int UserCount { get; set; }

    /// <summary>
    /// 楽観的ロック用のRowVersion
    /// </summary>
    public required byte[] RowVersion { get; set; }
}

/// <summary>
/// スキル一覧アイテムレスポンス
/// </summary>
public class SkillListItemResponse
{
    /// <summary>
    /// スキルID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// スキル名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// スキルの説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 更新者ユーザーID
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// スキルのアクティブ/非アクティブ状態
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// スキルの利用状況
    /// </summary>
    public List<string> UserIds { get; set; } = new();
    /// <summary>
    /// ユーザー数
    /// </summary>
    public int UserCount { get; set; }
}

/// <summary>
/// スキルレスポンス
/// </summary>
public class SkillResponse
{
    /// <summary>
    /// 成功フラグ
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// メッセージ
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// スキル詳細
    /// </summary>
    public SkillDetailResponse? Skill { get; set; }
}
