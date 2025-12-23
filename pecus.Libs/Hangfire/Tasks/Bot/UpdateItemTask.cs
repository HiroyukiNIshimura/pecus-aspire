using DiffPlex;
using DiffPlex.DiffBuilder;
using DiffPlex.DiffBuilder.Model;
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
        - 差分情報（追加・削除）から変更の要点を伝える
        - 絵文字は使わない
        - 挨拶は不要

        例: 「件名が『初期設計』から『詳細設計』に変更されました。フェーズが進んだようです。」
        例: 「本文が更新され、実装方針の詳細が追記されました。」
        例: 「期限と担当者に関する記述が追加されました。」
        """;

    /// <summary>
    /// 差分抽出時の最大行数
    /// </summary>
    private const int MaxDiffLines = 50;

    /// <summary>
    /// details JSON のデシリアライズ用レコード
    /// </summary>
    private sealed record UpdateDetails(string? New, string? Old);

    private readonly ILexicalConverterService? _lexicalConverterService;
    private readonly IAiClientFactory? _aiClientFactory;
    private readonly IBotSelector? _botSelector;

    /// <summary>
    /// UpdateItemTask のコンストラクタ
    /// </summary>
    public UpdateItemTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<UpdateItemTask> logger,
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

        if (_lexicalConverterService == null || _aiClientFactory == null || _botSelector == null)
        {
            Logger.LogDebug("LexicalConverterService, AiClientFactory or BotSelector is not available, using default message");
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

            var bot = await _botSelector.SelectBotByContentAsync(
                organizationId,
                aiClient,
                newContent
            );

            if (bot == null)
            {
                Logger.LogDebug("Bot not found, using default message");
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
    /// AI へのユーザープロンプトを生成する（差分ベース）
    /// </summary>
    private static string BuildUserPrompt(string newContent, string? oldContent, bool isSubjectChange)
    {
        var changeType = isSubjectChange ? "件名" : "本文";

        if (string.IsNullOrWhiteSpace(oldContent))
        {
            return $"以下のアイテムの{changeType}が変更されました。変更内容を紹介するメッセージを生成してください:\n\n【変更後】\n{newContent}";
        }

        if (isSubjectChange)
        {
            return $"以下のアイテムの件名が変更されました。変更内容を紹介するメッセージを生成してください:\n\n【変更前】\n{oldContent}\n\n【変更後】\n{newContent}";
        }

        var diffText = ExtractDiff(oldContent, newContent);

        if (string.IsNullOrWhiteSpace(diffText))
        {
            return $"以下のアイテムの{changeType}が変更されましたが、実質的なテキスト変更はありませんでした。フォーマットや軽微な調整が行われた可能性があります。";
        }

        return $"以下のアイテムの本文が変更されました。差分を元にチームに変更内容を紹介するメッセージを生成してください:\n\n{diffText}";
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

    /// <summary>
    /// 組織設定を取得する
    /// </summary>
    private async Task<OrganizationSetting?> GetOrganizationSettingAsync(int organizationId)
    {
        return await Context.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);
    }
}