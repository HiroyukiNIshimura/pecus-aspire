using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Lexical;
using Pecus.Libs.Notifications;
using System.Text.Json;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

// TODO: [重要] 本文が大きい場合の AI 送信ガード実装
// - 新規作成（CreateItemTask）: 文字数切り詰め（2000〜3000文字）でOK
// - 変更（UpdateItemTask）: 単純切り詰めだと差分が不明確になる
//   → 新旧の差分抽出（追加行・削除行のみ送信）を実装すべき
//   → DiffPlex ライブラリの導入も検討
// - トークン制限超過、コスト増大、レスポンス遅延のリスク回避が目的

/// <summary>
/// アイテム更新時にワークスペースグループチャットへメッセージを通知する Hangfire タスク
/// 必要に応じてメッセージを作成し、関連するワークスペースのグループチャットに通知する
/// </summary>
public class UpdateItemTask : ItemNotificationTaskBase
{
    /// <summary>
    /// AI メッセージ生成用のシステムプロンプト
    /// </summary>
    private const string MessageGenerationPrompt = """
        あなたはチームのチャットルームに投稿するアシスタントです。
        アイテム（タスクや課題）の変更内容を確認し、チームメンバーに対して変更点を簡潔に紹介するメッセージを生成してください。

        要件:
        - 100文字以内で簡潔にまとめる
        - 変更の要点を伝える
        - 絵文字は使わない
        - 挨拶は不要

        例: 「件名が『初期設計』から『詳細設計』に変更されました。フェーズが進んだようです。」
        例: 「本文が更新され、実装方針の詳細が追記されました。」
        """;

    /// <summary>
    /// details JSON のデシリアライズ用レコード
    /// </summary>
    private sealed record UpdateDetails(string? New, string? Old);

    private readonly ILexicalConverterService? _lexicalConverterService;
    private readonly IAiClientFactory? _aiClientFactory;

    /// <summary>
    /// UpdateItemTask のコンストラクタ
    /// </summary>
    public UpdateItemTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<UpdateItemTask> logger,
        ILexicalConverterService? lexicalConverterService = null,
        IAiClientFactory? aiClientFactory = null)
        : base(context, publisher, logger)
    {
        _lexicalConverterService = lexicalConverterService;
        _aiClientFactory = aiClientFactory;
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
    protected override async Task<string> BuildNotificationMessageAsync(
        int organizationId,
        WorkspaceItem item,
        string updatedByUserName,
        string workspaceCode,
        string? details)
    {
        var defaultMessage = BuildDefaultMessage(updatedByUserName, workspaceCode, item.Code);

        if (_lexicalConverterService == null || _aiClientFactory == null)
        {
            Logger.LogDebug("LexicalConverterService or AiClientFactory is not available, using default message");
            return defaultMessage;
        }

        if (string.IsNullOrWhiteSpace(details))
        {
            Logger.LogDebug("Details is empty, using default message");
            return defaultMessage;
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
                return defaultMessage;
            }

            var isSubjectChange = !string.IsNullOrWhiteSpace(updateDetails.New);
            string newContent;
            string? oldContent;

            if (isSubjectChange)
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
                    return defaultMessage;
                }

                var newBodyMarkdown = await ConvertToMarkdownAsync(item.Body);
                var oldBodyMarkdown = await ConvertToMarkdownAsync(updateDetails.Old);

                if (newBodyMarkdown == null || oldBodyMarkdown == null)
                {
                    Logger.LogDebug("Failed to convert body to Markdown, using default message");
                    return defaultMessage;
                }

                newContent = $"件名: {item.Subject}\n\n本文:\n{newBodyMarkdown}";
                oldContent = $"本文:\n{oldBodyMarkdown}";
            }

            var setting = await GetOrganizationSettingAsync(organizationId);
            if (setting == null ||
                setting.GenerativeApiVendor == GenerativeApiVendor.None ||
                string.IsNullOrEmpty(setting.GenerativeApiKey) ||
                string.IsNullOrEmpty(setting.GenerativeApiModel))
            {
                Logger.LogDebug("AI settings not configured for organization, using default message");
                return defaultMessage;
            }

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

            var needsAttention = await MessageAnalyzer.NeedsAttentionAsync(
                aiClient,
                newContent,
                Logger
            );

            var botType = needsAttention ? BotType.SystemBot : BotType.ChatBot;
            var bot = await GetBotByTypeAsync(organizationId, botType);

            if (bot == null)
            {
                Logger.LogDebug("Bot not found for type {BotType}, using default message", botType);
                return defaultMessage;
            }

            var userPrompt = BuildUserPrompt(newContent, oldContent, isSubjectChange);
            var generatedMessage = await aiClient.GenerateTextWithMessagesAsync(
                [
                    (MessageRole.System, $@"Userの一人称は「{updatedByUserName}」さんです。"),
                    (MessageRole.System, MessageGenerationPrompt),
                    (MessageRole.User, userPrompt)
                ],
                bot.Persona
            );

            if (string.IsNullOrWhiteSpace(generatedMessage))
            {
                Logger.LogDebug("AI generated empty message, using default message");
                return defaultMessage;
            }

            if (generatedMessage.Length > 100)
            {
                generatedMessage = generatedMessage[..97] + "...";
            }

            return $"{defaultMessage}\n\n{generatedMessage}";
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to generate AI message for item update, using default message");
            return defaultMessage;
        }
    }

    /// <summary>
    /// アイテム更新時のメッセージ通知を実行する
    /// </summary>
    /// <param name="itemId">更新されたアイテムのID</param>
    /// <param name="details">更新内容の詳細（JSON形式）</param>
    public async Task NotifyItemUpdatedAsync(int itemId, string? details = null)
    {
        await ExecuteNotificationAsync(itemId, details);
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
    /// AI へのユーザープロンプトを生成する
    /// </summary>
    private static string BuildUserPrompt(string newContent, string? oldContent, bool isSubjectChange)
    {
        var changeType = isSubjectChange ? "件名" : "本文";
        var prompt = $"以下のアイテムの{changeType}が変更されました。変更内容を紹介するメッセージを生成してください:\n\n";
        prompt += $"【変更後】\n{newContent}\n\n";

        if (!string.IsNullOrWhiteSpace(oldContent))
        {
            prompt += $"【変更前】\n{oldContent}";
        }

        return prompt;
    }

    /// <summary>
    /// 組織設定を取得する
    /// </summary>
    private async Task<OrganizationSetting?> GetOrganizationSettingAsync(int organizationId)
    {
        return await Context.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);
    }

    /// <summary>
    /// 指定した BotType の Bot を取得する
    /// </summary>
    private async Task<DB.Models.Bot?> GetBotByTypeAsync(int organizationId, BotType botType)
    {
        return await Context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == botType);
    }
}