using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

namespace Pecus.Services;

/// <summary>
/// ワークスペースアイテムのPIN管理サービス
/// </summary>
public class WorkspaceItemPinService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WorkspaceItemPinService> _logger;
    private readonly OrganizationAccessHelper _accessHelper;

    public WorkspaceItemPinService(
        ApplicationDbContext context,
        ILogger<WorkspaceItemPinService> logger,
        OrganizationAccessHelper accessHelper
    )
    {
        _context = context;
        _logger = logger;
        _accessHelper = accessHelper;
    }

    /// <summary>
    /// ワークスペースアイテムにPINを追加
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="userId">PINするユーザーID</param>
    /// <returns>作成されたPIN</returns>
    public async Task<WorkspaceItemPin> AddPinToItemAsync(int workspaceId, int itemId, int userId)
    {
        // アイテムの存在確認
        var item = await _context.WorkspaceItems.FirstOrDefaultAsync(wi =>
            wi.WorkspaceId == workspaceId && wi.Id == itemId
        );

        if (item == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        // 既にPINされているか確認
        var existingPin = await _context.WorkspaceItemPins.FirstOrDefaultAsync(p =>
            p.WorkspaceItemId == itemId && p.UserId == userId
        );
        if (existingPin != null)
        {
            throw new DuplicateException("アイテムは既にPINされています。");
        }

        var pin = new WorkspaceItemPin
        {
            WorkspaceItemId = itemId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
        };

        _context.WorkspaceItemPins.Add(pin);
        await _context.SaveChangesAsync();

        return pin;
    }

    /// <summary>
    /// ワークスペースアイテムからPINを削除
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="userId">PIN削除するユーザーID</param>
    public async Task RemovePinFromItemAsync(int workspaceId, int itemId, int userId)
    {
        // アイテムの存在確認
        var item = await _context.WorkspaceItems.FirstOrDefaultAsync(wi =>
            wi.WorkspaceId == workspaceId && wi.Id == itemId
        );

        if (item == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        // PINの検索
        var pin = await _context.WorkspaceItemPins.FirstOrDefaultAsync(p =>
            p.WorkspaceItemId == itemId && p.UserId == userId
        );

        if (pin == null)
        {
            throw new NotFoundException("PINが見つかりません。");
        }

        _context.WorkspaceItemPins.Remove(pin);

        await _context.SaveChangesAsync();
    }
}