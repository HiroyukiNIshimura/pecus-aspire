using Pecus.Libs.Mail.Templates.Models;
using Pecus.Libs.WeeklyReport.Models;

namespace Pecus.Libs.Mail.Preview;

/// <summary>
/// メールテンプレートのプレビュー用ダミーデータを生成するファクトリ
/// 開発・テスト環境専用
/// </summary>
public static class EmailPreviewDataFactory
{
    /// <summary>
    /// サポートするテンプレートの一覧
    /// </summary>
    public static IReadOnlyList<EmailTemplateInfo> GetTemplateList()
    {
        return
        [
            new(WelcomeEmailModel.TemplateName, "ウェルカムメール", "新規ユーザー登録時の歓迎メール"),
            new(PasswordResetEmailModel.TemplateName, "パスワードリセット", "パスワードリセット要求時のメール"),
            new(PasswordSetupEmailModel.TemplateName, "パスワード設定", "初期パスワード設定用のメール"),
            new(EmailChangeConfirmationEmailModel.TemplateName, "メールアドレス変更確認", "メールアドレス変更時の確認メール"),
            new(SecurityNotificationEmailModel.TemplateName, "セキュリティ通知", "新しいデバイスからのログイン通知"),
            new(OrganizationCreatedEmailModel.TemplateName, "組織作成完了", "組織登録完了時の通知メール"),
            new(WorkspaceCreatedEmailModel.TemplateName, "ワークスペース作成", "ワークスペース作成通知"),
            new(WorkspaceUpdatedEmailModel.TemplateName, "ワークスペース更新", "ワークスペース更新通知"),
            new(WorkspaceDeletedEmailModel.TemplateName, "ワークスペース削除", "ワークスペース削除通知"),
            new(WorkspaceJoinedEmailModel.TemplateName, "ワークスペース加入", "ワークスペース加入通知"),
            new(ItemCreatedEmailModel.TemplateName, "アイテム作成", "アイテム作成通知"),
            new(ItemUpdatedEmailModel.TemplateName, "アイテム更新", "アイテム更新通知"),
            new(TaskCreatedEmailModel.TemplateName, "タスク作成", "タスク作成通知"),
            new(TaskCompletedEmailModel.TemplateName, "タスク完了", "タスク完了通知"),
            new(HelpCommentEmailModel.TemplateName, "ヘルプ要求", "ヘルプコメント通知"),
            new(ReminderCommentEmailModel.TemplateName, "督促コメント", "リマインダーコメント通知"),
            new(WeeklyReportEmailModel.TemplateName, "週間レポート", "週間タスク・進捗レポート"),
            new(TestEmailModel.TemplateName, "テストメール", "メール送信テスト用"),
        ];
    }

    /// <summary>
    /// テンプレート名からダミーデータを生成
    /// </summary>
    /// <param name="templateName">テンプレート名</param>
    /// <returns>ダミーデータオブジェクト（不明なテンプレートの場合は null）</returns>
    public static object? CreateDummyData(string templateName)
    {
        var now = DateTimeOffset.UtcNow;

        return templateName switch
        {
            "welcome" => CreateWelcomeData(now),
            "password-reset" => CreatePasswordResetData(now),
            "password-setup" => CreatePasswordSetupData(now),
            "email-change-confirmation" => CreateEmailChangeData(now),
            "security-notification" => CreateSecurityNotificationData(now),
            "organization-created" => CreateOrganizationCreatedData(now),
            "workspace-created" => CreateWorkspaceCreatedData(now),
            "workspace-updated" => CreateWorkspaceUpdatedData(now),
            "workspace-deleted" => CreateWorkspaceDeletedData(now),
            "workspace-joined" => CreateWorkspaceJoinedData(now),
            "item-created" => CreateItemCreatedData(now),
            "item-updated" => CreateItemUpdatedData(now),
            "task-created" => CreateTaskCreatedData(now),
            "task-completed" => CreateTaskCompletedData(now),
            "help-comment" => CreateHelpCommentData(now),
            "reminder-comment" => CreateReminderCommentData(now),
            "weekly-report" => CreateWeeklyReportData(now),
            "test-email" => new TestEmailModel { Email = "test@example.com" },
            _ => null,
        };
    }

    private static WelcomeEmailModel CreateWelcomeData(DateTimeOffset now) => new()
    {
        UserName = "田中 太郎",
        Email = "tanaka@example.com",
        OrganizationName = "サンプル株式会社",
        WorkspaceName = "プロジェクトA",
        LoginUrl = "https://app.example.com/login",
        CreatedAt = now,
    };

    private static PasswordResetEmailModel CreatePasswordResetData(DateTimeOffset now) => new()
    {
        UserName = "田中 太郎",
        Email = "tanaka@example.com",
        PasswordResetUrl = "https://app.example.com/reset-password?token=sample-token-12345",
        TokenExpiresAt = now.AddHours(24),
        RequestedAt = now,
    };

    private static PasswordSetupEmailModel CreatePasswordSetupData(DateTimeOffset now) => new()
    {
        UserName = "田中 太郎",
        Email = "tanaka@example.com",
        OrganizationName = "サンプル株式会社",
        PasswordSetupUrl = "https://app.example.com/setup-password?token=sample-token-12345",
        TokenExpiresAt = now.AddDays(7),
        CreatedAt = now,
    };

    private static EmailChangeConfirmationEmailModel CreateEmailChangeData(DateTimeOffset now) => new()
    {
        UserName = "田中 太郎",
        CurrentEmail = "tanaka@example.com",
        NewEmail = "tanaka-new@example.com",
        ConfirmationUrl = "https://app.example.com/confirm-email?token=sample-token-12345",
        TokenExpiresAt = now.AddHours(24),
        RequestedAt = now,
    };

    private static SecurityNotificationEmailModel CreateSecurityNotificationData(DateTimeOffset now) => new()
    {
        UserName = "田中 太郎",
        Email = "tanaka@example.com",
        DeviceName = "Chrome on Windows",
        DeviceType = "Desktop",
        OS = "Windows 11",
        IpAddress = "192.168.1.1",
        Timezone = "Asia/Tokyo",
        LoginAt = now,
        SecuritySettingsUrl = "https://app.example.com/settings/security",
    };

    private static OrganizationCreatedEmailModel CreateOrganizationCreatedData(DateTimeOffset now) => new()
    {
        OrganizationName = "サンプル株式会社",
        OrganizationEmail = "contact@sample.example.com",
        RepresentativeName = "山田 花子",
        AdminUserName = "田中 太郎",
        AdminEmail = "tanaka@example.com",
        PasswordSetupUrl = "https://app.example.com/setup-password?token=org-token-12345",
        TokenExpiresAt = now.AddDays(7),
        CreatedAt = now,
    };

    private static WorkspaceCreatedEmailModel CreateWorkspaceCreatedData(DateTimeOffset now) => new()
    {
        UserName = "田中 太郎",
        WorkspaceName = "新規プロジェクト",
        WorkspaceCode = "PROJECT-001",
        CategoryName = "開発",
        Description = "新しい開発プロジェクト用のワークスペースです。",
        CreatedByName = "山田 花子",
        CreatedAt = now,
        OrganizationName = "サンプル株式会社",
        WorkspaceUrl = "https://app.example.com/workspace/PROJECT-001",
    };

    private static WorkspaceUpdatedEmailModel CreateWorkspaceUpdatedData(DateTimeOffset now) => new()
    {
        UserName = "田中 太郎",
        WorkspaceName = "プロジェクトA（改名後）",
        WorkspaceCode = "PROJECT-001",
        UpdatedByName = "山田 花子",
        UpdatedAt = now,
        Changes = ["名前を変更しました", "カテゴリを変更しました"],
        OldWorkspaceName = "プロジェクトA",
        NewWorkspaceName = "プロジェクトA（改名後）",
        OldCategoryName = "開発",
        NewCategoryName = "運用",
        OrganizationName = "サンプル株式会社",
        WorkspaceUrl = "https://app.example.com/workspace/PROJECT-001",
    };

    private static WorkspaceDeletedEmailModel CreateWorkspaceDeletedData(DateTimeOffset now) => new()
    {
        UserName = "田中 太郎",
        WorkspaceName = "終了プロジェクト",
        WorkspaceCode = "PROJECT-OLD",
        CategoryName = "アーカイブ",
        DeletedByName = "山田 花子",
        DeletedAt = now,
        OrganizationName = "サンプル株式会社",
        DeletionReason = "プロジェクト完了のため",
        BackupInfo = "データは30日間保持されます。復旧が必要な場合は管理者にお問い合わせください。",
    };

    private static WorkspaceJoinedEmailModel CreateWorkspaceJoinedData(DateTimeOffset now) => new()
    {
        UserName = "田中 太郎",
        WorkspaceName = "プロジェクトA",
        WorkspaceCode = "PROJECT-001",
        InviterName = "山田 花子",
        JoinedAt = now,
        FrontendWorkspaceUrl = "https://app.example.com/workspace/PROJECT-001",
    };

    private static ItemCreatedEmailModel CreateItemCreatedData(DateTimeOffset now) => new()
    {
        UserName = "田中 太郎",
        ItemTitle = "【要件定義】ユーザー管理機能の仕様検討",
        ItemCode = "ITEM-001",
        ItemType = "要件",
        Channel = "バックログ",
        BodyText = "ユーザー管理機能について、以下の要件を検討します。\n・ユーザー登録\n・ユーザー編集\n・ユーザー削除",
        BodyHtml = "<p>ユーザー管理機能について、以下の要件を検討します。</p><ul><li>ユーザー登録</li><li>ユーザー編集</li><li>ユーザー削除</li></ul>",
        CreatedByName = "山田 花子",
        CreatedAt = now,
        WorkspaceName = "プロジェクトA",
        WorkspaceCode = "PROJECT-001",
        ItemUrl = "https://app.example.com/workspace/PROJECT-001/item/ITEM-001",
    };

    private static ItemUpdatedEmailModel CreateItemUpdatedData(DateTimeOffset now) => new()
    {
        UserName = "田中 太郎",
        ItemTitle = "【要件定義】ユーザー管理機能の仕様検討",
        ItemCode = "ITEM-001",
        ItemType = "要件",
        BodyText = "更新された本文です。",
        Activities =
        [
            new ItemActivityEntry
            {
                EffectMessage = "担当者が変更されました",
                UpdatedByName = "山田 花子",
                UpdatedAt = now.AddMinutes(-30),
            },
            new ItemActivityEntry
            {
                EffectMessage = "期限が変更されました",
                UpdatedByName = "山田 花子",
                UpdatedAt = now.AddMinutes(-15),
            },
            new ItemActivityEntry
            {
                EffectMessage = "タスクが追加されました",
                UpdatedByName = "鈴木 一郎",
                UpdatedAt = now,
            },
        ],
        WorkspaceName = "プロジェクトA",
        WorkspaceCode = "PROJECT-001",
        ItemUrl = "https://app.example.com/workspace/PROJECT-001/item/ITEM-001",
    };

    private static TaskCreatedEmailModel CreateTaskCreatedData(DateTimeOffset now) => new()
    {
        UserName = "田中 太郎",
        TaskTitle = "ユーザー登録画面のUIデザイン作成",
        TaskCode = "TASK-001",
        Priority = "高",
        DueDate = now.AddDays(7),
        AssigneeName = "田中 太郎",
        CreatedByName = "山田 花子",
        CreatedAt = now,
        WorkspaceName = "プロジェクトA",
        WorkspaceCode = "PROJECT-001",
        TaskUrl = "https://app.example.com/workspace/PROJECT-001/task/TASK-001",
    };

    private static TaskCompletedEmailModel CreateTaskCompletedData(DateTimeOffset now) => new()
    {
        UserName = "山田 花子",
        TaskTitle = "ユーザー登録画面のUIデザイン作成",
        TaskCode = "TASK-001",
        AssigneeName = "田中 太郎",
        CompletedByName = "田中 太郎",
        CompletedAt = now,
        WorkspaceName = "プロジェクトA",
        WorkspaceCode = "PROJECT-001",
        TaskUrl = "https://app.example.com/workspace/PROJECT-001/task/TASK-001",
    };

    private static HelpCommentEmailModel CreateHelpCommentData(DateTimeOffset now) => new()
    {
        UserName = "山田 花子",
        RequesterName = "田中 太郎",
        ItemTitle = "【要件定義】ユーザー管理機能の仕様検討",
        ItemCode = "ITEM-001",
        TaskContent = "ユーザー登録画面のUIデザイン作成",
        TaskPriority = "高",
        TaskAssigneeName = "田中 太郎",
        CommentBody = "この部分の仕様について確認したいです。ユーザー登録時に必須項目は何になりますか？",
        CommentedAt = now,
        WorkspaceName = "プロジェクトA",
        WorkspaceCode = "PROJECT-001",
        ItemUrl = "https://app.example.com/workspace/PROJECT-001/item/ITEM-001",
        OrganizationName = "サンプル株式会社",
    };

    private static ReminderCommentEmailModel CreateReminderCommentData(DateTimeOffset now) => new()
    {
        UserName = "田中 太郎",
        RemindedByName = "山田 花子",
        ItemTitle = "【要件定義】ユーザー管理機能の仕様検討",
        ItemCode = "ITEM-001",
        TaskContent = "ユーザー登録画面のUIデザイン作成",
        TaskPriority = "高",
        TaskAssigneeName = "田中 太郎",
        CommentBody = "期限が迫っています。進捗状況を確認させてください。",
        CommentedAt = now,
        TaskDueDate = now.AddDays(2),
        WorkspaceName = "プロジェクトA",
        WorkspaceCode = "PROJECT-001",
        ItemUrl = "https://app.example.com/workspace/PROJECT-001/item/ITEM-001",
        OrganizationName = "サンプル株式会社",
    };

    private static WeeklyReportEmailModel CreateWeeklyReportData(DateTimeOffset now)
    {
        var today = DateOnly.FromDateTime(now.DateTime);
        var weekStart = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
        if (today.DayOfWeek == DayOfWeek.Sunday)
        {
            weekStart = weekStart.AddDays(-7);
        }
        var weekEnd = weekStart.AddDays(6);

        return new WeeklyReportEmailModel
        {
            UserName = "田中 太郎",
            OrganizationName = "サンプル株式会社",
            WeekStartDate = weekStart,
            WeekEndDate = weekEnd,
            PersonalSummary = new PersonalTaskSummary
            {
                CompletedCount = 5,
                RemainingCount = 3,
                OverdueCount = 1,
            },
            OwnerWorkspaces =
            [
                new OwnerWorkspaceSummary
                {
                    WorkspaceId = 1,
                    WorkspaceName = "プロジェクトA",
                    InProgressCount = 8,
                    CompletedThisWeekCount = 3,
                    OverdueCount = 2,
                    DueNextWeekCount = 5,
                    CommitterItems =
                    [
                        new CommitterItemSummary
                        {
                            ItemId = 1,
                            ItemName = "ユーザー管理機能",
                            ProgressPercent = 60,
                            TotalTaskCount = 10,
                            CompletedTaskCount = 6,
                            RemainingTaskCount = 4,
                            OverdueCount = 1,
                            DueNextWeekCount = 2,
                        },
                        new CommitterItemSummary
                        {
                            ItemId = 2,
                            ItemName = "検索機能",
                            ProgressPercent = 30,
                            TotalTaskCount = 5,
                            CompletedTaskCount = 1,
                            RemainingTaskCount = 4,
                            OverdueCount = 0,
                            DueNextWeekCount = 3,
                        },
                    ],
                },
                new OwnerWorkspaceSummary
                {
                    WorkspaceId = 2,
                    WorkspaceName = "プロジェクトB",
                    InProgressCount = 4,
                    CompletedThisWeekCount = 2,
                    OverdueCount = 0,
                    DueNextWeekCount = 3,
                    CommitterItems =
                    [
                        new CommitterItemSummary
                        {
                            ItemId = 3,
                            ItemName = "ダッシュボード",
                            ProgressPercent = 80,
                            TotalTaskCount = 5,
                            CompletedTaskCount = 4,
                            RemainingTaskCount = 1,
                            OverdueCount = 0,
                            DueNextWeekCount = 1,
                        },
                    ],
                },
            ],
            DashboardUrl = "https://app.example.com/dashboard",
        };
    }
}

/// <summary>
/// メールテンプレートの情報
/// </summary>
/// <param name="Name">テンプレート名（識別子）</param>
/// <param name="DisplayName">表示名</param>
/// <param name="Description">説明</param>
public record EmailTemplateInfo(string Name, string DisplayName, string Description);
