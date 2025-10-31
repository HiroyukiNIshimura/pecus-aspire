using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests;

namespace Pecus.Services;

/// <summary>
/// スキル管理サービス
/// </summary>
public class SkillService
{
    private readonly ApplicationDbContext _context;

    public SkillService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// スキルを作成
    /// </summary>
    public async Task<Skill> CreateSkillAsync(
        CreateSkillRequest request,
        int organizationId,
    int? createdByUserId = null
 )
    {
        // 同じ組織の同じ名前のスキルが既に存在するかチェック
        var existingSkill = await _context
  .Skills.Where(s => s.OrganizationId == organizationId && s.Name == request.Name)
            .FirstOrDefaultAsync();

        if (existingSkill != null)
        {
            throw new DuplicateException("同じスキル名は既に存在します。");
        }

        var skill = new Skill
        {
            Name = request.Name,
            Description = request.Description,
            OrganizationId = organizationId,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = createdByUserId,
            IsActive = true,
        };

        _context.Skills.Add(skill);
        await _context.SaveChangesAsync();

        return skill;
    }

    /// <summary>
    /// スキルIDで取得
    /// </summary>
    public async Task<Skill?> GetSkillByIdAsync(int skillId)
    {
        return await _context.Skills
    .Include(s => s.UserSkills)
       .FirstOrDefaultAsync(s => s.Id == skillId);
    }

    /// <summary>
    /// アクティブなスキルを取得
    /// </summary>
    public async Task<(List<Skill> skills, int totalCount)> GetSkillsByOrganizationPagedAsync(
        int organizationId,
        int page,
        int pageSize,
        bool? isActive = null
    )
    {
        var query = _context
            .Skills.Where(s => s.OrganizationId == organizationId);

        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        query = query.Include(s => s.UserSkills);

        var totalCount = await query.CountAsync();

        var skills = await query
          .OrderBy(s => s.Name)
        .Skip((page - 1) * pageSize)
                 .Take(pageSize)
            .ToListAsync();

        return (skills, totalCount);
    }
    /// <summary>
    /// スキルを更新
    /// </summary>
    public async Task<Skill> UpdateSkillAsync(
      int skillId,
        UpdateSkillRequest request,
        int? updatedByUserId = null
    )
    {
        var skill = await _context.Skills.FirstOrDefaultAsync(s => s.Id == skillId);
        if (skill == null)
        {
            throw new NotFoundException("スキルが見つかりません。");
        }

        // 更新前に同じ組織の同じ名前のスキルが存在しないかチェック
        if (!string.IsNullOrEmpty(request.Name) && request.Name != skill.Name)
        {
            var existingSkill = await _context
      .Skills
      .Where(s =>
  s.OrganizationId == skill.OrganizationId
        && s.Name == request.Name
    && s.Id != skillId
    )
      .FirstOrDefaultAsync();

            if (existingSkill != null)
            {
                throw new DuplicateException("同じスキル名は既に存在します。");
            }

            skill.Name = request.Name;
        }

        if (request.Description != null)
        {
            skill.Description = request.Description;
        }

        skill.UpdatedAt = DateTime.UtcNow;
        skill.UpdatedByUserId = updatedByUserId;

        _context.Skills.Update(skill);
        await _context.SaveChangesAsync();

        return skill;
    }

    /// <summary>
    /// スキルを削除
    /// </summary>
    public async Task<bool> DeleteSkillAsync(int skillId)
    {
        var skill = await _context.Skills.FirstOrDefaultAsync(s => s.Id == skillId);
        if (skill == null)
        {
            return false;
        }

        _context.Skills.Remove(skill);
        await _context.SaveChangesAsync();

        return true;
    }

    /// <summary>
    /// スキルを非アクティブ化
    /// </summary>
    public async Task<bool> DeactivateSkillAsync(int skillId, int? updatedByUserId = null)
    {
        var skill = await _context.Skills.FirstOrDefaultAsync(s => s.Id == skillId);
        if (skill == null)
        {
            return false;
        }

        skill.IsActive = false;
        skill.UpdatedAt = DateTime.UtcNow;
        skill.UpdatedByUserId = updatedByUserId;

        _context.Skills.Update(skill);
        await _context.SaveChangesAsync();

        return true;
    }

    /// <summary>
    /// スキルをアクティブ化
    /// </summary>
    public async Task<bool> ActivateSkillAsync(int skillId, int? updatedByUserId = null)
    {
        var skill = await _context.Skills.FirstOrDefaultAsync(s => s.Id == skillId);
        if (skill == null)
        {
            return false;
        }

        skill.IsActive = true;
        skill.UpdatedAt = DateTime.UtcNow;
        skill.UpdatedByUserId = updatedByUserId;

        _context.Skills.Update(skill);
        await _context.SaveChangesAsync();

        return true;
    }

    /// <summary>
    /// アクティブなスキルを取得
    /// </summary>
    public async Task<List<Skill>> GetActiveSkillsByOrganizationAsync(int organizationId)
    {
        return await _context
         .Skills.Where(s => s.OrganizationId == organizationId && s.IsActive)
     .OrderBy(s => s.Name)
      .ToListAsync();
    }

    /// <summary>
    /// Get total skill count for an organization
    /// </summary>
    public async Task<int> GetSkillCountByOrganizationAsync(int organizationId)
    {
        return await _context.Skills.CountAsync(s => s.OrganizationId == organizationId);
    }
}
