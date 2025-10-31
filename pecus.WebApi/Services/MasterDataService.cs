using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

namespace Pecus.Services;

/// <summary>
/// マスターデータ管理サービス
/// </summary>
public class MasterDataService
{
    private readonly ApplicationDbContext _context;

    public MasterDataService(ApplicationDbContext context) => _context = context;

    /// <summary>
    /// アクティブなジャンル一覧を取得（ページング不使用）
    /// </summary>
    public async Task<List<Genre>> GetActiveGenresAsync()
    {
        return await _context.Genres
            .Where(g => g.IsActive)
            .OrderBy(g => g.DisplayOrder)
            .ToListAsync();
    }

    /// <summary>
    /// 指定組織のアクティブなスキル一覧を取得（ページング不使用）
    /// </summary>
    public async Task<List<Skill>> GetActiveSkillsByOrganizationAsync(int organizationId)
    {
        return await _context.Skills
      .Where(s => s.OrganizationId == organizationId && s.IsActive == true)
            .OrderBy(s => s.Name)
     .ToListAsync();
    }
}
