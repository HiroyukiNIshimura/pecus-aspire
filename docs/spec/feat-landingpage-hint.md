## ランディングページの設定推奨

ある程度アクティビティのデータが積まれたら、その時点でユーザーのページ遷移の癖を判定し、ユーザー設定でランディングページの設定をお勧めする。

アクティビティはアイテムに対して1:Nで存在し、タイプは以下
/// <summary>
/// アクティビティのアクション種類を表す列挙型
/// </summary>
public enum ActivityActionType
{
    /// <summary>
    /// 作成
    /// </summary>
    Created,
    /// <summary>
    /// 件名更新
    /// </summary>
    SubjectUpdated,
    /// <summary>
    /// 本文更新
    /// </summary>
    BodyUpdated,
    /// <summary>
    /// ファイル追加
    /// </summary>
    FileAdded,
    /// <summary>
    /// ファイル削除
    /// </summary>
    FileRemoved,
    /// <summary>
    /// 担当者変更
    /// </summary>
    AssigneeChanged,
    /// <summary>
    /// 関連追加
    /// </summary>
    RelationAdded,
    /// <summary>
    /// 関連削除
    /// </summary>
    RelationRemoved,
    /// <summary>
    /// アーカイブ状態変更
    /// </summary>
    ArchivedChanged,
    /// <summary>
    /// 下書き状態変更
    /// </summary>
    DraftChanged,
    /// <summary>
    /// コミッター変更
    /// </summary>
    CommitterChanged,
    /// <summary>
    /// 優先度変更
    /// </summary>
    PriorityChanged,
    /// <summary>
    /// 期限変更
    /// </summary>
    DueDateChanged,
    /// <summary>
    /// タスク追加
    /// </summary>
    TaskAdded,
    /// <summary>
    /// タスク完了
    /// </summary>
    TaskCompleted,
    /// <summary>
    /// タスク破棄
    /// </summary>
    TaskDiscarded,
    /// <summary>
    /// タスク担当者変更
    /// </summary>
    TaskAssigneeChanged,
    /// <summary>
    /// タスク再開（差し戻し）
    /// </summary>
    TaskReopened,
    /// <summary>
    /// タスク期限変更
    /// </summary>
    TaskDueDateChanged
}

### ランディングページの設定
- ダッシュボード（デフォルト）
- ワークスペース
- マイタスク
- コミッター

## 1. アクティビティとランディングページのマッピング案
各アクションタイプをランディングページの特性に合わせて重み付けします。

### A. 「マイタスク」推奨（タスク実行・消化型）
タスクの完了や状態変更が主体のユーザーです。自分のToDoを最速で確認できるページが適しています。

対象アクション:
- TaskCompleted (重要度: 高)
- TaskReopened
- TaskAdded
- TaskDiscarded

### B. 「ワークスペース」推奨（コンテンツ作成・編集型）
アイテムそのものの作成、本文執筆、資料添付などを頻繁に行うユーザーです。プロジェクトの資料一覧やドキュメントにアクセスしやすいページが適しています。

対象アクション:
- Created
- BodyUpdated (重要度: 高)
- FileAdded / FileRemoved
- SubjectUpdated
- DraftChanged
- RelationAdded / RelationRemoved

### C. 「コミッター」推奨（進行管理・マネジメント型）
優先度の変更、担当者の割り当て、期限管理、承認（コミッター変更）など、アイテムのメンテナンスや交通整理を行うユーザーです。自分が責任を持つアイテムの状況を俯瞰できるページが適しています。

対象アクション:
- CommitterChanged
- AssigneeChanged
- TaskAssigneeChanged
- PriorityChanged
- DueDateChanged / TaskDueDateChanged
- ArchivedChanged

### D. ダッシュボード（デフォルト）
上記スコアに顕著な偏りがない場合
直近のアクティビティ数が閾値未満の場合（ROM専ユーザーなど）

## 2. 推論ロジックの実装イメージ (C#)
直近 N 件（または過去M 日分）のアクティビティを取得し、スコアリングするイメージです。

```cs
public LandingPageType RecommendLandingPage(IEnumerable<ActivityActionType> recentActions)
{
    var scores = new Dictionary<LandingPageType, int>
    {
        { LandingPageType.MyTasks, 0 },
        { LandingPageType.Workspace, 0 },
        { LandingPageType.Committer, 0 }
    };

    foreach (var action in recentActions)
    {
        switch (action)
        {
            // --- マイタスク系 ---
            case ActivityActionType.TaskCompleted:
                scores[LandingPageType.MyTasks] += 3; // 完了は強いシグナル
                break;
            case ActivityActionType.TaskAdded:
            case ActivityActionType.TaskDiscarded:
            case ActivityActionType.TaskReopened:
                scores[LandingPageType.MyTasks] += 1;
                break;

            // --- ワークスペース（編集）系 ---
            case ActivityActionType.Created:
            case ActivityActionType.BodyUpdated:
            case ActivityActionType.FileAdded:
                scores[LandingPageType.Workspace] += 2; // 編集作業は重め
                break;
            case ActivityActionType.SubjectUpdated:
            case ActivityActionType.FileRemoved:
            case ActivityActionType.RelationAdded:
            case ActivityActionType.RelationRemoved:
            case ActivityActionType.DraftChanged:
                scores[LandingPageType.Workspace] += 1;
                break;

            // --- コミッター（管理）系 ---
            case ActivityActionType.CommitterChanged:
            case ActivityActionType.AssigneeChanged:
            case ActivityActionType.TaskAssigneeChanged:
            case ActivityActionType.PriorityChanged:
            case ActivityActionType.DueDateChanged:
            case ActivityActionType.TaskDueDateChanged:
            case ActivityActionType.ArchivedChanged:
                scores[LandingPageType.Committer] += 1;
                break;
        }
    }

    // 最もスコアが高いものを抽出（同点や閾値以下の場合はデフォルト）
    var bestMatch = scores.OrderByDescending(x => x.Value).FirstOrDefault();

    // 例: 合計スコアが10未満ならデータ不足としてデフォルト（ダッシュボード）を維持
    if (bestMatch.Value < 10)
    {
        return LandingPageType.Dashboard;
    }

    return bestMatch.Key;
}
```

## 3. 補足
- データの古さ: 直近1ヶ月などの期間制限を設けると、「最近役割が変わった（プレイヤーからマネージャーになった等）」場合に追従しやすくなります。
- 閲覧ログの不在: この判定には「閲覧（View）」が含まれていません。ROM専の管理職などはアクティビティが出ないため、デフォルトの「ダッシュボード」に倒れますが、これはUXとして正しい（閲覧中心の人はサマリーを見るべき）挙動と言えます。

## 4. 判定トリガーと提示フロー

### 1.  **分析フェーズ (BackFire / Hangfire)**
    *   **タイミング**: 週次（月曜早朝など非ピーク帯）。
    *   **処理**: 直近1ヶ月のアクティビティを集計し、現在の設定と推奨値が乖離しているユーザーを抽出。「推奨保留フラグ」を立てる。
### 2.  **提示フェーズ (Frontend / WebApi)**
    *   **タイミング**: アプリ起動直後（または現在設定されているランディングページを表示した直後）。
    *   **条件**: 「推奨保留フラグ」があり、かつ「前回の拒否からN日以上経過」している場合。
    *   **UI**: 画面下部にスナックバー等で提示。「最近タスク処理が多いようです。起動ページを『マイタスク』に変更しますか？」
    *   **アクション**: 「設定へ移動」で設定画面へ遷移、または「はい」で即時変更を行う。

### 3. 除外条件（ノイズにならないための制御）
単に計算結果が変わったからといって毎回出すと「うざい」機能になります。以下の抑制ロジックが必要です：

1. 一度拒否したら一定期間出さない
  -「今は変更しない」を選ばれたら、同じ提案は1ヶ月間抑制する（Cool-down期間）。
2. 設定変更直後は出さない
  - ユーザーが手動で設定を変えたばかりなら、推論結果がどうあれ提案しない。
3. スコアが僅差なら出さない
  -「マイタスク(10点)」と「ワークスペース(9点)」のように迷うレベルなら、あえて現状維持とする（変更コストに見合わないため）。

### 4. データの永続化方針
**DB（サーバーサイド）で管理する。** ローカルストレージは使用しない。
デバイス変更やキャッシュクリアの影響を受けず、ユーザー体験を一貫させるため。

- **必要なデータ項目**:(UserSettingに追加)
    - `PendingLandingPageRecommendation`: バッチが計算した推奨値。
    - `LandingPageUpdatedAt`: ユーザーが最後に設定を変更した日時。
    - `LandingPageRecommendationRefusedAt`: ユーザーが提案を拒否した日時。

