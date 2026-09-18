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
        bool? isActive = null,
        bool? isArchived = null,
        bool? isDraft = null,
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
            .Where(wi => wi.WorkspaceId == workspace.Id);

        if (isActive.HasValue)
        {
            query = query.Where(wi => wi.IsActive == isActive.Value);
        }

        if (isArchived.HasValue)
        {
            query = query.Where(wi => wi.IsArchived == isArchived.Value);
        }

        if (isDraft.HasValue)
        {
            query = query.Where(wi => wi.IsDraft == isDraft.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Include(wi => wi.Owner)
            .Include(wi => wi.Assignee)
            .Include(wi => wi.Committer)
            .Include(wi => wi.WorkspaceItemTags)
                .ThenInclude(wit => wit.Tag)
            .OrderByDescending(wi => wi.CreatedAt)
            .Skip((targetPage - 1) * FixedPageSize)
            .Take(FixedPageSize)
            .ToListAsync(cancellationToken);

        var workspaceCode = workspace.Code ?? string.Empty;

        var itemResponses = items.Select(item =>
        {
            var tagNames = item.WorkspaceItemTags
                .Where(wit => wit.Tag != null && wit.Tag.IsActive)
                .Select(wit => wit.Tag!.Name)
                .ToList();

            return new ExternalItemSummaryResponse
            {
                ItemNumber = item.ItemNumber,
                Subject = item.Subject,
                Tags = tagNames,
                Owner = new ExternalUserRefResponse
                {
                    LoginId = item.Owner?.LoginId ?? string.Empty,
                    Username = item.Owner?.Username ?? string.Empty,
                },
                AssignedUser = item.Assignee != null
                    ? new ExternalUserRefResponse
                    {
                        LoginId = item.Assignee.LoginId,
                        Username = item.Assignee.Username,
                    }
                    : null,
                Committer = item.Committer != null
                    ? new ExternalUserRefResponse
                    {
                        LoginId = item.Committer.LoginId,
                        Username = item.Committer.Username,
                    }
                    : null,
                DueDate = item.DueDate,
                IsActive = item.IsActive,
                IsArchived = item.IsArchived,
                IsDraft = item.IsDraft,
            };
        }).ToList();

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
            .Include(wi => wi.Owner)
            .Include(wi => wi.Assignee)
            .Include(wi => wi.Committer)
            .Include(wi => wi.WorkspaceItemTags)
                .ThenInclude(wit => wit.Tag)
            .FirstOrDefaultAsync(
                wi => wi.WorkspaceId == workspace.Id && wi.ItemNumber == itemNumber,
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
            Owner = new ExternalUserRefResponse
            {
                LoginId = item.Owner?.LoginId ?? string.Empty,
                Username = item.Owner?.Username ?? string.Empty,
            },
            AssignedUser = item.Assignee != null
                ? new ExternalUserRefResponse
                {
                    LoginId = item.Assignee.LoginId,
                    Username = item.Assignee.Username,
                }
                : null,
            Committer = item.Committer != null
                ? new ExternalUserRefResponse
                {
                    LoginId = item.Committer.LoginId,
                    Username = item.Committer.Username,
                }
                : null,
            DueDate = item.DueDate,
            IsActive = item.IsActive,
            IsArchived = item.IsArchived,
            IsDraft = item.IsDraft,
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