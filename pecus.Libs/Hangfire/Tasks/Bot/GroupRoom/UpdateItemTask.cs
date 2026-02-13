using DiffPlex;
using DiffPlex.DiffBuilder;
using DiffPlex.DiffBuilder.Model;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.AI.Prompts;
using Pecus.Libs.AI.Prompts.Notifications;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks.Bot.Guards;
using Pecus.Libs.Hangfire.Tasks.Bot.Utils;
using Pecus.Libs.Lexical;
using Pecus.Libs.Notifications;
using System.Text.Json;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// アイテム更新時にワークスペースグループチャットへメッセージを通知する Hangfire タスク
/// 必要に応じてメッセージを作成し、関連するワークスペースのグループチャットに通知する
/// </summary>
public class UpdateItemTask : ItemNotificationTaskBase
{
    /// <summary>
    /// 差分抽出時の最大行数
    /// </summary>
    private const int MaxDiffLines = 50;

    /// <summary>
    /// details JSON のデシリアライズ用レコード
    /// </summary>
    private sealed record UpdateDetails(string? New, string? Old);

    private readonly ItemUpdatedPromptTemplate _promptTemplate = new();
    private readonly ILexicalConverterService? _lexicalConverterService;
    private readonly IAiClientFactory? _aiClientFactory;
    private readonly IBotSelector? _botSelector;
    private readonly IBackgroundJobClient? _backgroundJobClient;

    /// <summary>
    /// UpdateItemTask のコンストラクタ
    /// </summary>
    public UpdateItemTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        IBotTaskGuard taskGuard,
        ILogger<UpdateItemTask> logger,
        ILexicalConverterService? lexicalConverterService = null,
        IAiClientFactory? aiClientFactory = null,
        IBotSelector? botSelector = null,
        IBackgroundJobClient? backgroundJobClient = null)
        : base(context, publisher, taskGuard, logger)
    {
        _lexicalConverterService = lexicalConverterService;
        _aiClientFactory = aiClientFactory;
        _botSelector = botSelector;
        _backgroundJobClient = backgroundJobClient;
    }

    /// <inheritdoc />
    protected override string TaskName => "UpdateItemTask";

    /// <inheritdoc />
    protected override string BuildNotificationMessage(
        int organizationId,
        WorkspaceItem item,
        string updatedByUserName,
        string workspaceCode,
        string? details)
    {
        return BuildDefaultMessage(updatedByUserName, workspaceCode, item.Code);
    }

    /// <inheritdoc />
    protected override async Task<(string Message, DB.Models.Bot? SelectedBot)> BuildNotificationMessageAsync(
        int organizationId,
        WorkspaceItem item,
        string updatedByUserName,
        string workspaceCode,
        ActivityActionType actionType,
        string? details)
    {
        var defaultMessage = BuildDefaultMessage(updatedByUserName, workspaceCode, item.Code);

        if (_lexicalConverterService == null || _aiClientFactory == null || _botSelector == null)
        {
            Logger.LogDebug("LexicalConverterService, AiClientFactory or BotSelector is not available, using default message");
            return (defaultMessage, null);
        }

        if (string.IsNullOrWhiteSpace(details))
        {
            Logger.LogDebug("Details is empty, using default message");
            return (defaultMessage, null);
        }

        try
        {
            var updateDetails = JsonSerializer.Deserialize<UpdateDetails>(details, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (updateDetails == null)
            {
                Logger.LogDebug("Failed to deserialize details, using default message");
                return (defaultMessage, null);
            }

            string newContent;
            string? oldContent;

            if (actionType == ActivityActionType.SubjectUpdated)
            {
                newContent = $"件名: {updateDetails.New}";
                oldContent = !string.IsNullOrWhiteSpace(updateDetails.Old)
                    ? $"件名: {updateDetails.Old}"
                    : null;
            }
            else
            {
                if (string.IsNullOrWhiteSpace(updateDetails.Old))
                {
                    Logger.LogDebug("Both new and old content are empty, using default message");
                    return (defaultMessage, null);
                }

                var newBodyMarkdown = await ConvertToMarkdownAsync(item.Body);
                var oldBodyMarkdown = await ConvertToMarkdownAsync(updateDetails.Old);

                if (newBodyMarkdown == null || oldBodyMarkdown == null)
                {
                    Logger.LogDebug("Failed to convert body to Markdown, using default message");
                    return (defaultMessage, null);
                }

                newContent = $"件名: {item.Subject}\n\n本文:\n{newBodyMarkdown}";
                oldContent = $"件名: {item.Subject}\n\n本文:\n{oldBodyMarkdown}";
            }

            var setting = await GetOrganizationSettingAsync(organizationId);
            if (setting == null ||
                setting.GenerativeApiVendor == GenerativeApiVendor.None ||
                string.IsNullOrEmpty(setting.GenerativeApiKey) ||
                string.IsNullOrEmpty(setting.GenerativeApiModel))
            {
                Logger.LogDebug("AI settings not configured for organization, using default message");
                return (defaultMessage, null);
            }

            var aiClient = _aiClientFactory.CreateClient(
                setting.GenerativeApiVendor,
                setting.GenerativeApiKey,
                setting.GenerativeApiModel
            );

            if (aiClient == null)
            {
                Logger.LogDebug("Failed to create AI client, using default message");
                return (defaultMessage, null);
            }

            var bot = await _botSelector.SelectBotByContentAsync(
                organizationId,
                aiClient,
                newContent
            );

            if (bot == null)
            {
                Logger.LogDebug("Bot not found, using default message");
                return (defaultMessage, null);
            }

            // Bot のペルソナと行動指針を プロンプトテンプレート と統合
            var diffSummary = actionType != ActivityActionType.SubjectUpdated ? ExtractDiff(oldContent ?? "", newContent) : null;
            var promptInput = new ItemUpdatedPromptInput(
                UserName: updatedByUserName,
                NewContent: newContent,
                OldContent: oldContent,
                IsSubjectChange: actionType == ActivityActionType.SubjectUpdated,
                DiffSummary: diffSummary
            );
            var prompt = _promptTemplate.Build(promptInput);

            var botPersonaPrompt = new SystemPromptBuilder()
                .WithRawPersona(bot.Persona)
                .WithRawConstraint(bot.Constraint)
                .Build();
            var fullSystemPrompt = $"{prompt.SystemPrompt}\n\n{botPersonaPrompt}";

            var generatedMessage = await aiClient.GenerateTextAsync(fullSystemPrompt, prompt.UserPrompt);

            if (string.IsNullOrWhiteSpace(generatedMessage))
            {
                Logger.LogDebug("AI generated empty message, using default message");
                return (defaultMessage, bot);
            }

            return ($"{defaultMessage}\n\n{generatedMessage}", bot);
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to generate AI message for item update, using default message");
            return (defaultMessage, null);
        }
    }

    /// <summary>
    /// アイテム更新時のメッセージ通知を実行する（デバウンス対応）
    /// </summary>
    /// <param name="itemId">更新されたアイテムのID</param>
    /// <param name="actionType">アクションタイプ</param>
    /// <param name="scheduledUpdatedAt">スケジュール時点のアイテム更新日時（デバウンス判定用）</param>
    /// <param name="details">更新内容の詳細（JSON形式）</param>
    /// <remarks>
    /// デバウンス機能: スケジュール時の UpdatedAt と実行時の UpdatedAt を比較し、
    /// 異なる場合は後続の更新があったとみなして通知をスキップする。
    /// これにより、連続編集時の通知を最後の1回のみに抑制できる。
    /// Bot通知とメール通知の両方を処理する。
    /// メール通知はBot機能の有効/無効に関係なく送信される。
    /// </remarks>
    public async Task NotifyItemUpdatedAsync(
        int itemId,
        ActivityActionType actionType,
        DateTimeOffset scheduledUpdatedAt,
        string? details = null)
    {
        // デバウンスチェック: スケジュール時点から更新があればスキップ
        var item = await Context.WorkspaceItems
            .Include(wi => wi.Workspace)
            .Include(wi => wi.Owner)
            .FirstOrDefaultAsync(wi => wi.Id == itemId);

        if (item == null)
        {
            Logger.LogDebug("Item {ItemId} not found, skipping notification", itemId);
            return;
        }

        if (item.UpdatedAt != scheduledUpdatedAt)
        {
            Logger.LogDebug(
                "Item {ItemId} was updated after scheduling (scheduled: {ScheduledAt}, current: {CurrentAt}), skipping notification",
                itemId, scheduledUpdatedAt, item.UpdatedAt);
            return;
        }

        // Bot通知を実行（Bot機能が無効な組織では ExecuteNotificationAsync 内でスキップされる）
        await ExecuteNotificationAsync(itemId, actionType, details);
    }

    /// <summary>
    /// 定型メッセージを生成する
    /// </summary>
    private static string BuildDefaultMessage(string updatedByUserName, string workspaceCode, string itemCode)
    {
        return $"{updatedByUserName}さんがアイテムの内容を更新しました。\n[{workspaceCode}#{itemCode}]";
    }

    /// <summary>
    /// Lexical JSON を Markdown に変換する
    /// </summary>
    private async Task<string?> ConvertToMarkdownAsync(string? lexicalJson)
    {
        if (string.IsNullOrWhiteSpace(lexicalJson) || _lexicalConverterService == null)
        {
            return null;
        }

        var result = await _lexicalConverterService.ToMarkdownAsync(lexicalJson);
        return result.Success ? result.Result : null;
    }

    /// <summary>
    /// 新旧テキストの差分を抽出する（コンテキスト行を含む）
    /// </summary>
    private static string ExtractDiff(string oldText, string newText, int contextLines = 2)
    {
        var diffBuilder = new InlineDiffBuilder(new Differ());
        var diff = diffBuilder.BuildDiffModel(oldText, newText);
        var lines = diff.Lines.ToList();

        var result = new List<string>();
        var includedIndices = new HashSet<int>();

        for (var i = 0; i < lines.Count; i++)
        {
            if (lines[i].Type is ChangeType.Inserted or ChangeType.Deleted)
            {
                for (var j = Math.Max(0, i - contextLines); j <= Math.Min(lines.Count - 1, i + contextLines); j++)
                {
                    includedIndices.Add(j);
                }
            }
        }

        if (includedIndices.Count == 0)
        {
            return string.Empty;
        }

        var sortedIndices = includedIndices.OrderBy(i => i).ToList();
        var prevIndex = -2;

        foreach (var i in sortedIndices)
        {
            if (i > prevIndex + 1 && prevIndex >= 0)
            {
                result.Add("...");
            }

            var line = lines[i];
            var prefix = line.Type switch
            {
                ChangeType.Inserted => "+",
                ChangeType.Deleted => "-",
                _ => " "
            };

            if (!string.IsNullOrEmpty(line.Text))
            {
                result.Add($"{prefix} {line.Text}");
            }

            prevIndex = i;
        }

        if (result.Count > MaxDiffLines)
        {
            var truncated = result.Take(MaxDiffLines).ToList();
            truncated.Add($"... 他 {result.Count - MaxDiffLines} 行省略");
            return string.Join("\n", truncated);
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 新旧テキストの差分を抽出する（追加・削除行のみ、コンテキストなし）
    /// 現在未使用
    /// </summary>
    private static string ExtractDiffWithoutContext(string oldText, string newText)
    {
        var diffBuilder = new InlineDiffBuilder(new Differ());
        var diff = diffBuilder.BuildDiffModel(oldText, newText);

        var additions = new List<string>();
        var deletions = new List<string>();

        foreach (var line in diff.Lines)
        {
            if (string.IsNullOrWhiteSpace(line.Text))
            {
                continue;
            }

            switch (line.Type)
            {
                case ChangeType.Inserted:
                    additions.Add($"+ {line.Text}");
                    break;
                case ChangeType.Deleted:
                    deletions.Add($"- {line.Text}");
                    break;
            }
        }

        if (additions.Count == 0 && deletions.Count == 0)
        {
            return string.Empty;
        }

        var result = new List<string>();
        var halfMaxLines = MaxDiffLines / 2;

        if (deletions.Count > 0)
        {
            result.Add("【削除された内容】");
            result.AddRange(deletions.Take(halfMaxLines));
            if (deletions.Count > halfMaxLines)
            {
                result.Add($"...他 {deletions.Count - halfMaxLines} 行省略");
            }
        }

        if (additions.Count > 0)
        {
            if (result.Count > 0)
            {
                result.Add(string.Empty);
            }
            result.Add("【追加された内容】");
            result.AddRange(additions.Take(halfMaxLines));
            if (additions.Count > halfMaxLines)
            {
                result.Add($"...他 {additions.Count - halfMaxLines} 行省略");
            }
        }

        return string.Join("\n", result);
    }
}