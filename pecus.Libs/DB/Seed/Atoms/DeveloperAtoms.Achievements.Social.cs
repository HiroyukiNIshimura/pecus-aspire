using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB.Seed.Atoms;

/// <summary>
/// Achievement テストデータ - ソーシャル系
/// PromiseKeeper, Savior, TaskChef, Connector, BestSupporting, Commentator, Documenter, EvidenceKeeper, AiApprentice, Learner, UnsungHero
/// </summary>
public partial class DeveloperAtoms
{
    /// <summary>
    /// PromiseKeeper（約束の人）テストデータ
    /// 条件: 期限変更なしで完了したタスクが20件以上
    /// 参照: PromiseKeeperStrategy.cs
    /// </summary>
    private async Task SeedPromiseKeeperTestDataAsync()
    {
        // ===== 判定条件（PromiseKeeperStrategy と同じ値） =====
        const int RequiredCount = 20;
        // 判定式: TaskDueDateChanged Activity がない && IsCompleted, Count >= 20

        // Note: 期限変更がないタスクを判定するには Activity 履歴が必要。
        // テストデータはFirstTryで作成済みのリオープン Activity とは逆のパターン。
        // ここでは説明のみ記載
        _logger.LogInformation(
            "PromiseKeeper: Requires {Required}+ completed tasks without DueDateChanged activity (data-dependent)",
            RequiredCount);
    }

    /// <summary>
    /// Savior（救世主）テストデータ
    /// 条件: リオープンされたタスクを完了した
    /// 参照: SaviorStrategy.cs
    /// </summary>
    private async Task SeedSaviorTestDataAsync()
    {
        // ===== 判定条件（SaviorStrategy と同じ値） =====
        // 判定式: TaskReopened Activity があり、その後 TaskCompleted Activity がある

        // Note: FirstTry テストデータで TaskReopened を追加済み。
        // その後に TaskCompleted があれば Savior 達成となる
        _logger.LogInformation(
            "Savior: Requires completing a task that was reopened (uses FirstTry test data)");
    }

    /// <summary>
    /// TaskChef（タスク料理人）テストデータ
    /// 条件: 1日で5件以上のタスクを作成した
    /// 参照: TaskChefStrategy.cs
    /// </summary>
    private async Task SeedTaskChefTestDataAsync()
    {
        // ===== 判定条件（TaskChefStrategy と同じ値） =====
        const int RequiredCount = 5;
        const string TimeZoneId = "Asia/Tokyo";
        // 判定式: 同一日（JST）に CreatedAt があるタスク数 >= 5

        var tz = TimeZoneInfo.FindSystemTimeZoneById(TimeZoneId);
        var today = DateTime.Today;

        var tasksByCreator = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .GroupBy(t => t.CreatedByUserId)
            .Where(g => g.Count() >= 10)
            .OrderBy(g => g.Key)
            .Skip(14)
            .Take(2)
            .Select(g => new { UserId = g.Key, Tasks = g.OrderBy(t => t.Id).Take(10).ToList() })
            .ToListAsync();

        if (tasksByCreator.Count < 2)
        {
            _logger.LogWarning("TaskChef: Not enough users with 10+ created tasks for test data");
            return;
        }

        // ===== 条件を満たすユーザー（1人目: 5件が同一日に作成） =====
        var qualifyUser = tasksByCreator[0];
        for (int i = 0; i < qualifyUser.Tasks.Count; i++)
        {
            var task = qualifyUser.Tasks[i];
            if (i < 5)
            {
                // 5件: 今日作成 → 同一日に5件 → true
                task.CreatedAt = ToJstUtc(today, hour: 9 + i, minute: 0, tz);
            }
            else
            {
                // 残り: 昨日以前に作成 → カウント外
                task.CreatedAt = ToJstUtc(today.AddDays(-i), hour: 10, minute: 0, tz);
            }
        }

        // ===== 条件を満たさないユーザー（2人目: 4件のみ同一日に作成） =====
        var nonQualifyUser = tasksByCreator[1];
        for (int i = 0; i < nonQualifyUser.Tasks.Count; i++)
        {
            var task = nonQualifyUser.Tasks[i];
            if (i < 4)
            {
                // 4件: 今日作成 → RequiredCount(5) に満たない
                task.CreatedAt = ToJstUtc(today, hour: 9 + i, minute: 0, tz);
            }
            else
            {
                // 残り: 別の日に作成
                task.CreatedAt = ToJstUtc(today.AddDays(-i), hour: 10, minute: 0, tz);
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "TaskChef: User1 created {Required}+ tasks in one day (qualify), User2 created {Less} tasks (non-qualify)",
            RequiredCount, RequiredCount - 1);
    }

    /// <summary>
    /// Connector（コネクター）テストデータ
    /// 条件: アイテム間の関連を10件以上作成した
    /// 参照: ConnectorStrategy.cs
    /// </summary>
    private async Task SeedConnectorTestDataAsync()
    {
        // ===== 判定条件（ConnectorStrategy と同じ値） =====
        const int RequiredCount = 10;
        // 判定式: WorkspaceItemRelationの数 >= 10

        var users = await _context.Users
            .Where(u => u.OrganizationId != null && _targetOrganizationIds.Contains(u.OrganizationId.Value))
            .Where(u => u.IsActive)
            .OrderBy(u => u.Id)
            .Skip(4)
            .Take(2)
            .ToListAsync();

        if (users.Count < 2)
        {
            _logger.LogWarning("Connector: Not enough users for test data");
            return;
        }

        var items = await _context.WorkspaceItems
            .Where(i => i.Workspace!.OrganizationId == users[0].OrganizationId)
            .Take(2)
            .ToListAsync();

        if (items.Count == 0)
        {
            _logger.LogWarning("Connector: No items found to create relations");
            return;
        }

        var item1 = items[0];
        WorkspaceItem item2;

        if (items.Count >= 2)
        {
            item2 = items[1];
        }
        else
        {
            // アイテムが1つしかない場合は、リレーション用のダミーアイテムを作成
            var maxItemNumber = await _context.WorkspaceItems
                .Where(i => i.WorkspaceId == item1.WorkspaceId)
                .MaxAsync(i => (int?)i.ItemNumber) ?? 0;

            item2 = new WorkspaceItem
            {
                WorkspaceId = item1.WorkspaceId,
                ItemNumber = maxItemNumber + 1,
                Code = $"{item1.WorkspaceId}-{maxItemNumber + 1}",
                Subject = "Connector Test Item 2",
                Body = "Connector Test Item 2 Body",
                OwnerId = item1.OwnerId,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            _context.WorkspaceItems.Add(item2);
            await _context.SaveChangesAsync();
        }

        // ===== 条件を満たすユーザー（1人目: 10件の関連を作成） =====
        for (int i = 0; i < 10; i++)
        {
            _context.WorkspaceItemRelations.Add(new DB.Models.WorkspaceItemRelation
            {
                FromItemId = item1.Id,
                ToItemId = item2.Id,
                CreatedByUserId = users[0].Id,
                CreatedAt = DateTimeOffset.UtcNow,
                RowVersion = 0
            });
        }

        // ===== 条件を満たさないユーザー（2人目: 9件の関連を作成） =====
        for (int i = 0; i < 9; i++)
        {
            _context.WorkspaceItemRelations.Add(new DB.Models.WorkspaceItemRelation
            {
                FromItemId = item1.Id,
                ToItemId = item2.Id,
                CreatedByUserId = users[1].Id,
                CreatedAt = DateTimeOffset.UtcNow,
                RowVersion = 0
            });
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Connector: User1 created {Required}+ relations (qualify), User2 created {Less} relations (non-qualify)",
            RequiredCount, RequiredCount - 1);
    }

    /// <summary>
    /// BestSupporting（名バイプレイヤー）テストデータ
    /// 条件: 他のユーザーが作成したタスクを50件完了した
    /// 参照: BestSupportingStrategy.cs
    /// </summary>
    private async Task SeedBestSupportingTestDataAsync()
    {
        // ===== 判定条件（BestSupportingStrategy と同じ値） =====
        const int RequiredCount = 50;
        // 判定式: AssignedUserId != CreatedByUserId && IsCompleted, Count >= 50

        // Note: 50件は大量なのでテスト環境では困難。説明のみ記載
        _logger.LogInformation(
            "BestSupporting: Requires {Required}+ completed tasks created by others (data-dependent)",
            RequiredCount);
    }

    /// <summary>
    /// Commentator（コメンテーター）テストデータ
    /// 条件: タスクにコメントを50件投稿した
    /// 参照: CommentatorStrategy.cs
    /// </summary>
    private async Task SeedCommentatorTestDataAsync()
    {
        // ===== 判定条件（CommentatorStrategy と同じ値） =====
        const int RequiredCount = 50;
        // 判定式: TaskComments.Count >= 50

        // Note: 50件は大量なのでテスト環境では困難。説明のみ記載
        _logger.LogInformation(
            "Commentator: Requires {Required}+ task comments (data-dependent)",
            RequiredCount);
    }

    /// <summary>
    /// Documenter（ドキュメンター）テストデータ
    /// 条件: コメント付きでタスクを20件完了した
    /// 参照: DocumenterStrategy.cs
    /// </summary>
    private async Task SeedDocumenterTestDataAsync()
    {
        // ===== 判定条件（DocumenterStrategy と同じ値） =====
        const int RequiredCount = 20;
        // 判定式: TaskComments がある && IsCompleted, Count >= 20

        var tasks = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => t.IsCompleted)
            .OrderBy(t => t.Id)
            .Skip(100)
            .Take(25)
            .ToListAsync();

        if (tasks.Count < 25)
        {
            _logger.LogWarning("Documenter: Not enough completed tasks for test data");
            return;
        }

        var users = await _context.Users
            .Where(u => u.OrganizationId != null && _targetOrganizationIds.Contains(u.OrganizationId.Value))
            .Where(u => u.IsActive)
            .OrderBy(u => u.Id)
            .Take(2)
            .ToListAsync();

        if (users.Count < 2)
        {
            _logger.LogWarning("Documenter: Not enough users for test data");
            return;
        }

        // ===== 条件を満たすユーザー（1人目: 20件のタスクにコメント） =====
        for (int i = 0; i < 20; i++)
        {
            var task = tasks[i];
            task.AssignedUserId = users[0].Id;
            _context.TaskComments.Add(new DB.Models.TaskComment
            {
                WorkspaceTaskId = task.Id,
                UserId = users[0].Id,
                Content = $"Test comment for Documenter achievement {i + 1}",
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        // ===== 条件を満たさないユーザー（2人目: 19件のタスクにコメント） =====
        for (int i = 20; i < 25; i++)
        {
            var task = tasks[i];
            task.AssignedUserId = users[1].Id;
            if (i < 24)
            {
                _context.TaskComments.Add(new DB.Models.TaskComment
                {
                    WorkspaceTaskId = task.Id,
                    UserId = users[1].Id,
                    Content = $"Test comment for non-qualify {i - 19}",
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Documenter: User1 has {Required}+ tasks with comments (qualify), User2 has {Less} tasks (non-qualify)",
            RequiredCount, RequiredCount - 1);
    }

    /// <summary>
    /// EvidenceKeeper（証拠を残す人）テストデータ
    /// 条件: ファイル添付付きでタスクを完了した回数が20件以上
    /// 参照: EvidenceKeeperStrategy.cs
    /// </summary>
    private async Task SeedEvidenceKeeperTestDataAsync()
    {
        // ===== 判定条件（EvidenceKeeperStrategy と同じ値） =====
        const int RequiredCount = 20;
        // 判定式: WorkspaceItemAttachments がある && IsCompleted, Count >= 20

        // Note: ファイル添付のテストデータは複雑なため、説明のみ記載
        _logger.LogInformation(
            "EvidenceKeeper: Requires {Required}+ completed tasks with attachments (data-dependent)",
            RequiredCount);
    }

    /// <summary>
    /// AiApprentice（AI使いの弟子）テストデータ
    /// 条件: AIアシスタント機能を使用した（AIチャットルームでメッセージを送信した）
    /// 参照: AiApprenticeStrategy.cs
    /// </summary>
    private async Task SeedAiApprenticeTestDataAsync()
    {
        // ===== 判定条件（AiApprenticeStrategy と同じ値） =====
        // 判定式: ChatRoom.Type == Ai && SenderActor.UserId != null

        // 対象ユーザーを取得
        var users = await _context.Users
            .Where(u => u.OrganizationId != null && _targetOrganizationIds.Contains(u.OrganizationId.Value))
            .Where(u => u.IsActive)
            .OrderBy(u => u.Id)
            .Take(2)
            .ToListAsync();

        if (users.Count < 2)
        {
            _logger.LogWarning("AiApprentice: Not enough users for test data");
            return;
        }

        var targetUser = users[0];
        var organizationId = targetUser.OrganizationId!.Value;

        // AI チャットルームを作成
        var aiChatRoom = new ChatRoom
        {
            Type = ChatRoomType.Ai,
            Name = "AI Assistant Test",
            OrganizationId = organizationId,
            CreatedByUserId = targetUser.Id,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1)
        };
        _context.ChatRooms.Add(aiChatRoom);
        await _context.SaveChangesAsync();

        // 既存の ChatActor を検索、なければ作成
        var userActor = await _context.ChatActors
            .FirstOrDefaultAsync(a => a.UserId == targetUser.Id);

        if (userActor == null)
        {
            userActor = new ChatActor
            {
                OrganizationId = organizationId,
                ActorType = ChatActorType.User,
                UserId = targetUser.Id,
                DisplayName = targetUser.Username
            };
            _context.ChatActors.Add(userActor);
            await _context.SaveChangesAsync();
        }

        // AI チャットルームでユーザーがメッセージを送信
        var chatMessage = new ChatMessage
        {
            ChatRoomId = aiChatRoom.Id,
            SenderActorId = userActor.Id,
            MessageType = ChatMessageType.Text,
            Content = "Hello AI!",
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-1)
        };
        _context.ChatMessages.Add(chatMessage);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "AiApprentice: User {UserId} sent message to AI chat room (qualify)",
            targetUser.Id);
    }

    /// <summary>
    /// Learner（学習者）テストデータ
    /// 条件: リオープンされたタスクから学び、次の10件は一発で完了した
    /// 参照: LearnerStrategy.cs
    /// </summary>
    private async Task SeedLearnerTestDataAsync()
    {
        // ===== 判定条件（LearnerStrategy と同じ値） =====
        const int RequiredStreak = 10;
        // 判定式: TaskReopened 後に、TaskReopened なしで TaskCompleted が連続10件

        var workspaceIds = await _context.Workspaces
            .Where(w => _targetOrganizationIds.Contains(w.OrganizationId))
            .OrderBy(w => w.Id)
            .Select(w => w.Id)
            .Take(5)
            .ToListAsync();

        if (workspaceIds.Count == 0)
        {
            _logger.LogWarning("Learner: No workspaces found for test data");
            return;
        }

        // TaskReopened を持つユーザーを取得（FirstTry テストデータで作成済み）
        var usersWithReopen = await _context.Activities
            .Where(a => workspaceIds.Contains(a.WorkspaceId))
            .Where(a => a.ActionType == ActivityActionType.TaskReopened)
            .Where(a => a.UserId != null)
            .Select(a => a.UserId!.Value)
            .Distinct()
            .OrderBy(id => id)
            .Take(1)
            .ToListAsync();

        if (usersWithReopen.Count == 0)
        {
            _logger.LogWarning("Learner: No users with TaskReopened activity found");
            return;
        }

        var targetUserId = usersWithReopen[0];

        // そのユーザーの最後の Reopen 時刻を取得
        var lastReopenTime = await _context.Activities
            .Where(a => workspaceIds.Contains(a.WorkspaceId))
            .Where(a => a.ActionType == ActivityActionType.TaskReopened)
            .Where(a => a.UserId == targetUserId)
            .MaxAsync(a => a.CreatedAt);

        // リオープンされていないタスクの完了 Activity を取得
        var reopenedItemIds = await _context.Activities
            .Where(a => workspaceIds.Contains(a.WorkspaceId))
            .Where(a => a.ActionType == ActivityActionType.TaskReopened)
            .Select(a => a.ItemId)
            .Distinct()
            .ToListAsync();

        // リオープンされていないタスクの完了 Activity を追加（10件）
        var completedTasks = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => t.IsCompleted)
            .Where(t => !reopenedItemIds.Contains(t.WorkspaceItemId))
            .OrderBy(t => t.Id)
            .Take(12)
            .ToListAsync();

        if (completedTasks.Count < 10)
        {
            _logger.LogWarning("Learner: Not enough completed tasks without reopen for test data");
            return;
        }

        var baseTime = lastReopenTime.AddMinutes(1);
        for (int i = 0; i < 10; i++)
        {
            var task = completedTasks[i];
            _context.Activities.Add(new Activity
            {
                WorkspaceId = task.WorkspaceId,
                ItemId = task.WorkspaceItemId,
                UserId = targetUserId,
                ActionType = ActivityActionType.TaskCompleted,
                CreatedAt = baseTime.AddMinutes(i + 1)
            });
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Learner: User {UserId} has {Required} consecutive first-try completions after reopen (qualify)",
            targetUserId,
            RequiredStreak);
    }

    /// <summary>
    /// UnsungHero（沈黙の守護者）テストデータ
    /// 条件: 自分が作成者でないタスクを10件完了した
    /// 参照: UnsungHeroStrategy.cs
    /// </summary>
    private async Task SeedUnsungHeroTestDataAsync()
    {
        // ===== 判定条件（UnsungHeroStrategy と同じ値） =====
        const int RequiredCount = 10;
        // 判定式: AssignedUserId != CreatedByUserId && IsCompleted, Count >= 10

        var tasksByUser = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => t.IsCompleted)
            .GroupBy(t => t.AssignedUserId)
            .Where(g => g.Count() >= 15)
            .OrderBy(g => g.Key)
            .Skip(16)
            .Take(2)
            .Select(g => new { UserId = g.Key, Tasks = g.OrderBy(t => t.Id).Take(15).ToList() })
            .ToListAsync();

        if (tasksByUser.Count < 2)
        {
            _logger.LogWarning("UnsungHero: Not enough users with 15+ tasks for test data");
            return;
        }

        // 別のユーザーIDを取得（作成者として使用）
        var otherUsers = await _context.Users
            .Where(u => u.OrganizationId != null && _targetOrganizationIds.Contains(u.OrganizationId.Value))
            .Where(u => u.IsActive)
            .Where(u => u.Id != tasksByUser[0].UserId && u.Id != tasksByUser[1].UserId)
            .OrderBy(u => u.Id)
            .Take(2)
            .ToListAsync();

        if (otherUsers.Count < 2)
        {
            _logger.LogWarning("UnsungHero: Not enough other users for test data");
            return;
        }

        // ===== 条件を満たすユーザー（1人目: 10件が他者作成） =====
        var qualifyUser = tasksByUser[0];
        for (int i = 0; i < qualifyUser.Tasks.Count; i++)
        {
            var task = qualifyUser.Tasks[i];
            if (i < 10)
            {
                // 10件: 他者が作成 → AssignedUserId != CreatedByUserId → true
                task.CreatedByUserId = otherUsers[0].Id;
            }
            else
            {
                // 残り: 自分が作成 → AssignedUserId == CreatedByUserId → false
                task.CreatedByUserId = qualifyUser.UserId;
            }
        }

        // ===== 条件を満たさないユーザー（2人目: 9件のみ他者作成） =====
        var nonQualifyUser = tasksByUser[1];
        for (int i = 0; i < nonQualifyUser.Tasks.Count; i++)
        {
            var task = nonQualifyUser.Tasks[i];
            if (i < 9)
            {
                // 9件: 他者が作成 → true だが RequiredCount(10) に満たない
                task.CreatedByUserId = otherUsers[1].Id;
            }
            else
            {
                // 残り: 自分が作成
                task.CreatedByUserId = nonQualifyUser.UserId;
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "UnsungHero: User1 completed {Required}+ tasks created by others (qualify), User2 completed {Less} tasks (non-qualify)",
            RequiredCount, RequiredCount - 1);
    }
}
