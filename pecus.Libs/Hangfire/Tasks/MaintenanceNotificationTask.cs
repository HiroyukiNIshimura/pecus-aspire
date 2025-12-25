using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Notifications;
using System.Globalization;
using System.Text.RegularExpressions;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;
using BotEntity = Pecus.Libs.DB.Models.Bot;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// 運営通知（メンテナンス等）をシステムチャットルームに配信するタスク
/// </summary>
public partial class MaintenanceNotificationTask
{
    private readonly ApplicationDbContext _context;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly ILogger<MaintenanceNotificationTask> _logger;

    private static readonly IDeserializer YamlDeserializer = new DeserializerBuilder()
        .WithNamingConvention(CamelCaseNamingConvention.Instance)
        .IgnoreUnmatchedProperties()
        .Build();

    private static readonly HashSet<string> ValidCategories =
    [
        "緊急メンテナンス",
        "定期メンテナンス",
        "重要",
        "お知らせ",
        "障害報告",
    ];

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public MaintenanceNotificationTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<MaintenanceNotificationTask> logger)
    {
        _context = context;
        _publisher = publisher;
        _logger = logger;
    }

    /// <summary>
    /// 指定ディレクトリ内の未処理 Markdown ファイルを処理する
    /// </summary>
    /// <param name="notificationsDirectory">Notifications フォルダの絶対パス</param>
    public async Task ProcessPendingNotificationsAsync(string notificationsDirectory)
    {
        if (!Directory.Exists(notificationsDirectory))
        {
            _logger.LogWarning("Notifications directory not found: {Directory}", notificationsDirectory);
            return;
        }

        var mdFiles = Directory.GetFiles(notificationsDirectory, "*.md")
            .Where(f => !IsProcessedFile(Path.GetFileName(f)))
            .ToList();

        _logger.LogInformation(
            "Found {Count} pending notification file(s) in {Directory}",
            mdFiles.Count,
            notificationsDirectory);

        foreach (var filePath in mdFiles)
        {
            try
            {
                await ProcessFileAsync(filePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process notification file: {FilePath}", filePath);
            }
        }
    }

    private async Task ProcessFileAsync(string filePath)
    {
        var content = await File.ReadAllTextAsync(filePath);
        var notification = ParseMarkdown(content, filePath);

        if (notification == null)
        {
            _logger.LogWarning("Failed to parse notification file: {FilePath}", filePath);
            return;
        }

        if (notification.Delete && notification.MessageIds.Count > 0)
        {
            _logger.LogInformation(
                "Deleting notification messages: {Subject}, MessageIds={MessageIds}",
                notification.Subject,
                string.Join(", ", notification.MessageIds));

            await DeleteMessagesAsync(notification.MessageIds);
            await AppendDeletedAtAndRenameAsync(filePath, content);
            return;
        }

        if (notification.PublishAt > DateOnly.FromDateTime(DateTime.UtcNow))
        {
            _logger.LogDebug(
                "Notification not yet due: {FilePath}, PublishAt={PublishAt}",
                filePath,
                notification.PublishAt);
            return;
        }

        _logger.LogInformation(
            "Processing notification: {Subject}, Category={Category}, PublishAt={PublishAt}",
            notification.Subject,
            notification.Category,
            notification.PublishAt);

        var messageIds = await SendToAllOrganizationsAsync(notification);

        await AppendMessageIdsAndRenameAsync(filePath, content, messageIds);
    }

    private async Task DeleteMessagesAsync(List<int> messageIds)
    {
        var messages = await _context.ChatMessages
            .Where(m => messageIds.Contains(m.Id))
            .ToListAsync();

        if (messages.Count == 0)
        {
            _logger.LogWarning("No messages found to delete: MessageIds={MessageIds}", string.Join(", ", messageIds));
            return;
        }

        _context.ChatMessages.RemoveRange(messages);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted {Count} message(s)", messages.Count);
    }

    private static async Task AppendDeletedAtAndRenameAsync(string filePath, string originalContent)
    {
        var frontMatterMatch = FrontMatterPattern().Match(originalContent);
        if (!frontMatterMatch.Success)
        {
            RenameToProcessed(filePath);
            return;
        }

        var yamlContent = frontMatterMatch.Groups[1].Value;
        var bodyContent = originalContent[(frontMatterMatch.Index + frontMatterMatch.Length)..];

        var deletedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);

        var newYaml = $"{yamlContent}\ndeletedAt: {deletedAt}";
        var newContent = $"---\n{newYaml}\n---\n{bodyContent}";

        await File.WriteAllTextAsync(filePath, newContent);

        RenameToProcessed(filePath);
    }

    private async Task<List<int>> SendToAllOrganizationsAsync(MaintenanceNotification notification)
    {
        var messageIds = new List<int>();

        var organizations = await _context.Organizations
            .AsNoTracking()
            .Select(o => o.Id)
            .ToListAsync();

        _logger.LogInformation("Sending notification to {Count} organization(s)", organizations.Count);

        foreach (var organizationId in organizations)
        {
            try
            {
                var messageId = await SendToOrganizationAsync(organizationId, notification);
                if (messageId.HasValue)
                {
                    messageIds.Add(messageId.Value);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send notification to organization: OrganizationId={OrganizationId}",
                    organizationId);
            }
        }

        return messageIds;
    }

    private async Task<int?> SendToOrganizationAsync(int organizationId, MaintenanceNotification notification)
    {
        var systemRoom = await GetOrCreateSystemRoomAsync(organizationId);
        if (systemRoom == null)
        {
            _logger.LogWarning(
                "System room could not be created for organization: OrganizationId={OrganizationId}",
                organizationId);
            return null;
        }

        var systemBot = await GetSystemBotAsync(organizationId);
        if (systemBot?.ChatActor == null)
        {
            _logger.LogWarning(
                "SystemBot not found for organization: OrganizationId={OrganizationId}",
                organizationId);
            return null;
        }

        await EnsureBotIsMemberAsync(systemRoom.Id, systemBot.ChatActor.Id);

        var messageContent = BuildMessageContent(notification);
        var messageId = await SendBotMessageToSystemRoomAsync(organizationId, systemRoom, systemBot, messageContent);

        _logger.LogInformation(
            "Notification sent: OrganizationId={OrganizationId}, RoomId={RoomId}, MessageId={MessageId}",
            organizationId,
            systemRoom.Id,
            messageId);

        return messageId;
    }

    private async Task<ChatRoom?> GetOrCreateSystemRoomAsync(int organizationId)
    {
        var room = await _context.ChatRooms
            .FirstOrDefaultAsync(r =>
                r.OrganizationId == organizationId &&
                r.WorkspaceId == null &&
                r.Type == ChatRoomType.System);

        if (room != null)
        {
            return room;
        }

        var firstUser = await _context.Users
            .Where(u => u.OrganizationId == organizationId && u.IsActive)
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync();

        if (firstUser == null)
        {
            return null;
        }

        var organizationUserIds = await _context.Users
            .Where(u => u.OrganizationId == organizationId && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

        var actors = await _context.ChatActors
            .Where(a => a.UserId != null && organizationUserIds.Contains(a.UserId.Value))
            .ToListAsync();

        room = new ChatRoom
        {
            Type = ChatRoomType.System,
            Name = "システム通知",
            OrganizationId = organizationId,
            CreatedByUserId = firstUser.Id,
            Members = actors
                .Select(actor => new ChatRoomMember
                {
                    ChatActorId = actor.Id,
                    Role = actor.UserId == firstUser.Id ? ChatRoomRole.Owner : ChatRoomRole.Member,
                })
                .ToList(),
        };

        _context.ChatRooms.Add(room);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "System room created: RoomId={RoomId}, OrganizationId={OrganizationId}",
            room.Id,
            organizationId);

        return room;
    }

    private async Task<BotEntity?> GetSystemBotAsync(int organizationId)
    {
        return await _context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == BotType.SystemBot);
    }

    private async Task EnsureBotIsMemberAsync(int roomId, int chatActorId)
    {
        var isMember = await _context.ChatRoomMembers.AnyAsync(m =>
            m.ChatRoomId == roomId && m.ChatActorId == chatActorId);

        if (!isMember)
        {
            _context.ChatRoomMembers.Add(new ChatRoomMember
            {
                ChatRoomId = roomId,
                ChatActorId = chatActorId,
                Role = ChatRoomRole.Member,
            });
            await _context.SaveChangesAsync();
        }
    }

    private async Task<int> SendBotMessageToSystemRoomAsync(
        int organizationId,
        ChatRoom room,
        BotEntity systemBot,
        string content)
    {
        var message = new ChatMessage
        {
            ChatRoomId = room.Id,
            SenderActorId = systemBot.ChatActor!.Id,
            MessageType = ChatMessageType.System,
            Content = content,
        };
        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        // ルームの UpdatedAt を更新（後勝ち、RowVersion 競合回避）
        await _context.ChatRooms
            .Where(r => r.Id == room.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.UpdatedAt, DateTimeOffset.UtcNow));

        var payload = new
        {
            RoomId = room.Id,
            RoomType = room.Type.ToString(),
            Message = new
            {
                message.Id,
                message.SenderActorId,
                MessageType = message.MessageType.ToString(),
                message.Content,
                message.CreatedAt,
            },
        };

        await _publisher.PublishAsync(new SignalRNotification
        {
            GroupName = $"organization:{organizationId}",
            EventType = "chat:system_message",
            Payload = payload,
            SourceType = NotificationSourceType.SystemBot,
            OrganizationId = organizationId,
        });

        return message.Id;
    }

    private static string BuildMessageContent(MaintenanceNotification notification)
    {
        return $"【{notification.Category}】{notification.Subject}\n\n{notification.Body}";
    }

    private static bool IsProcessedFile(string fileName)
    {
        return ProcessedFilePattern().IsMatch(fileName);
    }

    [GeneratedRegex(@"^\d{12}_.*\.md$")]
    private static partial Regex ProcessedFilePattern();

    private static async Task AppendMessageIdsAndRenameAsync(string filePath, string originalContent, List<int> messageIds)
    {
        var frontMatterMatch = FrontMatterPattern().Match(originalContent);
        if (!frontMatterMatch.Success)
        {
            RenameToProcessed(filePath);
            return;
        }

        var yamlContent = frontMatterMatch.Groups[1].Value;
        var bodyContent = originalContent[(frontMatterMatch.Index + frontMatterMatch.Length)..];

        var processedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);
        var messageIdsStr = string.Join(", ", messageIds);

        var newYaml = $"{yamlContent}\nprocessedAt: {processedAt}\nmessageIds: [{messageIdsStr}]";
        var newContent = $"---\n{newYaml}\n---\n{bodyContent}";

        await File.WriteAllTextAsync(filePath, newContent);

        RenameToProcessed(filePath);
    }

    private static void RenameToProcessed(string filePath)
    {
        var directory = Path.GetDirectoryName(filePath)!;
        var fileName = Path.GetFileName(filePath);
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmm", CultureInfo.InvariantCulture);
        var newFileName = $"{timestamp}_{fileName}";
        var newPath = Path.Combine(directory, newFileName);

        File.Move(filePath, newPath);
    }

    private MaintenanceNotification? ParseMarkdown(string content, string filePath)
    {
        var frontMatterMatch = FrontMatterPattern().Match(content);
        if (!frontMatterMatch.Success)
        {
            _logger.LogWarning("No YAML front matter found in file: {FilePath}", filePath);
            return null;
        }

        var yaml = frontMatterMatch.Groups[1].Value;
        var body = content[(frontMatterMatch.Index + frontMatterMatch.Length)..].Trim();

        MaintenanceNotificationFrontMatter frontMatter;
        try
        {
            frontMatter = YamlDeserializer.Deserialize<MaintenanceNotificationFrontMatter>(yaml);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse YAML front matter in file: {FilePath}", filePath);
            return null;
        }

        if (frontMatter.PublishAt == null)
        {
            _logger.LogWarning("publishAt is required in file: {FilePath}", filePath);
            return null;
        }

        if (string.IsNullOrWhiteSpace(frontMatter.Subject))
        {
            _logger.LogWarning("subject is required in file: {FilePath}", filePath);
            return null;
        }

        var category = frontMatter.Category ?? "お知らせ";
        if (!ValidCategories.Contains(category))
        {
            _logger.LogWarning(
                "Unknown category '{Category}' in file: {FilePath}. Valid categories: {Valid}",
                category,
                filePath,
                string.Join(", ", ValidCategories));
        }

        return new MaintenanceNotification
        {
            PublishAt = DateOnly.FromDateTime(frontMatter.PublishAt.Value),
            Category = category,
            Subject = frontMatter.Subject,
            Body = body,
            Delete = frontMatter.Delete,
            MessageIds = frontMatter.MessageIds ?? [],
        };
    }

    [GeneratedRegex(@"^---\s*\n(.*?)\n---\s*\n", RegexOptions.Singleline)]
    private static partial Regex FrontMatterPattern();

    private class MaintenanceNotificationFrontMatter
    {
        public DateTime? PublishAt { get; set; }
        public string? Category { get; set; }
        public string? Subject { get; set; }
        public bool Delete { get; set; }
        public List<int>? MessageIds { get; set; }
    }

    private class MaintenanceNotification
    {
        public DateOnly PublishAt { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool Delete { get; set; }
        public List<int> MessageIds { get; set; } = [];
    }
}
