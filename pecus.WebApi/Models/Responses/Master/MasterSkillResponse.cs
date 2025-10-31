﻿namespace Pecus.Models.Responses.Master;

/// <summary>
/// マスターデータ用スキルレスポンス
/// </summary>
public class MasterSkillResponse
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
    /// 説明
    /// </summary>
    public string? Description { get; set; }
}