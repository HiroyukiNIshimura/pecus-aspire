# アジェンダ機能 設計書

> **更新日**: 2026-01-20
> **ステータス**: Phase 14完了

---
**重要**
- この設計と実装に乖離がある
- この設計は間違っている
- 実装が間違っている

場合は作業を必ず中止してください。

**重要**
内部ではこの機能をアジェンダと読んでいます（これは⭕️）
ただし、UI上は年配の方には通じない可能性があるので「**イベント**」と表現します。

## 🔲 TODO（実装漏れ）

Phase 1-14は完了済みですが、以下の機能・UIが未実装です。
フォーム検証：docs/frontend-guidelines.mdの7. クライアントサイドバリデーション（Zod）✅

### 優先度: 高

| 項目 | 説明 | 状態 |
|------|------|------|
| **通知ポップアップUI** | AppHeaderのアジェンダアイコンからポップアップで通知表示。招待・変更・中止・リマインダー通知。個別/一括既読機能。詳細は2.6節参照 | ✅ 完了 |
| **中止確認モーダル** | シリーズ全体を中止する際の確認ダイアログ（CancelConfirmModal）。詳細画面から呼び出す |  ✅ 完了 |
| **編集範囲選択モーダル** | 繰り返しアジェンダ編集時に「この回のみ / この回以降 / シリーズ全体」を選択（EditScopeModal） | ✅ 完了※1 |
| **特定回中止モーダル** | 特定回のみ中止する際のダイアログ（CancelOccurrenceModal）。詳細画面のアクションボタンから呼び出す（繰り返しイベントで特定回を表示中の場合） | ✅ 完了 |
| **特定回の詳細ページ** | `agendas/[agendaId]/occurrence/page.tsx` - 特定回の詳細・中止・変更UI | ✅ 完了 |
| **特定回の参加状況** | 「来週だけ不参加」など、特定回のみの参加状況を設定する機能。`AgendaExceptionAttendance`テーブル追加が必要※2 | 🔲 |

※1 この回のみの場合、参加者を変更しても何も起きない。参加者変更は非対応でOK。
※2 現在の`AgendaAttendee.Status`はシリーズ全体の状態。特定回の参加状況オーバーライドには新テーブルが必要。

### 優先度: 中

| 項目 | 説明 | 状態 |
|------|------|------|
| **参加者選択UI** | Phase 14。クイック追加（組織全体・ワークスペース）+ ユーザー検索による参加者追加機能（AttendeeSelector）。最大100人制限、メール通知switchトグル | ✅ 完了 |

### 優先度: 低（リファクタリング）

| 項目 | 説明 | 状態 |
|------|------|------|
| **RecurrenceSettings分離** | 現在AgendaForm.tsx内にインラインで実装されている繰り返し設定を別コンポーネントに分離 | 🔲 任意 |
| **ReminderSettings分離** | 現在AgendaForm.tsx内にインラインで実装されているリマインダー設定を別コンポーネントに分離 | 🔲 任意 |

### Server Actions（実装済み・UI未接続）

以下のServer Actionsは実装済みですが、UIからの呼び出しがありません:
- `fetchNotifications` - 通知一覧取得（通知ポップアップで使用予定）
- `markNotificationAsRead` - 個別既読（通知ポップアップで使用予定）
- `markAllNotificationsAsRead` - 一括既読（通知ポップアップで使用予定）

### バックエンド通知作成（実装済み）

以下の通知作成ロジックは `AgendaService.cs` で実装済みです:
- アジェンダ作成時 → `Invited` 通知（作成者除外）
- シリーズ中止時 → `SeriesCancelled` 通知（操作者除外）
- 特定回中止・変更時 → `OccurrenceCancelled` / `OccurrenceUpdated` 通知（操作者除外）
- シリーズ分割（この回以降編集）時 → `SeriesUpdated` 通知（操作者除外）
- リマインダー → `AgendaReminderTask.cs` で全参加者に送信（作成者含む）

通知送信ルールの詳細は「10.4 通知送信ルール」を参照。

---

## 概要

アクティビティ（過去の情報）とは別に、**未来の予定・イベント**を管理するアジェンダ機能の設計書。

### 主要機能

- 単発・繰り返しイベントの作成・編集・中止
- 参加者管理と参加状況の追跡
- リマインダー通知（アプリ内 + メール）
- 特定回の中止・変更（繰り返しイベント）

---

## 1. 要件サマリー

| 項目 | 決定内容 |
|------|---------|
| ワークスペース紐付け | なし（組織単位） |
| 繰り返しイベント | あり |
| リマインダー | アプリ内通知 + メール |
| 編集権限 | 誰でも編集可（ワークスペース権限なし） |
| 削除 | 物理削除なし → **中止（Cancelled）** 状態 |
| 繰り返し編集 | 「この回のみ」「この回以降」「シリーズ全体」の3択 |
| 週次曜日選択 | なし（開始日の曜日で繰り返し） |
| 過去アジェンダ | 別ジョブで物理削除（本設計対象外） |

---

## 2. UI設計

### 2.1 一覧画面（タイムライン形式）

```
┌─────────────────────────────────────────────────────────────┐
│  📅 今後の予定                            [+ 新規作成]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ── 今日 (1/19 日) ──────────────────────────────────────   │
│  │                                                          │
│  ├─ 14:00  週次定例MTG          🔄毎週   👥 5人  📍会議室A │
│  │         [参加] [仮] [不参加]                             │
│  │                                                          │
│  ├─ 17:00  プロジェクトレビュー          👥 3人  🔗 Zoom   │
│  │         ──────────────────────────────────────────────  │
│  │         🚫 中止: 主催者の都合により中止となりました      │
│  │         ──────────────────────────────────────────────  │
│  │                                                          │
│  ── 明日 (1/20 月) ──────────────────────────────────────   │
│  │                                                          │
│  ├─ 10:00  クライアント打ち合わせ  🔄毎月   👥 8人         │
│  │         [参加] [仮] [不参加]                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**特徴**:
- 時系列グルーピング: 今日 / 明日 / 今週 / 来週以降
- クイックアクション: 一覧から直接参加可否を設定可能
- 視覚的な区別: 終日イベント、オンライン/オフライン、参加人数
- 中止イベントも表示（グレーアウト + 理由表示）

### 2.2 詳細画面

```
┌─────────────────────────────────────────────────────────────┐
│  ← 戻る                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  週次定例MTG                                    🔄 毎週月曜 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                             │
│  📅 2026年1月19日(月) 14:00 - 15:00                         │
│  📍 会議室A                                                 │
│  🔗 https://zoom.us/j/xxxxx                                 │
│  🔔 リマインダー: 1日前、1時間前                            │
│                                                             │
│  ── 詳細 ────────────────────────────────────────────────   │
│  今週の進捗確認と来週のタスク割り当てを行います。           │
│                                                             │
│  ── あなたの参加状況 ────────────────────────────────────   │
│  (⊙) 参加する  ( ) 仮参加  ( ) 不参加                       │
│                                                             │
│  ── 参加者 (5人) ───────────────────────────────────────   │
│  [Avatar] 山田太郎 (主催者)                                 │
│  [Avatar] 佐藤花子          ✓ 参加                          │
│  [Avatar] 鈴木一郎          ? 仮参加                        │
│  [Avatar] 田中次郎          ✗ 不参加                        │
│  [Avatar] 高橋三郎          ─ 未回答                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [この回を中止] [この回を変更] [編集] [シリーズ全体を中止]  │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 作成/編集画面

```
┌─────────────────────────────────────────────────────────────┐
│  新しい予定を作成                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  タイトル *                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 週次定例MTG                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  □ 終日                                                    │
│                                                             │
│  開始 *                          終了 *                     │
│  ┌──────────────────────┐       ┌──────────────────────┐   │
│  │ 2026/01/19 14:00     │       │ 2026/01/19 15:00     │   │
│  └──────────────────────┘       └──────────────────────┘   │
│                                                             │
│  場所 / URL                                                 │
│  ...                                                        │
│                                                             │
│  ── 繰り返し設定 ────────────────────────────────────────   │
│                                                             │
│  ☑ 繰り返しイベントにする                                  │
│                                                             │
│  繰り返し: [毎週▼]  間隔: [1] 週ごと                       │
│                                                             │
│  終了:                                                      │
│  (⊙) 終了日を指定  [2026/03/31]                            │
│  ( ) 回数を指定    [10] 回後                               │
│  ( ) 終了しない                                            │
│                                                             │
│  ── リマインダー ────────────────────────────────────────   │
│  ☑ 1日前  ☑ 1時間前  ☐ 30分前  ☐ 開始時                   │
│                                                             │
│  ── 参加者 ──────────────────────────────────────────────   │
│  ℹ️ あなたは主催者として自動的に参加者に追加されます        │
│  👥 参加者は最大100人まで追加できます                       │
│                                                             │
│  クイック追加                                               │
│  [🏢 組織全体 2人] [📁 ワークスペースから選択 ▼]           │
│                                                             │
│  ユーザーを個別に追加                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🔍 名前またはメールで検索...                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  2人の参加者を選択中                                        │
│  [[Avatar] 山田太郎 ×] [[Avatar] 佐藤花子 ×]                │
│                                                             │
│  ☑━━━ 参加者にメール通知を送信する（推奨）                 │
│       有効にすると、作成・更新時に参加者へメールで通知      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 編集範囲選択モーダル（繰り返しイベント）

```
┌─────────────────────────────────────────────────────────────┐
│  この予定を編集                                      [×]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  「週次定例MTG」は繰り返しイベントです。                    │
│  どの範囲を編集しますか？                                   │
│                                                             │
│  (⊙) この回のみ (1/26)                                     │
│  ( ) この回以降すべて (1/26〜)                              │
│      ※ 新しい繰り返しシリーズが作成されます                │
│  ( ) すべての予定                                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                    [キャンセル] [続行]      │
└─────────────────────────────────────────────────────────────┘
```

### 2.5 AppHeader アジェンダアイコン

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo]  検索...      [📅²] [🔔³] [Avatar▼]                 │
│                        ↑     ↑                              │
│                   アジェンダ  チャット                      │
└──────────────────────────────────────────────────────────────┘
```

**実装方針**:
- アジェンダアイコン（📅）をクリックすると**通知ポップアップ**を表示
- バッジには未読通知数 + 未回答招待数の合計を表示
- ポップアップ内に「一覧を見る」リンクでアジェンダ一覧ページ（`/agendas`）へ遷移
- 詳細は2.6節参照

### 2.6 通知ポップアップUI（AppHeader）

AppHeaderのアジェンダアイコン（📅）をクリックすると表示されるポップアップ。

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo]  検索...      [📅³] [🔔³] [Avatar▼]                 │
│                        ↓クリック                            │
│                   ┌─────────────────────────────────────┐   │
│                   │ 🔔 通知 (3件)    [すべて既読にする] │   │
│                   ├─────────────────────────────────────┤   │
│                   │                                     │   │
│                   │ 🆕 山田太郎さんが招待しました       │   │
│                   │    「週次定例MTG」1/27(月) 14:00    │   │
│                   │ ─────────────────────────────────── │   │
│                   │ 🚫 「プロジェクトレビュー」中止     │   │
│                   │    主催者の都合により中止           │   │
│                   │ ─────────────────────────────────── │   │
│                   │ ⏰ 明日「クライアント打合せ」       │   │
│                   │    1/21(火) 10:00                   │   │
│                   │                                     │   │
│                   ├─────────────────────────────────────┤   │
│                   │     📅 イベント一覧を見る →        │   │
│                   └─────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**通知タイプ別アイコン**:
- 🆕 `Invited` - 新規招待
- 📝 `SeriesUpdated` / `OccurrenceUpdated` - 変更通知
- 🚫 `SeriesCancelled` / `OccurrenceCancelled` - 中止通知
- ⏰ `Reminder` - リマインダー
- ➕ `AddedToEvent` - 参加者追加
- ➖ `RemovedFromEvent` - 参加者削除

**機能仕様**:

| 機能 | 詳細 |
|------|------|
| **ポップアップ表示** | アイコンクリックでポップアップ表示。外側クリックまたはEscで閉じる |
| **通知一覧表示** | 未読通知を最大5件表示。スクロールで追加表示 |
| **個別既読** | 通知クリックで詳細ページへ遷移 + 既読API呼び出し + ポップアップ閉じる |
| **一括既読** | 「すべて既読にする」ボタンで全未読を既読に |
| **一覧ページ遷移** | 「イベント一覧を見る」リンクで `/agendas` へ遷移 |
| **空状態** | 未読0件の場合「新しい通知はありません」と表示 |

**使用するServer Actions**:
- `fetchNotifications(limit, beforeId, unreadOnly)` - 通知一覧取得
- `markNotificationAsRead(notificationId)` - 個別既読
- `markAllNotificationsAsRead(notificationIds?)` - 一括既読

---

## 3. データベース設計

### 3.1 Enum定義

#### RecurrenceType（繰り返しタイプ）

```csharp
// filepath: pecus.Libs/DB/Models/Enums/RecurrenceType.cs
public enum RecurrenceType
{
    None = 0,           // 繰り返しなし（単発）
    Daily = 1,          // 毎日
    Weekly = 2,         // 毎週（開始日の曜日で繰り返し）
    Biweekly = 3,       // 隔週
    MonthlyByDate = 4,  // 毎月（日付指定: 毎月15日など）
    MonthlyByWeekday = 5, // 毎月（曜日指定: 毎月第2火曜など）
    Yearly = 6          // 毎年
}
```

#### AgendaNotificationType（通知タイプ）

```csharp
// filepath: pecus.Libs/DB/Models/Enums/AgendaNotificationType.cs
public enum AgendaNotificationType
{
    Invited = 0,              // 新規招待
    SeriesUpdated = 1,        // シリーズ全体の変更
    SeriesCancelled = 2,      // シリーズ全体の中止
    OccurrenceUpdated = 3,    // 特定回の変更
    OccurrenceCancelled = 4,  // 特定回の中止
    Reminder = 5,             // リマインダー
    AddedToEvent = 6,         // 参加者追加
    RemovedFromEvent = 7      // 参加者削除
}
```

#### ReminderTiming（リマインダータイミング）

```csharp
// filepath: pecus.Libs/DB/Models/Enums/ReminderTiming.cs
public enum ReminderTiming
{
    AtStart = 0,      // 開始時
    Minutes5 = 5,     // 5分前
    Minutes15 = 15,   // 15分前
    Minutes30 = 30,   // 30分前
    Hours1 = 60,      // 1時間前
    Hours2 = 120,     // 2時間前
    Days1 = 1440,     // 1日前
    Days2 = 2880,     // 2日前
    Weeks1 = 10080    // 1週間前
}
```

### 3.2 テーブル定義

#### Agenda（メインテーブル）

| カラム | 型 | 説明 |
|--------|-----|------|
| Id | long | PK |
| OrganizationId | int | 組織ID |
| Title | string(200) | タイトル |
| Description | string? | 詳細（Markdown対応） |
| StartAt | DateTimeOffset | 開始日時 |
| EndAt | DateTimeOffset | 終了日時 |
| IsAllDay | bool | 終日フラグ |
| Location | string?(200) | 場所 |
| Url | string?(2000) | URL |
| **RecurrenceType** | RecurrenceType? | 繰り返しタイプ |
| **RecurrenceInterval** | int | 繰り返し間隔（デフォルト1） |
| **RecurrenceWeekOfMonth** | int? | 月次曜日指定時の週番号 |
| **RecurrenceEndDate** | DateOnly? | 繰り返し終了日 |
| **RecurrenceCount** | int? | 繰り返し回数 |
| **DefaultReminders** | string?(50) | リマインダー設定（カンマ区切り分） |
| **IsCancelled** | bool | 中止フラグ |
| **CancellationReason** | string?(500) | 中止理由 |
| **CancelledAt** | DateTimeOffset? | 中止日時 |
| **CancelledByUserId** | int? | 中止したユーザーID |
| CreatedByUserId | int | 作成者ID |
| CreatedAt | DateTimeOffset | 作成日時 |
| UpdatedAt | DateTimeOffset | 更新日時 |
| RowVersion | uint | 楽観的ロック |

#### AgendaAttendee（参加者テーブル）

| カラム | 型 | 説明 |
|--------|-----|------|
| AgendaId | long | PK, FK |
| UserId | int | PK, FK |
| Status | AttendanceStatus | 参加状況 |
| IsOptional | bool | 任意参加フラグ |
| **CustomReminders** | string?(50) | 個人リマインダー設定 |

#### AgendaException（例外テーブル - 新規）

| カラム | 型 | 説明 |
|--------|-----|------|
| Id | long | PK |
| AgendaId | long | FK |
| OriginalStartAt | DateTimeOffset | 元の開始日時（どの回か特定） |
| IsCancelled | bool | この回は中止か |
| CancellationReason | string?(500) | 中止理由 |
| ModifiedStartAt | DateTimeOffset? | 変更後開始日時 |
| ModifiedEndAt | DateTimeOffset? | 変更後終了日時 |
| ModifiedTitle | string?(200) | 変更後タイトル |
| ModifiedLocation | string?(200) | 変更後場所 |
| ModifiedUrl | string?(2000) | 変更後URL |
| ModifiedDescription | string? | 変更後詳細 |
| CreatedAt | DateTimeOffset | 作成日時 |
| CreatedByUserId | int | 作成者ID |

#### AgendaNotification（通知テーブル - 新規）

| カラム | 型 | 説明 |
|--------|-----|------|
| Id | long | PK |
| AgendaId | long | FK |
| UserId | int | FK |
| Type | AgendaNotificationType | 通知タイプ |
| OccurrenceStartAt | DateTimeOffset? | 対象回の開始日時 |
| Message | string?(500) | 通知メッセージ |
| IsRead | bool | 既読フラグ |
| IsEmailSent | bool | メール送信済みフラグ |
| CreatedAt | DateTimeOffset | 作成日時 |

#### AgendaReminderLog（リマインダー送信ログ - 新規）

繰り返しイベントの各回に対して、どのリマインダーを送信済みかを追跡するテーブル。

| カラム | 型 | 説明 |
|--------|-----|------|
| Id | long | PK |
| AgendaId | long | FK |
| UserId | int | FK |
| OccurrenceStartAt | DateTimeOffset | 対象回の開始日時（繰り返しの特定回を識別） |
| MinutesBefore | int | 何分前のリマインダーか（1440=1日前, 60=1時間前など） |
| SentAt | DateTimeOffset | 送信日時 |

**用途**:
- 定期ジョブがリマインダー送信時に、このテーブルを確認して重複送信を防止
- 参加者ごとの `CustomReminders` または `Agenda.DefaultReminders` と照合し、未送信のもののみ送信

```csharp
// リマインダージョブの処理イメージ
public async Task ProcessRemindersAsync()
{
    var now = DateTimeOffset.UtcNow;

    // 今後24時間以内に開始するアジェンダを取得
    var upcomingAgendas = await GetUpcomingAgendas(now, now.AddHours(24));

    foreach (var (agenda, occurrenceStartAt) in upcomingAgendas)
    {
        foreach (var attendee in agenda.Attendees)
        {
            // 個人設定 or デフォルト設定からリマインダー分数リストを取得
            var reminders = ParseReminders(attendee.CustomReminders ?? agenda.DefaultReminders);

            foreach (var minutesBefore in reminders)
            {
                var reminderTime = occurrenceStartAt.AddMinutes(-minutesBefore);

                // リマインダー時刻が現在〜5分後の範囲内か
                if (reminderTime >= now && reminderTime <= now.AddMinutes(5))
                {
                    // 既に送信済みか確認
                    var alreadySent = await _context.AgendaReminderLogs
                        .AnyAsync(l => l.AgendaId == agenda.Id
                            && l.UserId == attendee.UserId
                            && l.OccurrenceStartAt == occurrenceStartAt
                            && l.MinutesBefore == minutesBefore);

                    if (!alreadySent)
                    {
                        // 通知作成 + メール送信 + ログ記録
                        await SendReminderAsync(agenda, attendee, occurrenceStartAt, minutesBefore);
                    }
                }
            }
        }
    }
}
```

---

## 4. API設計

### 4.1 エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/api/agendas` | 一覧取得（展開済みオカレンス） |
| `GET` | `/api/agendas/recent` | 直近一覧 |
| `GET` | `/api/agendas/{id}` | 詳細取得 |
| `GET` | `/api/agendas/{id}/occurrence?startAt=` | 特定回の詳細 |
| `POST` | `/api/agendas` | 作成 |
| `PUT` | `/api/agendas/{id}` | シリーズ全体を更新 |
| `PUT` | `/api/agendas/{id}/from?startAt=` | この回以降を更新（シリーズ分割） |
| `PATCH` | `/api/agendas/{id}/cancel` | シリーズ全体を中止 |
| `PATCH` | `/api/agendas/{id}/attendance` | 参加状況更新 |
| `POST` | `/api/agendas/{id}/exceptions` | 特定回の中止・変更 |
| `PUT` | `/api/agendas/{id}/exceptions/{exceptionId}` | 特定回の変更を更新 |
| `DELETE` | `/api/agendas/{id}/exceptions/{exceptionId}` | 特定回の中止・変更を取消 |
| `GET` | `/api/agendas/notifications` | 通知一覧 |
| `GET` | `/api/agendas/notifications/count` | 未読件数（バッジ用） |
| `POST` | `/api/agendas/notifications/read` | 一括既読 |
| `POST` | `/api/agendas/notifications/{id}/read` | 個別既読 |

### 4.2 「この回以降」編集の実装方針

元のシリーズを分割し、新しいアジェンダを作成:

```
Before:
  Agenda#1: 1/5, 1/12, 1/19, [1/26], 2/2, 2/9, 2/16 ...
                              ↑ 編集対象

After:
  Agenda#1: 1/5, 1/12, 1/19 (RecurrenceEndDate = 1/19)
  Agenda#2: 1/26, 2/2, 2/9, 2/16 ... (新規作成、変更内容反映)
```

---

## 5. Request/Response DTO

### 5.1 CreateAgendaRequest

```csharp
public class CreateAgendaRequest
{
    [Required] [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Required] public DateTimeOffset StartAt { get; set; }
    [Required] public DateTimeOffset EndAt { get; set; }
    public bool IsAllDay { get; set; } = false;
    [MaxLength(200)] public string? Location { get; set; }
    [MaxLength(2000)] public string? Url { get; set; }

    // 繰り返し設定
    public RecurrenceType? RecurrenceType { get; set; }
    public int RecurrenceInterval { get; set; } = 1;
    public int? RecurrenceWeekOfMonth { get; set; }
    public DateOnly? RecurrenceEndDate { get; set; }
    public int? RecurrenceCount { get; set; }

    // リマインダー（分単位のリスト）
    public List<int>? Reminders { get; set; }

    // 参加者
    public List<AgendaAttendeeRequest> Attendees { get; set; } = new();
    public bool SendNotification { get; set; } = true;
}
```

### 5.2 AgendaOccurrenceResponse（一覧用）

```csharp
public class AgendaOccurrenceResponse
{
    public required long AgendaId { get; set; }
    public long? ExceptionId { get; set; }
    public required DateTimeOffset StartAt { get; set; }
    public required DateTimeOffset EndAt { get; set; }
    public required string Title { get; set; }
    public string? Location { get; set; }
    public string? Url { get; set; }
    public bool IsAllDay { get; set; }
    public RecurrenceType? RecurrenceType { get; set; }
    public bool IsCancelled { get; set; }
    public string? CancellationReason { get; set; }
    public bool IsModified { get; set; }  // この回のみ変更されているか
    public int AttendeeCount { get; set; }
    public AttendanceStatus? MyAttendanceStatus { get; set; }
    public UserItem? CreatedByUser { get; set; }
}
```

### 5.3 AgendaNotificationCountResponse

```csharp
public class AgendaNotificationCountResponse
{
    public int PendingInvitations { get; set; }  // 未回答の招待数
    public int UnreadNotifications { get; set; } // 未読通知数
    public int Total => PendingInvitations + UnreadNotifications;
}
```

---

## 6. フロントエンド構成

```
pecus.Frontend/src/
├── app/
│   └── (dashboard)/
│       └── agendas/
│           ├── page.tsx                     # 一覧ページ
│           ├── new/
│           │   └── page.tsx                 # 新規作成
│           └── [agendaId]/
│               ├── page.tsx                 # 詳細
│               ├── occurrence/
│               │   └── page.tsx             # 特定回の詳細
│               └── edit/
│                   └── page.tsx             # 編集
│
├── components/
│   └── agendas/
│       ├── AgendaTimeline.tsx               # タイムライン一覧
│       ├── AgendaTimelineGroup.tsx          # 日付グループ
│       ├── AgendaTimelineItem.tsx           # 一覧アイテム
│       ├── AgendaDetail.tsx                 # 詳細表示
│       ├── AgendaForm.tsx                   # 作成/編集フォーム
│       ├── RecurrenceSettings.tsx           # 繰り返し設定
│       ├── ReminderSettings.tsx             # リマインダー設定
│       ├── AttendeeSelector.tsx             # 参加者選択
│       ├── AttendeeSelectorModal.tsx        # 参加者選択モーダル
│       ├── AttendeeList.tsx                 # 参加者一覧
│       ├── AttendanceStatusBadge.tsx        # 参加状況バッジ
│       ├── QuickAttendanceButtons.tsx       # クイック参加ボタン
│       ├── CancelConfirmModal.tsx           # 中止確認モーダル
│       ├── EditScopeModal.tsx               # 編集範囲選択モーダル
│       ├── CancelOccurrenceModal.tsx        # 特定回中止モーダル
│       ├── AgendaIconButton.tsx             # ヘッダー用アジェンダアイコン+バッジ
│       └── AgendaNotificationPopup.tsx      # 通知ポップアップ
│
└── actions/
    └── agenda.ts                            # Server Actions
```

---

## 7. Hangfire ジョブ

### 7.1 リマインダー処理ジョブ

```csharp
// 5分ごとに実行
public class AgendaReminderJob
{
    public async Task ProcessRemindersAsync()
    {
        // 1. 今後60分以内に開始するアジェンダを取得
        // 2. 各参加者のリマインダー設定を確認
        // 3. 未送信のリマインダーがあれば通知作成 + メール送信
    }
}
```

### 7.2 メール送信ジョブ

```csharp
public class AgendaEmailJob
{
    // 招待メール送信
    Task SendInvitationEmailsAsync(long agendaId, List<int> userIds);

    // 中止通知メール送信
    Task SendCancellationEmailsAsync(long agendaId, string? reason);

    // 変更通知メール送信
    Task SendUpdateEmailsAsync(long agendaId, string? message);

    // 特定回の中止通知メール送信
    Task SendOccurrenceCancellationEmailsAsync(long agendaId, DateTimeOffset originalStartAt, string? reason);

    // リマインダーメール送信
    Task SendReminderEmailAsync(long agendaId, int userId, DateTimeOffset occurrenceStartAt, int minutesBefore);
}
```

---

## 8. 実装フェーズ

| Phase | 機能 | 詳細 | 工数 | 状態 |
|-------|------|------|------|------|
| **Phase 1** | DB設計 | マイグレーション作成（Enum、新テーブル、カラム追加） | 0.5日 | ✅ |
| **Phase 2** | 基本API | CRUD + 中止機能（単発イベントのみ） | 1.5日 | ✅ |
| **Phase 3** | 繰り返し | 作成・展開ロジック・一覧API | 2日 | ✅ |
| **Phase 4** | 例外処理 | 特定回の中止・変更API | 1.5日 | ✅ |
| **Phase 5** | 「この回以降」編集 | シリーズ分割ロジック | 1日 | ✅ |
| **Phase 6** | 参加状況 | 参加状況更新API | 0.5日 | ✅ |
| **Phase 7** | 通知基盤 | 通知テーブル + 一覧・件数API | 1日 | ✅ |
| **Phase 8** | リマインダー | Hangfireジョブ + 通知作成 | 1.5日 | ✅ |
| **Phase 9** | メール送信 | Hangfireジョブ | 1日 | ✅ |
| **Phase 10** | FE一覧 | タイムライン + クイックアクション | 2日 | ✅ |
| **Phase 11** | FE詳細 | 詳細表示 + 参加状況変更 | 1.5日 | ✅ |
| **Phase 12** | FEフォーム | 作成・編集 + 繰り返し設定 | 2日 | ✅ |
| **Phase 13** | FE通知 | ヘッダーアイコン + バッジ（一覧ページ遷移） | 1日 | ✅ |
| **Phase 14** | 参加者選択 | 統合検索UIで参加者追加 | 1日 | ✅ |

**合計: 約18日**

---

## 9. Phase 14: 参加者選択機能 詳細設計（✅完了）

### 9.1 概要

アジェンダ作成・編集時に参加者を選択できる機能。
クイック追加ボタン + ユーザー検索のシンプルなUI。

### 9.2 UI設計

#### 参加者セクション（作成/編集フォーム内）

```
── 参加者 ──────────────────────────────────────────────────

  ℹ️ あなたは主催者として自動的に参加者に追加されます
  👥 参加者は最大100人まで追加できます

┌──────────────────────────────────────────────────────────┐
│ クイック追加                                             │
│                                                          │
│ [🏢 組織全体 2人] [📁 ワークスペースから選択 ▼]         │
│                    ↓ クリックでドロップダウン表示        │
│                   ┌─────────────────────────────────┐    │
│                   │ 📁 開発チーム        2人        │    │
│                   │ 📁 マーケティング    2人        │    │
│                   └─────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘

ユーザーを個別に追加
┌──────────────────────────────────────────────────────────┐
│ 🔍 名前またはメールで検索...                             │
└──────────────────────────────────────────────────────────┘
  ↓ 入力すると候補が表示される
┌──────────────────────────────────────────────────────────┐
│  [Avatar] 山田太郎                                       │
│           yamada@example.com                             │
│  [Avatar] 山本花子                                       │
│           yamamoto@example.com                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ 2人の参加者を選択中                                      │
│                                                          │
│ [[Avatar] 山田太郎 ×] [[Avatar] 佐藤花子 ×]              │
└──────────────────────────────────────────────────────────┘

☑ 参加者にメール通知を送信する（推奨）
  有効にすると、アジェンダの作成・更新時に参加者へメールで通知されます。
```

**注意**:
- 主催者（作成者）はバックエンドで自動的に「参加」ステータスで追加されます
- フロントエンドでは主催者を参加者リストに含めて送信する必要はありません
- 組織全体・ワークスペースの人数表示は自分を除いた数

### 9.3 機能仕様

| 機能 | 詳細 |
|------|------|
| **主催者自動追加** | 作成者は自動的に「参加」ステータスで追加される（バックエンド処理） |
| **クイック追加** | 「組織全体」ボタンと「ワークスペースから選択」ドロップダウンで一括追加 |
| **ユーザー検索** | 名前・メールでデバウンス付き検索（1文字以上） |
| **チップ表示** | 選択済みはアバター付きチップ形式で表示、×で削除可能 |
| **重複排除** | 追加時、既存ユーザーと重複する場合は自動スキップ |
| **自分を除外** | 検索候補・一括追加から自分自身を除外 |
| **人数表示** | 組織全体・ワークスペースの人数は自分を除いた数を表示 |
| **上限100人** | 参加者は最大100人まで。上限到達時は警告表示＆追加ボタン無効化 |
| **メール通知** | switchトグルで通知ON/OFF（デフォルトON） |

### 9.4 Server Actions

| 関数 | 用途 |
|------|------|
| `fetchOrganizationMemberCount()` | 組織メンバー数取得（バッジ表示用） |
| `fetchOrganizationMembers()` | 組織メンバー一覧取得（最大100人、ページング対応） |
| `fetchWorkspaceList()` | ワークスペース一覧取得（ドロップダウン用） |
| `fetchWorkspaceMembers(workspaceId)` | ワークスペースメンバー一覧取得 |
| `searchUsers(query)` | ユーザー検索（名前・メール） |

### 9.5 コンポーネント構成

```
src/components/agendas/
└── AttendeeSelector.tsx    # クイック追加 + 検索 + チップ表示を統合
```

### 9.6 実装タスク（✅完了）

| タスク | 詳細 | 工数 | 状態 |
|--------|------|------|------|
| AttendeeSelector | クイック追加・検索・選択管理 | 0.5日 | ✅ |
| Server Actions | 組織メンバー・WS一覧・検索API | 0.25日 | ✅ |
| AgendaForm統合 | フォームへの組み込み + メール通知switch | 0.25日 | ✅ |

**工数: 1日**

**実装メモ:**
- `AttendeeSelector.tsx` を新規作成
  - クイック追加: 「組織全体」ボタン + 「ワークスペースから選択」ドロップダウン
  - ユーザー検索: デバウンス付き（300ms）、1文字以上で検索開始
  - 選択済み表示: アバター付きチップ、×ボタンで削除
  - 上限管理: MAX_ATTENDEES = 100、上限時は警告alert表示
- Server Actions: `src/actions/agenda.ts` に追加
  - `fetchOrganizationMembers`: ページング対応、最大100人まで取得
  - `fetchWorkspaceList`: ページング対応、最大5ページまで取得
- `AgendaForm.tsx` 統合
  - `currentUserId` propsで主催者を検索結果から除外
  - メール通知オプションをswitchスタイルに変更
- `AgendaForm.tsx` に統合済み、`currentUserId` propsを追加（主催者を検索結果から除外）
- `AgendaFormClient.tsx` / `new/page.tsx` / `edit/page.tsx` で `getCurrentUser()` を使用してユーザーIDを取得

---

## 10. 補足事項

### 10.1 過去アジェンダの物理削除

- 別ジョブで実装（本設計対象外）
- 期日を過ぎた古いアジェンダを定期的に物理削除

### 10.2 既存テーブルとの関係

- `Agenda` は既に作成済み（基本フィールドのみ）
- `AgendaAttendee` は既に作成済み
- 本設計で追加するカラム・テーブルはマイグレーションで対応

### 10.3 削除ポリシー

| 状況 | 操作 | 通知 |
|------|------|------|
| 過去のアジェンダ | 削除不可 | - |
| 当日（開始後） | 削除不可 | - |
| 当日（開始前） | 中止可（確認要） | 即時メール通知 |
| 明日以降 | 中止可 | メール通知 |

### 10.4 通知送信ルール

通知の送信対象は、操作タイプによって異なります。

| 通知タイプ | 送信対象 | 理由 |
|-----------|---------|------|
| **Invited（招待）** | 参加者 - 作成者 | 自分で作成したので招待通知は不要 |
| **Reminder（リマインダー）** | **全参加者（作成者含む）** | 自分も参加者として忘れないため |
| **SeriesUpdated（シリーズ更新）** | 参加者 - 操作者 | 自分で変更したので不要 |
| **SeriesCancelled（シリーズ中止）** | 参加者 - 操作者 | 自分で中止したので不要 |
| **OccurrenceUpdated（特定回更新）** | 参加者 - 操作者 | 自分で変更したので不要 |
| **OccurrenceCancelled（特定回中止）** | 参加者 - 操作者 | 自分で中止したので不要 |
| **AddedToEvent（追加）** | 追加されたユーザー | 追加した本人には不要 |
| **RemovedFromEvent（削除）** | 削除されたユーザー | 削除した本人には不要 |

**実装箇所**: `AgendaService.cs` および `AgendaReminderTask.cs`
