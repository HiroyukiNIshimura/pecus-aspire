using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Config;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Genre;

namespace Pecus.Services;

/// <summary>
/// ジャンルサービス
/// /// </summary>
public class GenreService
{
    private readonly ApplicationDbContext _context;
    private readonly PecusConfig _config;

    public GenreService(ApplicationDbContext context, PecusConfig config)
    {
        _context = context;
        _config = config;
    }

    /// <summary>
    /// ジャンル一覧をページネーションで取得
    /// </summary>
    public async Task<(List<GenreListItemResponse> genres, int totalCount)> GetGenresPagedAsync(
        int page,
        bool? activeOnly = null
    )
    {
        var query = _context.Genres.AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(g => g.IsActive);
        }

        query = query.OrderBy(g => g.DisplayOrder).ThenBy(g => g.Id);

        var totalCount = await query.CountAsync();

        var genres = await PaginationHelper.ApplyPaginationAsync(
            query.Include(g => g.Workspaces),
            page,
            _config.Pagination.DefaultPageSize
        );

        var result = genres
            .Select(g => new GenreListItemResponse
            {
                Id = g.Id,
                Name = g.Name,
                Description = g.Description,
                Icon = g.Icon,
                DisplayOrder = g.DisplayOrder,
                WorkspaceCount = g.Workspaces.Count,
                IsActive = g.IsActive,
            })
            .ToList();

        return (result, totalCount);
    }

    /// <summary>
    /// ジャンル詳細を取得
    /// </summary>
    public async Task<GenreDetailResponse> GetGenreByIdAsync(int id)
    {
        var genre = await _context
            .Genres.Include(g => g.Workspaces)
            .FirstOrDefaultAsync(g => g.Id == id);

        if (genre == null)
        {
            throw new NotFoundException("ジャンルが見つかりません。");
        }

        return new GenreDetailResponse
        {
            Id = genre.Id,
            Name = genre.Name,
            Description = genre.Description,
            Icon = genre.Icon,
            DisplayOrder = genre.DisplayOrder,
            WorkspaceCount = genre.Workspaces.Count,
            CreatedAt = genre.CreatedAt,
            CreatedByUserId = genre.CreatedByUserId,
            UpdatedAt = genre.UpdatedAt,
            UpdatedByUserId = genre.UpdatedByUserId,
            IsActive = genre.IsActive,
        };
    }

    /// <summary>
    /// ジャンルを作成
    /// </summary>
    public async Task<GenreResponse> CreateGenreAsync(
        CreateGenreRequest request,
        int? createdByUserId = null
    )
    {
        // 名前の重複チェック
        if (await _context.Genres.AnyAsync(g => g.Name == request.Name))
        {
            throw new DuplicateException("このジャンル名は既に使用されています。");
        }

        var genre = new Genre
        {
            Name = request.Name,
            Description = request.Description,
            Icon = request.Icon,
            DisplayOrder = request.DisplayOrder,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
        };

        _context.Genres.Add(genre);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyException(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。"
            );
        }

        return new GenreResponse
        {
            Id = genre.Id,
            Name = genre.Name,
            Description = genre.Description,
            Icon = genre.Icon,
            DisplayOrder = genre.DisplayOrder,
            CreatedAt = genre.CreatedAt,
            UpdatedAt = genre.UpdatedAt,
            IsActive = genre.IsActive,
        };
    }

    /// <summary>
    /// ジャンルを更新
    /// </summary>
    public async Task<GenreResponse> UpdateGenreAsync(
        int id,
        UpdateGenreRequest request,
        int? updatedByUserId = null
    )
    {
        var genre = await _context.Genres.FindAsync(id);
        if (genre == null)
        {
            throw new NotFoundException("ジャンルが見つかりません。");
        }

        // 楽観的ロック：RowVersion を検証
        if (!genre.RowVersion?.SequenceEqual(request.RowVersion) ?? true)
        {
            throw new ConcurrencyException(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。"
            );
        }

        // 名前の重複チェック（自分以外）
        if (request.Name != null && request.Name != genre.Name)
        {
            if (await _context.Genres.AnyAsync(g => g.Name == request.Name && g.Id != id))
            {
                throw new DuplicateException("このジャンル名は既に使用されています。");
            }
            genre.Name = request.Name;
        }

        if (request.Description != null)
        {
            genre.Description = request.Description;
        }

        if (request.Icon != null)
        {
            genre.Icon = request.Icon;
        }

        if (request.DisplayOrder.HasValue)
        {
            genre.DisplayOrder = request.DisplayOrder.Value;
        }

        genre.UpdatedByUserId = updatedByUserId;
        genre.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyException(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。"
            );
        }

        return new GenreResponse
        {
            Id = genre.Id,
            Name = genre.Name,
            Description = genre.Description,
            Icon = genre.Icon,
            DisplayOrder = genre.DisplayOrder,
            CreatedAt = genre.CreatedAt,
            UpdatedAt = genre.UpdatedAt,
            IsActive = genre.IsActive,
        };
    }

    /// <summary>
    /// ジャンルを削除
    /// </summary>
    public async Task DeleteGenreAsync(int id)
    {
        var genre = await _context
            .Genres.Include(g => g.Workspaces)
            .FirstOrDefaultAsync(g => g.Id == id);

        if (genre == null)
        {
            throw new NotFoundException("ジャンルが見つかりません。");
        }

        // このジャンルを使用しているワークスペースがある場合は削除不可
        if (genre.Workspaces.Any())
        {
            throw new InvalidOperationException("このジャンルは使用中のため削除できません。");
        }

        _context.Genres.Remove(genre);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyException(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。"
            );
        }
    }

    /// <summary>
    /// ジャンルのアクティブ状態を設定
    /// </summary>
    public async Task SetGenreActiveStatusAsync(int id, bool isActive, int? updatedByUserId = null)
    {
        var genre = await _context.Genres.FindAsync(id);
        if (genre == null)
        {
            throw new NotFoundException("ジャンルが見つかりません。");
        }

        if (genre.IsActive == isActive)
        {
            var statusText = isActive ? "有効" : "無効";
            throw new InvalidOperationException($"このジャンルは既に{statusText}です。");
        }

        genre.IsActive = isActive;
        genre.UpdatedByUserId = updatedByUserId;
        genre.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyException(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。"
            );
        }
    }

    /// <summary>
    /// ジャンルのアイコンを更新
    /// </summary>
    public async Task UpdateGenreIconAsync(int id, string iconPath, int? updatedByUserId = null)
    {
        var genre = await _context.Genres.FindAsync(id);
        if (genre == null)
        {
            throw new NotFoundException("ジャンルが見つかりません。");
        }

        genre.Icon = iconPath;
        genre.UpdatedByUserId = updatedByUserId;
        genre.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }
}
