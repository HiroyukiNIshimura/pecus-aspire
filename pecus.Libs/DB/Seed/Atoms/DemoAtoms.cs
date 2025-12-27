using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
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

    /// <summary>
    /// Constructor
    /// </summary>
    /// <param name="context"></param>
    /// <param name="logger"></param>
    /// <param name="options"></param>
    /// <param name="commonAtoms"></param>
    public DemoAtoms(
        ApplicationDbContext context,
        ILogger<DemoAtoms> logger,
        IOptions<DemoModeOptions> options,
        CommonAtoms commonAtoms)
    {
        _context = context;
        _logger = logger;
        _options = options.Value;
        _commonAtoms = commonAtoms;
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
        var existingOrg = await _context.Organizations.FirstOrDefaultAsync(o => o.Code == _options.Organization.Code);
        if (existingOrg != null)
        {
            _logger.LogInformation("Demo organization already exists, updating bots if needed...");
            await UpdateDemoBotsAsync(existingOrg);
            return existingOrg.Id;
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

            var chatActors = CreateDemoChatActors(organization, users, chatBot);
            await _context.ChatActors.AddRangeAsync(chatActors);
            await _context.SaveChangesAsync();

            var chatRooms = CreateDemoChatRooms(organization, users, chatActors);
            await _context.ChatRooms.AddRangeAsync(chatRooms);
            await _context.SaveChangesAsync();

            var chatRoomMembers = CreateChatRoomMembers(chatRooms, users, chatActors);
            await _context.ChatRoomMembers.AddRangeAsync(chatRoomMembers);
            await _context.SaveChangesAsync();

            var workspaces = await CreateDemoWorkspacesAsync(organization, users);
            await _context.Workspaces.AddRangeAsync(workspaces);
            await _context.SaveChangesAsync();

            var workspaceUsers = CreateDemoWorkspaceUsers(workspaces, users);
            await _context.WorkspaceUsers.AddRangeAsync(workspaceUsers);
            await _context.SaveChangesAsync();

            var (workspaceChatRooms, workspaceChatRoomMembers) = CreateWorkspaceGroupChatRooms(organization, workspaces, users, chatActors);
            await _context.ChatRooms.AddRangeAsync(workspaceChatRooms);
            await _context.SaveChangesAsync();

            await _context.ChatRoomMembers.AddRangeAsync(workspaceChatRoomMembers);
            await _context.SaveChangesAsync();

            var hintWorkspace = workspaces.FirstOrDefault(w => w.Name == "Coatiのヒント");
            if (hintWorkspace != null)
            {
                var adminUser = users.FirstOrDefault(u => _options.Users.Any(o => o.Role == "Admin" && o.Email == u.Email));
                await CreateDemoWorkspaceItemsAsync(hintWorkspace, adminUser);
            }

            var sampleProjectWorkspace = workspaces.FirstOrDefault(w => w.Name == "サンプルプロジェクト");
            if (sampleProjectWorkspace != null)
            {
                await CreateSampleProjectItemAsync(sampleProjectWorkspace, users);
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

    private async Task UpdateDemoBotsAsync(Organization org)
    {
        var systemBotPersona = BotPersonaHelper.GetSystemBotPersona();
        var systemBotConstraint = BotPersonaHelper.GetSystemBotConstraint();
        var chatBotPersona = BotPersonaHelper.GetChatBotPersona();
        var chatBotConstraint = BotPersonaHelper.GetChatBotConstraint();

        var existingSystemBot = await _context.Bots
            .FirstOrDefaultAsync(b => b.OrganizationId == org.Id && b.Type == BotType.SystemBot);
        var existingChatBot = await _context.Bots
            .FirstOrDefaultAsync(b => b.OrganizationId == org.Id && b.Type == BotType.ChatBot);

        var updated = false;

        if (existingSystemBot != null)
        {
            existingSystemBot.Persona = systemBotPersona;
            existingSystemBot.Constraint = systemBotConstraint;
            existingSystemBot.UpdatedAt = DateTimeOffset.UtcNow;
            updated = true;
            _logger.LogInformation("Demo SystemBot Persona/Constraint updated: {Name}", existingSystemBot.Name);
        }

        if (existingChatBot != null)
        {
            existingChatBot.Persona = chatBotPersona;
            existingChatBot.Constraint = chatBotConstraint;
            existingChatBot.UpdatedAt = DateTimeOffset.UtcNow;
            updated = true;
            _logger.LogInformation("Demo ChatBot Persona/Constraint updated: {Name}", existingChatBot.Name);
        }

        if (updated)
        {
            await _context.SaveChangesAsync();
        }
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
            GenerativeApiVendor = GenerativeApiVendor.DeepSeek,
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

    private List<ChatActor> CreateDemoChatActors(Organization org, List<User> users, Bot chatBot)
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

        var botActor = new ChatActor
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
        chatActors.Add(botActor);

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

        var hintWorkspace = new Workspace
        {
            Name = "Coatiのヒント",
            Code = CodeGenerator.GenerateWorkspaceCode(),
            Description = manualDescriptions.Length > 0 ? manualDescriptions[0] : "Coatiの使い方を説明するワークスペースです。",
            OrganizationId = org.Id,
            GenreId = manualGenre?.Id,
            Mode = WorkspaceMode.Document,
            OwnerId = user1.Id,
            CreatedByUserId = user1.Id,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        workspaces.Add(hintWorkspace);

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

    private (List<ChatRoom> ChatRooms, List<ChatRoomMember> Members) CreateWorkspaceGroupChatRooms(
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

        _context.ChatRooms.AddRange(chatRooms);
        _context.SaveChanges();

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

        return (chatRooms, chatRoomMembers);
    }

    private async Task CreateDemoWorkspaceItemsAsync(Workspace workspace, User? adminUser)
    {
        if (adminUser == null)
        {
            _logger.LogWarning("Admin user not found for creating demo workspace items");
            return;
        }

        var bodyDataList = await _commonAtoms.LoadMarkdownFilesAsLexicalJsonAsync();
        if (bodyDataList.Count == 0)
        {
            _logger.LogWarning("No markdown files found for seeding demo workspace items");
            return;
        }

        var sequenceName = $"workspace_{workspace.Id}_item_seq";
#pragma warning disable EF1002
        await _context.Database.ExecuteSqlRawAsync(
            $@"CREATE SEQUENCE IF NOT EXISTS ""{sequenceName}"" START WITH 1 INCREMENT BY 1"
        );
#pragma warning restore EF1002
        workspace.ItemNumberSequenceName = sequenceName;

        var items = new List<WorkspaceItem>();
        var itemNumber = 0;

        foreach (var bodyData in bodyDataList)
        {
            itemNumber++;

            var workspaceItem = new WorkspaceItem
            {
                WorkspaceId = workspace.Id,
                ItemNumber = itemNumber,
                Code = itemNumber.ToString(),
                Subject = bodyData.FileName,
                Body = bodyData.Body,
                RawBody = bodyData.RawBody,
                OwnerId = adminUser.Id,
                AssigneeId = null,
                Priority = null,
                DueDate = null,
                IsArchived = false,
                IsDraft = false,
                CommitterId = null,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            items.Add(workspaceItem);
        }

        await _context.WorkspaceItems.AddRangeAsync(items);
        await _context.SaveChangesAsync();

        if (itemNumber > 0)
        {
#pragma warning disable EF1002
            await _context.Database.ExecuteSqlRawAsync(
                $@"SELECT setval('""{sequenceName}""', {itemNumber}, true)"
            );
#pragma warning restore EF1002
        }

        _logger.LogInformation("Created {Count} demo workspace items for '{WorkspaceName}'", items.Count, workspace.Name);
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

        var bodyDataList = await _commonAtoms.LoadMarkdownFilesAsLexicalJsonAsync();
        if (bodyDataList.Count == 0)
        {
            _logger.LogWarning("No markdown files found for sample project item");
            return;
        }

        var sequenceName = $"workspace_{workspace.Id}_item_seq";
#pragma warning disable EF1002
        await _context.Database.ExecuteSqlRawAsync(
            $@"CREATE SEQUENCE IF NOT EXISTS ""{sequenceName}"" START WITH 1 INCREMENT BY 1"
        );
#pragma warning restore EF1002
        workspace.ItemNumberSequenceName = sequenceName;

        var bodyData = bodyDataList[0];
        var workspaceItem = new WorkspaceItem
        {
            WorkspaceId = workspace.Id,
            ItemNumber = 1,
            Code = "1",
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

        var random = new Random();
        var taskContents = SeedConstants.TaskContents;
        var priorities = new TaskPriority?[] { TaskPriority.Low, TaskPriority.Medium, TaskPriority.High, TaskPriority.Critical };

        var tasks = new List<WorkspaceTask>();

        for (int i = 0; i < 4; i++)
        {
            var taskType = taskTypes[random.Next(taskTypes.Count)];
            var priority = priorities[random.Next(priorities.Length)];
            var content = taskContents[random.Next(taskContents.Length)];

            var task = new WorkspaceTask
            {
                WorkspaceItemId = item.Id,
                WorkspaceId = workspace.Id,
                OrganizationId = workspace.OrganizationId,
                Sequence = i + 1,
                AssignedUserId = assignee.Id,
                CreatedByUserId = adminUser.Id,
                Content = content,
                TaskTypeId = taskType.Id,
                Priority = priority,
                StartDate = DateTimeOffset.UtcNow,
                DueDate = DateTimeOffset.UtcNow.AddDays(random.Next(7, 30)),
                EstimatedHours = random.Next(1, 16),
                ActualHours = null,
                ProgressPercentage = 0,
                IsCompleted = false,
                CompletedAt = null,
                IsDiscarded = false,
                DiscardedAt = null,
                DiscardReason = null,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            tasks.Add(task);
        }

        await _context.WorkspaceTasks.AddRangeAsync(tasks);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created {Count} tasks for sample project item", tasks.Count);

        await CreateSampleProjectTaskCommentsAsync(tasks, users);
    }

    /// <summary>
    /// サンプルプロジェクトのタスクにコメントを作成
    /// </summary>
    private async Task CreateSampleProjectTaskCommentsAsync(List<WorkspaceTask> tasks, List<User> users)
    {
        var random = new Random();
        var normalComments = SeedConstants.NormalComments;
        var commentTypes = Enum.GetValues<TaskCommentType>();

        var comments = new List<TaskComment>();

        foreach (var task in tasks)
        {
            for (int i = 0; i < 4; i++)
            {
                var commentUser = users[random.Next(users.Count)];
                var commentType = commentTypes[random.Next(commentTypes.Length)];
                var content = normalComments[random.Next(normalComments.Length)];

                var comment = new TaskComment
                {
                    WorkspaceTaskId = task.Id,
                    UserId = commentUser.Id,
                    Content = content,
                    CommentType = commentType,
                    CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-random.Next(1, 60) * (4 - i)),
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
}
