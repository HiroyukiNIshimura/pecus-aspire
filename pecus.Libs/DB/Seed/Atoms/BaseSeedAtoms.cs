using Bogus.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Lexical;
using Pecus.Libs.Security;
using Pecus.Libs.Utils;

namespace Pecus.Libs.DB.Seed.Atoms;

/// <summary>
/// シードデータ投入の共通ロジックを提供する抽象基底クラス
/// </summary>
public abstract class BaseSeedAtoms
{
    /// <summary>
    ///
    /// </summary>
    protected readonly ApplicationDbContext _context;
    /// <summary>
    ///
    /// </summary>
    protected readonly ILogger _logger;
    /// <summary>
    ///
    /// </summary>
    protected readonly CommonAtoms _seedAtoms;
    /// <summary>
    ///
    /// </summary>
    protected readonly Random _random = new Random();
    /// <summary>
    ///
    /// </summary>
    protected readonly Bogus.Faker _faker;
    /// <summary>
    /// 除外する組織ID（BackOffice組織など）
    /// </summary>
    protected long _excludeOrganizationId;
    /// <summary>
    /// シード対象の組織IDリスト（SeedOrganizationsAsyncで設定される）
    /// </summary>
    protected List<int> _targetOrganizationIds = [];

    /// <summary>
    /// Constructor
    /// </summary>
    /// <param name="context"></param>
    /// <param name="logger"></param>
    /// <param name="seedAtoms"></param>
    protected BaseSeedAtoms(
        ApplicationDbContext context,
        ILogger logger,
        CommonAtoms seedAtoms)
    {
        _context = context;
        _logger = logger;
        _seedAtoms = seedAtoms;
        _faker = new Bogus.Faker("ja");
    }

    /// <summary>
    /// データ投入量の設定を取得（派生クラスで実装）
    /// </summary>
    protected abstract SeedDataVolume GetDataVolume();

    /// <summary>
    /// ワークスペース説明文を生成
    /// </summary>
    protected string GenerateWorkspaceDescription(string genreName)
    {
        if (SeedConstants.WorkspaceDescriptionsByGenre.TryGetValue(genreName, out var descriptions))
        {
            return descriptions[_random.Next(descriptions.Length)];
        }
        return "チームでの情報共有とドキュメント管理を行うワークスペースです。";
    }

    /// <summary>
    /// バッチ処理で一括保存を実行
    /// </summary>
    protected async Task<int> ExecuteBatchInsertAsync<T>(
        List<T> items,
        int batchSize,
        string itemTypeName) where T : class
    {
        int totalAdded = 0;
        var autoDetectChanges = _context.ChangeTracker.AutoDetectChangesEnabled;

        try
        {
            _context.ChangeTracker.AutoDetectChangesEnabled = false;

            for (int i = 0; i < items.Count; i += batchSize)
            {
                var batch = items.Skip(i).Take(batchSize).ToList();
                _context.Set<T>().AddRange(batch);
                await _context.SaveChangesAsync();
                totalAdded += batch.Count;
                _logger.LogInformation("Added {Count} {Type}", totalAdded, itemTypeName);
            }
        }
        finally
        {
            _context.ChangeTracker.AutoDetectChangesEnabled = autoDetectChanges;
        }

        return totalAdded;
    }

    /// <summary>
    /// 組織ごとのユーザーマッピングを取得
    /// </summary>
    protected async Task<Dictionary<int, List<int>>> GetUsersByOrganizationAsync()
    {
        return await _context.Users
            .Where(u => u.OrganizationId != null)
            .GroupBy(u => u.OrganizationId!.Value)
            .ToDictionaryAsync(g => g.Key, g => g.Select(u => u.Id).ToList());
    }

    /// <summary>
    /// ワークスペースごとのメンバーマッピングを取得
    /// </summary>
    protected async Task<Dictionary<int, List<int>>> GetMembersByWorkspaceAsync()
    {
        return await _context.WorkspaceUsers
            .GroupBy(wu => wu.WorkspaceId)
            .ToDictionaryAsync(g => g.Key, g => g.Select(wu => wu.UserId).ToList());
    }

    /// <summary>
    /// タグのシードデータを投入
    /// </summary>
    public async Task SeedTagsAsync()
    {
        var organizations = await _context.Organizations.ToListAsync();

        if (!organizations.Any())
        {
            _logger.LogWarning("No organizations found for seeding tags");
            return;
        }

        var tagNames = new[]
        {
            "緊急",
            "重要",
            "開発",
            "デザイン",
            "レビュー待ち",
            "完了",
            "バグ修正",
            "テスト",
            "ドキュメント",
            "定期メンテナンス",
        };

        var usersByOrg = await _context.Users
            .Where(u => u.OrganizationId != null)
            .GroupBy(u => u.OrganizationId!.Value)
            .Select(g => new { OrganizationId = g.Key, UserId = g.First().Id })
            .ToDictionaryAsync(x => x.OrganizationId, x => x.UserId);

        var existingTags = await _context.Tags
            .Select(t => new { t.OrganizationId, t.Name })
            .ToHashSetAsync();

        var newTags = new List<Tag>();
        foreach (var organization in organizations)
        {
            if (!usersByOrg.TryGetValue(organization.Id, out var userId))
            {
                continue;
            }

            foreach (var tagName in tagNames)
            {
                if (!existingTags.Contains(new { OrganizationId = organization.Id, Name = tagName }))
                {
                    newTags.Add(new Tag
                    {
                        Name = tagName,
                        OrganizationId = organization.Id,
                        CreatedByUserId = userId,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    });
                }
            }
        }

        if (newTags.Any())
        {
            _context.Tags.AddRange(newTags);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} tags for {OrgCount} organizations", newTags.Count, organizations.Count);
        }
    }

    /// <summary>
    /// ボットのシードデータを投入
    /// 各組織に ChatBot と SystemBot を作成
    /// </summary>
    public async Task SeedBotsAsync()
    {
        var organizations = await _context.Organizations.ToListAsync();
        if (!organizations.Any())
        {
            _logger.LogInformation("No organizations found, skipping bot seeding");
            return;
        }

        var existingBots = await _context.Bots.ToListAsync();
        var existingBotsByOrg = existingBots
            .GroupBy(b => b.OrganizationId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var botsToAdd = new List<Bot>();

        foreach (var org in organizations)
        {
            var orgBots = existingBotsByOrg.GetValueOrDefault(org.Id, []);

            if (!orgBots.Any(b => b.Type == BotType.ChatBot))
            {
                botsToAdd.Add(new Bot
                {
                    OrganizationId = org.Id,
                    Type = BotType.ChatBot,
                    Name = "Coati Bot",
                    IconUrl = "/icons/bot/chat.webp",
                });
            }

            if (!orgBots.Any(b => b.Type == BotType.SystemBot))
            {
                botsToAdd.Add(new Bot
                {
                    OrganizationId = org.Id,
                    Type = BotType.SystemBot,
                    Name = "Butler Bot",
                    IconUrl = "/icons/bot/system.webp",
                });
            }
        }

        if (botsToAdd.Count > 0)
        {
            _context.Bots.AddRange(botsToAdd);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} bots", botsToAdd.Count);
        }
        else
        {
            _logger.LogInformation("All organizations already have bots, skipping creation");
        }

        var chatBotPersona = BotPersonaHelper.GetChatBotPersona();
        var chatBotConstraint = BotPersonaHelper.GetChatBotConstraint();
        var systemBotPersona = BotPersonaHelper.GetSystemBotPersona();
        var systemBotConstraint = BotPersonaHelper.GetSystemBotConstraint();

        var chatBotUpdated = await _context.Bots
            .Where(b => b.Type == BotType.ChatBot)
            .ExecuteUpdateAsync(s => s
                .SetProperty(b => b.Persona, chatBotPersona)
                .SetProperty(b => b.Constraint, chatBotConstraint));

        var systemBotUpdated = await _context.Bots
            .Where(b => b.Type == BotType.SystemBot)
            .ExecuteUpdateAsync(s => s
                .SetProperty(b => b.Persona, systemBotPersona)
                .SetProperty(b => b.Constraint, systemBotConstraint));

        if (chatBotUpdated > 0 || systemBotUpdated > 0)
        {
            _logger.LogInformation("Updated persona and constraint for {ChatBotCount} ChatBots and {SystemBotCount} SystemBots", chatBotUpdated, systemBotUpdated);
        }
    }

    /// <summary>
    /// 組織設定のシードデータを投入（欠損分を補完）
    /// </summary>
    public async Task SeedOrganizationSettingsAsync()
    {
        var organizations = await _context.Organizations.ToListAsync();
        if (!organizations.Any())
        {
            return;
        }

        var existingSettings = await _context.OrganizationSettings
            .ToDictionaryAsync(x => x.OrganizationId, x => x);

        var settingsToAdd = new List<OrganizationSetting>();

        foreach (var organization in organizations)
        {
            if (existingSettings.ContainsKey(organization.Id))
            {
                continue;
            }

            settingsToAdd.Add(
                new OrganizationSetting
                {
                    OrganizationId = organization.Id,
                    TaskOverdueThreshold = 0,
                    WeeklyReportDeliveryDay = 0,
                    MailFromAddress = organization.Email,
                    MailFromName = organization.Name,
                    GenerativeApiVendor = GenerativeApiVendor.None,
                    GenerativeApiKey = null,
                    Plan = OrganizationPlan.Free,
                    DefaultWorkspaceMode = WorkspaceMode.Normal,
                    UpdatedAt = DateTimeOffset.UtcNow,
                    UpdatedByUserId = null,
                }
            );
        }

        if (settingsToAdd.Count > 0)
        {
            _context.OrganizationSettings.AddRange(settingsToAdd);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} organization settings", settingsToAdd.Count);
        }
    }

    /// <summary>
    /// ユーザー設定のシードデータを投入（欠損分を補完）
    /// </summary>
    public async Task SeedUserSettingsAsync()
    {
        var users = await _context.Users.ToListAsync();
        if (!users.Any())
        {
            return;
        }

        var existingSettings = await _context.UserSettings
            .Select(s => s.UserId)
            .ToHashSetAsync();

        var settingsToAdd = new List<UserSetting>();

        foreach (var user in users)
        {
            if (existingSettings.Contains(user.Id))
            {
                continue;
            }

            settingsToAdd.Add(
                new UserSetting
                {
                    UserId = user.Id,
                    CanReceiveEmail = true,
                    UpdatedAt = DateTimeOffset.UtcNow,
                    UpdatedByUserId = null,
                }
            );
        }

        if (settingsToAdd.Count > 0)
        {
            _context.UserSettings.AddRange(settingsToAdd);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} user settings", settingsToAdd.Count);
        }
    }

    /// <summary>
    /// ChatActor のシードデータを投入
    /// </summary>
    public async Task SeedChatActorsAsync()
    {
        var chatActorsToAdd = new List<ChatActor>();

        var usersWithoutActor = await _context.Users
            .Where(u => u.OrganizationId != null && !_context.ChatActors.Any(a => a.UserId == u.Id))
            .ToListAsync();

        foreach (var user in usersWithoutActor)
        {
            chatActorsToAdd.Add(new ChatActor
            {
                OrganizationId = user.OrganizationId!.Value,
                ActorType = ChatActorType.User,
                UserId = user.Id,
                DisplayName = user.Username,
                AvatarType = user.AvatarType,
                AvatarUrl = user.UserAvatarPath,
            });
        }

        var botsWithoutActor = await _context.Bots
            .Where(b => !_context.ChatActors.Any(a => a.BotId == b.Id))
            .ToListAsync();

        foreach (var bot in botsWithoutActor)
        {
            chatActorsToAdd.Add(new ChatActor
            {
                OrganizationId = bot.OrganizationId,
                ActorType = ChatActorType.Bot,
                BotId = bot.Id,
                DisplayName = bot.Name,
                AvatarType = null,
                AvatarUrl = bot.IconUrl,
            });
        }

        if (!chatActorsToAdd.Any())
        {
            return;
        }

        const int batchSize = 500;
        await ExecuteBatchInsertAsync(chatActorsToAdd, batchSize, "ChatActors");

        _logger.LogInformation("Added {UserCount} ChatActors for users, {BotCount} for bots",
            usersWithoutActor.Count, botsWithoutActor.Count);
    }
}

/// <summary>
/// シードデータの投入量設定
/// </summary>
public record SeedDataVolume
{
    /// <summary>
    ///
    /// </summary>
    public int Organizations { get; init; }
    /// <summary>
    ///
    /// </summary>
    public int UsersPerOrganization { get; init; }
    /// <summary>
    ///
    /// </summary>
    public int WorkspacesPerOrganization { get; init; }
    /// <summary>
    ///
    /// </summary>
    public int ItemsPerWorkspace { get; init; }
    /// <summary>
    ///
    /// </summary>
    public int TasksPerItemMin { get; init; }
    /// <summary>
    ///
    /// </summary>
    public int TasksPerItemMax { get; init; }
    /// <summary>
    ///
    /// </summary>
    public int CommentsPerTaskMin { get; init; }
    /// <summary>
    ///
    /// </summary>
    public int CommentsPerTaskMax { get; init; }
    /// <summary>
    ///
    /// </summary>
    public int ActivitiesPerItemMin { get; init; }
    /// <summary>
    ///
    /// </summary>
    public int ActivitiesPerItemMax { get; init; }
    /// <summary>
    ///
    /// </summary>
    public int RelationsPerWorkspaceMin { get; init; }
    /// <summary>
    ///
    /// </summary>
    public int RelationsPerWorkspaceMax { get; init; }
}