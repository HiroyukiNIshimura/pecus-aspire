using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Responses.PersonalItemNote;

namespace Pecus.Services;

/// <summary>
/// 個人メモサービス
/// アイテムに対するユーザー個人のプライベートメモを管理します。
/// メモは本人のみがアクセス可能です。
/// </summary>
public class PersonalItemNoteService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PersonalItemNoteService> _logger;

    public PersonalItemNoteService(
        ApplicationDbContext context,
        ILogger<PersonalItemNoteService> logger
    )
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 個人メモを取得します（存在しない場合は null を返します）
    /// </summary>
    /// <param name="workspaceItemId">ワークスペースアイテムID</param>
    /// <param name="userId">メモ所有者ユーザーID</param>
    /// <param name="ct">キャンセルトークン</param>
    /// <returns>個人メモ、存在しない場合は null</returns>
    public async Task<PersonalItemNote?> GetNoteAsync(int workspaceItemId, int userId, CancellationToken ct = default)
    {
        return await _context.PersonalItemNotes
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.WorkspaceItemId == workspaceItemId && n.UserId == userId, ct);
    }

    /// <summary>
    /// 個人メモを作成します
    /// </summary>
    /// <param name="workspaceItemId">ワークスペースアイテムID</param>
    /// <param name="userId">メモ所有者ユーザーID</param>
    /// <param name="content">メモ内容</param>
    /// <param name="ct">キャンセルトークン</param>
    /// <returns>作成された個人メモ</returns>
    public async Task<PersonalItemNote> CreateNoteAsync(int workspaceItemId, int userId, string content, CancellationToken ct = default)
    {
        var existing = await _context.PersonalItemNotes
            .FirstOrDefaultAsync(n => n.WorkspaceItemId == workspaceItemId && n.UserId == userId, ct);

        if (existing != null)
        {
            throw new DuplicateException("このアイテムに対する個人メモは既に存在します。");
        }

        var note = new PersonalItemNote
        {
            WorkspaceItemId = workspaceItemId,
            UserId = userId,
            Content = content,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        _context.PersonalItemNotes.Add(note);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("個人メモを作成しました。WorkspaceItemId={WorkspaceItemId}, UserId={UserId}", workspaceItemId, userId);

        return note;
    }

    /// <summary>
    /// 個人メモを更新します
    /// </summary>
    /// <param name="workspaceItemId">ワークスペースアイテムID</param>
    /// <param name="userId">メモ所有者ユーザーID</param>
    /// <param name="content">新しいメモ内容</param>
    /// <param name="ct">キャンセルトークン</param>
    /// <returns>更新された個人メモ</returns>
    public async Task<PersonalItemNote> UpdateNoteAsync(int workspaceItemId, int userId, string content, CancellationToken ct = default)
    {
        var note = await _context.PersonalItemNotes
            .FirstOrDefaultAsync(n => n.WorkspaceItemId == workspaceItemId && n.UserId == userId, ct)
            ?? throw new NotFoundException("個人メモが見つかりません。");

        note.Content = content;
        note.UpdatedAt = DateTimeOffset.UtcNow;

        try
        {
            await _context.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogWarning("個人メモの競合を検出しました。WorkspaceItemId={WorkspaceItemId}, UserId={UserId}", workspaceItemId, userId);

            var entry = ex.Entries.Single();
            await entry.ReloadAsync(ct);

            throw new ConcurrencyException<PersonalItemNoteResponse>("個人メモが他のセッションで更新されています。再度お試しください。", ToResponse((PersonalItemNote)entry.Entity));
        }

        return note;
    }

    /// <summary>
    /// 個人メモを削除します（存在しない場合はスキップ）
    /// </summary>
    /// <param name="workspaceItemId">ワークスペースアイテムID</param>
    /// <param name="userId">メモ所有者ユーザーID</param>
    /// <param name="ct">キャンセルトークン</param>
    public async Task DeleteNoteAsync(int workspaceItemId, int userId, CancellationToken ct = default)
    {
        var note = await _context.PersonalItemNotes
            .FirstOrDefaultAsync(n => n.WorkspaceItemId == workspaceItemId && n.UserId == userId, ct);

        if (note == null)
        {
            return;
        }

        _context.PersonalItemNotes.Remove(note);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("個人メモを削除しました。WorkspaceItemId={WorkspaceItemId}, UserId={UserId}", workspaceItemId, userId);
    }

    /// <summary>
    /// エンティティをレスポンス DTO にマッピングします
    /// </summary>
    public static PersonalItemNoteResponse ToResponse(PersonalItemNote note) =>
        new()
        {
            Id = note.Id,
            WorkspaceItemId = note.WorkspaceItemId,
            Content = note.Content,
            CreatedAt = note.CreatedAt,
            UpdatedAt = note.UpdatedAt,
        };
}
