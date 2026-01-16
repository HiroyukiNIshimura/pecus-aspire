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
/// 本番環境向けのシードデータ生成
/// </summary>
public class ProductAtoms
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductAtoms> _logger;
    private readonly BackOfficeOptions _options;

    /// <summary>
    ///  Constructor
    /// </summary>
    /// <param name="context"></param>
    /// <param name="logger"></param>
    /// <param name="options"></param>
    public ProductAtoms(
        ApplicationDbContext context,
        ILogger<ProductAtoms> logger,
        IOptions<BackOfficeOptions> options)
    {
        _context = context;
        _logger = logger;
        _options = options.Value;
    }

    /// <summary>
    /// 本番環境用のデータを投入
    /// </summary>
    /// <returns>作成されたBackOffice組織のID</returns>
    public async Task<long> SeedProductAsync()
    {
        _logger.LogInformation("Seeding production data...");

        await SeedPermissionsAsync();
        await SeedRolesAsync();
        await SeedGenresAsync();
        await SeedTaskTypesAsync();
        await SeedAchievementMastersAsync();

        var backOfficeOrgId = await SeedBackOfficeDataAsync();

        _logger.LogInformation("Production data seeding completed");
        return backOfficeOrgId;
    }

    /// <summary>
    /// BackOffice関連のデータを1つのトランザクションで投入
    /// </summary>
    /// <returns>作成または取得されたBackOffice組織のID</returns>
    private async Task<long> SeedBackOfficeDataAsync()
    {
        var existingOrg = await _context.Organizations.FirstOrDefaultAsync(o => o.Code == _options.Organization.Code);
        if (existingOrg != null)
        {
            _logger.LogInformation("BackOffice organization already exists.");
            return existingOrg.Id;
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _logger.LogInformation("Creating BackOffice organization and related data...");

            var organization = CreateBackOfficeOrganization();
            await _context.Organizations.AddAsync(organization);
            await _context.SaveChangesAsync();

            var settings = CreateBackOfficeOrganizationSettings(organization);
            await _context.OrganizationSettings.AddAsync(settings);

            var backOfficeRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == SystemRole.BackOffice);
            if (backOfficeRole == null)
            {
                _logger.LogWarning("Required roles not found. Rolling back transaction.");
                await transaction.RollbackAsync();
                throw new InvalidOperationException("Required role (BackOffice) not found.");
            }

            var (systemBot, chatBot) = CreateBackOfficeBots(organization);
            await _context.Bots.AddRangeAsync(new[] { systemBot, chatBot });
            await _context.SaveChangesAsync();

            var users = CreateBackOfficeUsers(organization, backOfficeRole);
            await _context.Users.AddRangeAsync(users);
            await _context.SaveChangesAsync();

            var chatActors = CreateBackOfficeChatActors(organization, users, systemBot, chatBot);
            await _context.ChatActors.AddRangeAsync(chatActors);
            await _context.SaveChangesAsync();

            var aiChatRooms = CreateBackOfficeAiChatRooms(organization, users);
            await _context.ChatRooms.AddRangeAsync(aiChatRooms);
            await _context.SaveChangesAsync();

            var chatRoomMembers = CreateAiChatRoomMembers(aiChatRooms, chatActors, chatBot);
            await _context.ChatRoomMembers.AddRangeAsync(chatRoomMembers);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            _logger.LogInformation("BackOffice data seeding completed successfully");
            return organization.Id;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Failed to seed BackOffice data. Transaction rolled back.");
            throw;
        }
    }

    private Organization CreateBackOfficeOrganization()
    {
        return new Organization
        {
            Name = _options.Organization.Name,
            Code = _options.Organization.Code,
            PhoneNumber = _options.Organization.PhoneNumber,
            Email = _options.Organization.Email,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private OrganizationSetting CreateBackOfficeOrganizationSettings(Organization org)
    {
        return new OrganizationSetting
        {
            OrganizationId = org.Id,
            TaskOverdueThreshold = 0,
            WeeklyReportDeliveryDay = 0,
            MailFromAddress = org.Email,
            MailFromName = org.Name,
            GenerativeApiVendor = GenerativeApiVendor.None,
            Plan = OrganizationPlan.Enterprise,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    private (Bot SystemBot, Bot ChatBot) CreateBackOfficeBots(Organization org)
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


    private List<User> CreateBackOfficeUsers(Organization org, Role backOfficeRole)
    {
        var users = new List<User>();
        foreach (var userOption in _options.Users)
        {
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
            user.Roles.Add(backOfficeRole);
            users.Add(user);
        }

        return users;
    }

    private List<ChatActor> CreateBackOfficeChatActors(Organization org, List<User> users, Bot systemBot, Bot chatBot)
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

    private List<ChatRoom> CreateBackOfficeAiChatRooms(
        Organization org,
        List<User> users)
    {
        var rooms = new List<ChatRoom>();

        foreach (var user in users)
        {
            var room = new ChatRoom
            {
                OrganizationId = org.Id,
                WorkspaceId = null,
                Type = ChatRoomType.Ai,
                Name = $"{user.Username}のAIチャット",
                CreatedByUserId = user.Id,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            rooms.Add(room);
        }

        return rooms;
    }

    private List<ChatRoomMember> CreateAiChatRoomMembers(
        List<ChatRoom> rooms,
        List<ChatActor> chatActors,
        Bot chatBot)
    {
        var members = new List<ChatRoomMember>();
        var chatBotActor = chatActors.First(a => a.BotId == chatBot.Id);

        foreach (var room in rooms)
        {
            if (room.Type != ChatRoomType.Ai) continue;

            var userActor = chatActors.FirstOrDefault(a => a.UserId == room.CreatedByUserId);
            if (userActor == null) continue;

            members.Add(new ChatRoomMember
            {
                ChatRoomId = room.Id,
                ChatActorId = userActor.Id,
                Role = ChatRoomRole.Owner,
                JoinedAt = DateTimeOffset.UtcNow
            });

            members.Add(new ChatRoomMember
            {
                ChatRoomId = room.Id,
                ChatActorId = chatBotActor.Id,
                Role = ChatRoomRole.Member,
                JoinedAt = DateTimeOffset.UtcNow
            });
        }

        return members;
    }


    /// <summary>
    /// 権限のシードデータを投入
    /// </summary>
    private async Task SeedPermissionsAsync()
    {
        var permissions = new[]
        {
            new Permission
            {
                Name = "User.Read",
                Description = "ユーザー情報の閲覧",
                Category = "User",
            },
            new Permission
            {
                Name = "User.Write",
                Description = "ユーザー情報の編集",
                Category = "User",
            },
            new Permission
            {
                Name = "User.Delete",
                Description = "ユーザーの削除",
                Category = "User",
            },
            new Permission
            {
                Name = "Role.Read",
                Description = "ロール情報の閲覧",
                Category = "Role",
            },
            new Permission
            {
                Name = "Role.Write",
                Description = "ロール情報の編集",
                Category = "Role",
            },
            new Permission
            {
                Name = "Role.Delete",
                Description = "ロールの削除",
                Category = "Role",
            },
            new Permission
            {
                Name = "Organization.Read",
                Description = "組織情報の閲覧",
                Category = "Organization",
            },
            new Permission
            {
                Name = "Organization.Write",
                Description = "組織情報の編集",
                Category = "Organization",
            },
            new Permission
            {
                Name = "Organization.Delete",
                Description = "組織の削除",
                Category = "Organization",
            },
            new Permission
            {
                Name = "Workspace.Read",
                Description = "ワークスペース情報の閲覧",
                Category = "Workspace",
            },
            new Permission
            {
                Name = "Workspace.Write",
                Description = "ワークスペース情報の編集",
                Category = "Workspace",
            },
            new Permission
            {
                Name = "Workspace.Delete",
                Description = "ワークスペースの削除",
                Category = "Workspace",
            },
            new Permission
            {
                Name = "Admin.Access",
                Description = "管理者機能へのアクセス",
                Category = "Admin",
            },
        };

        var existingPermissionNames = await _context.Permissions
            .Select(p => p.Name)
            .ToHashSetAsync();

        var newPermissions = permissions
            .Where(p => !existingPermissionNames.Contains(p.Name))
            .ToList();

        if (newPermissions.Any())
        {
            _context.Permissions.AddRange(newPermissions);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} permissions", newPermissions.Count);
        }
    }

    /// <summary>
    /// ロールのシードデータを投入
    /// </summary>
    private async Task SeedRolesAsync()
    {
        var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == SystemRole.Admin);
        if (adminRole == null)
        {
            adminRole = new Role { Name = SystemRole.Admin, Description = "システム管理者" };
            _context.Roles.Add(adminRole);
            await _context.SaveChangesAsync();

            var allPermissions = await _context.Permissions.ToListAsync();
            adminRole.Permissions = allPermissions;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added role: Admin with all permissions");
        }

        var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == SystemRole.User);
        if (userRole == null)
        {
            userRole = new Role { Name = SystemRole.User, Description = "一般ユーザー" };
            _context.Roles.Add(userRole);
            await _context.SaveChangesAsync();

            var readPermissions = await _context
                .Permissions.Where(p => p.Name.EndsWith(".Read"))
                .ToListAsync();
            userRole.Permissions = readPermissions;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added role: User with read permissions");
        }

        var backendRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == SystemRole.BackOffice);
        if (backendRole == null)
        {
            backendRole = new Role { Name = SystemRole.BackOffice, Description = "バックオフィス" };
            _context.Roles.Add(backendRole);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added role: BackOffice with all permissions");
        }
    }

    /// <summary>
    /// ジャンルのシードデータを投入
    /// </summary>
    private async Task SeedGenresAsync()
    {
        var genres = new[]
        {
            new Genre
            {
                Name = "プロジェクト・開発",
                Description = "仕様書、設計書、進捗報告",
                Icon = "code",
                DisplayOrder = 1,
            },
            new Genre
            {
                Name = "企画・戦略",
                Description = "企画書、提案書、事業計画",
                Icon = "proposal",
                DisplayOrder = 2,
            },
            new Genre
            {
                Name = "営業・顧客管理",
                Description = "営業報告、商談メモ、顧客リスト",
                Icon = "sales",
                DisplayOrder = 3,
            },
            new Genre
            {
                Name = "マニュアル・手順",
                Description = "業務手順書、操作マニュアル、FAQ",
                Icon = "manual",
                DisplayOrder = 4,
            },
            new Genre
            {
                Name = "デザイン・クリエイティブ",
                Description = "デザインガイドライン、ワイヤーフレーム、広報資料",
                Icon = "design",
                DisplayOrder = 5,
            },
            new Genre
            {
                Name = "会議・打合せ",
                Description = "議事録、アジェンダ、決定事項",
                Icon = "minutes",
                DisplayOrder = 6,
            },
            new Genre
            {
                Name = "総務・人事・法務",
                Description = "稟議書、契約書、社内規定、就業規則",
                Icon = "admin",
                DisplayOrder = 7,
            },
            new Genre
            {
                Name = "経理・財務",
                Description = "予算申請書、請求書、経費精算",
                Icon = "finance",
                DisplayOrder = 8,
            },
            new Genre
            {
                Name = "ブログ",
                Description = "ブログ記事や投稿",
                Icon = "blog",
                DisplayOrder = 9,
            },
            new Genre
            {
                Name = "保守・運用",
                Description = "システムの保守や運用",
                Icon = "maintenance",
                DisplayOrder = 10,
            },
            new Genre
            {
                Name = "その他・個人メモ",
                Description = "メモ、ToDoリスト、連絡・通知文書",
                Icon = "general",
                DisplayOrder = 99,
            },
        };

        var existingGenreNames = await _context.Genres
            .Select(g => g.Name)
            .ToHashSetAsync();

        var newGenres = genres
            .Where(g => !existingGenreNames.Contains(g.Name))
            .ToList();

        if (newGenres.Any())
        {
            _context.Genres.AddRange(newGenres);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} genres", newGenres.Count);
        }
    }

    /// <summary>
    /// タスク種類のシードデータを投入
    /// </summary>
    private async Task SeedTaskTypesAsync()
    {
        var taskTypes = new[]
        {
            new TaskType
            {
                Code = "Bug",
                Name = "バグ修正",
                Description = "不具合の修正作業",
                Icon = "bug",
                DisplayOrder = 1,
            },
            new TaskType
            {
                Code = "Feature",
                Name = "新機能開発",
                Description = "新しい機能の開発作業",
                Icon = "feature",
                DisplayOrder = 2,
            },
            new TaskType
            {
                Code = "Documentation",
                Name = "ドキュメント作成・更新",
                Description = "ドキュメントの作成または更新作業",
                Icon = "documentation",
                DisplayOrder = 3,
            },
            new TaskType
            {
                Code = "Review",
                Name = "レビュー",
                Description = "コードレビューやドキュメントレビュー作業",
                Icon = "review",
                DisplayOrder = 4,
            },
            new TaskType
            {
                Code = "Testing",
                Name = "テスト",
                Description = "テスト作成・実行作業",
                Icon = "testing",
                DisplayOrder = 5,
            },
            new TaskType
            {
                Code = "Refactoring",
                Name = "リファクタリング",
                Description = "コードの改善・整理作業",
                Icon = "refactoring",
                DisplayOrder = 6,
            },
            new TaskType
            {
                Code = "Research",
                Name = "調査・研究",
                Description = "技術調査や研究作業",
                Icon = "research",
                DisplayOrder = 7,
            },
            new TaskType
            {
                Code = "Meeting",
                Name = "打ち合わせ",
                Description = "ミーティングや会議",
                Icon = "meeting",
                DisplayOrder = 8,
            },
            new TaskType
            {
                Code = "BusinessNegotiation",
                Name = "商談",
                Description = "顧客との商談や営業活動",
                Icon = "businessnegotiation",
                DisplayOrder = 9,
            },
            new TaskType
            {
                Code = "RequirementsConfirmation",
                Name = "要件確認",
                Description = "要件の確認・調整作業",
                Icon = "requirementsconfirmation",
                DisplayOrder = 10,
            },
            new TaskType
            {
                Code = "Other",
                Name = "その他",
                Description = "その他のタスク",
                Icon = "other",
                DisplayOrder = 99,
            },
        };

        var existingTaskTypeCodes = await _context.TaskTypes
            .Select(t => t.Code)
            .ToHashSetAsync();

        var newTaskTypes = taskTypes
            .Where(t => !existingTaskTypeCodes.Contains(t.Code))
            .ToList();

        if (newTaskTypes.Any())
        {
            _context.TaskTypes.AddRange(newTaskTypes);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} task types", newTaskTypes.Count);
        }
    }

    /// <summary>
    /// 実績マスタのシードデータを投入（毎回削除→再投入）
    /// </summary>
    private async Task SeedAchievementMastersAsync()
    {
        _logger.LogInformation("Seeding achievement masters (delete and re-insert)...");

        var now = DateTimeOffset.UtcNow;
        var achievements = new[]
        {
            // WorkStyle カテゴリ
            new AchievementMaster
            {
                Code = "EARLY_BIRD",
                Name = "暁の開拓者",
                NameEn = "Early Bird",
                Description = "早朝（6:00-8:00）にタスクを5件完了",
                DescriptionEn = "Complete 5 tasks in the early morning (6:00-8:00)",
                IconPath = "early_bird.webp",
                Difficulty = AchievementDifficulty.Easy,
                Category = AchievementCategory.WorkStyle,
                IsSecret = false,
                IsActive = true,
                SortOrder = 1,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "NIGHT_OWL",
                Name = "夜更かしの棟",
                NameEn = "Night Owl",
                Description = "深夜（22:00-2:00）にタスクを5件完了",
                DescriptionEn = "Complete 5 tasks late at night (22:00-2:00)",
                IconPath = "night_owl.webp",
                Difficulty = AchievementDifficulty.Easy,
                Category = AchievementCategory.WorkStyle,
                IsSecret = false,
                IsActive = true,
                SortOrder = 2,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "WEEKEND_GUARDIAN",
                Name = "週末の聖域",
                NameEn = "Weekend Guardian",
                Description = "金曜夜〜月曜朝まで完全オフ（Activity & ChatMessage が0件）",
                DescriptionEn = "Take a complete break from Friday night to Monday morning (no Activity & ChatMessage)",
                IconPath = "weekend_guardian.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.WorkStyle,
                IsSecret = false,
                IsActive = true,
                SortOrder = 3,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "VETERAN",
                Name = "古参ユーザー",
                NameEn = "Veteran",
                Description = "アカウント作成から1年経過",
                DescriptionEn = "One year since account creation",
                IconPath = "veteran.webp",
                Difficulty = AchievementDifficulty.Easy,
                Category = AchievementCategory.WorkStyle,
                IsSecret = false,
                IsActive = true,
                SortOrder = 4,
                CreatedAt = now
            },

            // Productivity カテゴリ
            new AchievementMaster
            {
                Code = "INBOX_ZERO",
                Name = "Inbox Zero",
                NameEn = "Zen Master",
                Description = "担当タスクを未完了なしの状態にする",
                DescriptionEn = "Clear all assigned tasks to zero incomplete",
                IconPath = "inbox_zero.webp",
                Difficulty = AchievementDifficulty.Easy,
                Category = AchievementCategory.Productivity,
                IsSecret = false,
                IsActive = true,
                SortOrder = 10,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "TASK_CHEF",
                Name = "タスク料理人",
                NameEn = "Task Chef",
                Description = "詳細なDescriptionやチェックリストを活用してタスクを完了",
                DescriptionEn = "Complete tasks with detailed descriptions and checklists",
                IconPath = "task_chef.webp",
                Difficulty = AchievementDifficulty.Easy,
                Category = AchievementCategory.Productivity,
                IsSecret = false,
                IsActive = true,
                SortOrder = 11,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "DEADLINE_MASTER",
                Name = "期限厳守の達人",
                NameEn = "Deadline Master",
                Description = "直近10件のタスクをすべて期限内に完了",
                DescriptionEn = "Complete the last 10 tasks within their deadlines",
                IconPath = "deadline_master.webp",
                Difficulty = AchievementDifficulty.Easy,
                Category = AchievementCategory.Productivity,
                IsSecret = false,
                IsActive = true,
                SortOrder = 12,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "ESTIMATION_WIZARD",
                Name = "見積もりの魔術師",
                NameEn = "Estimation Wizard",
                Description = "見積もり工数と実績工数の誤差が±20%以内のタスクを5件以上完了",
                DescriptionEn = "Complete 5+ tasks with estimation accuracy within ±20%",
                IconPath = "estimation_wizard.webp",
                Difficulty = AchievementDifficulty.Easy,
                Category = AchievementCategory.Productivity,
                IsSecret = false,
                IsActive = true,
                SortOrder = 13,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "SPEED_STAR",
                Name = "スピードスター",
                NameEn = "Speed Star",
                Description = "タスク作成から24時間以内に完了を5件達成",
                DescriptionEn = "Complete 5 tasks within 24 hours of creation",
                IconPath = "speed_star.webp",
                Difficulty = AchievementDifficulty.Easy,
                Category = AchievementCategory.Productivity,
                IsSecret = false,
                IsActive = true,
                SortOrder = 14,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "PRIORITY_HUNTER",
                Name = "高優先度ハンター",
                NameEn = "Priority Hunter",
                Description = "優先度Highのタスクを5件連続で完了",
                DescriptionEn = "Complete 5 high-priority tasks in a row",
                IconPath = "priority_hunter.webp",
                Difficulty = AchievementDifficulty.Easy,
                Category = AchievementCategory.Productivity,
                IsSecret = false,
                IsActive = true,
                SortOrder = 15,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "DOCUMENTER",
                Name = "ドキュメンター",
                NameEn = "Documenter",
                Description = "詳細なBody（500文字以上）を持つアイテムを作成",
                DescriptionEn = "Create an item with a detailed body (500+ characters)",
                IconPath = "documenter.webp",
                Difficulty = AchievementDifficulty.Easy,
                Category = AchievementCategory.Productivity,
                IsSecret = false,
                IsActive = true,
                SortOrder = 16,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "STREAK_MASTER",
                Name = "連続達成",
                NameEn = "Streak Master",
                Description = "7日連続でタスクを完了",
                DescriptionEn = "Complete tasks for 7 consecutive days",
                IconPath = "streak_master.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.Productivity,
                IsSecret = false,
                IsActive = true,
                SortOrder = 17,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "CENTURY",
                Name = "百人力",
                NameEn = "Century",
                Description = "累計100件のタスク完了",
                DescriptionEn = "Complete 100 tasks in total",
                IconPath = "century.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.Productivity,
                IsSecret = false,
                IsActive = true,
                SortOrder = 18,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "MULTITASKER",
                Name = "マルチタスカー",
                NameEn = "Multitasker",
                Description = "1日に3つ以上のワークスペースでタスク完了",
                DescriptionEn = "Complete tasks in 3+ workspaces in a single day",
                IconPath = "multitasker.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.Productivity,
                IsSecret = false,
                IsActive = true,
                SortOrder = 19,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "CONNECTOR",
                Name = "コネクター",
                NameEn = "Connector",
                Description = "アイテム間の関連を10件以上作成",
                DescriptionEn = "Create 10+ relations between items",
                IconPath = "connector.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.Productivity,
                IsSecret = false,
                IsActive = true,
                SortOrder = 20,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "THOUSAND_TASKS",
                Name = "千本ノック",
                NameEn = "Thousand Tasks",
                Description = "累計1000件のタスク完了",
                DescriptionEn = "Complete 1000 tasks in total",
                IconPath = "thousand_tasks.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.Productivity,
                IsSecret = false,
                IsActive = true,
                SortOrder = 21,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "PERFECT_WEEK",
                Name = "パーフェクトウィーク",
                NameEn = "Perfect Week",
                Description = "1週間で担当タスクを全て期限内完了（最低5件）",
                DescriptionEn = "Complete all assigned tasks within deadline in a week (minimum 5)",
                IconPath = "perfect_week.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.Productivity,
                IsSecret = false,
                IsActive = true,
                SortOrder = 22,
                CreatedAt = now
            },

            // AI カテゴリ
            new AchievementMaster
            {
                Code = "AI_APPRENTICE",
                Name = "AI使いの弟子",
                NameEn = "AI Apprentice",
                Description = "AIエージェントに相談・依頼を行う",
                DescriptionEn = "Consult or request assistance from the AI agent",
                IconPath = "ai_apprentice.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.AI,
                IsSecret = false,
                IsActive = true,
                SortOrder = 30,
                CreatedAt = now
            },

            // TeamPlay カテゴリ
            new AchievementMaster
            {
                Code = "BEST_SUPPORTING",
                Name = "名バイプレイヤー",
                NameEn = "Best Supporting",
                Description = "コミッターとして担当者以外のタスクを5件完了",
                DescriptionEn = "Complete 5 tasks as a committer (not the assignee)",
                IconPath = "best_supporting.webp",
                Difficulty = AchievementDifficulty.Easy,
                Category = AchievementCategory.TeamPlay,
                IsSecret = false,
                IsActive = true,
                SortOrder = 40,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "COMMENTATOR",
                Name = "コメンテーター",
                NameEn = "Commentator",
                Description = "タスクコメントで進捗報告を20件以上投稿",
                DescriptionEn = "Post 20+ progress comments on tasks",
                IconPath = "commentator.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.TeamPlay,
                IsSecret = false,
                IsActive = true,
                SortOrder = 41,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "UNSUNG_HERO",
                Name = "沈黙の守護者",
                NameEn = "Unsung Hero",
                Description = "他人のタスクのブロッカーを迅速に解消",
                DescriptionEn = "Quickly resolve blockers for others' tasks",
                IconPath = "unsung_hero.webp",
                Difficulty = AchievementDifficulty.Hard,
                Category = AchievementCategory.TeamPlay,
                IsSecret = true,
                IsActive = true,
                SortOrder = 42,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "SAVIOR",
                Name = "救世主",
                NameEn = "Savior",
                Description = "他者から引き継いだタスクを5件完了",
                DescriptionEn = "Complete 5 tasks inherited from others",
                IconPath = "savior.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.TeamPlay,
                IsSecret = false,
                IsActive = true,
                SortOrder = 43,
                CreatedAt = now
            },

            // Quality カテゴリ
            new AchievementMaster
            {
                Code = "FIRST_TRY",
                Name = "一発完了",
                NameEn = "First Try",
                Description = "差し戻しなしで完了したタスクの割合が90%以上（最低20件）",
                DescriptionEn = "Complete 90%+ tasks without rework (minimum 20)",
                IconPath = "first_try.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.Quality,
                IsSecret = false,
                IsActive = true,
                SortOrder = 50,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "LEARNER",
                Name = "学習者",
                NameEn = "Learner",
                Description = "差し戻し後に再完了したタスクを10件達成",
                DescriptionEn = "Complete 10 tasks after rework",
                IconPath = "learner.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.Quality,
                IsSecret = false,
                IsActive = true,
                SortOrder = 51,
                CreatedAt = now
            },

            // Reliability カテゴリ
            new AchievementMaster
            {
                Code = "STEADY_HAND",
                Name = "安定の担当者",
                NameEn = "Steady Hand",
                Description = "担当者変更なしで完了したタスクを20件達成",
                DescriptionEn = "Complete 20 tasks without assignee change",
                IconPath = "steady_hand.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.Reliability,
                IsSecret = false,
                IsActive = true,
                SortOrder = 60,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "PROMISE_KEEPER",
                Name = "約束の人",
                NameEn = "Promise Keeper",
                Description = "期限延長なしで10件完了",
                DescriptionEn = "Complete 10 tasks without deadline extension",
                IconPath = "promise_keeper.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.Reliability,
                IsSecret = false,
                IsActive = true,
                SortOrder = 61,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "AHEAD_OF_SCHEDULE",
                Name = "前倒しマスター",
                NameEn = "Ahead of Schedule",
                Description = "期限を短縮した後に完了を5件達成",
                DescriptionEn = "Complete 5 tasks after shortening the deadline",
                IconPath = "ahead_of_schedule.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.Reliability,
                IsSecret = false,
                IsActive = true,
                SortOrder = 62,
                CreatedAt = now
            },
            new AchievementMaster
            {
                Code = "EVIDENCE_KEEPER",
                Name = "証拠を残す人",
                NameEn = "Evidence Keeper",
                Description = "ファイル添付がある親アイテムに紐づくタスクを20件以上完了",
                DescriptionEn = "Complete 20+ tasks linked to items with file attachments",
                IconPath = "evidence_keeper.webp",
                Difficulty = AchievementDifficulty.Medium,
                Category = AchievementCategory.Reliability,
                IsSecret = false,
                IsActive = true,
                SortOrder = 63,
                CreatedAt = now
            },
        };

        var existingMasters = await _context.AchievementMasters.ToDictionaryAsync(m => m.Code);
        var addedCount = 0;
        var updatedCount = 0;

        foreach (var achievement in achievements)
        {
            if (existingMasters.TryGetValue(achievement.Code, out var existing))
            {
                // 既存レコードを更新
                existing.Name = achievement.Name;
                existing.NameEn = achievement.NameEn;
                existing.Description = achievement.Description;
                existing.DescriptionEn = achievement.DescriptionEn;
                existing.IconPath = achievement.IconPath;
                existing.Difficulty = achievement.Difficulty;
                existing.Category = achievement.Category;
                existing.IsSecret = achievement.IsSecret;
                existing.IsActive = achievement.IsActive;
                existing.SortOrder = achievement.SortOrder;
                updatedCount++;
            }
            else
            {
                // 新規追加
                await _context.AchievementMasters.AddAsync(achievement);
                addedCount++;
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Achievement masters: {Added} added, {Updated} updated", addedCount, updatedCount);
    }
}