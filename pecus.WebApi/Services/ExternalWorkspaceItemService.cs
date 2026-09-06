using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.Lexical;
using Pecus.Models.Responses.External;

namespace Pecus.Services;

/// <summary>
/// 外部API経由でワークスペースアイテムを操作するサービス
/// </summary>
public class ExternalWorkspaceItemService(
    ApplicationDbContext context,
    ILexicalConverterService lexicalConverterService,
    ILogger<ExternalWorkspaceItemService> logger) : IExternalWorkspaceItemService
{
    private const int FixedPageSize = 20;

    /// <inheritdoc />
    public async Task<ExternalItemListResponse> GetWorkspaceItemsAsync(
        int organizationId,
        string workspaceIdOrCode,
        int page,
        CancellationToken cancellationToken = default)
    {
        // ワークスペースの存在および組織所属チェック（コードまたは数値IDで検索）
        var isNumeric = int.TryParse(workspaceIdOrCode, out var numericId);
        var workspace = await context.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(
                w => w.OrganizationId == organizationId &&
                     (w.Code == workspaceIdOrCode || (isNumeric && w.Id == numericId)),
                cancellationToken);

        if (workspace == null)
        {
            throw new NotFoundException($"ワークスペース '{workspaceIdOrCode}' が見つかりません。");
        }

        var targetPage = page < 1 ? 1 : page;
        var query = context.WorkspaceItems
            .AsNoTracking()
            .Where(wi => wi.WorkspaceId == workspace.Id && wi.IsActive);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Include(wi => wi.WorkspaceItemTags)
                .ThenInclude(wit => wit.Tag)
            .OrderByDescending(wi => wi.CreatedAt)
            .Skip((targetPage - 1) * FixedPageSize)
            .Take(FixedPageSize)
            .ToListAsync(cancellationToken);

        var workspaceCode = workspace.Code ?? string.Empty;

        var convertedTasks = items.Select(async item =>
        {
            var markdown = await ConvertToMarkdownAsync(item.Body, cancellationToken);
            var tagNames = item.WorkspaceItemTags
                .Where(wit => wit.Tag != null && wit.Tag.IsActive)
                .Select(wit => wit.Tag!.Name)
                .ToList();

            return new ExternalItemResponse
            {
                WorkspaceCode = workspaceCode,
                ItemNumber = item.ItemNumber,
                Subject = item.Subject,
                Body = markdown,
                Tags = tagNames,
            };
        });

        var itemResponses = await Task.WhenAll(convertedTasks);

        return new ExternalItemListResponse
        {
            WorkspaceCode = workspaceCode,
            TotalCount = totalCount,
            CurrentPage = targetPage,
            PageSize = FixedPageSize,
            HasNextPage = (targetPage * FixedPageSize) < totalCount,
            Items = itemResponses,
        };
    }

    /// <inheritdoc />
    public async Task<ExternalItemResponse> GetWorkspaceItemAsync(
        int organizationId,
        string workspaceIdOrCode,
        int itemNumber,
        CancellationToken cancellationToken = default)
    {
        var isNumeric = int.TryParse(workspaceIdOrCode, out var numericId);
        var workspace = await context.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(
                w => w.OrganizationId == organizationId &&
                     (w.Code == workspaceIdOrCode || (isNumeric && w.Id == numericId)),
                cancellationToken);

        if (workspace == null)
        {
            throw new NotFoundException($"ワークスペース '{workspaceIdOrCode}' が見つかりません。");
        }

        var item = await context.WorkspaceItems
            .AsNoTracking()
            .Include(wi => wi.WorkspaceItemTags)
                .ThenInclude(wit => wit.Tag)
            .FirstOrDefaultAsync(
                wi => wi.WorkspaceId == workspace.Id && wi.ItemNumber == itemNumber && wi.IsActive,
                cancellationToken);

        if (item == null)
        {
            throw new NotFoundException($"ワークスペース '{workspaceIdOrCode}' にアイテム番号 '{itemNumber}' が見つかりません。");
        }

        var markdown = await ConvertToMarkdownAsync(item.Body, cancellationToken);
        var tagNames = item.WorkspaceItemTags
            .Where(wit => wit.Tag != null && wit.Tag.IsActive)
            .Select(wit => wit.Tag!.Name)
            .ToList();

        return new ExternalItemResponse
        {
            WorkspaceCode = workspace.Code ?? string.Empty,
            ItemNumber = item.ItemNumber,
            Subject = item.Subject,
            Body = markdown,
            Tags = tagNames,
        };
    }

    private async Task<string?> ConvertToMarkdownAsync(string? lexicalJson, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(lexicalJson))
        {
            return null;
        }

        try
        {
            var result = await lexicalConverterService.ToMarkdownAsync(lexicalJson, cancellationToken);
            if (!result.Success)
            {
                logger.LogWarning("Markdown変換に失敗しました: {Error}", result.ErrorMessage);
                return null;
            }

            return result.Result;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Markdown変換中にエラーが発生しました。");
            return null;
        }
    }
}