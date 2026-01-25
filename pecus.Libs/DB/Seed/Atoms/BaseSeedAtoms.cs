using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

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
        // _targetOrganizationIdsが設定されている場合はその組織のみを対象とする
        var query = _context.Organizations.AsQueryable();
        if (_targetOrganizationIds.Any())
        {
            query = query.Where(o => _targetOrganizationIds.Contains(o.Id));
        }
        var organizations = await query.ToListAsync();

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
    /// Bot はグローバルに1つだけ存在し、組織ごとに ChatActor で表現される
    /// </summary>
    public async Task SeedBotsAsync()
    {
        var existingBots = await _context.Bots.ToListAsync();

        var botsToAdd = new List<Bot>();

        // ChatBot がなければ作成（グローバルに1つ）
        if (!existingBots.Any(b => b.Type == BotType.ChatBot))
        {
            botsToAdd.Add(new Bot
            {
                Type = BotType.ChatBot,
                Name = "Coati Bot",
                IconUrl = "/icons/bot/chat.webp",
            });
        }

        // SystemBot がなければ作成（グローバルに1つ）
        if (!existingBots.Any(b => b.Type == BotType.SystemBot))
        {
            botsToAdd.Add(new Bot
            {
                Type = BotType.SystemBot,
                Name = "Butler Bot",
                IconUrl = "/icons/bot/system.webp",
            });
        }

        if (botsToAdd.Count > 0)
        {
            _context.Bots.AddRange(botsToAdd);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} global bots", botsToAdd.Count);
        }
        else
        {
            _logger.LogInformation("Global bots already exist, skipping creation");
        }

        // Persona と Constraint を更新
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
        // _targetOrganizationIdsが設定されている場合はその組織のみを対象とする
        var query = _context.Organizations.AsQueryable();
        if (_targetOrganizationIds.Any())
        {
            query = query.Where(o => _targetOrganizationIds.Contains(o.Id));
        }
        var organizations = await query.ToListAsync();
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
                    GamificationEnabled = true,
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
        // _targetOrganizationIdsが設定されている場合はその組織に所属するユーザーのみを対象とする
        var query = _context.Users.AsQueryable();
        if (_targetOrganizationIds.Any())
        {
            query = query.Where(u => u.OrganizationId != null && _targetOrganizationIds.Contains(u.OrganizationId.Value));
        }
        var users = await query.ToListAsync();
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

        // _targetOrganizationIdsが設定されている場合はその組織に所属するユーザーのみを対象とする
        var userQuery = _context.Users
            .Where(u => u.OrganizationId != null && !_context.ChatActors.Any(a => a.UserId == u.Id));
        if (_targetOrganizationIds.Any())
        {
            userQuery = userQuery.Where(u => _targetOrganizationIds.Contains(u.OrganizationId!.Value));
        }
        var usersWithoutActor = await userQuery.ToListAsync();

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

        // Bot 用 ChatActor の作成
        // Bot はグローバルに存在し、各組織に対して ChatActor を作成する
        var globalBots = await _context.Bots.ToListAsync();
        var existingBotActors = await _context.ChatActors
            .Where(a => a.BotId != null)
            .Select(a => new { a.OrganizationId, a.BotId })
            .ToListAsync();
        var existingBotActorKeys = existingBotActors
            .Select(a => (a.OrganizationId, a.BotId))
            .ToHashSet();

        // 対象組織を取得
        var orgQuery = _context.Organizations.AsQueryable();
        if (_targetOrganizationIds.Any())
        {
            orgQuery = orgQuery.Where(o => _targetOrganizationIds.Contains(o.Id));
        }
        var organizations = await orgQuery.Select(o => o.Id).ToListAsync();

        foreach (var orgId in organizations)
        {
            foreach (var bot in globalBots)
            {
                // この組織にこの Bot の ChatActor がまだない場合は作成
                if (!existingBotActorKeys.Contains((orgId, bot.Id)))
                {
                    chatActorsToAdd.Add(new ChatActor
                    {
                        OrganizationId = orgId,
                        ActorType = ChatActorType.Bot,
                        BotId = bot.Id,
                        DisplayName = bot.Name,
                        AvatarType = null,
                        AvatarUrl = bot.IconUrl,
                    });
                }
            }
        }

        if (!chatActorsToAdd.Any())
        {
            return;
        }

        const int batchSize = 500;
        await ExecuteBatchInsertAsync(chatActorsToAdd, batchSize, "ChatActors");

        _logger.LogInformation("Added {UserCount} ChatActors for users, {BotCount} for bots",
            usersWithoutActor.Count, chatActorsToAdd.Count - usersWithoutActor.Count);
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