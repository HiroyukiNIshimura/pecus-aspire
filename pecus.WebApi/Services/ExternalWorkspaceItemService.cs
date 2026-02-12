using Hangfire;
using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Lexical;
using Pecus.Models.Requests.External;
using Pecus.Models.Responses.External;

namespace Pecus.Services;

/// <summary>
/// 外部API経由でワークスペースアイテムを操作するサービス
/// </summary>
public class ExternalWorkspaceItemService(
    ApplicationDbContext context,
    ILexicalConverterService lexicalConverterService,
    OrganizationAccessHelper accessHelper,
    IBackgroundJobClient backgroundJobClient,
    ILogger<ExternalWorkspaceItemService> logger) : IExternalWorkspaceItemService
{
    /// <inheritdoc />
    public async Task<CreateExternalWorkspaceItemResponse> CreateItemAsync(
        int organizationId,
        string workspaceCode,
        CreateExternalWorkspaceItemRequest request,
        CancellationToken cancellationToken = default)
    {
        // 1. ワークスペースの存在確認（組織スコープでフィルタ）
        var workspace = await context.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(
                w => w.Code == workspaceCode && w.OrganizationId == organizationId,
                cancellationToken)
            ?? throw new NotFoundException($"ワークスペース '{workspaceCode}' が見つかりません。");

        // 2. オーナーの存在確認（同一組織内のユーザーのみ）
        var owner = await context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u => u.LoginId == request.OwnerLoginId && u.OrganizationId == organizationId,
                cancellationToken)
            ?? throw new NotFoundException($"ユーザー '{request.OwnerLoginId}' が見つかりません。");

        // 3. オーナーがワークスペースのメンバーであることを確認
        var isMember = await accessHelper.IsActiveWorkspaceMemberAsync(owner.Id, workspace.Id);
        if (!isMember)
        {
            throw new InvalidOperationException(
                $"ユーザー '{request.OwnerLoginId}' はワークスペースのメンバーではありません。");
        }

        // 4. MarkdownからLexical JSONへ変換
        var lexicalResult = await lexicalConverterService.FromMarkdownAsync(
            request.Body,
            cancellationToken);

        if (!lexicalResult.Success)
        {
            throw new InvalidOperationException(
                $"Markdown から Lexical JSON への変換に失敗しました: {lexicalResult.ErrorMessage}");
        }

        // 5. トランザクション開始
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // シーケンス名の確認
            if (string.IsNullOrEmpty(workspace.ItemNumberSequenceName))
            {
                throw new InvalidOperationException(
                    "ワークスペースのアイテム連番シーケンスが設定されていません。");
            }

            // シーケンスから次の連番を取得（アトミック操作）
#pragma warning disable EF1002
            var itemNumber = await context.Database
                .SqlQueryRaw<int>($@"SELECT nextval('""{workspace.ItemNumberSequenceName}""')::int AS ""Value""")
                .FirstAsync(cancellationToken);
#pragma warning restore EF1002

            var now = DateTimeOffset.UtcNow;
            var item = new WorkspaceItem
            {
                WorkspaceId = workspace.Id,
                ItemNumber = itemNumber,
                Code = itemNumber.ToString(),
                Subject = request.Subject,
                Body = lexicalResult.Result,
                OwnerId = owner.Id,
                IsDraft = false,
                IsArchived = false,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
                UpdatedByUserId = owner.Id,
            };

            context.WorkspaceItems.Add(item);
            await context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            logger.LogInformation(
                "外部APIでワークスペースアイテムを作成しました: ItemId={ItemId}, WorkspaceCode={WorkspaceCode}, Owner={Owner}",
                item.Id,
                workspaceCode,
                request.OwnerLoginId);

            // 検索インデックス更新ジョブをエンキュー
            backgroundJobClient.Enqueue<WorkspaceItemTasks>(x =>
                x.UpdateSearchIndexAsync(item.Id));

            // Activity 記録ジョブをエンキュー
            backgroundJobClient.Enqueue<ActivityTasks>(x =>
                x.RecordActivityAsync(workspace.Id, item.Id, owner.Id, ActivityActionType.Created, null));

            return new CreateExternalWorkspaceItemResponse
            {
                WorkspaceCode = workspace.Code ?? string.Empty,
                ItemNumber = item.ItemNumber,
                Subject = item.Subject,
                CreatedAt = item.CreatedAt,
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            logger.LogError(
                ex,
                "外部APIでのワークスペースアイテム作成に失敗しました: WorkspaceCode={WorkspaceCode}",
                workspaceCode);
            throw;
        }
    }
}