using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Lexical;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// アイテム作成時にワークスペースグループチャットへメッセージを通知する Hangfire タスク
/// 必要に応じてメッセージを作成し、関連するワークスペースのグループチャットに通知する
/// </summary>
public class CreateItemTask : ItemNotificationTaskBase
{
    /// <summary>
    /// AI メッセージ生成用のシステムプロンプト
    /// </summary>
    private const string MessageGenerationPrompt = """
        あなたはチームのチャットルームに投稿するアシスタントです。
        新しく作成されたアイテム（タスクや課題）の内容を確認し、チームメンバーに対して簡潔に紹介するメッセージを生成してください。

        要件:
        - 100文字以内で簡潔にまとめる
        - アイテムの要点を伝える
        - 絵文字は使わない
        - Markdownは使用しない
        - 挨拶は不要

        例: 「〇〇さんが、新規ユーザー登録フローの改善について検討が始まりました。UXの向上を目指します。」
        """;

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
    protected override async Task<string> BuildNotificationMessageAsync(
        int organizationId,
        WorkspaceItem item,
        string updatedByUserName,
        string workspaceCode,
        string? details)
    {
        var defaultMessage = BuildDefaultMessage(updatedByUserName, workspaceCode, item.Code);

        // 必要なサービスが揃っていない場合は定型文を返す
        if (_lexicalConverterService == null || _aiClientFactory == null || _botSelector == null)
        {
            Logger.LogDebug("LexicalConverterService, AiClientFactory or BotSelector is not available, using default message");
            return defaultMessage;
        }

        // 本文が空の場合は定型文を返す
        if (string.IsNullOrWhiteSpace(item.Body))
        {
            Logger.LogDebug("Item body is empty, using default message");
            return defaultMessage;
        }

        try
        {
            // Lexical JSON を Markdown に変換
            var markdownResult = await _lexicalConverterService.ToMarkdownAsync(item.Body);
            if (!markdownResult.Success || string.IsNullOrWhiteSpace(markdownResult.Result))
            {
                Logger.LogDebug("Failed to convert Lexical JSON to Markdown, using default message");
                return defaultMessage;
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
                return defaultMessage;
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
                return defaultMessage;
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
                return defaultMessage;
            }

            // Bot のペルソナと行動指針を MessageGenerationPrompt と統合
            var botPersonaPrompt = new SystemPromptBuilder()
                .WithRawPersona(bot.Persona)
                .WithRawConstraint(bot.Constraint)
                .Build();
            var fullSystemPrompt = $"{MessageGenerationPrompt}\n\n{botPersonaPrompt}";

            // AI でメッセージを生成
            var userPrompt = $"以下のアイテムについて紹介メッセージを生成してください:\n\n{contentForAnalysis}";
            var generatedMessage = await aiClient.GenerateTextWithMessagesAsync(
                [
                    (MessageRole.System, $@"Userの一人称は「{updatedByUserName}」さんです。"),
                    (MessageRole.User, userPrompt)
                ],
                fullSystemPrompt
            );

            if (string.IsNullOrWhiteSpace(generatedMessage))
            {
                Logger.LogDebug("AI generated empty message, using default message");
                return defaultMessage;
            }

            // 100文字を超える場合は切り詰め
            if (generatedMessage.Length > 100)
            {
                generatedMessage = generatedMessage[..97] + "...";
            }

            // 定型文 + AI 生成メッセージを返す
            return $"{defaultMessage}\n\n{generatedMessage}";
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to generate AI message for item creation, using default message");
            return defaultMessage;
        }
    }

    /// <summary>
    /// アイテム作成時のメッセージ通知を実行する
    /// </summary>
    /// <param name="itemId">作成されたアイテムのID</param>
    public async Task NotifyItemCreatedAsync(int itemId)
    {
        await ExecuteNotificationAsync(itemId, null);
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