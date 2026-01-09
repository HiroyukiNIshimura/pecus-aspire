using Pecus.Libs.Information;
using Pecus.Libs.Information.Models;

namespace Pecus.Libs.AI.Tools.Implementations;

/// <summary>
/// ワークスペース内の情報を検索するツール
/// </summary>
public class SearchInformationTool : IAiTool
{
    private readonly IInformationSearchProvider _informationSearchProvider;

    /// <inheritdoc />
    public string Name => "search_information";

    /// <inheritdoc />
    public string Description => "ワークスペース内のドキュメントやアイテムから関連情報を検索します。ユーザーが「○○について教えて」「○○の情報が知りたい」などと尋ねた時に使用します。";

    /// <inheritdoc />
    public int BasePriority => 90;

    /// <summary>
    /// SearchInformationTool のコンストラクタ
    /// </summary>
    /// <param name="informationSearchProvider">情報検索プロバイダー</param>
    public SearchInformationTool(IInformationSearchProvider informationSearchProvider)
    {
        _informationSearchProvider = informationSearchProvider;
    }

    /// <inheritdoc />
    public AiToolDefinition GetDefinition() => new()
    {
        Name = Name,
        Description = Description,
        Parameters = new AiToolParameters
        {
            Properties =
            [
                new AiToolParameter
                {
                    Name = "topic",
                    Type = "string",
                    Description = "検索するトピックやキーワード"
                },
                new AiToolParameter
                {
                    Name = "limit",
                    Type = "integer",
                    Description = "取得する結果の最大数（デフォルト: 5）"
                }
            ],
            Required = ["topic"]
        }
    };

    /// <inheritdoc />
    public int CalculateRelevanceScore(AiToolContext context)
    {
        if (context.SentimentResult == null)
        {
            return 0;
        }

        var baseScore = context.SentimentResult.InformationSeekingScore;

        if (string.IsNullOrWhiteSpace(context.SentimentResult.InformationTopic))
        {
            return Math.Max(0, baseScore - 30);
        }

        return baseScore;
    }

    /// <inheritdoc />
    public async Task<AiToolResult> ExecuteAsync(
        AiToolContext context,
        CancellationToken cancellationToken = default)
    {
        var topic = context.FunctionArguments?.TryGetValue("topic", out var topicObj) == true
            ? topicObj?.ToString()
            : context.SentimentResult?.InformationTopic;

        if (string.IsNullOrWhiteSpace(topic))
        {
            return AiToolResult.Empty(Name);
        }

        var limit = 5;
        if (context.FunctionArguments?.TryGetValue("limit", out var limitObj) == true
            && limitObj is int limitValue)
        {
            limit = limitValue;
        }

        var searchResult = await _informationSearchProvider.SearchAsync(
            context.UserId,
            topic,
            limit: limit,
            cancellationToken: cancellationToken
        );

        if (searchResult.Items.Count == 0)
        {
            return new AiToolResult
            {
                Success = true,
                ToolName = Name,
                ContextPrompt = null,
                DebugInfo = $"No results found for topic: {topic}"
            };
        }

        var prompt = BuildInformationContextPrompt(searchResult);

        return new AiToolResult
        {
            Success = true,
            ToolName = Name,
            ContextPrompt = prompt,
            SuggestedRole = RoleRandomizer.SecretaryRole,
            DebugInfo = $"Found {searchResult.Items.Count} items for topic: {topic}"
        };
    }

    /// <summary>
    /// 情報検索結果からコンテキストプロンプトを生成する
    /// </summary>
    private static string BuildInformationContextPrompt(InformationSearchResult searchResult)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"【参考情報】「{searchResult.SearchTopic}」に関連するドキュメント:");
        sb.AppendLine();

        foreach (var item in searchResult.Items)
        {
            sb.AppendLine($"■ [{item.WorkspaceCode}#{item.ItemCode}] {item.Subject}");
            sb.AppendLine($"  作成者: {item.OwnerName}");
            if (!string.IsNullOrWhiteSpace(item.AssigneeName))
            {
                sb.AppendLine($"  担当者: {item.AssigneeName}");
            }
            if (!string.IsNullOrWhiteSpace(item.CommitterName))
            {
                sb.AppendLine($"  コミッター: {item.CommitterName}");
            }
            if (!string.IsNullOrWhiteSpace(item.BodySnippet))
            {
                var snippet = item.BodySnippet.Length > 150
                    ? item.BodySnippet[..150] + "..."
                    : item.BodySnippet;
                sb.AppendLine($"  概要: {snippet}");
            }
            sb.AppendLine();
        }

        sb.AppendLine("この情報を参考に、ユーザーの質問に答えてください。");
        sb.AppendLine("ただし、情報をそのまま列挙するのではなく、自然な会話として回答してください。");
        sb.AppendLine("参照元のドキュメントコード（[ワークスペースコード#アイテムコード]形式）を適宜含めてください。");

        return sb.ToString();
    }
}