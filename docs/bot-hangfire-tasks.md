# Bot Hangfire タスク一覧

Bot 関連の Hangfire バックグラウンドタスクの一覧と概要。

## AI エージェント向け要約（必読）

- すべての Bot タスクは `pecus.Libs/Hangfire/Tasks/Bot/` に配置
- タスクの実行には AI 機能の有効化（`IsAiEnabledAsync`）のチェックが必要
- タスクは `IBackgroundJobClient.Enqueue<T>()` または `Schedule<T>()` でキューに追加
- Bot タイプは `ChatBot`（AI チャット）と `SystemBot`（通知系）の 2 種類

## タスク一覧

| タスク名 | 概要 | キュー登録場所 |
|---------|------|---------------|
| `AiChatReplyTask` | AI チャットルームでのユーザーメッセージに対して AI 返信を生成・送信 | `ChatController.SendMessage` |
| `GroupChatReplyTask` | ワークスペースグループチャットでの Bot 返信を生成 | `ChatController.SendMessage` |
| `FirstTouchdownTask` | 初回ログイン時のウェルカムメッセージを送信 | `EntranceAuthController.Login` |
| `CreateItemTask` | アイテム作成時にワークスペースグループチャットへ通知 | `WorkspaceItemController.CreateWorkspaceItem` |
| `CreateTaskTask` | タスク作成時にワークスペースグループチャットへ通知 | `WorkspaceTaskController.CreateWorkspaceTask` |
| `UpdateItemTask` | アイテム更新時にワークスペースグループチャットへ通知 | `WorkspaceItemService.EnqueueActivityIfChanged` |
| `UpdateTaskTask` | タスク更新時にワークスペースグループチャットへ通知 | `WorkspaceTaskController.UpdateWorkspaceTask` |
| `TaskCommentReminderTask` | リマインダーコメントから日付を AI 解析し、発火タスクをスケジュール | `TaskCommentController.CreateTaskComment` |
| `TaskCommentReminderFireTask` | スケジュールされた日時にリマインダー DM を送信 | `TaskCommentReminderTask.ScheduleReminderAsync` |
| `TaskCommentHelpWantedTask` | HelpWanted コメント時にワークスペースグループチャットへ通知 | `TaskCommentController.CreateTaskComment` |
| `TaskCommentNeedReplyTask` | NeedReply（回答依頼）コメント時に対象ユーザーへ DM 通知 | `TaskCommentController.CreateTaskComment` |
| `TaskCommentUrgeTask` | Urge（督促）コメント時にタスク担当者へ DM 通知 | `TaskCommentController.CreateTaskComment` |
| `SimilarTaskSuggestionTask` | 新規タスク作成時に類似タスク完了者を提案 | `TaskCommentController.CreateTaskComment` |

## タスク詳細

### AiChatReplyTask

**概要**: ユーザーが AI チャットルーム（`ChatRoomType.Ai`）にメッセージを送信した際、AI が返信を生成して送信するタスク。

**エンキュー条件**:
- チャットルームタイプが `ChatRoomType.Ai`
- AI 機能が有効（`IsAiEnabledAsync`）

**メソッド**: `SendReplyAsync(organizationId, roomId, triggerMessageId, senderUserId)`

---

### GroupChatReplyTask

**概要**: ワークスペースグループチャット（`ChatRoomType.Group`）へのメッセージに対して、Bot が適切な返信を生成するタスク。メッセージ内容に基づいて Bot タイプを動的に決定。

**エンキュー条件**:
- チャットルームタイプが `ChatRoomType.Group`
- ワークスペースに紐づいている（`WorkspaceId != null`）
- AI 機能が有効

**メソッド**: `SendReplyAsync(organizationId, roomId, triggerMessageId, senderUserId)`

---

### FirstTouchdownTask

**概要**: ユーザーの初回ログイン時に ChatBot からウェルカムメッセージを送信するタスク。10 秒の遅延後に AI ルームを作成（存在しない場合）し、メッセージを送信。

**エンキュー条件**:
- ユーザーが組織に所属（`OrganizationId.HasValue`）

**メソッド**: `WelcomeMessageAsync(organizationId, userId, username)`

---

### CreateItemTask

**概要**: ワークスペースアイテム作成時にワークスペースグループチャットへ通知メッセージを送信するタスク。AI を使用してアイテム内容を要約したメッセージを生成。

**エンキュー条件**:
- AI 機能が有効

**メソッド**: `NotifyItemCreatedAsync(itemId)`

---

### CreateTaskTask

**概要**: タスク作成時にワークスペースグループチャットへ通知メッセージを送信するタスク。タスクの種類、優先度、期限などを要約。

**エンキュー条件**:
- AI 機能が有効

**メソッド**: `NotifyTaskCreatedAsync(taskId)`

---

### UpdateItemTask

**概要**: アイテム更新時にワークスペースグループチャットへ変更内容を通知するタスク。差分情報から変更の要点を AI で要約。

**エンキュー条件**:
- AI 機能が有効
- アクションタイプが `BodyUpdated` または `SubjectUpdated`

**メソッド**: `NotifyItemUpdatedAsync(itemId, details)`

---

### UpdateTaskTask

**概要**: タスク更新時にワークスペースグループチャットへ通知メッセージを送信するタスク。現在の状態（優先度、期限、進捗など）を要約。

**エンキュー条件**:
- AI 機能が有効

**メソッド**: `NotifyTaskUpdatedAsync(taskId)`

---

### TaskCommentReminderTask

**概要**: リマインダーコメント（`TaskCommentType.Reminder`）が投稿された際、AI でコメント内容から日付を解析し、`TaskCommentReminderFireTask` を指定日時にスケジュールするタスク。

**エンキュー条件**:
- コメントタイプが `TaskCommentType.Reminder`
- AI 機能が有効

**メソッド**: `ScheduleReminderAsync(commentId)`

---

### TaskCommentReminderFireTask

**概要**: スケジュールされた日時にリマインダー DM をタスク担当者へ送信するタスク。`TaskCommentReminderTask` によってスケジュールされる。

**スケジュール条件**:
- `TaskCommentReminderTask` が有効な日付を解析した場合

**メソッド**: `SendReminderFireNotificationAsync(commentId, reminderMonth, reminderDay)`

---

### TaskCommentHelpWantedTask

**概要**: HelpWanted コメント（`TaskCommentType.HelpWanted`）が投稿された際、SystemBot がワークスペースグループチャットへ通知メッセージを送信するタスク。

**エンキュー条件**:
- コメントタイプが `TaskCommentType.HelpWanted`
- AI 機能が有効

**メソッド**: `SendHelpWantedNotificationAsync(commentId)`

---

### TaskCommentNeedReplyTask

**概要**: NeedReply コメント（`TaskCommentType.NeedReply`）が投稿された際、SystemBot が対象ユーザー（アイテムのオーナー、担当者、コミッター、タスク担当者）へ DM 通知を送信するタスク。

**エンキュー条件**:
- コメントタイプが `TaskCommentType.NeedReply`
- AI 機能が有効

**メソッド**: `SendNeedReplyNotificationAsync(commentId)`

---

### TaskCommentUrgeTask

**概要**: Urge コメント（`TaskCommentType.Urge`）が投稿された際、SystemBot がタスク担当者へ督促 DM を送信するタスク。コメント投稿者と担当者が同一の場合はスキップ。

**エンキュー条件**:
- コメントタイプが `TaskCommentType.Urge`
- AI 機能が有効
- コメント投稿者とタスク担当者が異なる

**メソッド**: `SendUrgeNotificationAsync(commentId)`

---

### SimilarTaskSuggestionTask

**概要**: 新規タスク作成時（HelpWanted コメント時）に、類似タスクを完了した経験者を AI で分析し、タスク担当者へ DM で提案するタスク。

**エンキュー条件**:
- コメントタイプが `TaskCommentType.HelpWanted`
- AI 機能が有効

**メソッド**: `SuggestSimilarTaskAssigneesAsync(taskId)`

## 関連ファイル

### タスククラス

| ファイル | 説明 |
|---------|------|
| `Bot/AiChatReplyTask.cs` | AI チャット返信タスク |
| `Bot/GroupChatReplyTask.cs` | グループチャット Bot 返信タスク |
| `Bot/GroupChatReplyTaskBase.cs` | グループチャット返信の基底クラス |
| `Bot/FirstTouchdownTask.cs` | 初回ログインウェルカムタスク |
| `Bot/CreateItemTask.cs` | アイテム作成通知タスク |
| `Bot/CreateTaskTask.cs` | タスク作成通知タスク |
| `Bot/UpdateItemTask.cs` | アイテム更新通知タスク |
| `Bot/UpdateTaskTask.cs` | タスク更新通知タスク |
| `Bot/ItemNotificationTaskBase.cs` | アイテム通知の基底クラス |
| `Bot/TaskNotificationTaskBase.cs` | タスク通知の基底クラス |
| `Bot/TaskCommentReminderTask.cs` | リマインダースケジュールタスク |
| `Bot/TaskCommentReminderFireTask.cs` | リマインダー発火タスク |
| `Bot/TaskCommentHelpWantedTask.cs` | HelpWanted 通知タスク |
| `Bot/TaskCommentNeedReplyTask.cs` | NeedReply 通知タスク |
| `Bot/TaskCommentUrgeTask.cs` | Urge 通知タスク |
| `Bot/SimilarTaskSuggestionTask.cs` | 類似タスク担当者提案タスク |

### ユーティリティ

| ファイル | 説明 |
|---------|------|
| `Bot/BotSelector.cs` | Bot タイプ選択ロジック |
| `Bot/IBotSelector.cs` | Bot セレクターインターフェース |
| `Bot/BotTaskUtils.cs` | Bot タスク共通ユーティリティ |
| `Bot/BotChatMessageInfo.cs` | Bot チャットメッセージ情報モデル |

## DB 更新の特殊ケース

### ChatRoom.UpdatedAt の更新（RowVersion 競合回避）

Bot タスクでは `ChatRoom.UpdatedAt` をメッセージ送信時に更新しています。これはチャットルーム一覧の並び順（最新のアクティビティがあるルームが上）を実現するためです。

**重要**: この更新処理では **`ExecuteUpdateAsync` を使用して直接 SQL で更新** しています。通常のエンティティ追跡による更新（`room.UpdatedAt = ...`）は使用しません。

#### 理由

- Bot タスクはバックグラウンドで並行実行される可能性がある
- 同じ `ChatRoom` に対して複数のタスクが同時に処理された場合、RowVersion（PostgreSQL の `xmin`）の競合により `DbUpdateConcurrencyException` が発生する
- バックグラウンド処理では「後勝ち」で問題ないため、RowVersion チェックを回避する

#### 実装パターン

```csharp
// ❌ NG: RowVersion 競合リスクあり
room.UpdatedAt = DateTimeOffset.UtcNow;
await Context.SaveChangesAsync();

// ✅ OK: 後勝ち、RowVersion 競合回避
await Context.ChatMessages.Add(message);
await Context.SaveChangesAsync();

await Context.ChatRooms
    .Where(r => r.Id == room.Id)
    .ExecuteUpdateAsync(s => s.SetProperty(r => r.UpdatedAt, DateTimeOffset.UtcNow));
```

#### 対象ファイル

以下のファイルで同様のパターンを適用しています：

- `GroupChatReplyTaskBase.cs` - `SendBotMessageAsync`
- `TaskNotificationTaskBase.cs` - `SendBotMessageAsync`
- `ItemNotificationTaskBase.cs` - `SendBotMessageAsync`
- `AiChatReplyTask.cs` - `SendBotReplyAsync`
- `TaskCommentNeedReplyTask.cs` - `SendBotMessageAsync`
- `TaskCommentReminderFireTask.cs` - `SendBotMessageAsync`
- `TaskCommentHelpWantedTask.cs` - `SendBotMessageAsync`
- `TaskCommentUrgeTask.cs` - `SendBotMessageAsync`
- `SimilarTaskSuggestionTask.cs` - `SendBotMessageAsync`

#### 注意事項

- **新しい Bot タスクを追加する際**は、`ChatRoom.UpdatedAt` の更新に必ず `ExecuteUpdateAsync` を使用すること
- 通常の Web API コントローラーでは RowVersion による楽観的ロックが有効なため、このパターンは **Bot タスク専用**
