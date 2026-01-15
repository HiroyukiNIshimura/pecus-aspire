using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.AI.Prompts;
using Pecus.Libs.AI.Prompts.Notifications;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks.Bot.Utils;
using Pecus.Libs.Lexical;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// アイテム作成時にワークスペースグループチャットへメッセージを通知する Hangfire タスク
/// 必要に応じてメッセージを作成し、関連するワークスペースのグループチャットに通知する
/// </summary>
public class CreateItemTask : ItemNotificationTaskBase
{
    private readonly ItemCreatedPromptTemplate _promptTemplate = new();
    private readonly ILexicalConverterService? _lexicalConverterService;
    private readonly IAiClientFactory? _aiClientFactory;
    private readonly IBotSelector? _botSelector;

    /// <summary>
    /// CreateItemTask のコンストラクタ
    /// </summary>
    public CreateItemTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<CreateItemTask> logger,
        ILexicalConverterService? lexicalConverterService = null,
        IAiClientFactory? aiClientFactory = null,
        IBotSelector? botSelector = null)
        : base(context, publisher, logger)
    {
        _lexicalConverterService = lexicalConverterService;
        _aiClientFactory = aiClientFactory;
        _botSelector = botSelector;
    }

    /// <inheritdoc />
    protected override string TaskName => "CreateItemTask";

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

        // 必要なサービスが揃っていない場合は定型文を返す
        if (_lexicalConverterService == null || _aiClientFactory == null || _botSelector == null)
        {
            Logger.LogDebug("LexicalConverterService, AiClientFactory or BotSelector is not available, using default message");
            return (defaultMessage, null);
        }

        // 本文が空の場合は定型文を返す
        if (string.IsNullOrWhiteSpace(item.Body))
        {
            Logger.LogDebug("Item body is empty, using default message");
            return (defaultMessage, null);
        }

        try
        {
            // Lexical JSON を Markdown に変換
            var markdownResult = await _lexicalConverterService.ToMarkdownAsync(item.Body);
            if (!markdownResult.Success || string.IsNullOrWhiteSpace(markdownResult.Result))
            {
                Logger.LogDebug("Failed to convert Lexical JSON to Markdown, using default message");
                return (defaultMessage, null);
            }

            var markdownBody = markdownResult.Result;

            // 組織設定を取得
            var setting = await GetOrganizationSettingAsync(organizationId);
            if (setting == null ||
                setting.GenerativeApiVendor == GenerativeApiVendor.None ||
                string.IsNullOrEmpty(setting.GenerativeApiKey) ||
                string.IsNullOrEmpty(setting.GenerativeApiModel))
            {
                Logger.LogDebug("AI settings not configured for organization, using default message");
                return (defaultMessage, null);
            }

            // AI クライアントを作成
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

            // メッセージ内容を組み立て（件名 + 本文）
            var contentForAnalysis = $"件名: {item.Subject}\n\n本文:\n{markdownBody}";

            // Bot を選定（感情分析に基づいて SystemBot または ChatBot を選択）
            var bot = await _botSelector.SelectBotByContentAsync(
                organizationId,
                aiClient,
                contentForAnalysis
            );

            if (bot == null)
            {
                Logger.LogDebug("Bot not found, using default message");
                return (defaultMessage, null);
            }

            // Bot のペルソナと行動指針を プロンプトテンプレート と統合
            var promptInput = new ItemCreatedPromptInput(
                UserName: updatedByUserName,
                Subject: item.Subject,
                BodyMarkdown: markdownBody
            );
            var prompt = _promptTemplate.Build(promptInput);

            var botPersonaPrompt = new SystemPromptBuilder()
                .WithRawPersona(bot.Persona)
                .WithRawConstraint(bot.Constraint)
                .Build();
            var fullSystemPrompt = $"{prompt.SystemPrompt}\n\n{botPersonaPrompt}";

            // AI でメッセージを生成
            var generatedMessage = await aiClient.GenerateTextAsync(fullSystemPrompt, prompt.UserPrompt);

            if (string.IsNullOrWhiteSpace(generatedMessage))
            {
                Logger.LogDebug("AI generated empty message, using default message");
                return (defaultMessage, bot);
            }

            // 定型文 + AI 生成メッセージを返す
            return ($"{defaultMessage}\n\n{generatedMessage}", bot);
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to generate AI message for item creation, using default message");
            return (defaultMessage, null);
        }
    }

    /// <summary>
    /// アイテム作成時のメッセージ通知を実行する
    /// </summary>
    /// <param name="itemId">作成されたアイテムのID</param>
    public async Task NotifyItemCreatedAsync(int itemId)
    {
        await ExecuteNotificationAsync(itemId, ActivityActionType.Created, null);
    }

    /// <summary>
    /// 定型メッセージを生成する
    /// </summary>
    private static string BuildDefaultMessage(string updatedByUserName, string workspaceCode, string itemCode)
    {
        return $"{updatedByUserName}さんがアイテムを作成しました。\n[{workspaceCode}#{itemCode}]";
    }

    /// <summary>
    /// 組織設定を取得する
    /// </summary>
    private async Task<OrganizationSetting?> GetOrganizationSettingAsync(int organizationId)
    {
        return await Context.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);
    }
}