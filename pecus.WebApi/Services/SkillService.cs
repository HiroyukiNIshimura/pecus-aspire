using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests;

namespace Pecus.Services;

/// <summary>
/// �X�L���Ǘ��T�[�r�X
/// </summary>
public class SkillService
{
    private readonly ApplicationDbContext _context;

    public SkillService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// �X�L�����쐬
    /// </summary>
    public async Task<Skill> CreateSkillAsync(
        CreateSkillRequest request,
        int organizationId,
    int? createdByUserId = null
 )
    {
        // �����g�D���œ������O�̃X�L�������݂��邩�`�F�b�N
        var existingSkill = await _context
  .Skills.Where(s => s.OrganizationId == organizationId && s.Name == request.Name)
            .FirstOrDefaultAsync();

        if (existingSkill != null)
        {
            throw new DuplicateException("���̃X�L�����͊��ɑ��݂��܂��B");
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
    /// �X�L��ID�Ŏ擾
    /// </summary>
    public async Task<Skill?> GetSkillByIdAsync(int skillId)
    {
        return await _context.Skills
    .Include(s => s.UserSkills)
       .FirstOrDefaultAsync(s => s.Id == skillId);
    }

    /// <summary>
    /// �g�D���̃X�L�����y�[�W�l�[�V�����t���Ŏ擾
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
    /// �X�L�����X�V
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
            throw new NotFoundException("�X�L����������܂���B");
        }

        // ���O��ύX����ꍇ�A�����g�D���œ������O�����݂��Ȃ����`�F�b�N
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
                throw new DuplicateException("���̃X�L�����͊��ɑ��݂��܂��B");
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
    /// �X�L�����폜
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
    /// �X�L���𖳌���
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
    /// �X�L����L����
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
    /// �g�D���̃X�L����S�Ď擾�i�A�N�e�B�u�Ȃ��̂̂݁j
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
