using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.DB.Services;
using Pecus.Libs.Security;
using Pecus.Libs.Utils;

namespace Pecus.Libs.DB.Seed.Atoms;

/// <summary>
/// デモ環境向けのシードデータ生成
/// </summary>
public class DemoAtoms
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DemoAtoms> _logger;
    private readonly DemoModeOptions _options;
    private readonly CommonAtoms _commonAtoms;
    private readonly BatchOrganizationDeletionService _organizationDeletionService;

    /// <summary>
    /// Constructor
    /// </summary>
    public DemoAtoms(
        ApplicationDbContext context,
        ILogger<DemoAtoms> logger,
        IOptions<DemoModeOptions> options,
        CommonAtoms commonAtoms,
        BatchOrganizationDeletionService organizationDeletionService)
    {
        _context = context;
        _logger = logger;
        _options = options.Value;
        _commonAtoms = commonAtoms;
        _organizationDeletionService = organizationDeletionService;
    }

    /// <summary>
    /// デモ環境用のデータを投入
    /// </summary>
    /// <returns>作成されたデモ組織のID</returns>
    public async Task<long> SeedDemoAsync()
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Demo mode is disabled. Skipping demo data seeding.");
            return 0;
        }

        _logger.LogInformation("Seeding demo data...");

        var demoOrgId = await SeedDemoDataAsync();

        _logger.LogInformation("Demo data seeding completed");
        return demoOrgId;
    }

    /// <summary>
    /// デモ関連のデータを1つのトランザクションで投入
    /// </summary>
    /// <returns>作成または取得されたデモ組織のID</returns>
    private async Task<long> SeedDemoDataAsync()
    {
        var existingOrg = await _context.Organizations
            .Include(o => o.Users)
            .FirstOrDefaultAsync(o => o.Code == _options.Organization.Code && o.IsDemo);

        if (existingOrg != null)
        {
            _logger.LogInformation("Demo organization already exists, deleting and recreating...");
            await DeleteDemoOrganizationAsync(existingOrg);
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _logger.LogInformation("Creating Demo organization and related data...");

            var organization = CreateDemoOrganization();
            await _context.Organizations.AddAsync(organization);
            await _context.SaveChangesAsync();

            var settings = CreateDemoOrganizationSettings(organization);
            await _context.OrganizationSettings.AddAsync(settings);

            var (systemBot, chatBot) = CreateDemoBots(organization);
            await _context.Bots.AddRangeAsync(systemBot, chatBot);
            await _context.SaveChangesAsync();

            await _commonAtoms.SeedSkillsAsync(_context);

            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == SystemRole.Admin);
            var memberRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == SystemRole.User);
            if (adminRole == null || memberRole == null)
            {
                _logger.LogWarning("Required roles not found. Rolling back transaction.");
                await transaction.RollbackAsync();
                throw new InvalidOperationException("Required roles (Admin/User) not found.");
            }

            var users = CreateDemoUsers(organization, adminRole, memberRole);
            await _context.Users.AddRangeAsync(users);
            await _context.SaveChangesAsync();

            var userSkills = await CreateDemoUserSkillsAsync(organization, users);
            await _context.UserSkills.AddRangeAsync(userSkills);
            await _context.SaveChangesAsync();

            var chatActors = CreateDemoChatActors(organization, users, systemBot, chatBot);
            await _context.ChatActors.AddRangeAsync(chatActors);
            await _context.SaveChangesAsync();

            var chatRooms = CreateDemoChatRooms(organization, users, chatActors);
            await _context.ChatRooms.AddRangeAsync(chatRooms);
            await _context.SaveChangesAsync();

            var chatRoomMembers = CreateChatRoomMembers(chatRooms, users, chatActors);
            await _context.ChatRoomMembers.AddRangeAsync(chatRoomMembers);
            await _context.SaveChangesAsync();

            var dmMessages = CreateDemoDmMessages(chatRooms, users, chatActors);
            await _context.ChatMessages.AddRangeAsync(dmMessages);
            await _context.SaveChangesAsync();

            var workspaces = await CreateDemoWorkspacesAsync(organization, users);
            await _context.Workspaces.AddRangeAsync(workspaces);
            await _context.SaveChangesAsync();

            var workspaceUsers = CreateDemoWorkspaceUsers(workspaces, users);
            await _context.WorkspaceUsers.AddRangeAsync(workspaceUsers);
            await _context.SaveChangesAsync();

            var workspaceChatRoomMembers = await CreateWorkspaceGroupChatRoomsAsync(organization, workspaces, users, chatActors);
            await _context.ChatRoomMembers.AddRangeAsync(workspaceChatRoomMembers);
            await _context.SaveChangesAsync();

            var sampleProjectWorkspace = workspaces.FirstOrDefault(w => w.Name == "サンプルプロジェクト");
            if (sampleProjectWorkspace != null)
            {
                await CreateSampleProjectItemAsync(sampleProjectWorkspace, users);
            }

            var documentProjectWorkspace = workspaces.FirstOrDefault(w => w.Name == "ドキュメントプロジェクト");
            if (documentProjectWorkspace != null)
            {
                await CreateSampleDocumentItemAsync(documentProjectWorkspace, users);
            }

            await transaction.CommitAsync();
            _logger.LogInformation("Demo data seeding completed successfully");
            return organization.Id;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Failed to seed Demo data. Transaction rolled back.");
            throw;
        }
    }

    /// <summary>
    /// デモ組織と関連データを削除
    /// </summary>
    private async Task DeleteDemoOrganizationAsync(Organization org)
    {
        await _organizationDeletionService.DeleteOrganizationWithRelatedDataAsync(org.Id);
    }

    private Organization CreateDemoOrganization()
    {
        return new Organization
        {
            Name = _options.Organization.Name,
            Code = _options.Organization.Code,
            PhoneNumber = _options.Organization.PhoneNumber,
            Email = _options.Organization.Email,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDemo = true
        };
    }

    private OrganizationSetting CreateDemoOrganizationSettings(Organization org)
    {
        return new OrganizationSetting
        {
            OrganizationId = org.Id,
            TaskOverdueThreshold = 0,
            WeeklyReportDeliveryDay = 0,
            MailFromAddress = org.Email,
            MailFromName = org.Name,
            GenerativeApiVendor = _options.Organization.GenerativeApiVendor,
            GenerativeApiKey = _options.Organization.GenerativeApiKey,
            GenerativeApiModel = _options.Organization.GenerativeApiModel,
            Plan = OrganizationPlan.Free,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    private (Bot SystemBot, Bot ChatBot) CreateDemoBots(Organization org)
    {
        var systemBotPersona = BotPersonaHelper.GetSystemBotPersona();
        var systemBotConstraint = BotPersonaHelper.GetSystemBotConstraint();
        var chatBotPersona = BotPersonaHelper.GetChatBotPersona();
        var chatBotConstraint = BotPersonaHelper.GetChatBotConstraint();

        var systemBot = new Bot
        {
            OrganizationId = org.Id,
            Type = BotType.SystemBot,
            Name = "Butler Bot",
            IconUrl = "/icons/bot/system.webp",
            Persona = systemBotPersona,
            Constraint = systemBotConstraint,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        var chatBot = new Bot
        {
            OrganizationId = org.Id,
            Type = BotType.ChatBot,
            Name = "Coati Bot",
            IconUrl = "/icons/bot/chat.webp",
            Persona = chatBotPersona,
            Constraint = chatBotConstraint,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        return (systemBot, chatBot);
    }

    private List<User> CreateDemoUsers(Organization org, Role adminRole, Role memberRole)
    {
        var users = new List<User>();
        foreach (var userOption in _options.Users)
        {
            var role = userOption.Role == "Admin" ? adminRole : memberRole;
            var loginId = CodeGenerator.GenerateLoginId();
            var passwordHash = PasswordHasher.HashPassword(userOption.Password);

            var user = new User
            {
                OrganizationId = org.Id,
                Email = userOption.Email,
                Username = userOption.Username,
                LoginId = loginId,
                PasswordHash = passwordHash,
                IsActive = true,
                AvatarType = AvatarType.UserAvatar,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            user.Roles.Add(role);
            users.Add(user);
        }

        return users;
    }

    private async Task<List<UserSkill>> CreateDemoUserSkillsAsync(Organization org, List<User> users)
    {
        var userSkills = new List<UserSkill>();

        var skills = await _context.Skills
            .Where(s => s.OrganizationId == org.Id && s.IsActive)
            .ToListAsync();

        if (!skills.Any())
        {
            _logger.LogWarning("No skills found for demo organization");
            return userSkills;
        }

        var random = new Random();
        var adminUser = users.FirstOrDefault();

        foreach (var user in users)
        {
            var selectedSkills = skills.OrderBy(_ => random.Next()).Take(3).ToList();

            foreach (var skill in selectedSkills)
            {
                userSkills.Add(new UserSkill
                {
                    UserId = user.Id,
                    SkillId = skill.Id,
                    AddedAt = DateTime.UtcNow,
                    AddedByUserId = adminUser?.Id
                });
            }
        }

        _logger.LogInformation("Created {Count} user skills for {UserCount} users", userSkills.Count, users.Count);
        return userSkills;
    }

    private List<ChatActor> CreateDemoChatActors(Organization org, List<User> users, Bot systemBot, Bot chatBot)
    {
        var chatActors = new List<ChatActor>();

        foreach (var user in users)
        {
            var actor = new ChatActor
            {
                OrganizationId = org.Id,
                ActorType = ChatActorType.User,
                UserId = user.Id,
                BotId = null,
                DisplayName = user.Username,
                AvatarType = user.AvatarType,
                AvatarUrl = user.UserAvatarPath,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            chatActors.Add(actor);
        }

        var systemBotActor = new ChatActor
        {
            OrganizationId = org.Id,
            ActorType = ChatActorType.Bot,
            UserId = null,
            BotId = systemBot.Id,
            DisplayName = systemBot.Name,
            AvatarType = null,
            AvatarUrl = systemBot.IconUrl,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        chatActors.Add(systemBotActor);

        var chatBotActor = new ChatActor
        {
            OrganizationId = org.Id,
            ActorType = ChatActorType.Bot,
            UserId = null,
            BotId = chatBot.Id,
            DisplayName = chatBot.Name,
            AvatarType = null,
            AvatarUrl = chatBot.IconUrl,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        chatActors.Add(chatBotActor);

        return chatActors;
    }

    private List<ChatRoom> CreateDemoChatRooms(
        Organization org,
        List<User> users,
        List<ChatActor> chatActors)
    {
        var adminUserOption = _options.Users.FirstOrDefault(u => u.Role == "Admin");
        if (adminUserOption == null) return new List<ChatRoom>();

        var adminUser = users.First(u => u.Email == adminUserOption.Email);
        var operatorUsers = users.Where(u => u.Email != adminUser.Email).ToList();

        var rooms = new List<ChatRoom>();

        foreach (var operatorUser in operatorUsers)
        {
            var minId = Math.Min(adminUser.Id, operatorUser.Id);
            var maxId = Math.Max(adminUser.Id, operatorUser.Id);
            var dmUserPair = $"{minId}_{maxId}";

            var room = new ChatRoom
            {
                OrganizationId = org.Id,
                Type = ChatRoomType.Dm,
                DmUserPair = dmUserPair,
                CreatedByUserId = adminUser.Id,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            rooms.Add(room);
        }

        return rooms;
    }

    private List<ChatRoomMember> CreateChatRoomMembers(
        List<ChatRoom> rooms,
        List<User> users,
        List<ChatActor> chatActors)
    {
        var members = new List<ChatRoomMember>();

        foreach (var room in rooms)
        {
            if (string.IsNullOrEmpty(room.DmUserPair)) continue;

            var ids = room.DmUserPair.Split('_').Select(long.Parse).ToList();
            if (ids.Count != 2) continue;

            var user1Id = ids[0];
            var user2Id = ids[1];

            var user1Actor = chatActors.FirstOrDefault(a => a.UserId == user1Id);
            var user2Actor = chatActors.FirstOrDefault(a => a.UserId == user2Id);

            if (user1Actor == null || user2Actor == null) continue;

            members.Add(new ChatRoomMember
            {
                ChatRoomId = room.Id,
                ChatActorId = user1Actor.Id,
                Role = ChatRoomRole.Member,
                JoinedAt = DateTimeOffset.UtcNow
            });

            members.Add(new ChatRoomMember
            {
                ChatRoomId = room.Id,
                ChatActorId = user2Actor.Id,
                Role = ChatRoomRole.Member,
                JoinedAt = DateTimeOffset.UtcNow
            });
        }

        return members;
    }

    private async Task<List<Workspace>> CreateDemoWorkspacesAsync(Organization org, List<User> users)
    {
        var workspaces = new List<Workspace>();

        var manualGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == "マニュアル・手順");
        var projectGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == "プロジェクト・開発");

        var userOptions = _options.Users.Where(u => u.Role != "Admin").ToList();
        if (userOptions.Count < 2)
        {
            _logger.LogWarning("Not enough non-admin users for demo workspaces");
            return workspaces;
        }

        var user1 = users.FirstOrDefault(u => u.Email == userOptions[0].Email);
        var user2 = users.FirstOrDefault(u => u.Email == userOptions[1].Email);

        if (user1 == null || user2 == null)
        {
            _logger.LogWarning("Demo users not found for workspace creation");
            return workspaces;
        }

        var manualDescriptions = SeedConstants.WorkspaceDescriptionsByGenre.GetValueOrDefault("マニュアル・手順", Array.Empty<string>());
        var projectDescriptions = SeedConstants.WorkspaceDescriptionsByGenre.GetValueOrDefault("プロジェクト・開発", Array.Empty<string>());

        var sampleProjectWorkspace = new Workspace
        {
            Name = "サンプルプロジェクト",
            Code = CodeGenerator.GenerateWorkspaceCode(),
            Description = projectDescriptions.Length > 0 ? projectDescriptions[0] : "サンプルのプロジェクトワークスペースです。",
            OrganizationId = org.Id,
            GenreId = projectGenre?.Id,
            Mode = WorkspaceMode.Normal,
            OwnerId = user2.Id,
            CreatedByUserId = user2.Id,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        workspaces.Add(sampleProjectWorkspace);

        var documentProjectWorkspace = new Workspace
        {
            Name = "ドキュメントプロジェクト",
            Code = CodeGenerator.GenerateWorkspaceCode(),
            Description = manualDescriptions.Length > 0 ? manualDescriptions[0] : "ドキュメント管理用のワークスペースです。",
            OrganizationId = org.Id,
            GenreId = manualGenre?.Id,
            Mode = WorkspaceMode.Document,
            OwnerId = user1.Id,
            CreatedByUserId = user1.Id,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        workspaces.Add(documentProjectWorkspace);

        _logger.LogInformation("Created {Count} demo workspaces", workspaces.Count);
        return workspaces;
    }

    private List<WorkspaceUser> CreateDemoWorkspaceUsers(List<Workspace> workspaces, List<User> users)
    {
        var workspaceUsers = new List<WorkspaceUser>();

        var userOptions = _options.Users.Where(u => u.Role != "Admin").ToList();
        if (userOptions.Count < 2) return workspaceUsers;

        var user1 = users.FirstOrDefault(u => u.Email == userOptions[0].Email);
        var user2 = users.FirstOrDefault(u => u.Email == userOptions[1].Email);

        if (user1 == null || user2 == null) return workspaceUsers;

        foreach (var workspace in workspaces)
        {
            foreach (var user in users)
            {
                WorkspaceRole role;
                if (workspace.OwnerId == user.Id)
                {
                    role = WorkspaceRole.Owner;
                }
                else
                {
                    role = WorkspaceRole.Member;
                }

                workspaceUsers.Add(new WorkspaceUser
                {
                    WorkspaceId = workspace.Id,
                    UserId = user.Id,
                    JoinedAt = DateTime.UtcNow,
                    WorkspaceRole = role
                });
            }
        }

        _logger.LogInformation("Created {Count} demo workspace users", workspaceUsers.Count);
        return workspaceUsers;
    }

    private async Task<List<ChatRoomMember>> CreateWorkspaceGroupChatRoomsAsync(
        Organization org,
        List<Workspace> workspaces,
        List<User> users,
        List<ChatActor> chatActors)
    {
        var chatRooms = new List<ChatRoom>();
        var chatRoomMembers = new List<ChatRoomMember>();

        foreach (var workspace in workspaces)
        {
            var ownerUser = users.FirstOrDefault(u => u.Id == workspace.OwnerId);
            if (ownerUser == null) continue;

            var room = new ChatRoom
            {
                OrganizationId = org.Id,
                Type = ChatRoomType.Group,
                Name = workspace.Name,
                WorkspaceId = workspace.Id,
                CreatedByUserId = ownerUser.Id,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            chatRooms.Add(room);
        }

        await _context.ChatRooms.AddRangeAsync(chatRooms);
        await _context.SaveChangesAsync();

        foreach (var room in chatRooms)
        {
            var isFirst = true;
            foreach (var user in users)
            {
                var chatActor = chatActors.FirstOrDefault(a => a.UserId == user.Id);
                if (chatActor == null) continue;

                chatRoomMembers.Add(new ChatRoomMember
                {
                    ChatRoomId = room.Id,
                    ChatActorId = chatActor.Id,
                    Role = isFirst ? ChatRoomRole.Owner : ChatRoomRole.Member,
                    JoinedAt = DateTimeOffset.UtcNow
                });
                isFirst = false;
            }

            var botActor = chatActors.FirstOrDefault(a => a.BotId != null);
            if (botActor != null)
            {
                chatRoomMembers.Add(new ChatRoomMember
                {
                    ChatRoomId = room.Id,
                    ChatActorId = botActor.Id,
                    Role = ChatRoomRole.Member,
                    JoinedAt = DateTimeOffset.UtcNow
                });
            }
        }

        _logger.LogInformation("Created {RoomCount} workspace group chat rooms with {MemberCount} members",
            chatRooms.Count, chatRoomMembers.Count);

        return chatRoomMembers;
    }

    /// <summary>
    /// サンプルプロジェクトワークスペースにアイテム、タスク、コメントを作成
    /// </summary>
    private async Task CreateSampleProjectItemAsync(Workspace workspace, List<User> users)
    {
        var userOptions = _options.Users.Where(u => u.Role != "Admin").ToList();
        if (userOptions.Count < 2)
        {
            _logger.LogWarning("Not enough non-admin users for sample project item");
            return;
        }

        var user1 = users.FirstOrDefault(u => u.Email == userOptions[0].Email);
        var user2 = users.FirstOrDefault(u => u.Email == userOptions[1].Email);
        var adminUser = users.FirstOrDefault(u => _options.Users.Any(o => o.Role == "Admin" && o.Email == u.Email));

        if (user1 == null || user2 == null || adminUser == null)
        {
            _logger.LogWarning("Required users not found for sample project item");
            return;
        }

        var bodyData = await _commonAtoms.LoadProductVisionAsLexicalJsonAsync();
        if (bodyData == null)
        {
            _logger.LogWarning("Failed to load product vision markdown for sample project item");
            return;
        }

        var sequenceName = $"workspace_{workspace.Id}_item_seq";
#pragma warning disable EF1002
        await _context.Database.ExecuteSqlRawAsync(
            $@"CREATE SEQUENCE IF NOT EXISTS ""{sequenceName}"" START WITH 1 INCREMENT BY 1"
        );
#pragma warning restore EF1002
        workspace.ItemNumberSequenceName = sequenceName;

        var workspaceItem = new WorkspaceItem
        {
            WorkspaceId = workspace.Id,
            ItemNumber = 1,
            Code = "1",
            Subject = bodyData.Value.FileName,
            Body = bodyData.Value.Body,
            RawBody = bodyData.Value.RawBody,
            OwnerId = user1.Id,
            AssigneeId = user2.Id,
            Priority = TaskPriority.Medium,
            DueDate = DateTime.UtcNow.AddDays(30),
            IsArchived = false,
            IsDraft = false,
            CommitterId = adminUser.Id,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.WorkspaceItems.AddAsync(workspaceItem);
        await _context.SaveChangesAsync();

#pragma warning disable EF1002
        await _context.Database.ExecuteSqlRawAsync(
            $@"SELECT setval('""{sequenceName}""', 1, true)"
        );
#pragma warning restore EF1002

        _logger.LogInformation("Created sample project item '{Subject}' in '{WorkspaceName}'", workspaceItem.Subject, workspace.Name);

        await CreateSampleProjectTasksAsync(workspaceItem, workspace, user2, users);
    }

    /// <summary>
    /// サンプルプロジェクトのアイテムにタスクを作成
    /// フェーズごとに異なる進捗状態を持たせてシナリオ性を高める
    /// </summary>
    private async Task CreateSampleProjectTasksAsync(WorkspaceItem item, Workspace workspace, User assignee, List<User> users)
    {
        var taskTypes = await _context.TaskTypes.Where(t => t.IsActive).ToListAsync();
        if (!taskTypes.Any())
        {
            _logger.LogWarning("No task types found for sample project tasks");
            return;
        }

        var adminUser = users.FirstOrDefault(u => _options.Users.Any(o => o.Role == "Admin" && o.Email == u.Email));
        if (adminUser == null)
        {
            _logger.LogWarning("Admin user not found for creating sample project tasks");
            return;
        }

        // タスクのフェーズ定義（シナリオ性を持たせる）
        var taskPhases = GetTaskPhaseScenarios();
        var tasks = new List<WorkspaceTask>();

        for (int i = 0; i < taskPhases.Count; i++)
        {
            var phase = taskPhases[i];
            var taskType = taskTypes.FirstOrDefault(t => t.Name == phase.TaskTypeName) ?? taskTypes[0];

            var task = new WorkspaceTask
            {
                WorkspaceItemId = item.Id,
                WorkspaceId = workspace.Id,
                OrganizationId = workspace.OrganizationId,
                Sequence = i + 1,
                AssignedUserId = assignee.Id,
                CreatedByUserId = adminUser.Id,
                Content = phase.Content,
                TaskTypeId = taskType.Id,
                Priority = phase.Priority,
                StartDate = DateTimeOffset.UtcNow.AddDays(phase.StartDaysOffset),
                DueDate = DateTimeOffset.UtcNow.AddDays(phase.DueDaysOffset),
                EstimatedHours = phase.EstimatedHours,
                ActualHours = phase.ActualHours,
                ProgressPercentage = phase.ProgressPercentage,
                IsCompleted = phase.IsCompleted,
                CompletedAt = phase.IsCompleted ? DateTimeOffset.UtcNow.AddDays(phase.CompletedDaysOffset) : null,
                IsDiscarded = false,
                DiscardedAt = null,
                DiscardReason = null,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(phase.CreatedDaysOffset),
                UpdatedAt = DateTimeOffset.UtcNow
            };

            tasks.Add(task);
        }

        await _context.WorkspaceTasks.AddRangeAsync(tasks);
        await _context.SaveChangesAsync();

        // 先行タスクIDを設定（保存後にIDが確定するため）
        var hasUpdates = false;
        for (int i = 0; i < tasks.Count && i < taskPhases.Count; i++)
        {
            var predecessorIndex = taskPhases[i].PredecessorIndex;
            if (predecessorIndex.HasValue && predecessorIndex.Value >= 0 && predecessorIndex.Value < tasks.Count)
            {
                tasks[i].PredecessorTaskId = tasks[predecessorIndex.Value].Id;
                hasUpdates = true;
            }
        }

        if (hasUpdates)
        {
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Created {Count} tasks for sample project item", tasks.Count);

        await CreateSampleProjectTaskCommentsAsync(tasks, users, taskPhases);
    }

    /// <summary>
    /// タスクのフェーズシナリオを取得
    /// </summary>
    private static List<TaskPhaseScenario> GetTaskPhaseScenarios()
    {
        return new List<TaskPhaseScenario>
        {
            // フェーズ1: 完了済み（3日前に完了）- 先行タスクなし
            new()
            {
                Content = "要件定義書のドラフト作成",
                TaskTypeName = "作業",
                Priority = TaskPriority.High,
                StartDaysOffset = -10,
                DueDaysOffset = -3,
                CreatedDaysOffset = -10,
                CompletedDaysOffset = -3,
                EstimatedHours = 8,
                ActualHours = 6,
                ProgressPercentage = 100,
                IsCompleted = true,
                PredecessorIndex = null, // 先行タスクなし
                Comments = new List<(string Content, TaskCommentType Type, int MinutesOffset)>
                {
                    ("ドラフト完成しました。レビューをお願いします。", TaskCommentType.NeedReply, -4320), // 3日前
                    ("確認しました。いくつか修正点をコメントしています。", TaskCommentType.Normal, -4200),
                    ("修正完了しました！", TaskCommentType.Normal, -4140),
                    ("LGTM👍 完了にします。", TaskCommentType.Normal, -4080),
                }
            },
            // フェーズ2: レビュー中（80%完了）- 要件定義が先行
            new()
            {
                Content = "画面設計書の作成",
                TaskTypeName = "作業",
                Priority = TaskPriority.High,
                StartDaysOffset = -5,
                DueDaysOffset = 2,
                CreatedDaysOffset = -5,
                CompletedDaysOffset = 0,
                EstimatedHours = 16,
                ActualHours = 12,
                ProgressPercentage = 80,
                IsCompleted = false,
                PredecessorIndex = 0, // 要件定義書が先行
                Comments = new List<(string Content, TaskCommentType Type, int MinutesOffset)>
                {
                    ("画面設計の方針について相談させてください。", TaskCommentType.HelpWanted, -2880), // 2日前
                    ("モバイルファーストで進めましょう。参考資料を共有します。", TaskCommentType.Normal, -2820),
                    ("承知しました。進めます！", TaskCommentType.Normal, -2760),
                    ("8割完成しました。レビューお願いできますか？", TaskCommentType.NeedReply, -60),
                }
            },
            // フェーズ3: 作業中（30%進行）- 画面設計が先行
            new()
            {
                Content = "APIエンドポイントの実装",
                TaskTypeName = "開発",
                Priority = TaskPriority.Medium,
                StartDaysOffset = -2,
                DueDaysOffset = 5,
                CreatedDaysOffset = -3,
                CompletedDaysOffset = 0,
                EstimatedHours = 24,
                ActualHours = 8,
                ProgressPercentage = 30,
                IsCompleted = false,
                PredecessorIndex = 1, // 画面設計書が先行
                Comments = new List<(string Content, TaskCommentType Type, int MinutesOffset)>
                {
                    ("認証周りの実装で少し詰まっています…", TaskCommentType.HelpWanted, -1440), // 1日前
                    ("JWTの検証部分ですか？サンプルコード送りますね。", TaskCommentType.Normal, -1380),
                    ("ありがとうございます！参考にして進めます。", TaskCommentType.Normal, -1320),
                    ("進捗30%です。予定通り進んでいます。", TaskCommentType.Memo, -120),
                }
            },
            // フェーズ4: 未着手（これから開始）- API実装が先行
            new()
            {
                Content = "結合テストの実施",
                TaskTypeName = "検証",
                Priority = TaskPriority.Medium,
                StartDaysOffset = 5,
                DueDaysOffset = 10,
                CreatedDaysOffset = -3,
                CompletedDaysOffset = 0,
                EstimatedHours = 16,
                ActualHours = null,
                ProgressPercentage = 0,
                IsCompleted = false,
                PredecessorIndex = 2, // API実装が先行
                Comments = new List<(string Content, TaskCommentType Type, int MinutesOffset)>
                {
                    ("テスト環境の準備をお願いします。", TaskCommentType.NeedReply, -2880),
                    ("来週月曜に準備完了予定です。", TaskCommentType.Normal, -2820),
                    ("了解です！それまでにテストケースを準備しておきます。", TaskCommentType.Normal, -2760),
                }
            },
            // フェーズ5: 期限超過（注意喚起）- 独立タスク（並行作業）
            new()
            {
                Content = "ドキュメント更新",
                TaskTypeName = "作業",
                Priority = TaskPriority.Low,
                StartDaysOffset = -7,
                DueDaysOffset = -1, // 昨日が期限
                CreatedDaysOffset = -7,
                CompletedDaysOffset = 0,
                EstimatedHours = 4,
                ActualHours = 2,
                ProgressPercentage = 50,
                IsCompleted = false,
                PredecessorIndex = null, // 独立タスク（並行作業可能）
                Comments = new List<(string Content, TaskCommentType Type, int MinutesOffset)>
                {
                    ("ドキュメント更新、半分完了しました。", TaskCommentType.Memo, -2880),
                    ("期限が近づいています。進捗いかがですか？", TaskCommentType.Reminder, -1440),
                    ("すみません、他のタスクに追われていました。今日中に完了させます。", TaskCommentType.Normal, -1380),
                    ("本日期限です。対応をお願いします！", TaskCommentType.Urge, -60),
                }
            },
        };
    }

    /// <summary>
    /// タスクフェーズのシナリオ定義
    /// </summary>
    private class TaskPhaseScenario
    {
        public string Content { get; set; } = string.Empty;
        public string TaskTypeName { get; set; } = "作業";
        public TaskPriority? Priority { get; set; }
        public int StartDaysOffset { get; set; }
        public int DueDaysOffset { get; set; }
        public int CreatedDaysOffset { get; set; }
        public int CompletedDaysOffset { get; set; }
        public decimal EstimatedHours { get; set; }
        public decimal? ActualHours { get; set; }
        public int ProgressPercentage { get; set; }
        public bool IsCompleted { get; set; }
        /// <summary>
        /// 先行タスクのインデックス（0始まり、nullは先行タスクなし）
        /// </summary>
        public int? PredecessorIndex { get; set; }
        public List<(string Content, TaskCommentType Type, int MinutesOffset)> Comments { get; set; } = new();
    }

    /// <summary>
    /// サンプルプロジェクトのタスクにコメントを作成
    /// フェーズシナリオに基づいた会話形式のコメントを生成
    /// </summary>
    private async Task CreateSampleProjectTaskCommentsAsync(
        List<WorkspaceTask> tasks,
        List<User> users,
        List<TaskPhaseScenario> taskPhases)
    {
        var comments = new List<TaskComment>();

        var adminUser = users.FirstOrDefault(u => _options.Users.Any(o => o.Role == "Admin" && o.Email == u.Email));
        var memberUsers = users.Where(u => u.Id != adminUser?.Id).ToList();

        for (int taskIndex = 0; taskIndex < tasks.Count && taskIndex < taskPhases.Count; taskIndex++)
        {
            var task = tasks[taskIndex];
            var phase = taskPhases[taskIndex];

            // シナリオに基づいたコメントを作成
            for (int i = 0; i < phase.Comments.Count; i++)
            {
                var (content, commentType, minutesOffset) = phase.Comments[i];

                // 会話形式: 偶数番目はメンバー、奇数番目は管理者（または交互）
                User commentUser;
                if (i % 2 == 0)
                {
                    commentUser = memberUsers.Any() ? memberUsers[taskIndex % memberUsers.Count] : users[0];
                }
                else
                {
                    commentUser = adminUser ?? users[0];
                }

                var comment = new TaskComment
                {
                    WorkspaceTaskId = task.Id,
                    UserId = commentUser.Id,
                    Content = content,
                    CommentType = commentType,
                    CreatedAt = DateTimeOffset.UtcNow.AddMinutes(minutesOffset),
                    UpdatedAt = DateTimeOffset.UtcNow,
                    IsDeleted = false
                };

                comments.Add(comment);
            }
        }

        await _context.TaskComments.AddRangeAsync(comments);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created {Count} task comments for sample project tasks", comments.Count);
    }

    /// <summary>
    /// ドキュメントプロジェクトワークスペースにアイテムを作成
    /// </summary>
    private async Task CreateSampleDocumentItemAsync(Workspace workspace, List<User> users)
    {
        var userOptions = _options.Users.Where(u => u.Role != "Admin").ToList();
        if (userOptions.Count < 2)
        {
            _logger.LogWarning("Not enough non-admin users for sample project item");
            return;
        }

        var user1 = users.FirstOrDefault(u => u.Email == userOptions[0].Email);
        var user2 = users.FirstOrDefault(u => u.Email == userOptions[1].Email);
        var adminUser = users.FirstOrDefault(u => _options.Users.Any(o => o.Role == "Admin" && o.Email == u.Email));

        if (user1 == null || user2 == null || adminUser == null)
        {
            _logger.LogWarning("Required users not found for sample document item");
            return;
        }

        var bodyDataList = await _commonAtoms.LoadMarkdownFilesAsLexicalJsonAsync();
        if (bodyDataList.Count == 0)
        {
            _logger.LogWarning("No markdown files found for sample document item");
            return;
        }

        var sequenceName = $"workspace_{workspace.Id}_item_seq";
#pragma warning disable EF1002
        await _context.Database.ExecuteSqlRawAsync(
            $@"CREATE SEQUENCE IF NOT EXISTS ""{sequenceName}"" START WITH 1 INCREMENT BY 1"
        );
#pragma warning restore EF1002
        workspace.ItemNumberSequenceName = sequenceName;

        var workspaceItems = new List<WorkspaceItem>();
        for (var i = 0; i < bodyDataList.Count; i++)
        {
            var bodyData = bodyDataList[i];
            var itemNumber = i + 1;
            var workspaceItem = new WorkspaceItem
            {
                WorkspaceId = workspace.Id,
                ItemNumber = itemNumber,
                Code = itemNumber.ToString(),
                Subject = bodyData.FileName,
                Body = bodyData.Body,
                RawBody = bodyData.RawBody,
                OwnerId = user1.Id,
                AssigneeId = user2.Id,
                Priority = TaskPriority.Medium,
                DueDate = DateTime.UtcNow.AddDays(30),
                IsArchived = false,
                IsDraft = false,
                CommitterId = adminUser.Id,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            workspaceItems.Add(workspaceItem);
        }

        await _context.WorkspaceItems.AddRangeAsync(workspaceItems);
        await _context.SaveChangesAsync();

#pragma warning disable EF1002
        await _context.Database.ExecuteSqlRawAsync(
            $@"SELECT setval('""{sequenceName}""', {bodyDataList.Count}, true)"
        );
#pragma warning restore EF1002

        _logger.LogInformation("Created {Count} sample document items in '{WorkspaceName}'", workspaceItems.Count, workspace.Name);
    }

    /// <summary>
    /// デモDMルームにシナリオ性のあるメッセージを作成
    /// </summary>
    private List<ChatMessage> CreateDemoDmMessages(
        List<ChatRoom> chatRooms,
        List<User> users,
        List<ChatActor> chatActors)
    {
        var messages = new List<ChatMessage>();

        var adminUserOption = _options.Users.FirstOrDefault(u => u.Role == "Admin");
        if (adminUserOption == null) return messages;

        var adminUser = users.First(u => u.Email == adminUserOption.Email);
        var adminActor = chatActors.FirstOrDefault(a => a.UserId == adminUser.Id);
        if (adminActor == null) return messages;

        var operatorUsers = users.Where(u => u.Email != adminUser.Email).ToList();
        var dmRooms = chatRooms.Where(r => r.Type == ChatRoomType.Dm).ToList();

        // 各オペレーターとの会話シナリオを作成
        var conversationScenarios = GetDmConversationScenarios();
        var scenarioIndex = 0;

        foreach (var operatorUser in operatorUsers)
        {
            var operatorActor = chatActors.FirstOrDefault(a => a.UserId == operatorUser.Id);
            if (operatorActor == null) continue;

            // このユーザーとのDMルームを探す
            var dmRoom = dmRooms.FirstOrDefault(r =>
                r.DmUserPair != null &&
                r.DmUserPair.Split('_').Select(long.Parse).Contains(adminUser.Id) &&
                r.DmUserPair.Split('_').Select(long.Parse).Contains(operatorUser.Id));

            if (dmRoom == null) continue;

            // シナリオを取得（ローテーション）
            var scenario = conversationScenarios[scenarioIndex % conversationScenarios.Count];
            scenarioIndex++;

            // 会話を時系列で作成（3日前から開始）
            var baseTime = DateTimeOffset.UtcNow.AddDays(-3);

            foreach (var (isAdmin, messageText, minutesOffset) in scenario)
            {
                var senderActor = isAdmin ? adminActor : operatorActor;
                var message = new ChatMessage
                {
                    ChatRoomId = dmRoom.Id,
                    SenderActorId = senderActor.Id,
                    MessageType = ChatMessageType.Text,
                    Content = messageText,
                    CreatedAt = baseTime.AddMinutes(minutesOffset)
                };
                messages.Add(message);
            }
        }

        _logger.LogInformation("Created {Count} DM messages for demo", messages.Count);
        return messages;
    }

    /// <summary>
    /// DMの会話シナリオを取得
    /// </summary>
    private static List<List<(bool IsAdmin, string Message, int MinutesOffset)>> GetDmConversationScenarios()
    {
        return new List<List<(bool, string, int)>>
        {
            // シナリオ1: 新人オンボーディング
            new()
            {
                (true, "こんにちは！チームへようこそ🎉 何か困ったことがあればいつでも聞いてくださいね。", 0),
                (false, "ありがとうございます！早速ですが、プロジェクトの進め方について質問があります。", 15),
                (true, "もちろん！何でも聞いてください。", 18),
                (false, "タスクの優先度はどうやって決めればいいですか？", 20),
                (true, "基本的には期限が近いものから対応してください。緊急度が高いものには🔴マークをつけているので、それを目安にしてもらえると助かります。", 25),
                (false, "なるほど、わかりました！ありがとうございます😊", 30),
                (true, "何かあればいつでも声かけてね👍", 32),
            },
            // シナリオ2: 作業相談
            new()
            {
                (false, "お疲れさまです。今対応中のドキュメント作成の件でご相談があります。", 0),
                (true, "お疲れさま！どうしました？", 5),
                (false, "構成案を作ったのですが、一度レビューいただけますか？", 8),
                (true, "もちろん！ワークスペースにアップロードしてもらえれば確認するよ。", 12),
                (false, "承知しました。今日中にアップします！", 15),
                (true, "👌了解！", 16),
                (false, "アップしました！お手すきの時に確認お願いします。", 180),
                (true, "確認しました！全体的にいい構成だと思います。1点だけコメント入れたので見てみてください。", 240),
                (false, "ありがとうございます！修正して再度アップしますね。", 245),
            },
            // シナリオ3: 進捗確認
            new()
            {
                (true, "今週の進捗はどうですか？", 0),
                (false, "順調に進んでいます！予定通り金曜日には完了できそうです。", 30),
                (true, "よかった！何か詰まっているところはない？", 35),
                (false, "大丈夫です。ただ、来週のミーティングについて確認したいことが…", 40),
                (true, "何でしょう？", 42),
                (false, "水曜の14時からで大丈夫ですか？", 45),
                (true, "OK！カレンダーに入れておくね。", 48),
                (false, "ありがとうございます🙏", 50),
            },
        };
    }

}