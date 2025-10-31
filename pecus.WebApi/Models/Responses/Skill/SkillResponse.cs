namespace Pecus.Models.Responses.Skill;

/// <summary>
/// スキル詳細情報レスポンス
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
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }
}

/// <summary>
/// スキルリストアイテムレスポンス
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
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// このスキルを保有しているユーザー数
    /// </summary>
    public int UserCount { get; set; }
}

/// <summary>
/// スキル作成・更新レスポンス
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
    /// スキル情報（オプション）
    /// </summary>
    public SkillDetailResponse? Skill { get; set; }
}
