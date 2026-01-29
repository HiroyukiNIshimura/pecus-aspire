using System.Text;

namespace Pecus.Libs.AI.Prompts.Tasks;

/// <summary>
/// タスク生成の入力パラメータ
/// </summary>
/// <param name="WorkspaceGenre">ワークスペースのジャンル名</param>
/// <param name="ItemSubject">アイテム件名</param>
/// <param name="ItemBodyMarkdown">アイテム本文（Markdown形式）</param>
/// <param name="StartDate">プロジェクト開始日</param>
/// <param name="EndDate">プロジェクト完了日</param>
/// <param name="TaskTypes">利用可能なタスクタイプ一覧</param>
/// <param name="AdditionalContext">追加のコンテキスト情報（任意）</param>
/// <param name="Feedback">前回の生成結果へのフィードバック（任意）</param>
/// <param name="PreviousCandidates">前回生成されたタスク候補（任意）</param>
public record TaskGenerationInput(
    string? WorkspaceGenre,
    string ItemSubject,
    string? ItemBodyMarkdown,
    DateOnly StartDate,
    DateOnly EndDate,
    IReadOnlyList<TaskTypeInfo> TaskTypes,
    string? AdditionalContext,
    string? Feedback,
    IReadOnlyList<PreviousCandidateInfo>? PreviousCandidates
);

/// <summary>
/// タスクタイプ情報
/// </summary>
/// <param name="Id">タスクタイプID</param>
/// <param name="Code">タスクタイプコード</param>
/// <param name="Name">タスクタイプ名</param>
/// <param name="Description">タスクタイプの説明</param>
public record TaskTypeInfo(int Id, string Code, string Name, string? Description);

/// <summary>
/// 前回の候補情報（イテレーション用）
/// </summary>
/// <param name="Content">タスク内容</param>
/// <param name="IsAccepted">採用されたか</param>
/// <param name="RejectionReason">却下理由（却下の場合）</param>
public record PreviousCandidateInfo(string Content, bool IsAccepted, string? RejectionReason);

/// <summary>
/// タスク生成用のプロンプトテンプレート
/// </summary>
public class TaskGenerationPromptTemplate : IPromptTemplate<TaskGenerationInput>
{
    /// <inheritdoc />
    public string BuildSystemPrompt(TaskGenerationInput input)
    {
        return """
            あなたはプロジェクト管理の専門家です。
            与えられたプロジェクト情報から、実行可能なタスクリストを生成してください。

            ## 出力ルール
            1. **タスク数はデフォルト最大10件まで**に制限する（重要度の高いものを優先）
               - ただし「追加情報」や「フィードバック」で10件より少ない数が指定されている場合は、そちらを優先する
               - 10件を超える指定は無視し、最大10件とする
            2. 各タスクは具体的で実行可能な単位に分割する
            3. 依存関係を明確にし、クリティカルパスを特定する
            4. 並行作業可能なタスクを識別する
            5. 規模感（S/M/L/XL）を現実的に見積もる
              - S: 半日以内（〜4時間）
              - M: 1日程度（〜8時間）
              - L: 2-3日（〜24時間）
              - XL: 1週間程度（〜40時間）
            6. タスクタイプは提供されたリストから最適なものを選択する
              - 各タスクの性質に最も合致するタスクタイプIDを指定
              - 該当するものがない場合はnullを指定
              - 選択理由を taskTypeRationale に記載
            7. 日本語で記述する
            8. rationale（理由）は簡潔に50文字以内で記述する

            ## クリティカルパス判定基準
            クリティカルパスとは「プロジェクト開始から完了までの最長経路」です。
            - isOnCriticalPath=true となるのは以下の条件を**両方**満たすタスクのみ：
              1. プロジェクト完了に直接影響する依存チェーンに含まれる
              2. このタスクが遅れるとプロジェクト全体の完了が遅れる
            - 後続タスク（このタスクを predecessorTempIds に含むタスク）を持たないタスクは isOnCriticalPath=false
            - 並行作業可能で独立したタスクは isOnCriticalPath=false
            - 「重要なタスク」と「クリティカルパス上のタスク」は異なる概念です

            ## 出力形式
            以下のJSON形式で出力してください。
            ```json
            {
              "candidates": [
                {
                  "tempId": "task-1",
                  "content": "タスク内容",
                  "suggestedTaskTypeId": 1,
                  "taskTypeRationale": "タスクタイプ選択の理由",
                  "estimatedSize": "M",
                  "predecessorTempIds": [],
                  "isOnCriticalPath": true,
                  "canParallelize": false,
                  "suggestedStartDayOffset": 0,
                  "suggestedDurationDays": 2,
                  "rationale": "このタスクが必要な理由"
                }
              ],
              "totalEstimatedDays": 30,
              "criticalPathDescription": "クリティカルパスの説明",
              "suggestions": ["提案1", "提案2"]
            }
            ```
            """;
    }

    /// <inheritdoc />
    public string BuildUserPrompt(TaskGenerationInput input)
    {
        var content = new StringBuilder();

        // プロジェクト情報
        content.AppendLine("## プロジェクト情報");
        if (!string.IsNullOrWhiteSpace(input.WorkspaceGenre))
        {
            content.AppendLine($"- ジャンル: {input.WorkspaceGenre}");
        }
        content.AppendLine($"- 件名: {input.ItemSubject}");
        content.AppendLine($"- 期間: {input.StartDate:yyyy-MM-dd} 〜 {input.EndDate:yyyy-MM-dd}");
        content.AppendLine();

        // 詳細内容
        if (!string.IsNullOrWhiteSpace(input.ItemBodyMarkdown))
        {
            content.AppendLine("## 詳細内容");
            // トークン制限を考慮して本文を切り詰め
            var truncatedBody = input.ItemBodyMarkdown.Length > 4000
                ? input.ItemBodyMarkdown[..4000] + "\n...(以下省略)"
                : input.ItemBodyMarkdown;
            content.AppendLine(truncatedBody);
            content.AppendLine();
        }

        // タスクタイプ一覧
        content.AppendLine("## 利用可能なタスクタイプ");
        content.AppendLine("以下のリストから各タスクに最適なタイプを選択してください。該当するものがない場合は suggestedTaskTypeId を null にしてください。");
        content.AppendLine();
        content.AppendLine("| ID | コード | 名称 | 説明 |");
        content.AppendLine("|----|--------|------|------|");
        foreach (var taskType in input.TaskTypes)
        {
            var description = string.IsNullOrWhiteSpace(taskType.Description) ? "-" : taskType.Description;
            content.AppendLine($"| {taskType.Id} | {taskType.Code} | {taskType.Name} | {description} |");
        }
        content.AppendLine();

        // 追加コンテキスト
        if (!string.IsNullOrWhiteSpace(input.AdditionalContext))
        {
            content.AppendLine("## 追加情報");
            content.AppendLine(input.AdditionalContext);
            content.AppendLine();
        }

        // 前回の生成結果（イテレーション時）
        if (input.PreviousCandidates?.Count > 0)
        {
            content.AppendLine("## 前回の生成結果");
            content.AppendLine();

            var accepted = input.PreviousCandidates.Where(p => p.IsAccepted).ToList();
            var rejected = input.PreviousCandidates.Where(p => !p.IsAccepted).ToList();

            if (accepted.Count > 0)
            {
                content.AppendLine("### 採用されたタスク");
                foreach (var item in accepted)
                {
                    content.AppendLine($"- ✓ {item.Content}");
                }
                content.AppendLine();
            }

            if (rejected.Count > 0)
            {
                content.AppendLine("### 却下されたタスク");
                foreach (var item in rejected)
                {
                    var reason = string.IsNullOrWhiteSpace(item.RejectionReason) ? "理由なし" : item.RejectionReason;
                    content.AppendLine($"- ✗ {item.Content}: {reason}");
                }
                content.AppendLine();
            }
        }

        // フィードバック
        if (!string.IsNullOrWhiteSpace(input.Feedback))
        {
            content.AppendLine("## フィードバック");
            content.AppendLine(input.Feedback);
            content.AppendLine();
        }

        return content.ToString();
    }
}
